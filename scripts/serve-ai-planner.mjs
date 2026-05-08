import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const defaultPort = 8081;

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'));

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.ico')) return 'image/x-icon';
  if (filePath.endsWith('.ttf')) return 'font/ttf';
  return 'application/octet-stream';
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(body);
}

async function handleGemini(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sendJson(res, 503, { error: { message: 'GEMINI_API_KEY is not configured on the local server.' } });
    return;
  }

  try {
    const body = await readJson(req);
    const model = typeof body.model === 'string' ? body.model : (process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite');
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: body.systemInstruction,
        contents: body.contents,
        generationConfig: body.generationConfig,
      }),
    });
    const payload = await upstream.text();
    res.writeHead(upstream.status, {
      'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    res.end(payload);
  } catch (error) {
    sendJson(res, 500, { error: { message: error instanceof Error ? error.message : 'Gemini proxy failed.' } });
  }
}

async function serveFile(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(dist, safePath);

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch {
    filePath = path.join(dist, 'index.html');
  }

  if (!filePath.startsWith(dist)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    await readFile(filePath);
    res.writeHead(200, {
      'content-type': contentType(filePath),
      'cache-control': filePath.endsWith('index.html') ? 'no-store' : 'public, max-age=31536000, immutable',
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

function portFromArgs() {
  const portArg = process.argv.find((arg) => arg.startsWith('--port='));
  if (portArg) return Number(portArg.split('=')[1]) || defaultPort;
  const index = process.argv.indexOf('--port');
  if (index >= 0) return Number(process.argv[index + 1]) || defaultPort;
  return Number(process.env.PORT) || defaultPort;
}

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url?.startsWith('/api/gemini')) {
    void handleGemini(req, res);
    return;
  }
  void serveFile(req, res);
});

const port = portFromArgs();
server.listen(port, '127.0.0.1', () => {
  console.log(`Tabylga AI planner is running at http://127.0.0.1:${port}`);
});
