/**
 * Nexora - Cart Module
 * Exige autenticação para acessar e para prosseguir ao checkout.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Guard: carrinho exige login
  if (!requireAuth()) return;

  const cartItemsContainer = document.querySelector('[data-testid="cart-items"]');
  const emptyCartContainer = document.querySelector('[data-testid="empty-cart"]');
  const cartTotalElement = document.querySelector('[data-testid="cart-total"]');
  const cartSubtotalElement = document.getElementById('cart-subtotal');
  const cartCountSummaryElement = document.getElementById('cart-summary-count');
  const cartLayout = document.getElementById('cart-layout');

  const products = window.NEXORA_PRODUCTS || [];

  function getProductById(id) {
    return products.find(p => p.id === id);
  }

  function renderCart() {
    const cart = getCart();

    if (cart.length === 0) {
      if (cartLayout) cartLayout.style.display = 'none';
      if (emptyCartContainer) emptyCartContainer.style.display = 'block';
      updateCartBadge();
      return;
    }

    if (cartLayout) cartLayout.style.display = 'grid';
    if (emptyCartContainer) emptyCartContainer.style.display = 'none';

    cartItemsContainer.innerHTML = '';
    let grandTotal = 0;
    let totalItemsCount = 0;

    cart.forEach(item => {
      const product = getProductById(item.productId);
      if (!product) return;

      const subtotal = product.price * item.quantity;
      grandTotal += subtotal;
      totalItemsCount += item.quantity;

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.setAttribute('data-testid', 'cart-item');
      itemEl.setAttribute('data-product-id', product.id);

      itemEl.innerHTML = `
        <div class="cart-item-img">
          <img
            src="${product.image}"
            alt="${product.imageAlt}"
            class="cart-img"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          >
          <div class="cart-img-fallback" style="display:none;" aria-hidden="true">
            ${product.icon}
          </div>
        </div>
        <div class="cart-item-details">
          <h2 class="cart-item-name">${product.name}</h2>
          <div class="cart-item-unit-price">Preço unitário: ${formatCurrency(product.price)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="cart-item-quantity-wrapper">
            <span>Qtd:</span>
            <span class="cart-item-quantity" data-testid="cart-item-quantity">${item.quantity}</span>
          </div>
          <div class="cart-item-subtotal">${formatCurrency(subtotal)}</div>
          <button
            type="button"
            class="btn btn-danger-outline"
            data-testid="remove-item"
            aria-label="Remover ${product.name} do carrinho"
          >
            Remover
          </button>
        </div>
      `;

      const removeBtn = itemEl.querySelector('[data-testid="remove-item"]');
      removeBtn.addEventListener('click', () => {
        removeFromCart(product.id);
        showToast(`"${product.name}" removido do carrinho.`);
        renderCart();
      });

      cartItemsContainer.appendChild(itemEl);
    });

    if (cartTotalElement) {
      cartTotalElement.textContent = formatCurrency(grandTotal);
    }
    if (cartSubtotalElement) {
      cartSubtotalElement.textContent = formatCurrency(grandTotal);
    }
    if (cartCountSummaryElement) {
      cartCountSummaryElement.textContent = `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'itens'}`;
    }

    updateCartBadge();
  }

  renderCart();
});
