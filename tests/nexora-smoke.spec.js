// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Nexora - Teste de Fumaça (Smoke Test)', () => {
  test('deve carregar a página inicial/login com sucesso e validar elementos fundamentais', async ({ page }) => {
    await page.goto('/pages/login.html');

    // Valida título da página
    await expect(page).toHaveTitle(/Login | Nexora/);

    // Valida contrato de data-testid do login
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();

    // Valida mensagem demonstrativa
    await expect(page.getByText('cliente@nexora.demo')).toBeVisible();
  });

  test('deve validar login com credenciais inválidas e com credenciais válidas', async ({ page }) => {
    await page.goto('/pages/login.html');

    // Tentativa com senha incorreta
    await page.getByTestId('login-email').fill('cliente@nexora.demo');
    await page.getByTestId('login-password').fill('SenhaErrada123');
    await page.getByTestId('login-submit').click();

    // Valida exibição do erro
    const errorEl = page.getByTestId('login-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('Credenciais inválidas');

    // Sucesso com credenciais válidas
    await page.getByTestId('login-password').fill('Nexora123');
    await page.getByTestId('login-submit').click();

    // Redireciona para o catálogo
    await expect(page).toHaveURL(/.*catalog\.html/);
    await expect(page.getByTestId('product-list')).toBeVisible();
  });

  test('fluxo completo e2e demonstrativo de compra', async ({ page }) => {
    // 1. Acesso ao catálogo
    await page.goto('/pages/catalog.html');
    await expect(page.getByTestId('cart-count')).toHaveText('0');

    // 2. Adicionar primeiro produto
    const firstProduct = page.getByTestId('product-card').first();
    await expect(firstProduct.getByTestId('product-name')).toBeVisible();
    await expect(firstProduct.getByTestId('product-price')).toBeVisible();
    await firstProduct.getByTestId('add-to-cart').click();

    // Valida atualização do contador
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    // 3. Abrir o carrinho
    await page.getByTestId('open-cart').click();
    await expect(page).toHaveURL(/.*cart\.html/);
    await expect(page.getByTestId('cart-items')).toBeVisible();
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await expect(page.getByTestId('cart-item-quantity')).toHaveText('1');

    // 4. Ir para o checkout
    await page.getByTestId('go-to-checkout').click();
    await expect(page).toHaveURL(/.*checkout\.html/);
    await expect(page.getByTestId('checkout-form')).toBeVisible();

    // 5. Preencher dados de entrega e finalizar pedido
    await page.getByTestId('shipping-name').fill('Ana Souza');
    await page.getByTestId('shipping-address').fill('Rua das Flores, 123');
    await page.getByTestId('shipping-city').fill('Curitiba');
    await page.getByTestId('shipping-zip').fill('80000-000');
    await page.getByTestId('place-order').click();

    // 6. Confirmação do pedido
    await expect(page).toHaveURL(/.*confirmation\.html/);
    await expect(page.getByTestId('order-success')).toBeVisible();
    await expect(page.getByTestId('order-number')).toContainText('NEX-');
    await expect(page.getByTestId('order-summary')).toBeVisible();
    await expect(page.getByTestId('continue-shopping')).toBeVisible();

    // 7. Voltar ao catálogo e verificar carrinho zerado
    await page.getByTestId('continue-shopping').click();
    await expect(page).toHaveURL(/.*catalog\.html/);
    await expect(page.getByTestId('cart-count')).toHaveText('0');
  });
});
