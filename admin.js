// =========================================================
// Chiquinho dos Doces — Painel de Gestão
// Login (Supabase Auth), Dashboard, Produtos, Pedidos, Entregas
// =========================================================

const currency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CATEGORY_LABELS = { mousse: 'Mousse', torta: 'Torta de Bolacha' };
const DELIVERY_LABELS = { entrega: 'Entrega', retirada: 'Retirada' };
const PAYMENT_LABELS = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão na entrega' };
const STATUS_LABELS = {
  novo: 'Novo',
  em_preparo: 'Em preparo',
  saiu_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
};

// Escapa texto vindo de fontes não confiáveis (dados enviados pelo cliente
// no checkout, que qualquer visitante pode gravar) antes de inserir no DOM.
function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// Monta um link wa.me a partir do número digitado pelo cliente, garantindo
// o código do país (55) mesmo se o cliente não tiver digitado.
function whatsappLinkFor(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

// ---------- Login / sessão ----------

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginAlert = document.getElementById('loginAlert');
const loginBtn = document.getElementById('loginBtn');

function showLoginAlert(message) {
  loginAlert.textContent = message;
  loginAlert.hidden = false;
}

function clearLoginAlert() {
  loginAlert.hidden = true;
  loginAlert.textContent = '';
}

function showLogin() {
  loginScreen.hidden = false;
  adminApp.hidden = true;
}

function showApp(session) {
  loginScreen.hidden = true;
  adminApp.hidden = false;
  document.getElementById('adminUserEmail').textContent = session?.user?.email || '';
  loadDashboard();
}

if (!window.supabaseClient) {
  showLoginAlert(
    'Supabase ainda não configurado. Edite o arquivo supabase-config.js com a URL e a chave anônima ' +
    'do seu projeto, rode sql/supabase_schema.sql e crie um usuário administrador em Authentication → Users.'
  );
  loginBtn.disabled = true;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!window.supabaseClient) return;

  clearLoginAlert();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  loginBtn.disabled = true;
  loginBtn.textContent = 'Entrando...';

  const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

  loginBtn.disabled = false;
  loginBtn.textContent = 'Entrar';

  if (error) {
    showLoginAlert('E-mail ou senha inválidos.');
    return;
  }

  showApp(data.session);
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (window.supabaseClient) await window.supabaseClient.auth.signOut();
  showLogin();
});

async function initAuth() {
  if (!window.supabaseClient) {
    showLogin();
    return;
  }

  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (session) {
    showApp(session);
  } else {
    showLogin();
  }

  window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') showLogin();
  });
}

// ---------- Navegação entre telas ----------

const VIEW_TITLES = {
  dashboard: 'Dashboard',
  products: 'Produtos',
  orders: 'Pedidos',
  deliveries: 'Entregas'
};

document.getElementById('adminNav').addEventListener('click', (e) => {
  const btn = e.target.closest('.admin-nav-item');
  if (!btn) return;

  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const view = btn.dataset.view;
  document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  document.getElementById('viewTitle').textContent = VIEW_TITLES[view] || '';

  if (view === 'dashboard') loadDashboard();
  if (view === 'products') loadProducts();
  if (view === 'orders') loadOrders();
  if (view === 'deliveries') loadDeliveries();
});

// ---------- Dashboard ----------

async function loadDashboard() {
  const msg = document.getElementById('dashboardMessage');
  msg.hidden = true;

  if (!window.supabaseClient) {
    msg.textContent = 'Configure o Supabase para ver os números de vendas.';
    msg.hidden = false;
    return;
  }

  const { data, error } = await window.supabaseClient
    .from('orders')
    .select('status, total, created_at');

  if (error) {
    console.warn('Erro ao carregar dashboard:', error);
    msg.textContent = 'Não foi possível carregar os dados do dashboard.';
    msg.hidden = false;
    return;
  }

  const rows = data || [];
  const todayStr = new Date().toDateString();

  const totalOrders = rows.length;
  const newOrders = rows.filter(r => r.status === 'novo').length;
  const deliveredOrders = rows.filter(r => r.status === 'entregue').length;
  const totalSold = rows
    .filter(r => r.status !== 'cancelado')
    .reduce((sum, r) => sum + Number(r.total || 0), 0);
  const todaySales = rows
    .filter(r => r.status !== 'cancelado' && new Date(r.created_at).toDateString() === todayStr)
    .reduce((sum, r) => sum + Number(r.total || 0), 0);

  document.getElementById('statTotalOrders').textContent = totalOrders;
  document.getElementById('statNewOrders').textContent = newOrders;
  document.getElementById('statDeliveredOrders').textContent = deliveredOrders;
  document.getElementById('statTotalSold').textContent = currency(totalSold);
  document.getElementById('statTodaySales').textContent = currency(todaySales);
}

