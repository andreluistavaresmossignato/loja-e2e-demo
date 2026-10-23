/**
 * Nexora - Catalog Module
 * O catálogo é público — qualquer visitante pode visualizar.
 * Adicionar ao carrinho exige autenticação.
 */

document.addEventListener('DOMContentLoaded', () => {
  const productListContainer = document.querySelector('[data-testid="product-list"]');
  if (!productListContainer) return;

  const products = window.NEXORA_PRODUCTS || [];

  function closeAllPopovers() {
    const popovers = document.querySelectorAll('.auth-popover');
    popovers.forEach(p => p.remove());
  }

  // Fechar popover ao clicar fora ou com Escape
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.auth-popover') && !e.target.closest('[data-testid="add-to-cart"]')) {
      closeAllPopovers();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllPopovers();
    }
  });

  function showAuthPopover(targetButton, productId) {
    closeAllPopovers();

    const popover = document.createElement('div');
    popover.className = 'auth-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Aviso de autenticação');

    popover.innerHTML = `
      <div class="auth-popover-content">
        <p class="auth-popover-msg">É necessário entrar na sua conta para adicionar produtos ao carrinho.</p>
        <div class="auth-popover-actions">
          <button type="button" class="btn btn-primary btn-sm btn-popover-login" data-testid="popover-login">
            Fazer login
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-popover-close" data-testid="popover-close" aria-label="Fechar aviso">
            Fechar
          </button>
        </div>
      </div>
    `;

    // Posicionar relativo ao botão pai
    const cardFooter = targetButton.closest('.product-footer') || targetButton.parentElement;
    if (cardFooter) {
      cardFooter.style.position = 'relative';
      cardFooter.appendChild(popover);
    } else {
      targetButton.parentElement.appendChild(popover);
    }

    const loginBtn = popover.querySelector('.btn-popover-login');
    const closeBtn = popover.querySelector('.btn-popover-close');

    loginBtn.addEventListener('click', () => {
      savePendingProduct(productId);
      window.location.href = 'login.html';
    });

    closeBtn.addEventListener('click', () => {
      popover.remove();
      targetButton.focus();
    });
  }

  function renderProducts() {
    productListContainer.innerHTML = '';

    products.forEach(product => {
      const card = document.createElement('article');
      card.className = 'card product-card';
      card.setAttribute('data-testid', 'product-card');
      card.setAttribute('data-product-id', product.id);

      card.innerHTML = `
        <div class="product-image-container">
          <img
            src="${product.image}"
            alt="${product.imageAlt}"
            class="product-img"
            loading="lazy"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          >
          <div class="product-img-fallback" aria-hidden="true" style="display:none;">
            ${product.icon}
          </div>
        </div>
        <div class="product-body">
          <h2 class="product-name" data-testid="product-name">${product.name}</h2>
          <p class="product-desc">${product.description}</p>
          <div class="product-footer">
            <span class="product-price" data-testid="product-price">${formatCurrency(product.price)}</span>
            <button
              type="button"
              class="btn btn-primary"
              data-testid="add-to-cart"
              aria-label="Adicionar ${product.name} ao carrinho"
            >
              Adicionar
            </button>
          </div>
        </div>
      `;

      const addBtn = card.querySelector('[data-testid="add-to-cart"]');
      addBtn.addEventListener('click', (e) => {
        if (!isAuthenticated()) {
          showAuthPopover(addBtn, product.id);
          return;
        }
        addToCart(product.id, 1);
        showToast(`"${product.name}" adicionado ao carrinho!`);
      });

      productListContainer.appendChild(card);
    });
  }

  renderProducts();
});
