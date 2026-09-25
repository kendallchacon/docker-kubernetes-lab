const form = document.querySelector('#order-form');
const feedback = document.querySelector('#feedback');
const submitButton = document.querySelector('#submit-button');

function showError(message) {
  feedback.hidden = false;
  feedback.className = 'feedback feedback-error';
  feedback.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = 'No se pudo realizar el pedido';
  const detail = document.createElement('p');
  detail.textContent = message;
  feedback.append(title, detail);
}

function showOrder(order) {
  feedback.hidden = false;
  feedback.className = 'feedback feedback-success';
  feedback.replaceChildren();

  const heading = document.createElement('div');
  heading.className = 'feedback-heading';
  heading.textContent = 'Pedido recibido ✓';

  const details = document.createElement('dl');
  for (const [label, value] of [
    ['Pedido', `#${order.orderId}`],
    ['Producto', order.productName],
    ['Cantidad', String(order.quantity)],
    ['Estado', 'Recibido']
  ]) {
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = value;
    details.append(term, description);
  }

  const instance = document.createElement('div');
  instance.className = 'instance';
  const instanceLabel = document.createElement('span');
  instanceLabel.textContent = 'PROCESADO POR';
  const instanceName = document.createElement('code');
  instanceName.textContent = order.processedBy;
  instance.append(instanceLabel, instanceName);

  feedback.append(heading, details, instance);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const product = new FormData(form).get('product');
  const quantityInput = document.querySelector('#quantity');
  const quantity = Number(quantityInput.value);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    showError('La cantidad debe ser un entero entre 1 y 99.');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Enviando pedido…';

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, quantity })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Inténtalo de nuevo.');
    }
    showOrder(result);
  } catch (error) {
    showError(error.message || 'Comprueba la conexión e inténtalo de nuevo.');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Realizar pedido <span aria-hidden="true">↗</span>';
  }
});
