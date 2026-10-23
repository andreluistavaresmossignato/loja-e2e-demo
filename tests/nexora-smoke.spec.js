// @ts-check
import { test, expect } from '@playwright/test';

// ─── Helper: login ────────────────────────────────────────────────────────────
async function loginAs(page, email = 'cliente@nexora.demo', password = 'Nexora123') {
  await page.goto('/pages/login.html');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/catalog\.html/);
}

// ─── Helper: clear localStorage ──────────────────────────────────────────────
async function clearAppStorage(page) {
  await page.goto('/pages/catalog.html');
  await page.evaluate(() => {
    localStorage.removeItem('nexora_user');
    localStorage.removeItem('nexora_cart');
    localStorage.removeItem('nexora_last_order');
    localStorage.removeItem('nexora_pending_product');
    localStorage.removeItem('nexora_return_url');
  });
}

// ─── Helper: adicionar produto como usuário autenticado ───────────────────────
async function addFirstProductToCart(page) {
  await page.goto('/pages/catalog.html');
  await page.getByTestId('product-card').first().getByTestId('add-to-cart').click();
}

// =============================================================================
// BLOCO 1 — Acesso e autenticação
// =============================================================================
test.describe('Acesso e autenticação', () => {

  test('1. Visitante consegue abrir e visualizar o catálogo sem login', async ({ page }) => {
    await page.goto('/pages/catalog.html');
    await expect(page.getByTestId('product-list')).toBeVisible();
    // Há pelo menos 1 produto visível
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await expect(page.getByTestId('product-name').first()).toBeVisible();
    await expect(page.getByTestId('product-price').first()).toBeVisible();
  });

  test('2. Visitante não autenticado é redirecionado ao login ao tentar adicionar ao carrinho', async ({ page }) => {
    await clearAppStorage(page);
    await page.goto('/pages/catalog.html');

    // Clica em "Adicionar" sem estar logado
    await page.getByTestId('product-card').first().getByTestId('add-to-cart').click();

    // Deve redirecionar para login (aguarda a navegação)
    await expect(page).toHaveURL(/login\.html/, { timeout: 5000 });
  });

  test('3. Após login válido, usuário consegue adicionar produtos', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);
    await addFirstProductToCart(page);
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  test('4. Credenciais inválidas continuam sendo rejeitadas', async ({ page }) => {
    await page.goto('/pages/login.html');
    await page.getByTestId('login-email').fill('errado@email.com');
    await page.getByTestId('login-password').fill('SenhaErrada');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page.getByTestId('login-error')).toContainText('Credenciais inválidas');
    await expect(page).toHaveURL(/login\.html/);
  });

  test('5. Visitante não autenticado acessando checkout diretamente é redirecionado para login', async ({ page }) => {
    await clearAppStorage(page);
    await page.goto('/pages/checkout.html');
    // Deve redirecionar para login
    await expect(page).toHaveURL(/login\.html/, { timeout: 5000 });
  });

  test('6. Usuário autenticado com carrinho vazio não pode finalizar compra no checkout', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);
    // Acessa checkout com carrinho vazio
    await page.goto('/pages/checkout.html');
    // Deve mostrar aviso de carrinho vazio (não o formulário)
    await expect(page.locator('#checkout-empty-warning')).toBeVisible();
    await expect(page.locator('#checkout-content')).not.toBeVisible();
  });

  test('7. Página de confirmação sem pedido válido não exibe dados fictícios', async ({ page }) => {
    await clearAppStorage(page);
    await page.goto('/pages/confirmation.html');
    // Deve mostrar estado vazio, não dados de pedido
    await expect(page.locator('#no-order-container')).toBeVisible();
    await expect(page.locator('#order-success-container')).not.toBeVisible();
  });
});

