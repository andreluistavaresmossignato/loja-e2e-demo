/**
 * Nexora - Checkout Module
 * Exige autenticação e carrinho não-vazio.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Guard: checkout exige login
  if (!requireAuth()) return;

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

  // Guard: carrinho vazio
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

  // ─── Payment method logic ─────────────────────────────────────────────────
  const paymentOptions = document.querySelectorAll('input[name="payment-method"]');
  const paymentDetails = document.getElementById('payment-details');
  const pixInfo = document.getElementById('payment-pix-info');
  const boletoInfo = document.getElementById('payment-boleto-info');
  const cardInfo = document.getElementById('payment-card-info');

  function updatePaymentDetails() {
    const selected = document.querySelector('input[name="payment-method"]:checked');
    if (!selected) {
      if (paymentDetails) paymentDetails.style.display = 'none';
      return;
    }
    if (paymentDetails) paymentDetails.style.display = 'block';
    if (pixInfo) pixInfo.style.display = 'none';
    if (boletoInfo) boletoInfo.style.display = 'none';
    if (cardInfo) cardInfo.style.display = 'none';

    const method = selected.value;
    if (method === 'pix' && pixInfo) {
      pixInfo.style.display = 'block';
    } else if (method === 'boleto' && boletoInfo) {
      boletoInfo.style.display = 'block';
    } else if (method === 'card' && cardInfo) {
      cardInfo.style.display = 'block';
    }
  }

  paymentOptions.forEach(option => {
    option.addEventListener('change', updatePaymentDetails);
  });

  // ─── Validation helpers ───────────────────────────────────────────────────
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
    // Card fields
    ['card-number', 'card-name', 'card-expiry', 'card-cvv'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('is-invalid');
      const err = document.getElementById(`error-${id}`);
      if (err) err.textContent = '';
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

  // ─── Form submission ──────────────────────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    // Double-check auth
    if (!isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }

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

    // Payment method validation
    const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
    if (!selectedPayment) {
      errorMessages.push('Método de pagamento');
      hasErrors = true;
      const paymentSection = document.getElementById('payment-section');
      if (paymentSection) paymentSection.classList.add('section-error');
    }

    // Card field validation (if card selected)
    let cardName = '', cardNumber = '', cardExpiry = '', cardCvv = '';
    if (selectedPayment && selectedPayment.value === 'card') {
      const cardNameEl = document.getElementById('card-name');
      const cardNumberEl = document.getElementById('card-number');
      const cardExpiryEl = document.getElementById('card-expiry');
      const cardCvvEl = document.getElementById('card-cvv');

      cardName = cardNameEl ? cardNameEl.value.trim() : '';
      cardNumber = cardNumberEl ? cardNumberEl.value.replace(/\s/g, '') : '';
      cardExpiry = cardExpiryEl ? cardExpiryEl.value.trim() : '';
      cardCvv = cardCvvEl ? cardCvvEl.value.trim() : '';

      if (!cardName) {
        setFieldError(cardNameEl, 'Informe o nome impresso no cartão.');
        hasErrors = true;
      }
      if (!cardNumber || cardNumber.length < 13) {
        setFieldError(cardNumberEl, 'Informe um número de cartão válido.');
        hasErrors = true;
      }
      if (!cardExpiry || !/^\d{2}\/\d{2,4}$/.test(cardExpiry)) {
        setFieldError(cardExpiryEl, 'Informe a validade no formato MM/AA.');
        hasErrors = true;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setFieldError(cardCvvEl, 'Informe o código de segurança.');
        hasErrors = true;
      }
    }

    if (hasErrors) {
      if (errorElement) {
        const missingPayment = !selectedPayment ? ' Selecione um método de pagamento.' : '';
        errorElement.textContent = `Por favor, corrija os campos indicados.${missingPayment}`;
        errorElement.style.display = 'block';
      }
      return;
    }

    // Generate order
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `NEX-${randomDigits}`;
    const paymentMethod = selectedPayment.value;

    const orderRecord = {
      orderNumber,
      createdAt: new Date().toISOString(),
      shipping: { name: nameVal, address: addressVal, city: cityVal, zip: zipVal },
      paymentMethod,
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
      // Dados de cartão NÃO são persistidos
    };

    setStorage(STORAGE_KEYS.LAST_ORDER, orderRecord);
    clearCart();

    window.location.href = 'confirmation.html';
  });
});
