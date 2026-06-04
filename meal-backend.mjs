import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchOpenFoodFactsProduct, normalizeOpenFoodFactsSearchResults } from './meal-analysis.js';

const config = await loadConfig();
const port = Number(config.port || process.env.PORT || 8787);
const host = config.host || process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
const appRoot = path.dirname(fileURLToPath(import.meta.url));
const baseJsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type'
};
const configuredOrigins = parseAllowedOrigins(config.allowedOrigins || config.allowedOrigin || process.env.ALLOWED_ORIGIN);
const staticMimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

async function loadConfig() {
  try {
    const raw = await fs.readFile(new URL('./meal-backend.local.json', import.meta.url), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function responseHeaders(req) {
  return { ...baseJsonHeaders, 'access-control-allow-origin': currentAllowedOrigin(req) };
}

function sendJson(req, res, status, body) {
  res.writeHead(status, responseHeaders(req));
  res.end(JSON.stringify(body));
}

function parseAllowedOrigins(value) {
  if (Array.isArray(value)) return value.map(String).map(origin => origin.trim()).filter(Boolean);
  return String(value || '').split(',').map(origin => origin.trim()).filter(Boolean);
}

function currentAllowedOrigin(req) {
  const origin = req?.headers?.origin;
  if (origin === 'null') return 'null';
  if (origin && configuredOrigins.includes(origin)) return origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return configuredOrigins[0] || 'http://127.0.0.1:8765';
}

async function fetchOpenFoodFacts(url) {
  let response;
  try {
    response = await fetch(url, { headers: { accept: 'application/json' } });
  } catch {
    throw new Error('Open Food Facts ist gerade nicht erreichbar.');
  }
  if (!response.ok) throw new Error('Open Food Facts ist gerade nicht erreichbar.');
  return response.json();
}

function staticFilePath(pathname) {
  const decodedPath = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const normalizedPath = path.normalize(decodedPath).replace(/^([/\\])+/, '');
  const filePath = path.resolve(appRoot, normalizedPath);
  return filePath.startsWith(appRoot + path.sep) || filePath === appRoot ? filePath : null;
}

async function serveStatic(req, res, pathname) {
  const filePath = staticFilePath(pathname);
  if (!filePath) return sendJson(req, res, 403, { error: 'Zugriff verweigert.' });

  try {
    const body = await fs.readFile(filePath);
    const contentType = staticMimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': contentType });
    if (req.method === 'HEAD') return res.end();
    return res.end(body);
  } catch {
    return sendJson(req, res, 404, { error: 'Datei nicht gefunden.' });
  }
}

async function handleBarcode(req, res, barcode) {
  try {
    const product = await fetchOpenFoodFactsProduct(barcode);
    if (!product.found) return sendJson(req, res, 404, { error: 'Produkt nicht gefunden.' });
    return sendJson(req, res, 200, product);
  } catch (error) {
    const status = /Barcode|Pruefziffer|Ziffern|eingeben/.test(error.message) ? 400 : 503;
    return sendJson(req, res, status, { error: error.message });
  }
}

async function handleFoodSearch(req, res, query) {
  const q = String(query || '').trim();
  if (q.length < 2) return sendJson(req, res, 400, { error: 'Bitte mindestens zwei Zeichen suchen.' });
  const params = new URLSearchParams({
    search_terms: q,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '8',
    fields: 'code,product_name,generic_name,brands,nutriments,serving_size'
  });
  try {
    const payload = await fetchOpenFoodFacts(`https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`);
    return sendJson(req, res, 200, { products: normalizeOpenFoodFactsSearchResults(payload) });
  } catch (error) {
    return sendJson(req, res, 503, { error: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, responseHeaders(req));
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const barcodeMatch = url.pathname.match(/^\/api\/products\/barcode\/([^/]+)$/);

  try {
    if (req.method === 'GET' && barcodeMatch) return await handleBarcode(req, res, barcodeMatch[1]);
    if (req.method === 'GET' && url.pathname === '/api/foods/search') return await handleFoodSearch(req, res, url.searchParams.get('q'));
    if (['GET', 'HEAD'].includes(req.method)) return await serveStatic(req, res, url.pathname);
    return sendJson(req, res, 404, { error: 'Route nicht gefunden.' });
  } catch (error) {
    return sendJson(req, res, 500, { error: error.message || 'Unerwarteter Serverfehler.' });
  }
});

server.listen(port, host, () => {
  console.log(`Meal backend listening on http://${host}:${port}`);
});

export { server };
