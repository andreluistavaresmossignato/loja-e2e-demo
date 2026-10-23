/**
 * Nexora - Login Module
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const emailInput = document.querySelector('[data-testid="login-email"]');
  const passwordInput = document.querySelector('[data-testid="login-password"]');
  const errorElement = document.querySelector('[data-testid="login-error"]');

  // Se já está autenticado, vai direto ao catálogo
  if (isAuthenticated()) {
    window.location.href = 'catalog.html';
    return;
  }

  const DEMO_CREDENTIALS = {
    email: 'cliente@nexora.demo',
    password: 'Nexora123'
  };

  function clearError() {
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
    emailInput.classList.remove('is-invalid');
    passwordInput.classList.remove('is-invalid');
  }

  function showError(msg) {
    if (errorElement) {
      errorElement.textContent = msg;
      errorElement.style.display = 'block';
    }
  }

  emailInput.addEventListener('input', clearError);
  passwordInput.addEventListener('input', clearError);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      emailInput.classList.add('is-invalid');
      showError('Por favor, informe seu e-mail.');
      emailInput.focus();
      return;
    }

    if (!password) {
      passwordInput.classList.add('is-invalid');
      showError('Por favor, informe sua senha.');
      passwordInput.focus();
      return;
    }

    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      setCurrentUser({
        email: email,
        name: 'Cliente',
        loggedAt: new Date().toISOString()
      });

      // Consome produto pendente (adição solicitada antes do login)
      const pendingProductId = consumePendingProduct();
      if (pendingProductId) {
        addToCart(pendingProductId, 1);
      }

      window.location.href = 'catalog.html';
    } else {
      emailInput.classList.add('is-invalid');
      passwordInput.classList.add('is-invalid');
      showError('Credenciais inválidas. Verifique o e-mail e a senha informados.');
    }
  });
});
