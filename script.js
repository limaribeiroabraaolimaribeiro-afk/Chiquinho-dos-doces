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
    emoji: '🍈'
  },
  {
    id: 'mousse-limao',
    name: 'Mousse de Limão',
    desc: 'Leve e cítrica, com toque especial de limão.',
    price: 15,
    category: 'mousses',
    image: 'img/foto produto limão.png',
    emoji: '🍋'
  },
  {
    id: 'mousse-morango',
    name: 'Mousse de Morango',
    desc: 'Doce na medida certa, com pedaços de morango.',
    price: 15,
    category: 'mousses',
    image: 'img/produto morango.png',
    emoji: '🍓'
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
    emoji: '🍫'
  },
  {
    id: 'torta-tradicional',
    name: 'Torta de Bolacha Tradicional',
    desc: 'Clássica e irresistível, feita com camadas de bolacha e creme.',
    price: 15,
    category: 'tortas',
    image: 'assets/torta-tradicional.jpg',
    emoji: '🍰'
  },
  {
    id: 'torta-chocolate',
    name: 'Torta de Bolacha de Chocolate',
    desc: 'Camadas de bolacha com creme de chocolate e cobertura especial.',
    price: 15,
    category: 'tortas',
    image: 'assets/torta-chocolate.jpg',
    emoji: '🎂'
  }
];

// Categorias exibidas nas abas e suas seções correspondentes no DOM
const CATEGORIES = [
  { key: 'mousses', gridId: 'grid-mousses', sectionId: 'section-mousses' },
  { key: 'tortas', gridId: 'grid-tortas', sectionId: 'section-tortas' }
];

const state = {
  category: 'mousses',
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
      img.parentElement.classList.add('product-image--fallback');
    }
  });
}

// ---------- Renderização dos cards ----------

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.id = product.id;

  card.innerHTML = `
    <div class="product-image" data-emoji="${product.emoji}">
      <button class="favorite-btn" aria-label="Favoritar ${product.name}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>
        </svg>
      </button>
      <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="product-info">
      <h3 class="product-title">${product.name}</h3>
      <p class="product-description">${product.desc}</p>
      <span class="product-price">${currency(product.price)}</span>
      <button class="add-btn" data-id="${product.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" width="13" height="13"><path d="M12 5v14M5 12h14"/></svg>
        Adicionar
      </button>
    </div>
  `;

  attachImageFallback(card.querySelector('img'), product);

  card.querySelector('.favorite-btn').addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('is-active');
  });

  card.querySelector('.add-btn').addEventListener('click', () => addToCart(product.id));

  return card;
}