// ---------- Produtos ----------

let productsCache = [];

async function loadProducts() {
  const tbody = document.getElementById('productsTableBody');
  const empty = document.getElementById('productsEmpty');
  tbody.innerHTML = '';

  if (!window.supabaseClient) {
    empty.textContent = 'Configure o Supabase para gerenciar produtos.';
    empty.hidden = false;
    return;
  }

  const { data, error } = await window.supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('Erro ao carregar produtos:', error);
    empty.textContent = 'Não foi possível carregar os produtos.';
    empty.hidden = false;
    return;
  }

  productsCache = data || [];
  empty.hidden = productsCache.length > 0;

  productsCache.forEach(product => {
    const tr = document.createElement('tr');
    const categoryEmoji = product.category === 'torta' ? '🍰' : '🍮';

    const thumbCell = document.createElement('td');
    if (product.image_url) {
      const img = document.createElement('img');
      img.className = 'table-product-thumb';
      img.src = product.image_url;
      img.alt = product.name;
      img.onerror = () => {
        const fallback = document.createElement('div');
        fallback.className = 'table-product-thumb table-product-thumb--emoji';
        fallback.textContent = categoryEmoji;
        img.replaceWith(fallback);
      };
      thumbCell.appendChild(img);
    } else {
      thumbCell.innerHTML = `<div class="table-product-thumb table-product-thumb--emoji">${categoryEmoji}</div>`;
    }

    tr.appendChild(thumbCell);
    tr.insertAdjacentHTML('beforeend', `
      <td>${escapeHtml(product.name)}</td>
      <td>${CATEGORY_LABELS[product.category] || escapeHtml(product.category)}</td>
      <td>${currency(product.price)}</td>
      <td><span class="active-badge active-badge--${product.is_active ? 'yes' : 'no'}">${product.is_active ? 'Ativo' : 'Inativo'}</span></td>
      <td>
        <div class="table-actions">
          <button class="admin-icon-btn" data-action="edit" title="Editar">✏️</button>
          <button class="admin-icon-btn" data-action="toggle" title="Ativar/Desativar">${product.is_active ? '🚫' : '✅'}</button>
          <button class="admin-icon-btn admin-icon-btn--danger" data-action="delete" title="Excluir">🗑️</button>
        </div>
      </td>
    `);

    tr.querySelector('[data-action="edit"]').addEventListener('click', () => openProductModal(product));
    tr.querySelector('[data-action="toggle"]').addEventListener('click', () => toggleProductActive(product));
    tr.querySelector('[data-action="delete"]').addEventListener('click', () => deleteProduct(product));

    tbody.appendChild(tr);
  });
}

async function toggleProductActive(product) {
  const { error } = await window.supabaseClient
    .from('products')
    .update({ is_active: !product.is_active })
    .eq('id', product.id);

  if (error) {
    console.warn('Erro ao atualizar produto:', error);
    alert('Não foi possível atualizar o produto.');
    return;
  }
  loadProducts();
}

async function deleteProduct(product) {
  if (!confirm(`Excluir "${product.name}"? Essa ação não pode ser desfeita.`)) return;

  const { error } = await window.supabaseClient.from('products').delete().eq('id', product.id);
  if (error) {
    console.warn('Erro ao excluir produto:', error);
    alert('Não foi possível excluir o produto.');
    return;
  }
  loadProducts();
}

const productModalOverlay = document.getElementById('productModalOverlay');
const productForm = document.getElementById('productForm');
const productFormAlert = document.getElementById('productFormAlert');

function openProductModal(product) {
  productForm.reset();
  productFormAlert.hidden = true;
  document.getElementById('productId').value = '';

  if (product) {
    document.getElementById('productModalTitle').textContent = 'Editar produto';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productImageUrl').value = product.image_url || '';
    document.getElementById('productIsActive').checked = product.is_active;
  } else {
    document.getElementById('productModalTitle').textContent = 'Novo produto';
    document.getElementById('productIsActive').checked = true;
  }

  productModalOverlay.classList.add('active');
}

function closeProductModal() {
  productModalOverlay.classList.remove('active');
}

