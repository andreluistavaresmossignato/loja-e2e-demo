/**
 * Nexora - Catalog Module
 */

document.addEventListener('DOMContentLoaded', () => {
  const productListContainer = document.querySelector('[data-testid="product-list"]');
  if (!productListContainer) return;

  const products = window.NEXORA_PRODUCTS || [];

  function renderProducts() {
    productListContainer.innerHTML = '';

    products.forEach(product => {
      const card = document.createElement('article');
      card.className = 'card product-card';
      card.setAttribute('data-testid', 'product-card');
      card.setAttribute('data-product-id', product.id);

      card.innerHTML = `
        <div class="product-image-container" aria-hidden="true">
          ${product.icon}
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
      addBtn.addEventListener('click', () => {
        addToCart(product.id, 1);
        showToast(`"${product.name}" adicionado ao carrinho!`);
      });

      productListContainer.appendChild(card);
    });
  }

  renderProducts();
});