function renderProducts() {
  CATEGORIES.forEach(({ key, gridId, sectionId }) => {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    document.getElementById(sectionId).hidden = state.category !== key;

    if (state.category !== key) return;

    PRODUCTS.filter(p => p.category === key)
      .forEach(p => grid.appendChild(createProductCard(p)));
  });
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

// ---------- Tela de pesquisa ----------

const SEARCH_HISTORY_KEY = 'chiquinho_search_history';
const MAX_HISTORY = 6;
const SUGGESTED_IDS = ['mousse-maracuja', 'mousse-chocolate', 'torta-tradicional', 'mousse-morango'];

const searchState = { query: '', category: 'all' };

function getSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveSearchHistory(history) {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

function addToSearchHistory(term) {
  const clean = term.trim();
  if (!clean) return;
  let history = getSearchHistory().filter(h => h.toLowerCase() !== clean.toLowerCase());
  history.unshift(clean);
  history = history.slice(0, MAX_HISTORY);
  saveSearchHistory(history);
  renderSearchHistory();
}

function renderSearchHistory() {
  const history = getSearchHistory();
  const section = document.getElementById('recentSearches');
  const list = document.getElementById('historyList');

  section.hidden = history.length === 0;
  list.innerHTML = '';

  history.forEach(term => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'history-pill';
    pill.innerHTML = `
      <span>${term}</span>
      <span class="history-pill__remove" data-term="${term}">&times;</span>
    `;
    pill.addEventListener('click', (e) => {
      if (e.target.closest('.history-pill__remove')) {
        e.stopPropagation();
        const remaining = getSearchHistory().filter(h => h !== term);
        saveSearchHistory(remaining);
        renderSearchHistory();
        return;
      }
      document.getElementById('searchPageInput').value = term;
      searchState.query = term;
      renderSearchPage();
    });
    list.appendChild(pill);
  });
}

function renderSuggestedProducts() {
  const grid = document.getElementById('suggestionProducts');
  grid.innerHTML = '';
  SUGGESTED_IDS
    .map(id => PRODUCTS.find(p => p.id === id))
    .filter(Boolean)
    .forEach(p => grid.appendChild(createProductCard(p)));
}

function renderSearchPage() {
  const query = searchState.query.trim().toLowerCase();
  const resultsSection = document.getElementById('searchResultsSection');
  const suggestionsSection = document.getElementById('searchSuggestions');

  if (!query) {
    resultsSection.hidden = true;
    suggestionsSection.hidden = false;
    renderSearchHistory();
    return;
  }

  resultsSection.hidden = false;
  suggestionsSection.hidden = true;
  document.getElementById('recentSearches').hidden = true;

  const matches = PRODUCTS.filter(p =>
    (searchState.category === 'all' || p.category === searchState.category) &&
    p.name.toLowerCase().includes(query)
  );

  const grid = document.getElementById('searchResults');
  grid.innerHTML = '';
  matches.forEach(p => grid.appendChild(createProductCard(p)));

  document.getElementById('searchNoResults').hidden = matches.length > 0;
}

function openSearchPage() {
  const page = document.getElementById('searchPage');
  page.hidden = false;
  document.body.style.overflow = 'hidden';
  renderSuggestedProducts();
  renderSearchPage();
  document.getElementById('searchPageInput').focus();
}

function closeSearchPage() {
  document.getElementById('searchPage').hidden = true;
  document.body.style.overflow = '';
  document.getElementById('searchPageInput').value = '';
  searchState.query = '';
}

document.getElementById('searchTrigger').addEventListener('click', openSearchPage);
document.getElementById('closeSearchPage').addEventListener('click', closeSearchPage);

document.getElementById('searchPageInput').addEventListener('input', (e) => {
  searchState.query = e.target.value;
  renderSearchPage();
});

document.getElementById('searchPageInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addToSearchHistory(e.target.value);
});

document.getElementById('searchPageInput').addEventListener('blur', (e) => {
  if (e.target.value.trim()) addToSearchHistory(e.target.value);
});

document.querySelector('.search-categories').addEventListener('click', (e) => {
  const chip = e.target.closest('.search-category');
  if (!chip) return;
  document.querySelectorAll('.search-category').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  searchState.category = chip.dataset.category;
  renderSearchPage();
});

document.getElementById('clearSearchHistory').addEventListener('click', () => {
  saveSearchHistory([]);
  renderSearchHistory();
});

// ---------- Carrinho ----------

const WHATSAPP_NUMBER = '5547999184872';
const WHATSAPP_DISPLAY = '(47) 99918-4872';

function addToCart(productId) {
  state.cart[productId] = (state.cart[productId] || 0) + 1;
  onCartChanged();
}

function changeQty(productId, delta) {
  const current = state.cart[productId] || 0;
  const next = current + delta;
  if (next <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = next;
  }
  onCartChanged();
}