// =============================================================================
// BLOCO 2 — Compra
// =============================================================================
test.describe('Fluxo de compra', () => {

  test('8. Usuário autenticado adiciona produtos e visualiza o carrinho', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);
    await addFirstProductToCart(page);

    await page.getByTestId('open-cart').click();
    await expect(page).toHaveURL(/cart\.html/);
    await expect(page.getByTestId('cart-items')).toBeVisible();
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await expect(page.getByTestId('cart-item-quantity')).toHaveText('1');
  });

  test('9. Totais são calculados corretamente', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);
    await addFirstProductToCart(page);

    await page.goto('/pages/cart.html');
    const totalText = await page.getByTestId('cart-total').textContent();
    // Total deve conter "R$" e não ser zero
    expect(totalText).toMatch(/R\$\s*\d/);
    expect(totalText).not.toMatch(/R\$\s*0,00/);
  });

  test('10. Checkout valida campos obrigatórios de entrega', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);
    await addFirstProductToCart(page);

    await page.goto('/pages/checkout.html');
    // Seleciona pagamento
    await page.getByTestId('payment-radio-pix').click();
    // Submete sem preencher campos de entrega
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('checkout-error')).toBeVisible();
  });

  test('11. Checkout bloqueia submissão sem método de pagamento selecionado', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);
    await addFirstProductToCart(page);

    await page.goto('/pages/checkout.html');
    await page.getByTestId('shipping-name').fill('Ana Teste');
    await page.getByTestId('shipping-address').fill('Rua Teste, 1');
    await page.getByTestId('shipping-city').fill('São Paulo');
    await page.getByTestId('shipping-zip').fill('01310-100');
    // Não seleciona método de pagamento
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('checkout-error')).toBeVisible();
    await expect(page).toHaveURL(/checkout\.html/);
  });

  test('12. As três opções de pagamento são exibidas e podem ser selecionadas', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);
    await addFirstProductToCart(page);
    await page.goto('/pages/checkout.html');

    await expect(page.getByTestId('payment-method-pix')).toBeVisible();
    await expect(page.getByTestId('payment-method-card')).toBeVisible();
    await expect(page.getByTestId('payment-method-boleto')).toBeVisible();

    // Seleciona cada um
    await page.getByTestId('payment-radio-pix').click();
    await expect(page.getByTestId('payment-radio-pix')).toBeChecked();

    await page.getByTestId('payment-radio-card').click();
    await expect(page.getByTestId('payment-radio-card')).toBeChecked();

    await page.getByTestId('payment-radio-boleto').click();
    await expect(page.getByTestId('payment-radio-boleto')).toBeChecked();
  });

  test('13. Seleção de cartão exibe campos demonstrativos e os valida', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);
    await addFirstProductToCart(page);
    await page.goto('/pages/checkout.html');

    await page.getByTestId('payment-radio-card').click();
    await expect(page.getByTestId('payment-card-info')).toBeVisible();
    await expect(page.getByTestId('payment-card-number')).toBeVisible();
    await expect(page.getByTestId('payment-card-name')).toBeVisible();
    await expect(page.getByTestId('payment-card-expiry')).toBeVisible();
    await expect(page.getByTestId('payment-card-cvv')).toBeVisible();

    // Preenche endereço mas não o cartão → erro
    await page.getByTestId('shipping-name').fill('Carlos Lima');
    await page.getByTestId('shipping-address').fill('Av Central, 200');
    await page.getByTestId('shipping-city').fill('Rio de Janeiro');
    await page.getByTestId('shipping-zip').fill('20040-020');
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('checkout-error')).toBeVisible();
  });

  test('14. Dados de cartão não são persistidos no localStorage', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);
    await addFirstProductToCart(page);
    await page.goto('/pages/checkout.html');

    await page.getByTestId('payment-radio-card').click();
    await page.getByTestId('shipping-name').fill('Carlos Lima');
    await page.getByTestId('shipping-address').fill('Av Central, 200');
    await page.getByTestId('shipping-city').fill('Rio de Janeiro');
    await page.getByTestId('shipping-zip').fill('20040-020');
    await page.getByTestId('payment-card-name').fill('CARLOS L');
    await page.getByTestId('payment-card-number').fill('1234 5678 9012 3456');
    await page.getByTestId('payment-card-expiry').fill('12/28');
    await page.getByTestId('payment-card-cvv').fill('321');
    await page.getByTestId('place-order').click();

    await expect(page).toHaveURL(/confirmation\.html/);

    // Verifica que o localStorage não tem dados sensíveis
    const storageRaw = await page.evaluate(() => {
      const order = localStorage.getItem('nexora_last_order');
      return order;
    });
    const order = JSON.parse(storageRaw);
    const orderStr = JSON.stringify(order);
    // Número de cartão, CVV e validade não devem estar no registro
    expect(orderStr).not.toContain('1234 5678 9012 3456');
    expect(orderStr).not.toContain('123456789012');
    expect(orderStr).not.toContain('321');
  });

  test('15. Pedido válido exibe método de pagamento na confirmação', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);
    await addFirstProductToCart(page);
    await page.goto('/pages/checkout.html');

    await page.getByTestId('shipping-name').fill('Beatriz Santos');
    await page.getByTestId('shipping-address').fill('Rua do Porto, 55');
    await page.getByTestId('shipping-city').fill('Florianópolis');
    await page.getByTestId('shipping-zip').fill('88010-000');
    await page.getByTestId('payment-radio-boleto').click();
    await page.getByTestId('place-order').click();

    await expect(page).toHaveURL(/confirmation\.html/);
    await expect(page.getByTestId('order-success')).toBeVisible();
    await expect(page.getByTestId('order-number')).toContainText('NEX-');
    // Exibe o método boleto
    const paymentEl = page.locator('#confirmed-payment');
    await expect(paymentEl).toContainText('Boleto');
  });

  test('16. Carrinho é zerado após compra concluída', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);
    await addFirstProductToCart(page);

    await page.goto('/pages/checkout.html');
    await page.getByTestId('shipping-name').fill('Pedro Alves');
    await page.getByTestId('shipping-address').fill('Rua Norte, 88');
    await page.getByTestId('shipping-city').fill('Curitiba');
    await page.getByTestId('shipping-zip').fill('80000-010');
    await page.getByTestId('payment-radio-pix').click();
    await page.getByTestId('place-order').click();

    await expect(page).toHaveURL(/confirmation\.html/);
    await page.getByTestId('continue-shopping').click();
    await expect(page).toHaveURL(/catalog\.html/);
    await expect(page.getByTestId('cart-count')).toHaveText('0');
  });
});

