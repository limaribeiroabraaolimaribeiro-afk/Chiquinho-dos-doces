// =========================================================
// Chiquinho dos Doces — Catálogo
// Dados de produtos, carrinho, filtros e busca
// =========================================================

const PRODUCTS = [
  {
    id: 'mousse-maracuja',
    name: 'Mousse de Maracujá',
    desc: 'Refrescante e cremosa, com polpa de maracujá.',
    price: 15,
    category: 'mousses',
    image: 'img/foto do produto maracuja.png',
    emoji: '🍈',
    btnClass: ''
  },
  {
    id: 'mousse-limao',
    name: 'Mousse de Limão',
    desc: 'Leve e cítrica, com toque especial de limão.',
    price: 15,
    category: 'mousses',
    image: 'img/foto produto limão.png',
    emoji: '🍋',
    btnClass: 'btn-add--gold'
  },
  {
    id: 'mousse-morango',
    name: 'Mousse de Morango',
    desc: 'Doce na medida certa, com pedaços de morango.',
    price: 15,
    category: 'mousses',
    image: 'img/produto morango.png',
    emoji: '🍓',
    btnClass: 'btn-add--berry'
  },
  {
    id: 'mousse-chocolate',
    name: 'Mousse de Chocolate',
    desc: 'Cremosa e intensa, para os apaixonados por chocolate.',
    price: 15,
    category: 'mousses',
    // imagem definitiva ainda não enviada pelo cliente — troque o arquivo
    // "img/produto chocolate.png" quando a foto própria estiver disponível.
    image: 'img/produto chocolate.png',
    tempImage: 'img/temp-mousse-chocolate.jpg',
    emoji: '🍫',
    btnClass: 'btn-add--choco'
  },
  {
    id: 'torta-tradicional',
    name: 'Torta de Bolacha Tradicional',
    desc: 'Clássica e irresistível, feita com camadas de bolacha e creme.',
    price: 15,
    category: 'tortas',
    image: 'assets/torta-tradicional.jpg',
    emoji: '🍰',
    btnClass: 'btn-add--gold'
  },
  {
    id: 'torta-chocolate',
    name: 'Torta de Bolacha de Chocolate',
    desc: 'Camadas de bolacha com creme de chocolate e cobertura especial.',
    price: 15,
    category: 'tortas',
    image: 'assets/torta-chocolate.jpg',
    emoji: '🎂',
    btnClass: 'btn-add--choco'
  }
];

// Categorias exibidas nas abas e suas seções correspondentes no DOM
const CATEGORIES = [
  { key: 'mousses', gridId: 'grid-mousses', sectionId: 'section-mousses' },
  { key: 'tortas', gridId: 'grid-tortas', sectionId: 'section-tortas' }
];

const state = {
  category: 'mousses',
  search: '',
  cart: {} // { productId: quantity }
};

const currency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ---------- Fallback em cadeia para imagens ----------
// Tenta a foto definitiva do produto; se não existir, tenta a imagem
// temporária de referência; se nenhuma existir, mostra o emoji.

function attachImageFallback(img, product) {
  img.addEventListener('error', function onError() {
    if (product.tempImage && !img.dataset.triedTemp) {
      img.dataset.triedTemp = 'true';
      if (product.tempImagePosition) img.style.objectPosition = product.tempImagePosition;
      img.src = product.tempImage;
    } else {
      img.parentElement.classList.add('product-card__media--fallback');
    }
  });
}

// ---------- Renderização dos cards ----------

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = product.category === 'tortas'
    ? 'product-card product-card--horizontal'
    : 'product-card';
  card.dataset.id = product.id;

  card.innerHTML = `
    <div class="product-card__media" data-emoji="${product.emoji}">
      <button class="fav-btn" aria-label="Favoritar ${product.name}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>
        </svg>
      </button>
      <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="product-card__body">
      <h3 class="product-card__name">${product.name}</h3>
      <p class="product-card__desc">${product.desc}</p>
      <div class="product-card__footer">
        <span class="product-card__price">${currency(product.price)}</span>
        <button class="btn-add ${product.btnClass}" data-id="${product.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
          Adicionar
        </button>
      </div>
    </div>
  `;

  attachImageFallback(card.querySelector('img'), product);

  card.querySelector('.fav-btn').addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('is-active');
  });

  card.querySelector('.btn-add').addEventListener('click', () => addToCart(product.id));

  return card;
}

