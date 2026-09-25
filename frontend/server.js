const express = require('express');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');

const app = express();
const port = Number(process.env.PORT) || 8080;
const ordersServiceUrl = process.env.ORDERS_SERVICE_URL || 'http://localhost:3001';

app.use(express.json({ limit: '8kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/orders', (req, res) => {
  let target;
  try {
    target = new URL('/orders', ordersServiceUrl);
  } catch (error) {
    console.error('ORDERS_SERVICE_URL inválida:', error);
    return res.status(502).json({ error: 'El servicio de pedidos no está disponible.' });
  }

  const body = JSON.stringify(req.body || {});
  const transport = target.protocol === 'https:' ? https : http;
  const upstream = transport.request(target, {
    method: 'POST',
    agent: false,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      Connection: 'close'
    },
    timeout: 5000
  }, (response) => {
    res.status(response.statusCode || 502);
    res.set('Content-Type', response.headers['content-type'] || 'application/json');
    response.pipe(res);
  });

  upstream.on('timeout', () => {
    upstream.destroy(new Error('Tiempo de espera agotado'));
  });
  upstream.on('error', (error) => {
    console.error('No se pudo contactar Orders Service:', error.message);
    if (!res.headersSent) {
      res.status(error.message === 'Tiempo de espera agotado' ? 504 : 502)
        .json({ error: 'El servicio de pedidos no está disponible. Inténtalo de nuevo.' });
    } else {
      res.destroy(error);
    }
  });
  upstream.end(body);
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'El cuerpo debe contener JSON válido.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El pedido es demasiado grande.' });
  }
  console.error('Error inesperado:', error);
  return res.status(500).json({ error: 'No se pudo procesar la solicitud.' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend escuchando en el puerto ${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