document.getElementById('newProductBtn').addEventListener('click', () => openProductModal(null));
document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
document.getElementById('cancelProductForm').addEventListener('click', closeProductModal);
productModalOverlay.addEventListener('click', (e) => {
  if (e.target === productModalOverlay) closeProductModal();
});

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  productFormAlert.hidden = true;

  if (!window.supabaseClient) return;

  const id = document.getElementById('productId').value;
  const name = document.getElementById('productName').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);

  if (!name) {
    productFormAlert.textContent = 'Informe o nome do produto.';
    productFormAlert.hidden = false;
    return;
  }
  if (isNaN(price) || price < 0) {
    productFormAlert.textContent = 'Informe um preço válido.';
    productFormAlert.hidden = false;
    return;
  }

  const payload = {
    name,
    description: document.getElementById('productDescription').value.trim(),
    price,
    category: document.getElementById('productCategory').value,
    image_url: document.getElementById('productImageUrl').value.trim() || null,
    is_active: document.getElementById('productIsActive').checked
  };

  const saveBtn = document.getElementById('saveProductBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando...';

  const { error } = id
    ? await window.supabaseClient.from('products').update(payload).eq('id', id)
    : await window.supabaseClient.from('products').insert(payload);

  saveBtn.disabled = false;
  saveBtn.textContent = 'Salvar produto';

  if (error) {
    console.warn('Erro ao salvar produto:', error);
    productFormAlert.textContent = 'Não foi possível salvar o produto. Tente novamente.';
    productFormAlert.hidden = false;
    return;
  }

  closeProductModal();
  loadProducts();
});

// ---------- Pedidos ----------

let ordersCache = [];

async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  const empty = document.getElementById('ordersEmpty');
  tbody.innerHTML = '';

  if (!window.supabaseClient) {
    empty.textContent = 'Configure o Supabase para ver os pedidos.';
    empty.hidden = false;
    return;
  }

  const { data, error } = await window.supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Erro ao carregar pedidos:', error);
    empty.textContent = 'Não foi possível carregar os pedidos.';
    empty.hidden = false;
    return;
  }

  ordersCache = data || [];
  empty.hidden = ordersCache.length > 0;

  ordersCache.forEach(order => {
    const tr = document.createElement('tr');
    tr.className = 'is-clickable';
    tr.innerHTML = `
      <td>#${escapeHtml(order.id.slice(0, 8))}</td>
      <td>${escapeHtml(order.customer_name)}</td>
      <td>${escapeHtml(order.customer_whatsapp)}</td>
      <td>${currency(order.total)}</td>
      <td>${DELIVERY_LABELS[order.delivery_type] || escapeHtml(order.delivery_type)}</td>
      <td>${PAYMENT_LABELS[order.payment_method] || escapeHtml(order.payment_method)}</td>
      <td><span class="status-badge status-badge--${order.status}">${STATUS_LABELS[order.status] || order.status}</span></td>
      <td>${formatDateTime(order.created_at)}</td>
    `;
    tr.addEventListener('click', () => openOrderModal(order));
    tbody.appendChild(tr);
  });
}

document.getElementById('refreshOrdersBtn').addEventListener('click', loadOrders);

const orderModalOverlay = document.getElementById('orderModalOverlay');

