/**
 * Nexora - Shared State & Utilities
 */

const STORAGE_KEYS = {
  CART: 'nexora_cart',
  USER: 'nexora_user',
  LAST_ORDER: 'nexora_last_order'
};

// Monetary Formatter
function formatCurrency(value) {
  const numeric = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numeric);
}

// Storage Safe Helpers
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

// Cart State Management
function getCart() {
  const cart = getStorage(STORAGE_KEYS.CART, []);
  if (!Array.isArray(cart)) return [];
  // Ensure valid item structure
  return cart.filter(item => item && typeof item.productId === 'string' && typeof item.quantity === 'number' && item.quantity > 0);
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

// User Session Management (Demo only)
function getCurrentUser() {
  return getStorage(STORAGE_KEYS.USER, null);
}

function setCurrentUser(user) {
  setStorage(STORAGE_KEYS.USER, user);
}

function logoutUser() {
  removeStorage(STORAGE_KEYS.USER);
  window.location.href = 'login.html';
}

// UI Feedback Toast
function showToast(message) {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Trigger animation
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
  }, 2500);
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  // Populate user badge if element exists
  const userSlot = document.getElementById('user-session-info');
  if (userSlot) {
    const user = getCurrentUser();
    if (user && user.email) {
      userSlot.innerHTML = `
        <span>Olá, <strong>${user.email}</strong></span>
        <button type="button" class="btn-logout" id="btn-logout">Sair</button>
      `;
      const btnLogout = document.getElementById('btn-logout');
      if (btnLogout) {
        btnLogout.addEventListener('click', logoutUser);
      }
    } else {
      userSlot.innerHTML = `<a href="login.html" class="nav-link">Entrar</a>`;
    }
  }
});