function removeFromCart(productId) {
  delete state.cart[productId];
  onCartChanged();
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

// Chamado sempre que o carrinho muda: atualiza a bolinha do cabeçalho,
// a barra inferior e — se a tela "Meu pedido" estiver aberta — a lista.
function onCartChanged() {
  updateCartBadge();
  updateBottomBar();
  if (!document.getElementById('cartPage').hidden) renderCartPage();
}

function updateCartBadge() {
  const { count } = getCartTotals();
  const cartBadge = document.getElementById('cartBadge');
  if (count > 0) {
    cartBadge.textContent = count;
    cartBadge.style.display = 'flex';
  } else {
    cartBadge.textContent = '';
    cartBadge.style.display = 'none';
  }
}

// Monta o conteúdo da barra fixa inferior: botão "Fale conosco" quando o
// carrinho está vazio, ou total + "Ver carrinho" quando há itens.
function updateBottomBar() {
  const { count, total } = getCartTotals();
  const bottomBar = document.getElementById('bottomBar');

  if (count === 0) {
    const doubtMessage = encodeURIComponent(
      'Olá! Vim pelo catálogo do Chiquinho dos Doces e gostaria de tirar uma dúvida.'
    );
    bottomBar.innerHTML = `
      <a class="bottom-contact" href="https://wa.me/${WHATSAPP_NUMBER}?text=${doubtMessage}" target="_blank" rel="noopener">
        <div class="bottom-contact-left">
          <div class="bottom-contact-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2m0 1.67a8.2 8.2 0 0 1 5.83 2.42 8.19 8.19 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.25 8.24a8.3 8.3 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.55 3.7-8.25 8.26-8.25M8.53 6.85c-.17 0-.45.06-.68.32-.24.25-.9.88-.9 2.15 0 1.27.92 2.5 1.05 2.67.13.17 1.8 2.86 4.43 3.9 2.19.87 2.64.7 3.11.65.47-.04 1.53-.62 1.75-1.23s.22-1.11.15-1.22c-.06-.11-.24-.17-.5-.3s-1.53-.75-1.77-.84-.4-.13-.58.13-.68.84-.83 1.02c-.15.17-.3.19-.56.06-.26-.13-1.08-.4-2.06-1.27-.76-.68-1.28-1.51-1.43-1.77-.15-.25-.02-.39.11-.52.12-.12.26-.3.4-.45.13-.15.17-.25.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.44-.82-1.96-.2-.46-.42-.44-.58-.45z"/>
            </svg>
          </div>
          <div class="bottom-contact-text">
            <strong>Fale conosco no WhatsApp</strong>
            <small>${WHATSAPP_DISPLAY}</small>
          </div>
        </div>
        <div class="bottom-contact-arrow">›</div>
      </a>
    `;
    return;
  }

  bottomBar.innerHTML = `
    <div class="bottom-cart">
      <div class="bottom-cart-left">
        <div class="bottom-cart-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <div class="bottom-cart-info">
          <small>${count} ${count === 1 ? 'item' : 'itens'}</small>
          <strong>${currency(total)}</strong>
        </div>
      </div>
      <button class="bottom-cart-action" type="button" onclick="openCartPage()">
        Ver carrinho
        <span>›</span>
      </button>
    </div>
  `;
}

// ---------- Tela "Meu pedido" ----------

function renderCartPage() {
  const entries = Object.entries(state.cart);
  const list = document.getElementById('cartPageList');
  const emptyMsg = document.getElementById('cartPageEmpty');
  const footer = document.getElementById('cartPageFooter');

  list.innerHTML = '';

  if (entries.length === 0) {
    emptyMsg.hidden = false;
    footer.hidden = true;
    return;
  }

  emptyMsg.hidden = true;
  footer.hidden = false;

  entries.forEach(([id, qty]) => {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;

    const item = document.createElement('div');
    item.className = 'cart-page__item';
    item.innerHTML = `
      <div class="cart-page__item-media">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="cart-page__item-info">
        <p class="cart-page__item-name">${product.name}</p>
        <span class="cart-page__item-price">${currency(product.price)} / un.</span>
        <div class="cart-page__item-qty">
          <button class="qty-btn" data-action="decrease" data-id="${id}">−</button>
          <span>${qty}</span>
          <button class="qty-btn" data-action="increase" data-id="${id}">+</button>
        </div>
      </div>
      <div class="cart-page__item-side">
        <button class="remove-btn" data-id="${id}" aria-label="Remover ${product.name}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M3 6h18"/>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
        <span class="cart-page__item-subtotal">${currency(product.price * qty)}</span>
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

    list.appendChild(item);
  });

  list.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = btn.dataset.action === 'increase' ? 1 : -1;
      changeQty(btn.dataset.id, delta);
    });
  });

  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
  });

  document.getElementById('cartPageTotal').textContent = currency(getCartTotals().total);
}

function openCartPage() {
  document.getElementById('cartPage').hidden = false;
  document.body.style.overflow = 'hidden';
  renderCartPage();
}

function closeCartPage() {
  document.getElementById('cartPage').hidden = true;
  document.body.style.overflow = '';
}

document.getElementById('cartToggle').addEventListener('click', openCartPage);
document.getElementById('closeCartPage').addEventListener('click', closeCartPage);
document.getElementById('goToCheckoutBtn').addEventListener('click', openCheckoutPage);

// ---------- Tela de checkout ----------

function openCheckoutPage() {
  document.getElementById('cartPage').hidden = true;
  document.getElementById('checkoutPage').hidden = false;
}

function closeCheckoutPage() {
  document.getElementById('checkoutPage').hidden = true;
  document.getElementById('cartPage').hidden = false;
}

function exitToHome() {
  document.getElementById('checkoutPage').hidden = true;
  document.getElementById('cartPage').hidden = true;
  document.body.style.overflow = '';
}

document.getElementById('closeCheckoutPage').addEventListener('click', closeCheckoutPage);

document.getElementById('deliveryOptions').addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  document.querySelectorAll('#deliveryOptions .option-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('deliveryFields').hidden = btn.dataset.value !== 'entrega';
});

document.getElementById('paymentOptions').addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  document.querySelectorAll('#paymentOptions .option-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('changeField').hidden = btn.dataset.value !== 'dinheiro';
});

function buildOrderMessage() {
  const { total } = getCartTotals();
  const name = document.getElementById('checkoutName').value.trim();
  const phone = document.getElementById('checkoutPhone').value.trim();
  const note = document.getElementById('checkoutNote').value.trim();
  const delivery = document.querySelector('#deliveryOptions .option-btn.active').dataset.value;
  const payment = document.querySelector('#paymentOptions .option-btn.active').dataset.value;

  const lines = Object.entries(state.cart).map(([id, qty]) => {
    const product = PRODUCTS.find(p => p.id === id);
    return `- ${qty}x ${product.name} — ${currency(product.price * qty)}`;
  });

  const parts = [
    'Olá! Quero fazer um pedido no Chiquinho dos Doces.',
    '',
    `Nome: ${name}`,
    `WhatsApp: ${phone}`,
    '',
    'Pedido:',
    ...lines,
    '',
    `Total: ${currency(total)}`,
    ''
  ];

  parts.push(`Forma de recebimento: ${delivery === 'entrega' ? 'Entrega' : 'Retirada'}`);
  if (delivery === 'entrega') {
    const address = document.getElementById('checkoutAddress').value.trim();
    const number = document.getElementById('checkoutNumber').value.trim();
    const neighborhood = document.getElementById('checkoutNeighborhood').value.trim();
    const reference = document.getElementById('checkoutReference').value.trim();
    parts.push(`Endereço: ${address}${number ? ', nº ' + number : ''}`);
    parts.push(`Bairro: ${neighborhood}`);
    if (reference) parts.push(`Referência: ${reference}`);
  }
  parts.push('');

  let paymentLabel = 'Pix';
  if (payment === 'dinheiro') {
    const change = document.getElementById('checkoutChange').value.trim();
    paymentLabel = change ? `Dinheiro (troco para ${change})` : 'Dinheiro';
  } else if (payment === 'cartao') {
    paymentLabel = 'Cartão na entrega';
  }
  parts.push(`Pagamento: ${paymentLabel}`);
  parts.push('');
  parts.push('Observação:');
  parts.push(note || 'Sem observação.');

  return parts.join('\n');
}

document.getElementById('sendOrderBtn').addEventListener('click', () => {
  const name = document.getElementById('checkoutName').value.trim();
  const phone = document.getElementById('checkoutPhone').value.trim();
  if (!name || !phone) {
    alert('Preencha seu nome e WhatsApp para continuar.');
    return;
  }

  const delivery = document.querySelector('#deliveryOptions .option-btn.active').dataset.value;
  if (delivery === 'entrega') {
    const address = document.getElementById('checkoutAddress').value.trim();
    const neighborhood = document.getElementById('checkoutNeighborhood').value.trim();
    if (!address || !neighborhood) {
      alert('Preencha o endereço e o bairro para a entrega.');
      return;
    }
  }

  const message = buildOrderMessage();
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');

  state.cart = {};
  onCartChanged();
  exitToHome();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!document.getElementById('checkoutPage').hidden) { closeCheckoutPage(); return; }
  if (!document.getElementById('cartPage').hidden) { closeCartPage(); return; }
  if (!document.getElementById('searchPage').hidden) { closeSearchPage(); }
});

// ---------- Inicialização ----------

renderProducts();
updateCartBadge();
updateBottomBar();
