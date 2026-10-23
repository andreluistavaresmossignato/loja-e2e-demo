/**
 * Nexora - Shared State & Utilities
 */

const STORAGE_KEYS = {
  CART: 'nexora_cart',
  USER: 'nexora_user',
  LAST_ORDER: 'nexora_last_order',
  PENDING_PRODUCT: 'nexora_pending_product'
};

// ─── Monetary Formatter ───────────────────────────────────────────────────────
function formatCurrency(value) {
  const numeric = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numeric);
}

// ─── Storage Safe Helpers ─────────────────────────────────────────────────────
function getStorage(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Erro ao carregar do localStorage [${key}]:`, e);
    return defaultValue;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Erro ao salvar no localStorage [${key}]:`, e);
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Erro ao remover do localStorage [${key}]:`, e);
  }
}

// ─── Authentication ───────────────────────────────────────────────────────────
function getCurrentUser() {
  return getStorage(STORAGE_KEYS.USER, null);
}

function isAuthenticated() {
  const user = getCurrentUser();
  return !!(user && user.email);
}

function setCurrentUser(user) {
  setStorage(STORAGE_KEYS.USER, user);
}

function logoutUser() {
  removeStorage(STORAGE_KEYS.USER);
  // Carrinho é mantido mas o checkout exige autenticação
  window.location.href = 'login.html';
}

/**
 * Redireciona para login se não autenticado.
 * @param {string} [returnUrl] - URL de retorno opcional após login.
 */
function requireAuth(returnUrl) {
  if (!isAuthenticated()) {
    if (returnUrl) {
      setStorage('nexora_return_url', returnUrl);
    }
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ─── Cart State Management ────────────────────────────────────────────────────
function getCart() {
  const cart = getStorage(STORAGE_KEYS.CART, []);
  if (!Array.isArray(cart)) return [];
  return cart.filter(
    item =>
      item &&
      typeof item.productId === 'string' &&
      typeof item.quantity === 'number' &&
      item.quantity > 0
  );
}

function saveCart(cart) {
  setStorage(STORAGE_KEYS.CART, cart);
  updateCartBadge();
}

function addToCart(productId, quantity = 1) {
  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.productId === productId);
  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.productId !== productId);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function getCartItemCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.quantity || 0), 0);
}

function updateCartBadge() {
  const badges = document.querySelectorAll('[data-testid="cart-count"]');
  const count = getCartItemCount();
  badges.forEach(badge => {
    badge.textContent = count;
  });
}

// ─── Pending product after login ──────────────────────────────────────────────
function savePendingProduct(productId) {
  setStorage(STORAGE_KEYS.PENDING_PRODUCT, productId);
}

function consumePendingProduct() {
  const productId = getStorage(STORAGE_KEYS.PENDING_PRODUCT, null);
  removeStorage(STORAGE_KEYS.PENDING_PRODUCT);
  return productId;
}

// ─── UI Feedback Toast ────────────────────────────────────────────────────────
function showToast(message, type = 'default') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'info' ? ' toast-info' : '');
  toast.textContent = message;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// ─── Global initialization ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  const userSlot = document.getElementById('user-session-info');
  if (userSlot) {
    const user = getCurrentUser();
    if (user && user.email) {
      const displayName = user.name || user.email;
      userSlot.innerHTML = `
        <div class="user-menu-wrapper">
          <button
            type="button"
            class="user-menu-trigger"
            id="user-menu-trigger"
            aria-haspopup="true"
            aria-expanded="false"
            aria-label="Menu do usuário"
          >
            <span class="user-greeting">Olá, <strong>${displayName}</strong></span>
            <span class="user-menu-chevron" aria-hidden="true">▾</span>
          </button>
          <div class="user-dropdown-menu" id="user-dropdown-menu" role="menu" aria-label="Opções do usuário" style="display: none;">
            <button type="button" class="btn-logout-item" id="btn-logout" role="menuitem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sair
            </button>
          </div>
        </div>
      `;

      const trigger = document.getElementById('user-menu-trigger');
      const menu = document.getElementById('user-dropdown-menu');
      const btnLogout = document.getElementById('btn-logout');

      function toggleMenu(open) {
        const isOpen = open !== undefined ? open : menu.style.display !== 'none';
        if (isOpen) {
          menu.style.display = 'none';
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          menu.style.display = 'block';
          trigger.setAttribute('aria-expanded', 'true');
        }
      }

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
      });

      // Fechar ao clicar fora
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu-wrapper')) {
          toggleMenu(true);
        }
      });

      // Fechar com tecla Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.style.display !== 'none') {
          toggleMenu(true);
          trigger.focus();
        }
      });

      if (btnLogout) {
        btnLogout.addEventListener('click', logoutUser);
      }
    } else {
      userSlot.innerHTML = `<a href="login.html" class="nav-link">Entrar</a>`;
    }
  }
});
