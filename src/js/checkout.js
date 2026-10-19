/**
 * Nexora - Checkout Module
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-testid="checkout-form"]');
  const nameInput = document.querySelector('[data-testid="shipping-name"]');
  const addressInput = document.querySelector('[data-testid="shipping-address"]');
  const cityInput = document.querySelector('[data-testid="shipping-city"]');
  const zipInput = document.querySelector('[data-testid="shipping-zip"]');
  const errorElement = document.querySelector('[data-testid="checkout-error"]');
  const summaryItemsContainer = document.getElementById('checkout-items-summary');
  const checkoutTotalElement = document.getElementById('checkout-total');
  const checkoutEmptyWarning = document.getElementById('checkout-empty-warning');
  const checkoutContent = document.getElementById('checkout-content');

  const products = window.NEXORA_PRODUCTS || [];

  function getProductById(id) {
    return products.find(p => p.id === id);
  }

  const cart = getCart();

  // Guard against empty cart
  if (cart.length === 0) {
    if (checkoutContent) checkoutContent.style.display = 'none';
    if (checkoutEmptyWarning) checkoutEmptyWarning.style.display = 'block';
    return;
  }

  if (checkoutContent) checkoutContent.style.display = 'grid';
  if (checkoutEmptyWarning) checkoutEmptyWarning.style.display = 'none';

  // Render Order Summary
  let grandTotal = 0;
  let summaryHtml = '';

  cart.forEach(item => {
    const product = getProductById(item.productId);
    if (!product) return;
    const subtotal = product.price * item.quantity;
    grandTotal += subtotal;

    summaryHtml += `
      <div class="order-item-line">
        <span>${product.name} (x${item.quantity})</span>
        <strong>${formatCurrency(subtotal)}</strong>
      </div>
    `;
  });

  if (summaryItemsContainer) {
    summaryItemsContainer.innerHTML = summaryHtml;
  }

  if (checkoutTotalElement) {
    checkoutTotalElement.textContent = formatCurrency(grandTotal);
  }

  function clearErrors() {
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
    const inputs = [nameInput, addressInput, cityInput, zipInput];
    inputs.forEach(input => {
      if (input) {
        input.classList.remove('is-invalid');
        const errSpan = document.getElementById(`error-${input.id}`);
        if (errSpan) errSpan.textContent = '';
      }
    });
  }

  function setFieldError(input, msg) {
    if (!input) return;
    input.classList.add('is-invalid');
    const errSpan = document.getElementById(`error-${input.id}`);
    if (errSpan) errSpan.textContent = msg;
  }

  [nameInput, addressInput, cityInput, zipInput].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        const errSpan = document.getElementById(`error-${input.id}`);
        if (errSpan) errSpan.textContent = '';
        if (errorElement) {
          errorElement.textContent = '';
          errorElement.style.display = 'none';
        }
      });
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const currentCart = getCart();
    if (currentCart.length === 0) {
      if (errorElement) {
        errorElement.textContent = 'Não é possível finalizar a compra com o carrinho vazio.';
        errorElement.style.display = 'block';
      }
      return;
    }

    const nameVal = nameInput ? nameInput.value.trim() : '';
    const addressVal = addressInput ? addressInput.value.trim() : '';
    const cityVal = cityInput ? cityInput.value.trim() : '';
    const zipVal = zipInput ? zipInput.value.trim() : '';

    let hasErrors = false;
    const errorMessages = [];

    if (!nameVal) {
      setFieldError(nameInput, 'Informe o nome completo do destinatário.');
      errorMessages.push('Nome do destinatário');
      hasErrors = true;
    }

    if (!addressVal) {
      setFieldError(addressInput, 'Informe o endereço completo para entrega.');
      errorMessages.push('Endereço');
      hasErrors = true;
    }

    if (!cityVal) {
      setFieldError(cityInput, 'Informe a cidade.');
      errorMessages.push('Cidade');
      hasErrors = true;
    }

    if (!zipVal) {
      setFieldError(zipInput, 'Informe o CEP.');
      errorMessages.push('CEP');
      hasErrors = true;
    }

    if (hasErrors) {
      if (errorElement) {
        errorElement.textContent = `Por favor, preencha todos os campos obrigatórios: ${errorMessages.join(', ')}.`;
        errorElement.style.display = 'block';
      }
      return;
    }

    // Generate fictitious order ID
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `NEX-${randomDigits}`;

    const orderRecord = {
      orderNumber: orderNumber,
      createdAt: new Date().toISOString(),
      shipping: {
        name: nameVal,
        address: addressVal,
        city: cityVal,
        zip: zipVal
      },
      items: currentCart.map(item => {
        const prod = getProductById(item.productId);
        return {
          productId: item.productId,
          name: prod ? prod.name : 'Produto',
          unitPrice: prod ? prod.price : 0,
          quantity: item.quantity,
          subtotal: (prod ? prod.price : 0) * item.quantity
        };
      }),
      total: grandTotal
    };

    setStorage(STORAGE_KEYS.LAST_ORDER, orderRecord);
    clearCart();

    window.location.href = 'confirmation.html';
  });
});
