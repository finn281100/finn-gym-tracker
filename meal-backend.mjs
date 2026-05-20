import http from 'node:http';
import fs from 'node:fs/promises';
import { normalizeOpenFoodFactsProduct, normalizeOpenFoodFactsSearchResults } from './meal-analysis.js';

const config = await loadConfig();
const port = Number(config.port || process.env.PORT || 8787);
const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': config.allowedOrigin || process.env.ALLOWED_ORIGIN || 'http://127.0.0.1:8765',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type'
};

async function loadConfig() {
  try {
    const raw = await fs.readFile(new URL('./meal-backend.local.json', import.meta.url), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(body));
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

async function handleBarcode(res, barcode) {
  const cleanBarcode = String(barcode || '').replace(/\D/g, '');
  if (!cleanBarcode) return sendJson(res, 400, { error: 'Bitte einen gültigen Barcode eingeben.' });
  try {
    const payload = await fetchOpenFoodFacts(`https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`);
    const product = normalizeOpenFoodFactsProduct(payload);
    if (!product.found) return sendJson(res, 404, { error: 'Produkt nicht gefunden.' });
    return sendJson(res, 200, product);
  } catch (error) {
    return sendJson(res, 503, { error: error.message });
  }
}

async function handleFoodSearch(res, query) {
  const q = String(query || '').trim();
  if (q.length < 2) return sendJson(res, 400, { error: 'Bitte mindestens zwei Zeichen suchen.' });
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
    return sendJson(res, 200, { products: normalizeOpenFoodFactsSearchResults(payload) });
  } catch (error) {
    return sendJson(res, 503, { error: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, jsonHeaders);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const barcodeMatch = url.pathname.match(/^\/api\/products\/barcode\/([^/]+)$/);

  try {
    if (req.method === 'GET' && barcodeMatch) return await handleBarcode(res, barcodeMatch[1]);
    if (req.method === 'GET' && url.pathname === '/api/foods/search') return await handleFoodSearch(res, url.searchParams.get('q'));
    return sendJson(res, 404, { error: 'Route nicht gefunden.' });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Unerwarteter Serverfehler.' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Meal backend listening on http://127.0.0.1:${port}`);
});

export { server };