// =============================================================================
// BLOCO 3 — Interface e imagens
// =============================================================================
test.describe('Interface, imagens e seletores', () => {

  test('17. Imagens dos quatro produtos carregam ou exibem fallback', async ({ page }) => {
    await page.goto('/pages/catalog.html');
    const cards = page.getByTestId('product-card');
    await expect(cards).toHaveCount(4);

    // Para cada cartão, verifica que há um elemento de imagem (img ou fallback svg)
    for (let i = 0; i < 4; i++) {
      const card = cards.nth(i);
      const img = card.locator('img.product-img');
      await expect(img).toBeVisible();
    }
  });

  test('18. Navegação entre páginas funciona corretamente', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);

    // Catálogo → Carrinho (via header)
    await page.getByTestId('open-cart').click();
    await expect(page).toHaveURL(/cart\.html/);

    // Carrinho → Catálogo (via link)
    await page.getByRole('link', { name: /Continuar Comprando/i }).click();
    await expect(page).toHaveURL(/catalog\.html/);

    // Catálogo → Login (via logout)
    await page.locator('#btn-logout').click();
    await expect(page).toHaveURL(/login\.html/);
  });

  test('19. Seletores data-testid do contrato estão presentes', async ({ page }) => {
    // Login
    await page.goto('/pages/login.html');
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
    await expect(page.getByTestId('login-error')).toBeAttached();

    // Catálogo
    await page.goto('/pages/catalog.html');
    await expect(page.getByTestId('product-list')).toBeVisible();
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await expect(page.getByTestId('product-name').first()).toBeVisible();
    await expect(page.getByTestId('product-price').first()).toBeVisible();
    await expect(page.getByTestId('add-to-cart').first()).toBeVisible();
    await expect(page.getByTestId('cart-count')).toBeVisible();
    await expect(page.getByTestId('open-cart')).toBeVisible();

    // Carrinho (requer auth + item para ver go-to-checkout visível)
    await loginAs(page);
    await addFirstProductToCart(page);
    await page.goto('/pages/cart.html');
    await expect(page.getByTestId('cart-items')).toBeAttached();
    await expect(page.getByTestId('empty-cart')).toBeAttached();
    await expect(page.getByTestId('cart-total')).toBeAttached();
    await expect(page.getByTestId('go-to-checkout')).toBeVisible();
  });

  test('20. Remoção de avisos não eliminou o feedback essencial de ações', async ({ page }) => {
    await clearAppStorage(page);
    await loginAs(page);

    // Toast ao adicionar produto
    await page.goto('/pages/catalog.html');
    await page.getByTestId('product-card').first().getByTestId('add-to-cart').click();
    // Toast deve aparecer (verificamos via DOM)
    await expect(page.locator('.toast')).toBeVisible();

    // Mensagem de erro ao submeter login com campos vazios
    await page.evaluate(() => localStorage.removeItem('nexora_user'));
    await page.goto('/pages/login.html');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toBeVisible();
  });
});

