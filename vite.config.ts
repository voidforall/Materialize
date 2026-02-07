import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite plugin that adds a server middleware endpoint: POST /api/host-image
 * Accepts { base64: "data:image/png;base64,..." }
 * Uploads the image to tmpfiles.org and returns { url: "https://..." }
 * This gives us a public URL that Printful can fetch.
 */
function imageHostPlugin(): Plugin {
  return {
    name: 'image-host',
    configureServer(server) {
      server.middlewares.use('/api/host-image', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;

        try {
          const { base64 } = JSON.parse(body);
          if (!base64) throw new Error('Missing base64 field');

          // Strip data URI prefix if present
          const raw = base64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(raw, 'base64');

          // Build multipart form data manually (no extra deps)
          const boundary = '----ViteImageHost' + Date.now();
          const filename = `art_${Date.now()}.png`;

          const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`;
          const footer = `\r\n--${boundary}--\r\n`;

          const multipartBody = Buffer.concat([
            Buffer.from(header),
            buffer,
            Buffer.from(footer),
          ]);

          // Upload to tmpfiles.org
          const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
            body: multipartBody,
          });

          const uploadData = await uploadRes.json() as any;
          if (uploadData.status !== 'success') throw new Error('Upload failed');

          // tmpfiles.org returns "https://tmpfiles.org/12345/file.png"
          // Direct download link is "https://tmpfiles.org/dl/12345/file.png"
          const publicUrl = uploadData.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ url: publicUrl }));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/printful': {
            target: 'https://api.printful.com',
            changeOrigin: true,
            rewrite: (path: string) => path.replace(/^\/api\/printful/, ''),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                proxyReq.setHeader('Authorization', `Bearer ${env.PRINTFUL_API_KEY}`);
              });
            },
          },
        },
      },
      plugins: [react(), imageHostPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