async function openOrderModal(order) {
  const content = document.getElementById('orderDetailContent');
  content.innerHTML = '<p class="admin-empty">Carregando itens...</p>';
  orderModalOverlay.classList.add('active');

  document.getElementById('orderWhatsappLink').href = whatsappLinkFor(order.customer_whatsapp);
  const statusSelect = document.getElementById('orderStatusSelect');
  statusSelect.value = order.status;
  statusSelect.onchange = () => updateOrderStatus(order.id, statusSelect.value);

  let items = [];
  if (window.supabaseClient) {
    const { data, error } = await window.supabaseClient
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);
    if (!error) items = data || [];
  }

  const rows = [
    ['Nome', order.customer_name],
    ['WhatsApp', order.customer_whatsapp],
    ['Forma de recebimento', DELIVERY_LABELS[order.delivery_type] || order.delivery_type]
  ];

  if (order.delivery_type === 'entrega') {
    rows.push(['Endereço', `${order.address || ''}, nº ${order.number || ''}`]);
    rows.push(['Bairro', order.neighborhood || '']);
    if (order.reference) rows.push(['Referência', order.reference]);
  }

  rows.push(['Pagamento', PAYMENT_LABELS[order.payment_method] || order.payment_method]);
  if (order.change_for) rows.push(['Troco para', order.change_for]);
  rows.push(['Observação', order.observation || 'Sem observação.']);
  rows.push(['Data do pedido', formatDateTime(order.created_at)]);

  const itemsRows = items.map(item => `
    <tr>
      <td>${item.quantity}x ${escapeHtml(item.product_name)}${item.observation ? `<br><small>Obs: ${escapeHtml(item.observation)}</small>` : ''}</td>
      <td>${currency(item.unit_price)}</td>
      <td>${currency(item.subtotal)}</td>
    </tr>
  `).join('');

  content.innerHTML = `
    <div class="order-detail-section">
      <h3>Dados do cliente</h3>
      ${rows.map(([label, value]) => `
        <div class="order-detail-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>
      `).join('')}
    </div>

    <div class="order-detail-section">
      <h3>Itens do pedido</h3>
      <table class="order-items-table">
        <thead><tr><th>Item</th><th>Unitário</th><th>Subtotal</th></tr></thead>
        <tbody>${itemsRows || '<tr><td colspan="3">Nenhum item encontrado.</td></tr>'}</tbody>
      </table>
    </div>

    <div class="order-detail-section">
      <div class="order-detail-row"><span>Subtotal</span><span>${currency(order.subtotal)}</span></div>
      <div class="order-detail-row"><span>Taxa de entrega</span><span>${order.delivery_fee ? currency(order.delivery_fee) : 'Grátis / a combinar'}</span></div>
      <div class="order-detail-row"><span>Total</span><span>${currency(order.total)}</span></div>
    </div>
  `;
}

document.getElementById('closeOrderModal').addEventListener('click', () => {
  orderModalOverlay.classList.remove('active');
});
orderModalOverlay.addEventListener('click', (e) => {
  if (e.target === orderModalOverlay) orderModalOverlay.classList.remove('active');
});

async function updateOrderStatus(orderId, status) {
  const { error } = await window.supabaseClient.from('orders').update({ status }).eq('id', orderId);
  if (error) {
    console.warn('Erro ao atualizar status do pedido:', error);
    alert('Não foi possível atualizar o status do pedido.');
    return;
  }
  loadOrders();
  if (document.getElementById('view-deliveries').classList.contains('active')) loadDeliveries();
  if (document.getElementById('view-dashboard').classList.contains('active')) loadDashboard();
}

// ---------- Entregas ----------

async function loadDeliveries() {
  const list = document.getElementById('deliveriesList');
  const empty = document.getElementById('deliveriesEmpty');
  list.innerHTML = '';

  if (!window.supabaseClient) {
    empty.textContent = 'Configure o Supabase para ver as entregas.';
    empty.hidden = false;
    return;
  }

  const { data, error } = await window.supabaseClient
    .from('orders')
    .select('*')
    .eq('status', 'saiu_entrega')
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('Erro ao carregar entregas:', error);
    empty.textContent = 'Não foi possível carregar as entregas.';
    empty.hidden = false;
    return;
  }

  const deliveries = data || [];
  empty.hidden = deliveries.length > 0;

  deliveries.forEach(order => {
    const card = document.createElement('div');
    card.className = 'delivery-card';

    const address = order.address
      ? `${order.address}, nº ${order.number || ''} — ${order.neighborhood || ''}`
      : 'Retirada no local (sem endereço)';

    const mapsQuery = order.address
      ? encodeURIComponent(`${order.address}, ${order.number || ''}, ${order.neighborhood || ''}`)
      : '';

    card.innerHTML = `
      <h3>${escapeHtml(order.customer_name)}</h3>
      <p class="delivery-address">📍 ${escapeHtml(address)}</p>
      <p class="delivery-total">${currency(order.total)}</p>
      <div class="delivery-card-actions">
        <a class="admin-secondary-btn" href="${whatsappLinkFor(order.customer_whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>
        ${mapsQuery ? `<a class="admin-secondary-btn" href="https://www.google.com/maps/search/?api=1&query=${mapsQuery}" target="_blank" rel="noopener">Ver no Maps</a>` : ''}
        <button class="admin-primary-btn" data-action="deliver">Marcar como entregue</button>
      </div>
    `;

    card.querySelector('[data-action="deliver"]').addEventListener('click', () => updateOrderStatus(order.id, 'entregue'));

    list.appendChild(card);
  });
}

document.getElementById('refreshDeliveriesBtn').addEventListener('click', loadDeliveries);

// ---------- Inicialização ----------

initAuth();
