/* animation.js — ROXI con carrito persistente */

// ===== util: toast =====
const notify = (msg, timeout = 2500) => {
  const n = document.getElementById('notification');
  if (!n) return;
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), timeout);
};

// ===== helpers de moneda =====
const CURRENCY_SYMBOL = 'Bs';
const currency = (n) => `${CURRENCY_SYMBOL} ${(Math.round(n * 100) / 100).toLocaleString('es-BO')}`;

// ===== storage =====
const CART_KEY = 'roxi_cart_v1';
const loadCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
};
const saveCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items));

// ===== header behavior =====
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header?.classList.toggle('scrolled', window.scrollY > 10);
});

// ===== mobile menu =====
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle?.addEventListener('click', () => {
  const open = !navLinks.classList.contains('active');
  navLinks.classList.toggle('active', open);
  menuToggle.setAttribute('aria-expanded', String(open));
});
navLinks?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('active'))
);

// ===== smooth anchors =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if (el) { e.preventDefault(); el.scrollIntoView({behavior:'smooth'}); }
  });
});

// ===== hero carousel =====
const slides = Array.from(document.querySelectorAll('.hero-slide'));
const dots = Array.from(document.querySelectorAll('.carousel-dot'));
let current = 0;
const goTo = (idx) => {
  if (!slides.length) return;
  slides[current].classList.remove('active');
  dots[current].classList.remove('active');
  current = (idx + slides.length) % slides.length;
  slides[current].classList.add('active');
  dots[current].classList.add('active');
};
dots.forEach((d,i)=> d.addEventListener('click', ()=> goTo(i)));
setInterval(()=> goTo(current + 1), 5000);

// ===== carrito =====
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');

// restaura contador al cargar
function updateCartCount() {
  const items = loadCart();
  const qty = items.reduce((sum,i)=> sum + (i.qty||1), 0);
  if (cartCount) cartCount.textContent = qty;
}
updateCartCount();

// agrega/une productos (mismo nombre+precio => incrementa qty)
function addToCart({ name, price, style, src }) {
  const items = loadCart();
  const idx = items.findIndex(i => i.name === name && i.price === Number(price));
  if (idx >= 0) {
    items[idx].qty = (items[idx].qty || 1) + 1;
  } else {
    items.push({ id: Date.now()+Math.random(), name, price: Number(price), style, src, qty: 1 });
  }
  saveCart(items);
  updateCartCount();
}

// click “Añadir al Carrito” en tarjetas
document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('.add-to-cart');
  if (!btn) return;
  const card = btn.closest('.product-card');
  const name = card.querySelector('.product-name')?.textContent?.trim();
  const priceText = card.querySelector('.product-price')?.textContent?.trim() || '';
  const price = Number(priceText.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'));
  const style = (card.dataset.style || '').trim();
  const src = card.querySelector('.product-image')?.src || '';
  addToCart({ name, price, style, src });
  notify('Producto añadido al carrito 🛒');
});

// icono carrito
cartBtn?.addEventListener('click', () => {
  window.location.href = 'checkout.html';
});

// ===== filtros =====
const filterBar = document.getElementById('filterBar');
const productCards = Array.from(document.querySelectorAll('.product-card'));
const applyFilter = (style) => {
  productCards.forEach(card => {
    const s = (card.dataset.style || '').toLowerCase();
    card.style.display = (style === 'all' || s === style) ? '' : 'none';
  });
  filterBar?.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === style)
  );
};
filterBar?.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-filter]');
  if (!b) return;
  applyFilter(b.dataset.filter);
});
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', () => {
    const style = (card.dataset.target || '').toLowerCase();
    document.getElementById('productos')?.scrollIntoView({behavior:'smooth'});
    if (style) applyFilter(style);
  });
});
applyFilter('all');

// ===== Lightbox (galería + productos) =====
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lightboxImg');
const lbClose = document.querySelector('.lightbox-close');
const lbTitle = document.getElementById('lbTitle');
const lbMeta = document.getElementById('lbMeta');
const lbAdd = document.getElementById('lbAdd');

const lbContext = { name: '', price: 0, style: '', src: '', source: '' };

const openLB = ({ name, price, style, src, source }) => {
  lbContext.name = name || 'Vista';
  lbContext.price = Number(price) || 0;
  lbContext.style = style || '';
  lbContext.src = src || '';
  lbContext.source = source || '';

  lbImg.src = src;
  lbTitle.textContent = name || 'Vista';
  lbMeta.textContent = lbContext.price ? `${currency(lbContext.price)}${style ? '  •  ' + style : ''}` : (style || 'Inspiración');
  lb.classList.add('show');
  lb.setAttribute('aria-hidden', 'false');
};
const closeLB = () => {
  lb.classList.remove('show');
  lb.setAttribute('aria-hidden', 'true');
  lbImg.src = '';
  lbTitle.textContent = '';
  lbMeta.textContent = '';
};
lbClose?.addEventListener('click', closeLB);
lb?.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLB(); });

lbAdd?.addEventListener('click', () => {
  addToCart(lbContext);
  notify(`${lbContext.name} añadido al carrito 🛒`);
});

// Click en imagen de producto => abrir Lightbox
document.querySelectorAll('#productos .product-card .product-image').forEach(img => {
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', () => {
    const card = img.closest('.product-card');
    const name = card.querySelector('.product-name')?.textContent?.trim();
    const style = (card.dataset.style || '').trim();
    const priceText = card.querySelector('.product-price')?.textContent?.trim() || '';
    const price = Number(priceText.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'));
    openLB({ name, price, style, src: img.src, source: 'product' });
  });
});

// Overlay “Añadir” en galería + lightbox
document.querySelectorAll('#galeria .gallery-item').forEach((item, idx) => {
  const btn = document.createElement('button');
  btn.className = 'gallery-add';
  btn.textContent = 'Añadir al Carrito';
  item.appendChild(btn);

  const img = item.querySelector('img');

  img.addEventListener('click', () => {
    const name = img.alt?.trim() || `Inspiración ${idx + 1}`;
    const price = 199;
    openLB({ name, price, style: 'Inspiración', src: img.src, source: 'gallery' });
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const name = img.alt?.trim() || `Inspiración ${idx + 1}`;
    const price = 199;
    addToCart({ name, price, style: 'Inspiración', src: img.src });
    notify(`${name} añadido al carrito 🛒`);
  });
});

// ===== Búsqueda =====
const searchBtn = document.getElementById('searchBtn');
const searchOverlay = document.getElementById('searchOverlay');
const searchInput = document.getElementById('searchInput');
const searchClose = document.getElementById('searchClose');

const toggleSearch = (show) => {
  if (!searchOverlay) return;
  searchOverlay.classList.toggle('show', show);
  searchOverlay.setAttribute('aria-hidden', show ? 'false' : 'true');
  if (show) setTimeout(()=> searchInput?.focus(), 50);
};
searchBtn?.addEventListener('click', ()=> toggleSearch(true));
searchClose?.addEventListener('click', ()=> toggleSearch(false));
searchOverlay?.addEventListener('click', (e)=>{ if (e.target === searchOverlay) toggleSearch(false); });
document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') toggleSearch(false); });

const productList = Array.from(document.querySelectorAll('#productos .product-card'));
const productIndex = productList.map(card => ({ card, text: card.textContent.toLowerCase() }));
searchInput?.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) { productList.forEach(c => c.style.display = ''); return; }
  productIndex.forEach(({ card, text }) => {
    card.style.display = text.includes(q) ? '' : 'none';
  });
});

// Atajo Ctrl/Cmd+K
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault(); toggleSearch(true);
  }
});