function renderProducts() {
  const term = state.search.trim().toLowerCase();
  let anyVisible = false;

  CATEGORIES.forEach(({ key, gridId, sectionId }) => {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    document.getElementById(sectionId).hidden = state.category !== key;

    if (state.category !== key) return;

    const visible = PRODUCTS.filter(p =>
      p.category === key && p.name.toLowerCase().includes(term)
    );
    visible.forEach(p => grid.appendChild(createProductCard(p)));
    if (visible.length > 0) anyVisible = true;
  });

  document.getElementById('noResults').hidden = anyVisible;
}

// ---------- Abas de categoria ----------

document.getElementById('categoryTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
  btn.classList.add('tab--active');
  state.category = btn.dataset.category;
  renderProducts();
});

// ---------- Busca ----------

document.getElementById('searchInput').addEventListener('input', (e) => {
  state.search = e.target.value;
  renderProducts();
});

// ---------- Carrinho ----------

function addToCart(productId) {
  state.cart[productId] = (state.cart[productId] || 0) + 1;
  updateCartUI();
}

function changeQty(productId, delta) {
  const current = state.cart[productId] || 0;
  const next = current + delta;
  if (next <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = next;
  }
  updateCartUI();
}

function getCartTotals() {
  let count = 0;
  let total = 0;
  Object.entries(state.cart).forEach(([id, qty]) => {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;
    count += qty;
    total += qty * product.price;
  });
  return { count, total };
}

function renderCartPanel() {
  const container = document.getElementById('cartItems');
  const entries = Object.entries(state.cart);

  if (entries.length === 0) {
    container.innerHTML = '<p class="cart-panel__empty">Seu carrinho está vazio.</p>';
    return;
  }

  container.innerHTML = '';
  entries.forEach(([id, qty]) => {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;

    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = `
      <div class="cart-item__media">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="cart-item__info">
        <p class="cart-item__name">${product.name}</p>
        <span class="cart-item__price">${currency(product.price)}</span>
      </div>
      <div class="cart-item__qty">
        <button class="qty-btn" data-action="decrease" data-id="${id}">−</button>
        <span>${qty}</span>
        <button class="qty-btn" data-action="increase" data-id="${id}">+</button>
      </div>
    `;

    const img = item.querySelector('img');
    img.addEventListener('error', function onError() {
      if (product.tempImage && !img.dataset.triedTemp) {
        img.dataset.triedTemp = 'true';
        img.src = product.tempImage;
      } else {
        img.style.display = 'none';
        img.parentElement.textContent = product.emoji;
      }
    });

    container.appendChild(item);
  });

  container.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = btn.dataset.action === 'increase' ? 1 : -1;
      changeQty(btn.dataset.id, delta);
    });
  });
}

function updateCartUI() {
  const { count, total } = getCartTotals();

  document.getElementById('cartBadge').textContent = count;
  document.getElementById('cartBarBadge').textContent = count;
  document.getElementById('cartBarCount').textContent =
    `${count} ${count === 1 ? 'item' : 'itens'} no carrinho`;
  document.getElementById('cartBarTotal').textContent = currency(total);
  document.getElementById('cartPanelTotal').textContent = currency(total);

  renderCartPanel();
}

// ---------- Painel lateral do carrinho ----------

const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');

function openCart() {
  cartPanel.classList.add('is-open');
  cartOverlay.classList.add('is-open');
}

function closeCart() {
  cartPanel.classList.remove('is-open');
  cartOverlay.classList.remove('is-open');
}

document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// ---------- Finalizar pedido ----------

function checkout() {
  const { count, total } = getCartTotals();
  if (count === 0) {
    alert('Seu carrinho está vazio. Adicione produtos antes de finalizar o pedido.');
    return;
  }

  const lines = Object.entries(state.cart).map(([id, qty]) => {
    const product = PRODUCTS.find(p => p.id === id);
    return `${qty}x ${product.name} — ${currency(product.price * qty)}`;
  });

  const message = [
    'Olá! Gostaria de fazer o seguinte pedido:',
    '',
    ...lines,
    '',
    `Total: ${currency(total)}`
  ].join('\n');

  window.open(`https://wa.me/5500000000000?text=${encodeURIComponent(message)}`, '_blank');
}

document.getElementById('checkoutBtn').addEventListener('click', checkout);
document.getElementById('checkoutBtn2').addEventListener('click', checkout);

// ---------- Inicialização ----------

renderProducts();
updateCartUI();
