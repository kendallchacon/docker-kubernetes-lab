const express = require('express');
const os = require('node:os');
const { randomUUID } = require('node:crypto');

const app = express();
const port = Number(process.env.PORT) || 3001;
const products = {
  mouse: 'Mouse inalámbrico',
  keyboard: 'Teclado mecánico',
  headphones: 'Audífonos'
};

app.use(express.json({ limit: '8kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/orders', (req, res) => {
  const { product, quantity } = req.body || {};

  if (typeof product !== 'string' || !Object.hasOwn(products, product)) {
    return res.status(400).json({ error: 'Selecciona un producto válido.' });
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return res.status(400).json({ error: 'La cantidad debe ser un entero entre 1 y 99.' });
  }

  const order = {
    orderId: randomUUID(),
    product,
    productName: products[product],
    quantity,
    status: 'received',
    processedBy: os.hostname()
  };

  console.log(`[ORDER] id=${order.orderId} product=${order.product} quantity=${order.quantity} processedBy=${order.processedBy}`);
  return res.status(201).json(order);
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'El cuerpo debe contener JSON válido.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El pedido es demasiado grande.' });
  }
  console.error('Error inesperado:', error);
  return res.status(500).json({ error: 'No se pudo procesar el pedido.' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`[START] Orders Service | instance=${os.hostname()} | port=${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