// =============================================================================
// BLOCO LEGADO — Testes do smoke original preservados e atualizados
// =============================================================================
test.describe('Nexora - Fluxo E2E Completo com Pagamento', () => {

  test('fluxo completo e2e com Pix', async ({ page }) => {
    await clearAppStorage(page);

    // 1. Login
    await page.goto('/pages/login.html');
    await expect(page.getByTestId('login-email')).toBeVisible();
    await page.getByTestId('login-email').fill('cliente@nexora.demo');
    await page.getByTestId('login-password').fill('Nexora123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/catalog\.html/);

    // 2. Catálogo
    await expect(page.getByTestId('cart-count')).toHaveText('0');
    const firstProduct = page.getByTestId('product-card').first();
    await expect(firstProduct.getByTestId('product-name')).toBeVisible();
    await firstProduct.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    // 3. Carrinho
    await page.getByTestId('open-cart').click();
    await expect(page).toHaveURL(/cart\.html/);
    await expect(page.getByTestId('cart-items')).toBeVisible();
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await expect(page.getByTestId('cart-item-quantity')).toHaveText('1');

    // 4. Checkout
    await page.getByTestId('go-to-checkout').click();
    await expect(page).toHaveURL(/checkout\.html/);
    await expect(page.getByTestId('checkout-form')).toBeVisible();

    await page.getByTestId('shipping-name').fill('Ana Souza');
    await page.getByTestId('shipping-address').fill('Rua das Flores, 123');
    await page.getByTestId('shipping-city').fill('Curitiba');
    await page.getByTestId('shipping-zip').fill('80000-000');
    await page.getByTestId('payment-radio-pix').click();
    await page.getByTestId('place-order').click();

    // 5. Confirmação
    await expect(page).toHaveURL(/confirmation\.html/);
    await expect(page.getByTestId('order-success')).toBeVisible();
    await expect(page.getByTestId('order-number')).toContainText('NEX-');
    await expect(page.getByTestId('order-summary')).toBeVisible();
    await expect(page.getByTestId('continue-shopping')).toBeVisible();

    // 6. Retorno ao catálogo com carrinho zerado
    await page.getByTestId('continue-shopping').click();
    await expect(page).toHaveURL(/catalog\.html/);
    await expect(page.getByTestId('cart-count')).toHaveText('0');
  });
});
