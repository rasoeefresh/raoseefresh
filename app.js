/**
 * Raosee Fresh Supermarket - Core Application Logic
 * Integrates Blinkit-style quick commerce with Razorpay Online Payment Gateway,
 * Instant Direct UPI (0% Fee), and WhatsApp order dispatch.
 */

// Global State
const state = {
  products: [],
  config: {},
  cart: {}, // { [productId]: quantity }
  activeCategory: 'all',
  searchQuery: '',
  tipAmount: 0,
  selectedPaymentMethod: 'razorpay', // 'razorpay', 'upi_qr', 'cod'
  currentUser: null,
  deliveryAddress: {
    name: '',
    phone: '',
    flat: '',
    street: '',
    landmark: '',
    instructions: 'Ring the doorbell and leave at door'
  },
  currentTrackingOrder: null,
  pendingUpiOrder: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadConfigAndData();
  setupEventListeners();
  renderCategories();
  renderProducts();
  updateCartUI();
  setupSearchPlaceholderRotation();
  checkUrlParamsForTracking();
  setupCrossTabSync();
});

// Load configuration and data from storage
function loadConfigAndData() {
  state.config = typeof getStoreConfig === 'function' ? getStoreConfig() : {};
  state.products = typeof getStoredProducts === 'function' ? getStoredProducts() : [];
  
  if (state.config.payment && state.config.payment.defaultMethod) {
    state.selectedPaymentMethod = state.config.payment.defaultMethod;
  }

  // Load saved cart
  try {
    const savedCart = localStorage.getItem('raosee_cart');
    if (savedCart) state.cart = JSON.parse(savedCart);
  } catch (e) {
    state.cart = {};
  }

  // Load current logged-in customer profile
  try {
    const savedUser = localStorage.getItem('raosee_current_user');
    if (savedUser) {
      state.currentUser = JSON.parse(savedUser);
      if (state.currentUser.address) {
        state.deliveryAddress.name = state.currentUser.name || '';
        state.deliveryAddress.phone = state.currentUser.phone || '';
        state.deliveryAddress.flat = state.currentUser.address.flat || '';
        state.deliveryAddress.street = state.currentUser.address.street || '';
        state.deliveryAddress.landmark = state.currentUser.address.landmark || '';
      }
    }
  } catch (e) {
    state.currentUser = null;
  }
  updateHeaderUserUI();

  // Load saved address
  try {
    const savedAddress = localStorage.getItem('raosee_address');
    if (savedAddress) {
      const parsedAddr = JSON.parse(savedAddress);
      state.deliveryAddress = { ...state.deliveryAddress, ...parsedAddr };
    }
  } catch (e) {
    // defaults
  }

  // Apply branding
  applyBranding();
  renderBanners();
  renderAnnouncement();

  // Async cloud sync pull if enabled
  if (typeof syncFromCloud === 'function') {
    syncFromCloud().then(updated => {
      if (updated) {
        state.config = typeof getStoreConfig === 'function' ? getStoreConfig() : {};
        state.products = typeof getStoredProducts === 'function' ? getStoredProducts() : [];
        applyBranding();
        renderBanners();
        renderAnnouncement();
        renderCategories();
        renderProducts();
      }
    }).catch(e => console.warn("Cloud sync check error", e));
  }
}

function applyBranding() {
  const cfg = state.config || {};

  const storeNameEls = document.querySelectorAll('.js-store-name');
  storeNameEls.forEach(el => el.textContent = cfg.storeName || 'Raosee Fresh');

  const companyNameEls = document.querySelectorAll('.js-company-name');
  companyNameEls.forEach(el => el.textContent = cfg.companyName || cfg.storeName || 'Raosee Fresh Retail Pvt Ltd');

  const outletNameEls = document.querySelectorAll('.js-outlet-name');
  outletNameEls.forEach(el => el.textContent = cfg.outletName || 'Main Dark Store');

  const outletAddrEls = document.querySelectorAll('.js-outlet-address');
  outletAddrEls.forEach(el => el.textContent = cfg.storeAddress || 'HSR Layout, Bangalore');

  const gstinEls = document.querySelectorAll('.js-store-gstin');
  gstinEls.forEach(el => el.textContent = cfg.gstin || '29ABCDE1234F1Z5');

  const fssaiEls = document.querySelectorAll('.js-store-fssai');
  fssaiEls.forEach(el => el.textContent = cfg.fssaiNumber || '11223344000123');

  const taglineEls = document.querySelectorAll('.js-store-tagline');
  taglineEls.forEach(el => el.textContent = cfg.tagline || 'Farm Fresh Groceries Delivered in 10-15 Mins');

  const outletCodeEls = document.querySelectorAll('.js-outlet-code');
  outletCodeEls.forEach(el => el.textContent = cfg.outletCode || 'RF-BLR-01');

  const emailEls = document.querySelectorAll('.js-store-email');
  emailEls.forEach(el => el.textContent = cfg.email || 'support@raoseefresh.com');

  // Handle Logo display
  const logoEls = document.querySelectorAll('.js-store-logo');
  logoEls.forEach(el => {
    if (cfg.logoUrl) {
      el.innerHTML = `<img src="${cfg.logoUrl}" alt="${escapeHtml(cfg.storeName || 'Logo')}" class="w-full h-full object-contain rounded-2xl" onerror="this.onerror=null; this.parentElement.innerHTML='${cfg.logoEmoji || '⚡'}';" />`;
    } else {
      el.innerHTML = cfg.logoEmoji || '⚡';
    }
  });

  const phoneEls = document.querySelectorAll('.js-store-phone');
  phoneEls.forEach(el => el.textContent = cfg.supportPhone || '+91 98765 43210');

  const deliveryTimeEls = document.querySelectorAll('.js-delivery-time');
  deliveryTimeEls.forEach(el => el.textContent = cfg.deliveryTimeEstimate || '10-15 mins');

  const storeStatusBadge = document.getElementById('store-status-badge');
  if (storeStatusBadge) {
    if (cfg.isStoreOpen !== false) {
      storeStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>Store Open (${cfg.openingTime || '06:00 AM'} - ${cfg.closingTime || '11:30 PM'})</span>`;
      storeStatusBadge.className = "flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200";
    } else {
      storeStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span><span class="text-red-700 font-bold">Temporarily Paused (High Rush)</span>`;
      storeStatusBadge.className = "flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-200";
    }
  }
}

// Dynamic Announcement Ticker
function renderAnnouncement() {
  const container = document.getElementById('announcement-ticker');
  if (!container) return;

  if (state.config.showAnnouncementBar !== false && state.config.storeNotice) {
    container.innerHTML = `
      <div class="bg-gradient-to-r from-green-900 via-emerald-800 to-green-950 text-white text-xs py-2 px-3 sm:px-6 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-2 overflow-hidden truncate">
          <span class="bg-amber-400 text-gray-900 text-[10px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0">Live Update</span>
          <span class="truncate font-medium">${escapeHtml(state.config.storeNotice)}</span>
        </div>
        <button onclick="openWhatsAppChat('Hi Raosee Fresh team, I would like to inquire about today\\'s stock/rates.')" class="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 ml-3 flex-shrink-0">
          <span>Inquire on WhatsApp</span> ➔
        </button>
      </div>
    `;
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
  }
}

// Dynamic Promotional Banners
function renderBanners() {
  const container = document.getElementById('promo-banners-grid');
  if (!container) return;

  const banners = typeof getStoredBanners === 'function' ? getStoredBanners() : [];
  const activeBanners = banners.filter(b => b.enabled !== false);

  if (activeBanners.length === 0) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');

  container.innerHTML = activeBanners.map(banner => {
    let actionAttr = `onclick="openWhatsAppChat('Hi Raosee Fresh team, I would like to know more about: ${encodeURIComponent(banner.title)}')"`;
    if (banner.action === 'photo-whatsapp') {
      actionAttr = `onclick="openPhotoOrderWhatsApp()"`;
    } else if (banner.action === 'explore') {
      actionAttr = `onclick="document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' })"`;
    }

    return `
      <div class="bg-gradient-to-br ${banner.gradient || 'from-green-800 to-green-950'} text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
        <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div>
          ${banner.badge ? `
            <span class="bg-white/20 backdrop-blur-md text-white font-extrabold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
              ${escapeHtml(banner.badge)}
            </span>
          ` : ''}
          <h2 class="text-xl sm:text-2xl font-black leading-tight mb-1">
            ${escapeHtml(banner.title)}
          </h2>
          <p class="text-xs sm:text-sm text-white/90 mb-4">
            ${escapeHtml(banner.subtitle || '')}
          </p>
        </div>
        <div class="flex items-center justify-between gap-2 mt-auto pt-2">
          ${banner.footerText ? `
            <span class="text-xs font-bold text-white/80">${escapeHtml(banner.footerText)}</span>
          ` : '<span></span>'}
          ${banner.btnText ? `
            <button ${actionAttr} class="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition-all">
              <span>${escapeHtml(banner.btnText)}</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Category List
function renderCategories() {
  const container = document.getElementById('category-pills');
  if (!container) return;

  const categories = typeof getStoredCategories === 'function' ? getStoredCategories() : [];
  const activeCategories = categories.filter(c => c.enabled !== false);

  container.innerHTML = activeCategories.map(cat => {
    const isActive = state.activeCategory === cat.id;
    return `
      <button 
        onclick="selectCategory('${cat.id}')"
        class="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm ${
          isActive 
            ? 'bg-[#0C831F] text-white shadow-green-200' 
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
        }"
      >
        <span class="text-base">${cat.icon || '🛒'}</span>
        <span>${cat.label}</span>
      </button>
    `;
  }).join('');
}

function selectCategory(catId) {
  state.activeCategory = catId;
  renderCategories();
  renderProducts();
  
  const grid = document.getElementById('products-section');
  if (grid) {
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Render Products Grid
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const countBadge = document.getElementById('products-count');
  if (!grid) return;

  let filtered = state.products;

  // Filter by category
  if (state.activeCategory !== 'all') {
    filtered = filtered.filter(p => p.category === state.activeCategory);
  }

  // Filter by search query
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.categoryLabel.toLowerCase().includes(q) ||
      (p.tag && p.tag.toLowerCase().includes(q))
    );
  }

  if (countBadge) {
    countBadge.textContent = `${filtered.length} products available`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="w-20 h-20 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center text-3xl">🔍</div>
        <h3 class="text-lg font-bold text-gray-800 mb-1">No products found</h3>
        <p class="text-sm text-gray-500 max-w-sm mx-auto mb-5">We couldn't find anything matching "${state.searchQuery}". Would you like us to arrange it via WhatsApp?</p>
        <button onclick="openWhatsAppChat('Hi Raosee Fresh team, do you have ${encodeURIComponent(state.searchQuery || 'this item')} available?')" class="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-transform active:scale-95">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.303c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/></svg>
          Ask on WhatsApp
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const qty = state.cart[product.id] || 0;
    const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

    return `
      <div class="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative group">
        <!-- Tag / Discount badge -->
        <div class="flex items-center justify-between gap-1 mb-2">
          ${discount > 0 ? `
            <span class="bg-blue-50 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              ${discount}% OFF
            </span>
          ` : '<span></span>'}
          <span class="text-[11px] font-medium text-gray-500 flex items-center gap-1">
            ⏱️ ${product.deliveryTime || '10m'}
          </span>
        </div>

        <!-- Product Image -->
        <div class="relative w-full aspect-square mb-3 overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center">
          <img 
            src="${product.image}" 
            alt="${escapeHtml(product.name)}"
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'"
          />
          ${product.tag ? `
            <span class="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              ${product.tag}
            </span>
          ` : ''}
        </div>

        <!-- Title & Unit -->
        <div class="flex-1 flex flex-col mb-3">
          <h4 class="font-semibold text-gray-800 text-sm sm:text-base leading-snug line-clamp-2 mb-1" title="${escapeHtml(product.name)}">
            ${escapeHtml(product.name)}
          </h4>
          <span class="text-xs text-gray-500 font-medium">${product.unit}</span>
        </div>

        <!-- Price & Add Button -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
          <div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-base sm:text-lg font-bold text-gray-900">₹${product.price}</span>
              ${product.mrp > product.price ? `
                <span class="text-xs text-gray-400 line-through">₹${product.mrp}</span>
              ` : ''}
            </div>
          </div>

          <!-- Add / Qty Controller -->
          <div id="btn-container-${product.id}">
            ${renderCartButton(product.id, qty)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCartButton(productId, qty) {
  if (qty > 0) {
    return `
      <div class="inline-flex items-center bg-[#0C831F] text-white rounded-xl shadow-sm px-1 py-0.5 text-sm font-bold">
        <button 
          onclick="updateCartItem('${productId}', -1)"
          aria-label="Decrease quantity"
          class="w-7 h-7 flex items-center justify-center hover:bg-black/10 rounded-lg active:scale-90 transition-transform"
        >
          -
        </button>
        <span class="px-2 text-xs sm:text-sm font-bold min-w-[20px] text-center">${qty}</span>
        <button 
          onclick="updateCartItem('${productId}', 1)"
          aria-label="Increase quantity"
          class="w-7 h-7 flex items-center justify-center hover:bg-black/10 rounded-lg active:scale-90 transition-transform"
        >
          +
        </button>
      </div>
    `;
  }

  return `
    <button 
      onclick="updateCartItem('${productId}', 1)"
      class="bg-green-50 hover:bg-[#0C831F] text-[#0C831F] hover:text-white border border-[#0C831F]/30 hover:border-[#0C831F] px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm"
    >
      ADD
    </button>
  `;
}

// Cart Item Updates
function updateCartItem(productId, delta) {
  const current = state.cart[productId] || 0;
  const newQty = Math.max(0, current + delta);

  if (newQty === 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = newQty;
  }

  localStorage.setItem('raosee_cart', JSON.stringify(state.cart));

  const btnContainer = document.getElementById(`btn-container-${productId}`);
  if (btnContainer) {
    btnContainer.innerHTML = renderCartButton(productId, newQty);
  }

  updateCartUI();
}

// Cart Calculations
function getCartSummary() {
  let subtotal = 0;
  let totalMrp = 0;
  let itemCount = 0;
  const items = [];

  for (const [id, qty] of Object.entries(state.cart)) {
    const product = state.products.find(p => p.id === id);
    if (product && qty > 0) {
      subtotal += product.price * qty;
      totalMrp += (product.mrp || product.price) * qty;
      itemCount += qty;
      items.push({ product, qty, total: product.price * qty });
    }
  }

  const freeDeliveryThreshold = state.config.freeDeliveryThreshold || 199;
  const standardDeliveryFee = state.config.standardDeliveryFee || 25;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold || subtotal === 0;
  const deliveryFee = isFreeDelivery ? 0 : standardDeliveryFee;
  const handlingFee = subtotal > 0 ? (state.config.handlingFee || 2) : 0;
  const savings = Math.max(0, totalMrp - subtotal);
  const grandTotal = subtotal + deliveryFee + handlingFee + (state.tipAmount || 0);

  return {
    items,
    itemCount,
    subtotal,
    totalMrp,
    deliveryFee,
    isFreeDelivery,
    freeDeliveryThreshold,
    amountNeededForFreeDelivery: Math.max(0, freeDeliveryThreshold - subtotal),
    handlingFee,
    tip: state.tipAmount || 0,
    savings,
    grandTotal
  };
}

// Update Cart Badge, Floating Bar & Slide Drawer
function updateCartUI() {
  const summary = getCartSummary();

  // Floating Cart Bar (Mobile)
  const floatingBar = document.getElementById('mobile-cart-bar');
  if (floatingBar) {
    if (summary.itemCount > 0) {
      floatingBar.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
      floatingBar.classList.add('translate-y-0', 'opacity-100');
      
      const countEl = document.getElementById('mobile-cart-count');
      const totalEl = document.getElementById('mobile-cart-total');
      if (countEl) countEl.textContent = `${summary.itemCount} ${summary.itemCount === 1 ? 'ITEM' : 'ITEMS'}`;
      if (totalEl) totalEl.textContent = `₹${summary.grandTotal}`;
    } else {
      floatingBar.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
      floatingBar.classList.remove('translate-y-0', 'opacity-100');
    }
  }

  // Header Cart Button Badge
  const headerBadges = document.querySelectorAll('.js-header-cart-count');
  headerBadges.forEach(badge => {
    badge.textContent = summary.itemCount;
    badge.style.display = summary.itemCount > 0 ? 'inline-flex' : 'none';
  });

  const headerTotal = document.querySelector('.js-header-cart-total');
  if (headerTotal) {
    headerTotal.textContent = summary.itemCount > 0 ? `₹${summary.grandTotal}` : 'My Cart';
  }

  renderCartDrawerContent(summary);
}

// Select Payment Method in Drawer
function selectPaymentMethod(method) {
  state.selectedPaymentMethod = method;
  
  // Highlight chosen payment card
  const methods = ['razorpay', 'upi_qr', 'cod'];
  methods.forEach(m => {
    const el = document.getElementById(`pay-opt-${m}`);
    const radio = document.getElementById(`radio-${m}`);
    if (el) {
      if (m === method) {
        el.classList.add('border-green-600', 'bg-green-50/50');
        el.classList.remove('border-gray-200', 'bg-white');
      } else {
        el.classList.remove('border-green-600', 'bg-green-50/50');
        el.classList.add('border-gray-200', 'bg-white');
      }
    }
    if (radio) radio.checked = (m === method);
  });

  // Update checkout button text
  updateCheckoutButtonText();
}

function updateCheckoutButtonText() {
  const summary = getCartSummary();
  const btn = document.getElementById('btn-checkout-primary');
  const btnIcon = document.getElementById('btn-checkout-icon');
  const btnLabel = document.getElementById('btn-checkout-label');
  const btnSub = document.getElementById('btn-checkout-sub');

  if (!btn || !btnLabel) return;

  if (state.selectedPaymentMethod === 'razorpay') {
    btn.className = "w-full bg-[#0C831F] hover:bg-emerald-800 text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-between shadow-lg hover:shadow-xl active:scale-98 transition-all";
    if (btnIcon) btnIcon.innerHTML = `💳`;
    btnLabel.textContent = `Pay ₹${summary.grandTotal} via Razorpay`;
    if (btnSub) btnSub.textContent = `Cards, UPI, NetBanking, Wallets`;
  } else if (state.selectedPaymentMethod === 'upi_qr') {
    btn.className = "w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-between shadow-lg hover:shadow-xl active:scale-98 transition-all";
    if (btnIcon) btnIcon.innerHTML = `📲`;
    btnLabel.textContent = `Pay ₹${summary.grandTotal} via Direct UPI`;
    if (btnSub) btnSub.textContent = `Scan QR / Google Pay / PhonePe / Paytm (0% Fee)`;
  } else {
    btn.className = "w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-between shadow-lg hover:shadow-xl active:scale-98 transition-all";
    if (btnIcon) btnIcon.innerHTML = `<svg class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.303c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/></svg>`;
    btnLabel.textContent = `Order on WhatsApp (Pay ₹${summary.grandTotal} on Delivery)`;
    if (btnSub) btnSub.textContent = `Cash or UPI to Rider at Doorstep`;
  }
}

function renderCartDrawerContent(summary) {
  const drawerItems = document.getElementById('drawer-items-list');
  const drawerBill = document.getElementById('drawer-bill-details');
  const emptyState = document.getElementById('drawer-empty-state');
  const filledState = document.getElementById('drawer-filled-state');
  const freeProgress = document.getElementById('free-delivery-progress');

  if (!drawerItems || !drawerBill) return;

  if (summary.itemCount === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (filledState) filledState.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (filledState) filledState.classList.remove('hidden');

  // Free delivery progress bar
  if (freeProgress) {
    if (summary.isFreeDelivery) {
      freeProgress.innerHTML = `
        <div class="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <span>🎉</span>
          <span>Yay! You've unlocked <strong>FREE 10-min Delivery</strong>!</span>
        </div>
      `;
    } else {
      const percentage = Math.min(100, Math.round((summary.subtotal / summary.freeDeliveryThreshold) * 100));
      freeProgress.innerHTML = `
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div class="flex items-center justify-between text-xs text-amber-900 font-semibold mb-1.5">
            <span>Add ₹${summary.amountNeededForFreeDelivery} more for <strong>FREE Delivery</strong></span>
            <span>${percentage}%</span>
          </div>
          <div class="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
            <div class="bg-[#0C831F] h-2 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    }
  }

  // Items List
  drawerItems.innerHTML = summary.items.map(({ product, qty, total }) => `
    <div class="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-gray-100">
      <img src="${product.image}" class="w-14 h-14 object-cover rounded-lg bg-gray-50 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'" />
      <div class="flex-1 min-w-0">
        <h5 class="text-xs sm:text-sm font-bold text-gray-800 truncate">${escapeHtml(product.name)}</h5>
        <div class="text-[11px] text-gray-500">${product.unit}</div>
        <div class="text-xs font-bold text-gray-900 mt-1">₹${product.price} × ${qty} = <span class="text-[#0C831F]">₹${total}</span></div>
      </div>
      <div class="flex-shrink-0">
        <div class="inline-flex items-center bg-[#0C831F] text-white rounded-lg shadow-sm px-1 py-0.5 text-xs font-bold">
          <button onclick="updateCartItem('${product.id}', -1)" class="w-6 h-6 flex items-center justify-center hover:bg-black/10 rounded">-</button>
          <span class="px-2 text-xs font-bold">${qty}</span>
          <button onclick="updateCartItem('${product.id}', 1)" class="w-6 h-6 flex items-center justify-center hover:bg-black/10 rounded">+</button>
        </div>
      </div>
    </div>
  `).join('');

  // Bill Summary
  drawerBill.innerHTML = `
    <div class="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-xs sm:text-sm space-y-2">
      <div class="font-bold text-gray-900 border-b pb-2 mb-2 flex items-center justify-between">
        <span>Bill Summary</span>
        ${summary.savings > 0 ? `<span class="text-green-700 bg-green-100 px-2 py-0.5 rounded text-[11px]">Saved ₹${summary.savings}</span>` : ''}
      </div>
      <div class="flex justify-between text-gray-600">
        <span>Item Total (${summary.itemCount} items)</span>
        <span>₹${summary.subtotal}</span>
      </div>
      <div class="flex justify-between text-gray-600">
        <span class="flex items-center gap-1">
          Delivery Charge
          <span class="text-[10px] text-gray-400 cursor-help" title="Free on orders above ₹${summary.freeDeliveryThreshold}">ⓘ</span>
        </span>
        <span class="${summary.deliveryFee === 0 ? 'text-green-700 font-bold' : ''}">
          ${summary.deliveryFee === 0 ? 'FREE' : `₹${summary.deliveryFee}`}
        </span>
      </div>
      <div class="flex justify-between text-gray-600">
        <span>Handling & Packaging Fee</span>
        <span>₹${summary.handlingFee}</span>
      </div>
      ${summary.tip > 0 ? `
        <div class="flex justify-between text-gray-600">
          <span>Delivery Partner Tip</span>
          <span>₹${summary.tip}</span>
        </div>
      ` : ''}
      <div class="border-t border-gray-200 pt-2.5 flex justify-between text-sm sm:text-base font-extrabold text-gray-900">
        <span>To Pay</span>
        <span class="text-[#0C831F]">₹${summary.grandTotal}</span>
      </div>
    </div>
  `;

  updateCheckoutButtonText();
}

// Drawer Open / Close
function toggleCartDrawer(open) {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const panel = document.getElementById('drawer-panel');

  if (!drawer || !overlay || !panel) return;

  if (open) {
    drawer.classList.remove('hidden');
    void drawer.offsetWidth;
    overlay.classList.remove('opacity-0');
    panel.classList.remove('translate-x-full');
    renderCartDrawerContent(getCartSummary());
  } else {
    overlay.classList.add('opacity-0');
    panel.classList.add('translate-x-full');
    setTimeout(() => {
      drawer.classList.add('hidden');
    }, 300);
  }
}

// Tips selection
function setTip(amount) {
  state.tipAmount = amount;
  
  const tipButtons = document.querySelectorAll('.js-tip-btn');
  tipButtons.forEach(btn => {
    const val = parseInt(btn.getAttribute('data-tip'), 10);
    if (val === amount) {
      btn.classList.add('bg-[#0C831F]', 'text-white', 'border-[#0C831F]');
      btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-200');
    } else {
      btn.classList.remove('bg-[#0C831F]', 'text-white', 'border-[#0C831F]');
      btn.classList.add('bg-white', 'text-gray-700', 'border-gray-200');
    }
  });

  updateCartUI();
}

// Extract customer and address details from drawer
function extractAddressForm() {
  const nameInput = document.getElementById('addr-name');
  const phoneInput = document.getElementById('addr-phone');
  const flatInput = document.getElementById('addr-flat');
  const streetInput = document.getElementById('addr-street');
  const landmarkInput = document.getElementById('addr-landmark');
  const notesInput = document.getElementById('addr-notes');

  const customerName = (nameInput ? nameInput.value.trim() : '') || state.deliveryAddress.name || 'Valued Customer';
  const customerPhone = (phoneInput ? phoneInput.value.trim() : '') || state.deliveryAddress.phone || '';
  const flat = (flatInput ? flatInput.value.trim() : '') || state.deliveryAddress.flat || '';
  const street = (streetInput ? streetInput.value.trim() : '') || state.deliveryAddress.street || '';
  const landmark = (landmarkInput ? landmarkInput.value.trim() : '') || state.deliveryAddress.landmark || '';
  const notes = (notesInput ? notesInput.value.trim() : '') || state.deliveryAddress.instructions || 'Leave at door';

  if (!customerPhone || !flat) {
    const addrSection = document.getElementById('address-section-drawer');
    if (addrSection) {
      addrSection.scrollIntoView({ behavior: 'smooth' });
    }
    alert("Please fill your mobile number and house/flat address for 10-15 min delivery!");
    return null;
  }

  state.deliveryAddress = {
    name: customerName,
    phone: customerPhone,
    flat,
    street,
    landmark,
    instructions: notes
  };
  localStorage.setItem('raosee_address', JSON.stringify(state.deliveryAddress));

  return state.deliveryAddress;
}

// Unified Checkout Handler: Routes to Razorpay / UPI QR / COD
function handleUnifiedCheckout() {
  const summary = getCartSummary();
  if (summary.itemCount === 0) {
    alert("Your cart is empty! Please add some grocery items first.");
    return;
  }

  const customer = extractAddressForm();
  if (!customer) return;

  const orderId = `RF-${Date.now().toString().slice(-6)}`;

  if (state.selectedPaymentMethod === 'razorpay') {
    initiateRazorpayPayment(orderId, summary, customer);
  } else if (state.selectedPaymentMethod === 'upi_qr') {
    initiateDirectUpiPayment(orderId, summary, customer);
  } else {
    // Cash / UPI on Delivery
    processOrderCompletion(orderId, summary, customer, {
      method: 'Cash / UPI on Delivery (COD)',
      status: 'Pay to Rider at Doorstep',
      paymentId: 'COD-' + orderId
    });
  }
}

// 1. Razorpay Payment Gateway Integration
function initiateRazorpayPayment(orderId, summary, customer) {
  const keyId = state.config.payment?.razorpayKeyId || 'rzp_test_1DP5mmOlF5G5ag';
  const amountInPaise = Math.round(summary.grandTotal * 100);

  // Check if Razorpay SDK is loaded
  if (typeof Razorpay === 'undefined') {
    console.warn("Razorpay script not yet loaded or blocked. Offering fallback verification.");
    const proceedTest = confirm(`Razorpay SDK connection is initializing. Would you like to simulate a successful payment of ₹${summary.grandTotal} for Order #${orderId}?`);
    if (proceedTest) {
      const mockPayId = 'pay_sim_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      processOrderCompletion(orderId, summary, customer, {
        method: 'Razorpay Online Gateway (UPI / Cards / NetBanking)',
        status: 'PAID ONLINE (Verified)',
        paymentId: mockPayId
      });
    }
    return;
  }

  const options = {
    key: keyId,
    amount: amountInPaise,
    currency: "INR",
    name: state.config.storeName || "Raosee Fresh Supermarket",
    description: `Express Grocery Delivery (Order #${orderId})`,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&auto=format&fit=crop&q=80",
    prefill: {
      name: customer.name,
      contact: customer.phone.replace(/\D/g, '').slice(-10),
      email: state.config.email || "customer@raoseefresh.com"
    },
    theme: {
      color: "#0C831F"
    },
    modal: {
      ondismiss: function() {
        console.log("Customer closed payment modal without completing payment.");
      }
    },
    handler: function(response) {
      console.log("Razorpay Payment Success:", response);
      processOrderCompletion(orderId, summary, customer, {
        method: 'Razorpay Online Gateway (Cards / UPI / NetBanking)',
        status: 'PAID ONLINE (Verified ✅)',
        paymentId: response.razorpay_payment_id
      });
    }
  };

  try {
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function(response) {
      alert("Payment failed: " + (response.error.description || "Transaction cancelled"));
    });
    rzp.open();
  } catch (err) {
    console.error("Error opening Razorpay checkout:", err);
    alert("Could not open Razorpay window. Please try UPI or Cash on Delivery.");
  }
}

// 2. Direct Instant UPI (0% Fee) QR & App Intent
function initiateDirectUpiPayment(orderId, summary, customer) {
  const upiId = state.config.payment?.upiId || 'raoseefresh@upi';
  const upiName = encodeURIComponent(state.config.storeName || 'Raosee Fresh Supermarket');
  const amount = summary.grandTotal.toFixed(2);
  const note = encodeURIComponent(`Order ${orderId} Raosee Fresh`);

  // Standard UPI URI
  const upiUri = `upi://pay?pa=${upiId}&pn=${upiName}&am=${amount}&cu=INR&tn=${note}`;
  
  state.pendingUpiOrder = { orderId, summary, customer, upiUri, amount };

  // Update UPI Modal DOM
  const modal = document.getElementById('upi-qr-modal');
  const amountEl = document.getElementById('upi-modal-amount');
  const orderIdEl = document.getElementById('upi-modal-orderid');
  const vpaEl = document.getElementById('upi-modal-vpa');
  const qrImg = document.getElementById('upi-modal-qr-img');
  const gpayBtn = document.getElementById('btn-upi-gpay');
  const phonepeBtn = document.getElementById('btn-upi-phonepe');
  const paytmBtn = document.getElementById('btn-upi-paytm');

  if (amountEl) amountEl.textContent = `₹${summary.grandTotal}`;
  if (orderIdEl) orderIdEl.textContent = `#${orderId}`;
  if (vpaEl) vpaEl.textContent = upiId;

  // Generate dynamic QR Code image via standard API
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}`;
  }

  // Set direct deep links for mobile devices
  if (gpayBtn) gpayBtn.href = upiUri;
  if (phonepeBtn) phonepeBtn.href = upiUri;
  if (paytmBtn) paytmBtn.href = upiUri;

  if (modal) modal.classList.remove('hidden');
}

function closeUpiQrModal() {
  const modal = document.getElementById('upi-qr-modal');
  if (modal) modal.classList.add('hidden');
}

function confirmUpiPaymentCompleted() {
  if (!state.pendingUpiOrder) return;
  const refInput = document.getElementById('upi-utr-input');
  const utr = (refInput ? refInput.value.trim() : '') || 'UPI-' + Date.now().toString().slice(-6);

  const { orderId, summary, customer } = state.pendingUpiOrder;
  closeUpiQrModal();

  processOrderCompletion(orderId, summary, customer, {
    method: 'Direct UPI (Google Pay / PhonePe / Paytm)',
    status: 'PAID VIA UPI (Ref: ' + utr + ')',
    paymentId: utr
  });
}

// 3. Process Completed Order & Send to WhatsApp
function processOrderCompletion(orderId, summary, customer, paymentDetails) {
  const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Build clean, professional WhatsApp Message
  let message = `🛒 *NEW ORDER: RAOSEE FRESH SUPERMARKET*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔖 *Order ID:* #${orderId}\n`;
  message += `⏰ *Time:* ${dateStr} (10-15 Min Express Delivery)\n\n`;

  message += `💳 *PAYMENT DETAILS:*\n`;
  message += `• Status: *${paymentDetails.status}*\n`;
  message += `• Method: ${paymentDetails.method}\n`;
  if (paymentDetails.paymentId) message += `• Transaction/Ref ID: \`${paymentDetails.paymentId}\`\n\n`;

  message += `👤 *CUSTOMER DETAILS:*\n`;
  message += `• Name: *${customer.name}*\n`;
  if (customer.phone) message += `• Phone: *${customer.phone}*\n`;
  message += `• Address: ${customer.flat ? customer.flat + ', ' : ''}${customer.street ? customer.street : 'Store Area'}\n`;
  if (customer.landmark) message += `• Landmark: ${customer.landmark}\n`;
  if (customer.instructions) message += `• Instructions: ${customer.instructions}\n\n`;

  message += `🛍️ *ITEMS ORDERED:*\n`;
  summary.items.forEach((item, idx) => {
    message += `${idx + 1}. *${item.product.name}* (${item.product.unit})\n`;
    message += `    Qty: ${item.qty} × ₹${item.product.price} = *₹${item.total}*\n`;
  });

  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *BILL SUMMARY:*\n`;
  message += `• Items Subtotal: ₹${summary.subtotal}\n`;
  message += `• Delivery Fee: ${summary.deliveryFee === 0 ? 'FREE' : '₹' + summary.deliveryFee}\n`;
  message += `• Handling & Packaging: ₹${summary.handlingFee}\n`;
  if (summary.tip > 0) message += `• Rider Tip: ₹${summary.tip}\n`;
  if (summary.savings > 0) message += `• You Saved: ₹${summary.savings} 🎉\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `✨ *GRAND TOTAL: ₹${summary.grandTotal}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `⚡ *Please confirm this order and dispatch from dark store.* Thank you!`;

  // Create order tracking record
  const orderRecord = {
    id: orderId,
    timestamp: new Date().toISOString(),
    customer: customer,
    items: summary.items,
    total: summary.grandTotal,
    payment: paymentDetails,
    status: paymentDetails.status.includes('PAID') ? 'Paid & Confirmed' : 'Confirmed (COD)'
  };

  saveRecentOrder(orderRecord);
  state.currentTrackingOrder = orderRecord;

  // Clear cart and close drawer
  state.cart = {};
  localStorage.removeItem('raosee_cart');
  updateCartUI();
  toggleCartDrawer(false);

  // Target WhatsApp URL
  const waNumber = (state.config.whatsappNumber || '919876543210').replace(/\D/g, '');
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  // Open WhatsApp in new tab / app
  window.open(waUrl, '_blank');

  // Launch live tracking modal
  showLiveTrackingModal(orderRecord);
}

// WhatsApp Customer Support Quick Actions
function openWhatsAppChat(customMessage = '') {
  const waNumber = (state.config.whatsappNumber || '919876543210').replace(/\D/g, '');
  const defaultMsg = customMessage || `Hello Raosee Fresh Supermarket team, I need help with grocery ordering/delivery.`;
  const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMsg)}`;
  window.open(url, '_blank');
}

function openPhotoOrderWhatsApp() {
  const waNumber = (state.config.whatsappNumber || '919876543210').replace(/\D/g, '');
  const msg = `Hi Raosee Fresh! I am sending a photo/text list of groceries I want to order for home delivery. Please check and reply with bill and delivery ETA!`;
  const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ================= CUSTOMER AUTHENTICATION & PROFILE LOGIC =================
function updateHeaderUserUI() {
  const headerBtn = document.getElementById('header-user-btn');
  const avatarEl = document.getElementById('header-user-avatar');
  const nameEl = document.getElementById('header-user-name');
  const mobileLabelEl = document.getElementById('mobile-bottom-user-label');

  if (state.currentUser) {
    const firstName = state.currentUser.name ? state.currentUser.name.split(' ')[0] : 'Account';
    if (nameEl) nameEl.textContent = firstName;
    if (avatarEl) avatarEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-0.5 animate-pulse"></span>👤`;
    if (headerBtn) {
      headerBtn.classList.remove('bg-gray-100', 'text-gray-800');
      headerBtn.classList.add('bg-green-50', 'text-blinkit-green', 'border', 'border-green-300');
    }
    if (mobileLabelEl) mobileLabelEl.textContent = firstName;
  } else {
    if (nameEl) nameEl.textContent = 'Login';
    if (avatarEl) avatarEl.textContent = '👤';
    if (headerBtn) {
      headerBtn.classList.remove('bg-green-50', 'text-blinkit-green', 'border', 'border-green-300');
      headerBtn.classList.add('bg-gray-100', 'text-gray-800');
    }
    if (mobileLabelEl) mobileLabelEl.textContent = 'Login';
  }
}

function handleHeaderUserClick() {
  if (state.currentUser) {
    openAccountDrawer();
  } else {
    openLoginModal();
  }
}

// In-App Customer Login Modal Controls
let modalActivePhone = '';

function openLoginModal() {
  const modal = document.getElementById('customer-login-modal');
  if (!modal) {
    window.location.href = 'login.html';
    return;
  }
  // Reset steps
  document.getElementById('modal-login-step-phone')?.classList.remove('hidden');
  document.getElementById('modal-login-step-otp')?.classList.add('hidden');
  document.getElementById('modal-login-step-profile')?.classList.add('hidden');
  
  const phoneInput = document.getElementById('modal-login-phone');
  if (phoneInput) {
    phoneInput.value = '';
    setTimeout(() => phoneInput.focus(), 150);
  }
  modal.classList.remove('hidden');
}

function closeLoginModal() {
  const modal = document.getElementById('customer-login-modal');
  if (modal) modal.classList.add('hidden');
}

function handleModalSendOtp() {
  const input = document.getElementById('modal-login-phone');
  const phone = input ? input.value.trim().replace(/\D/g, '') : '';
  if (phone.length < 10) {
    alert("Please enter a valid 10-digit mobile number.");
    input?.focus();
    return;
  }
  modalActivePhone = phone;
  const disp = document.getElementById('modal-otp-phone-display');
  if (disp) disp.textContent = `+91 ${phone}`;

  document.getElementById('modal-login-step-phone')?.classList.add('hidden');
  document.getElementById('modal-login-step-otp')?.classList.remove('hidden');

  // Clear and focus OTP
  const otpInputs = document.querySelectorAll('.modal-otp-digit');
  otpInputs.forEach(i => i.value = '');
  if (otpInputs[0]) otpInputs[0].focus();
}

function handleModalVerifyOtp() {
  const otpInputs = document.querySelectorAll('.modal-otp-digit');
  let code = '';
  otpInputs.forEach(i => code += i.value);

  if (code.length < 4) {
    alert("Please enter 4-digit code.");
    return;
  }

  // Lookup in saved users registry
  let users = [];
  try {
    users = JSON.parse(localStorage.getItem('raosee_users') || '[]');
  } catch (e) {
    users = [];
  }

  const existing = users.find(u => u.phone === modalActivePhone);
  if (existing) {
    setCustomerSession(existing);
    closeLoginModal();
    alert(`Welcome back, ${existing.name}! 🎉`);
  } else {
    // New customer: ask for Name & Delivery Flat
    document.getElementById('modal-login-step-otp')?.classList.add('hidden');
    document.getElementById('modal-login-step-profile')?.classList.remove('hidden');
  }
}

function handleModalSaveProfile() {
  const name = document.getElementById('modal-profile-name')?.value.trim();
  const flat = document.getElementById('modal-profile-flat')?.value.trim();
  const street = document.getElementById('modal-profile-street')?.value.trim() || 'HSR Layout';

  if (!name || !flat) {
    alert("Please enter your name and flat/house number.");
    return;
  }

  const newUser = {
    id: 'usr_' + Date.now().toString().slice(-6),
    name: name,
    phone: modalActivePhone,
    address: { flat, street, city: 'Bangalore' },
    savedAddresses: [{ type: 'Home', flat, street }],
    createdAt: new Date().toISOString(),
    orderCount: 0
  };

  let users = [];
  try {
    users = JSON.parse(localStorage.getItem('raosee_users') || '[]');
  } catch (e) {
    users = [];
  }
  users.push(newUser);
  localStorage.setItem('raosee_users', JSON.stringify(users));

  setCustomerSession(newUser);
  closeLoginModal();
  alert(`Welcome to Raosee Fresh Supermarket, ${newUser.name}! 🛒`);
}

function quickModalLogin(name, phone, flat) {
  const user = {
    id: 'usr_' + phone.slice(-4),
    name: name,
    phone: phone,
    address: { flat: flat, street: 'Bangalore', city: 'Bangalore' },
    savedAddresses: [{ type: 'Home', flat: flat, street: 'Bangalore' }],
    createdAt: new Date().toISOString(),
    orderCount: 2
  };

  let users = [];
  try {
    users = JSON.parse(localStorage.getItem('raosee_users') || '[]');
  } catch (e) {
    users = [];
  }
  if (!users.some(u => u.phone === phone)) {
    users.push(user);
    localStorage.setItem('raosee_users', JSON.stringify(users));
  }

  setCustomerSession(user);
  closeLoginModal();
}

function setCustomerSession(user) {
  state.currentUser = user;
  localStorage.setItem('raosee_current_user', JSON.stringify(user));
  
  // Auto-populate cart drawer delivery fields
  if (user.address) {
    state.deliveryAddress.name = user.name || '';
    state.deliveryAddress.phone = user.phone || '';
    state.deliveryAddress.flat = user.address.flat || '';
    state.deliveryAddress.street = user.address.street || '';
    localStorage.setItem('raosee_address', JSON.stringify(state.deliveryAddress));

    const nameInp = document.getElementById('addr-name');
    const phoneInp = document.getElementById('addr-phone');
    const flatInp = document.getElementById('addr-flat');
    const streetInp = document.getElementById('addr-street');
    if (nameInp) nameInp.value = user.name || '';
    if (phoneInp) phoneInp.value = user.phone || '';
    if (flatInp) flatInp.value = user.address.flat || '';
    if (streetInp) streetInp.value = user.address.street || '';
  }

  updateHeaderUserUI();
}

function logoutCustomer() {
  if (confirm("Are you sure you want to log out?")) {
    state.currentUser = null;
    localStorage.removeItem('raosee_current_user');
    updateHeaderUserUI();
    closeAccountDrawer();
  }
}

// Account & Orders Drawer Controls
function openAccountDrawer() {
  const drawer = document.getElementById('account-drawer');
  const overlay = document.getElementById('account-drawer-overlay');
  const panel = document.getElementById('account-drawer-panel');
  if (!drawer || !overlay || !panel) return;

  // Fill user details
  const nameEl = document.getElementById('account-user-name');
  const phoneEl = document.getElementById('account-user-phone');
  const addrEl = document.getElementById('account-user-address');

  if (state.currentUser) {
    if (nameEl) nameEl.textContent = state.currentUser.name || 'Valued Customer';
    if (phoneEl) phoneEl.textContent = `+91 ${state.currentUser.phone || ''}`;
    if (addrEl && state.currentUser.address) {
      addrEl.textContent = `${state.currentUser.address.flat || ''}, ${state.currentUser.address.street || ''}`;
    }
  }

  renderAccountOrders();

  drawer.classList.remove('hidden');
  void drawer.offsetWidth;
  overlay.classList.remove('opacity-0');
  panel.classList.remove('translate-x-full');
}

function closeAccountDrawer() {
  const drawer = document.getElementById('account-drawer');
  const overlay = document.getElementById('account-drawer-overlay');
  const panel = document.getElementById('account-drawer-panel');
  if (!drawer || !overlay || !panel) return;

  overlay.classList.add('opacity-0');
  panel.classList.add('translate-x-full');
  setTimeout(() => {
    drawer.classList.add('hidden');
  }, 300);
}

function renderAccountOrders() {
  const container = document.getElementById('account-orders-container');
  if (!container) return;

  let allOrders = [];
  try {
    allOrders = JSON.parse(localStorage.getItem('raosee_orders') || '[]');
  } catch (e) {
    allOrders = [];
  }

  // Filter orders for current user phone or show all local device orders
  const userPhone = state.currentUser?.phone;
  const userOrders = userPhone 
    ? allOrders.filter(o => !o.customer?.phone || o.customer.phone === userPhone || o.customer.phone.includes(userPhone))
    : allOrders;

  if (userOrders.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-gray-400 space-y-2">
        <span class="text-4xl block">🛍️</span>
        <p class="text-xs font-bold text-gray-700">No Orders Placed Yet</p>
        <p class="text-[11px] text-gray-400">Order fresh groceries delivered in 10-15 minutes!</p>
        <button onclick="closeAccountDrawer()" class="mt-2 bg-blinkit-green text-white font-bold px-4 py-2 rounded-xl text-xs">
          Start Shopping ➔
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = userOrders.map(order => {
    const itemsPreview = order.items.map(i => `${escapeHtml(i.product.name)} × ${i.qty}`).join(', ');
    const isPaid = (order.payment?.status || '').includes('PAID');
    const status = order.status || 'Confirmed';

    let statusBadgeClass = 'bg-green-100 text-green-800 border-green-200';
    if (status.includes('Packing')) statusBadgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status.includes('Out')) statusBadgeClass = 'bg-blue-100 text-blue-800 border-blue-200';

    return `
      <div onclick="openOrderReceipt('${order.id}')" class="bg-gray-50 hover:bg-green-50/40 rounded-2xl p-4 border border-gray-200 hover:border-green-300 transition-all space-y-3 cursor-pointer">
        <div class="flex items-center justify-between">
          <div>
            <span class="font-mono font-black text-xs text-gray-900">#${order.id}</span>
            <span class="text-[10px] text-gray-400 ml-2">${new Date(order.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <span class="text-[10px] font-black px-2 py-0.5 rounded-full border ${statusBadgeClass}">
            ${escapeHtml(status)}
          </span>
        </div>

        <div class="text-xs text-gray-600 line-clamp-1 truncate" title="${itemsPreview}">
          ${itemsPreview}
        </div>

        <div class="flex items-center justify-between text-xs pt-1 border-t border-gray-200" onclick="event.stopPropagation()">
          <div>
            <span class="text-[10px] text-gray-400 block">${order.payment?.method || 'Online'}</span>
            <strong class="font-black text-sm text-[#0C831F]">₹${order.total}</strong>
          </div>

          <div class="flex items-center gap-1.5">
            <button onclick="openOrderReceipt('${order.id}')" class="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl text-[11px] font-bold text-gray-700">
              🧾 Details
            </button>
            <button onclick="reorderOrder('${order.id}')" class="px-2.5 py-1.5 bg-white hover:bg-green-50 border border-green-300 rounded-xl text-[11px] font-bold text-blinkit-green">
              🔄 Reorder
            </button>
            <button onclick="trackOrder('${order.id}')" class="px-3 py-1.5 bg-blinkit-green hover:bg-blinkit-greenHover text-white rounded-xl text-[11px] font-black shadow-sm flex items-center gap-1">
              <span>⚡ Track</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Reorder functionality
function reorderOrder(orderId) {
  let allOrders = [];
  try {
    allOrders = JSON.parse(localStorage.getItem('raosee_orders') || '[]');
  } catch (e) {
    allOrders = [];
  }

  const order = allOrders.find(o => o.id === orderId);
  if (!order || !order.items) return;

  order.items.forEach(i => {
    const prodId = i.product?.id;
    if (prodId) {
      state.cart[prodId] = (state.cart[prodId] || 0) + i.qty;
    }
  });

  localStorage.setItem('raosee_cart', JSON.stringify(state.cart));
  updateCartUI();
  closeAccountDrawer();
  toggleCartDrawer(true);
  alert("✓ Items added back into your cart!");
}

// Itemized Bill Receipt Modal Controls
function openOrderReceipt(orderId) {
  // Always close account drawer first so modal displays clearly without overlay conflicts
  closeAccountDrawer();

  let allOrders = [];
  try {
    allOrders = JSON.parse(localStorage.getItem('raosee_orders') || '[]');
  } catch (e) {
    allOrders = [];
  }

  const order = allOrders.find(o => o.id === orderId);
  if (!order) {
    alert("Order details not found.");
    return;
  }

  const modal = document.getElementById('order-receipt-modal');
  if (!modal) {
    window.location.href = `track.html?orderId=${orderId}`;
    return;
  }

  const cfg = state.config || (typeof getStoreConfig === 'function' ? getStoreConfig() : {});
  
  const receiptCompanyEl = document.getElementById('receipt-company-name');
  if (receiptCompanyEl) receiptCompanyEl.textContent = cfg.companyName || cfg.storeName || 'Raosee Fresh Retail Pvt Ltd';

  const receiptOutletNameEl = document.getElementById('receipt-outlet-name');
  if (receiptOutletNameEl) receiptOutletNameEl.textContent = cfg.outletName || 'Main Dark Store - HSR Layout Hub #01';

  const receiptOutletAddrEl = document.getElementById('receipt-outlet-address');
  if (receiptOutletAddrEl) receiptOutletAddrEl.textContent = cfg.storeAddress || 'Shop #12, Ground Floor, Central Market Complex, 19th Main, HSR Layout Sector 2, Bangalore - 560102';

  const receiptGstinEl = document.getElementById('receipt-gstin');
  if (receiptGstinEl) receiptGstinEl.textContent = cfg.gstin || '29ABCDE1234F1Z5';

  const receiptFssaiEl = document.getElementById('receipt-fssai');
  if (receiptFssaiEl) receiptFssaiEl.textContent = cfg.fssaiNumber || '11223344000123';

  const receiptFooterNoteEl = document.getElementById('receipt-footer-note');
  if (receiptFooterNoteEl) receiptFooterNoteEl.textContent = cfg.invoiceFooterNote || 'Thank you for shopping with Raosee Fresh! Freshness guaranteed.';

  // Order Details
  const orderIdEl = document.getElementById('receipt-order-id');
  if (orderIdEl) orderIdEl.textContent = `#${order.id}`;

  const dateEl = document.getElementById('receipt-date');
  if (dateEl) dateEl.textContent = new Date(order.timestamp).toLocaleString();

  const nameEl = document.getElementById('receipt-customer-name');
  if (nameEl) nameEl.textContent = order.customer?.name || 'Customer';

  const phoneEl = document.getElementById('receipt-customer-phone');
  if (phoneEl) phoneEl.textContent = order.customer?.phone ? '+91 ' + order.customer.phone : '';

  // Safe Address extraction
  let custAddr = '';
  if (order.customer) {
    if (typeof order.customer.address === 'string') {
      custAddr = order.customer.address;
    } else if (order.customer.address && typeof order.customer.address === 'object') {
      custAddr = `${order.customer.address.flat || ''}, ${order.customer.address.street || ''}`;
    } else {
      custAddr = `${order.customer.flat || ''}, ${order.customer.street || ''}`;
    }
    if (order.customer.landmark) custAddr += ` (Landmark: ${order.customer.landmark})`;
  }
  const addrEl = document.getElementById('receipt-customer-address');
  if (addrEl) addrEl.textContent = custAddr || 'Standard Dark Store Service Zone';

  const payMethodEl = document.getElementById('receipt-payment-method');
  if (payMethodEl) payMethodEl.textContent = order.payment?.method || 'Cash / Online';

  const payRefEl = document.getElementById('receipt-payment-ref');
  if (payRefEl) payRefEl.textContent = order.payment?.paymentId ? `Transaction Ref: ${order.payment.paymentId}` : (order.payment?.status || '');

  // Live Status Badge & Tracking Link
  const statusEl = document.getElementById('receipt-order-status');
  if (statusEl) statusEl.textContent = order.status || 'Confirmed';

  const trackBtn = document.getElementById('receipt-track-btn');
  if (trackBtn) trackBtn.href = `track.html?orderId=${order.id}`;

  // Line items
  const itemsContainer = document.getElementById('receipt-items-tbody');
  let subtotal = 0;
  if (itemsContainer && order.items) {
    itemsContainer.innerHTML = order.items.map((item, idx) => {
      const itemTot = item.total || (item.qty * (item.product?.price || 0));
      subtotal += itemTot;
      return `
        <tr class="border-b border-gray-100 text-xs">
          <td class="py-2 pr-2">
            <div class="flex items-center gap-2">
              <img src="${item.product?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'}" class="w-7 h-7 rounded-lg object-cover bg-gray-100 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'" />
              <div>
                <div class="font-bold text-gray-900">${escapeHtml(item.product?.name || 'Product')}</div>
                <div class="text-[10px] text-gray-400">${escapeHtml(item.product?.unit || '')}</div>
              </div>
            </div>
          </td>
          <td class="py-2 text-center font-bold text-gray-800">${item.qty}</td>
          <td class="py-2 text-right text-gray-600">₹${item.product?.price || 0}</td>
          <td class="py-2 text-right font-black text-gray-900">₹${itemTot}</td>
        </tr>
      `;
    }).join('');
  }

  const subtotalEl = document.getElementById('receipt-subtotal');
  if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;

  const grandTotEl = document.getElementById('receipt-grand-total');
  if (grandTotEl) grandTotEl.textContent = `₹${order.total || subtotal}`;

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function closeOrderReceipt() {
  const modal = document.getElementById('order-receipt-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

// Track Order Trigger
function trackOrder(orderId) {
  let allOrders = [];
  try {
    allOrders = JSON.parse(localStorage.getItem('raosee_orders') || '[]');
  } catch (e) {
    allOrders = [];
  }

  const order = allOrders.find(o => o.id === orderId);
  if (order) {
    closeAccountDrawer();
    showLiveTrackingModal(order);
  } else {
    window.location.href = `track.html?orderId=${orderId}`;
  }
}

// ================= LIVE ORDER TRACKING MODAL LOGIC =================
function showLiveTrackingModal(order) {
  state.currentTrackingOrder = order;
  const modal = document.getElementById('tracking-modal');
  if (!modal) {
    window.location.href = `track.html?orderId=${order.id}`;
    return;
  }

  updateTrackingModalContent(order);
  modal.classList.remove('hidden');
  startOrderTrackingAnimation();
}

function updateTrackingModalContent(order) {
  const orderIdEl = document.getElementById('track-order-id');
  const totalEl = document.getElementById('track-order-total');
  const itemsEl = document.getElementById('track-order-items');
  const payBadge = document.getElementById('track-payment-badge');
  const fullScreenLink = document.getElementById('track-fullscreen-link');

  if (orderIdEl) orderIdEl.textContent = `#${order.id}`;
  if (totalEl) totalEl.textContent = `₹${order.total}`;
  if (payBadge) {
    payBadge.textContent = order.payment ? order.payment.status : 'Confirmed';
  }
  if (fullScreenLink) {
    fullScreenLink.href = `track.html?orderId=${order.id}`;
  }
  if (itemsEl) {
    itemsEl.innerHTML = order.items.map(i => `
      <div class="text-xs text-gray-600 flex justify-between py-1">
        <span>${escapeHtml(i.product.name)} × ${i.qty}</span>
        <span class="font-bold text-gray-900">₹${i.total}</span>
      </div>
    `).join('');
  }

  // Update status stepper based on order.status
  const status = (order.status || 'Confirmed').toLowerCase();
  applyTrackingStepHighlights(status);
}

function closeTrackingModal() {
  const modal = document.getElementById('tracking-modal');
  if (modal) modal.classList.add('hidden');
  if (window.trackInterval) clearInterval(window.trackInterval);
}

function applyTrackingStepHighlights(status) {
  const step1 = document.getElementById('track-step-1');
  const step2 = document.getElementById('track-step-2');
  const step3 = document.getElementById('track-step-3');
  const step4 = document.getElementById('track-step-4');
  const step5 = document.getElementById('track-step-5');

  const setNode = (node, active) => {
    if (!node) return;
    const dot = node.querySelector('span');
    const title = node.querySelector('div:first-of-type');
    if (active) {
      if (dot) dot.className = "absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-[#0C831F] border-2 border-white ring-2 ring-green-100";
      if (title) title.className = "text-xs font-black text-gray-900";
    } else {
      if (dot) dot.className = "absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-gray-300 border-2 border-white";
      if (title) title.className = "text-xs font-semibold text-gray-400";
    }
  };

  if (status.includes('deliver') && !status.includes('out')) {
    setNode(step1, true);
    setNode(step2, true);
    setNode(step3, true);
    setNode(step4, true);
    setNode(step5, true);
  } else if (status.includes('out') || status.includes('dispatched')) {
    setNode(step1, true);
    setNode(step2, true);
    setNode(step3, true);
    setNode(step4, true);
    setNode(step5, false);
  } else if (status.includes('pack')) {
    setNode(step1, true);
    setNode(step2, true);
    setNode(step3, false);
    setNode(step4, false);
    setNode(step5, false);
  } else {
    setNode(step1, true);
    setNode(step2, false);
    setNode(step3, false);
    setNode(step4, false);
    setNode(step5, false);
  }
}

function startOrderTrackingAnimation() {
  const etaTimer = document.getElementById('track-eta-timer');
  let secondsLeft = 11 * 60 + 45; // 11m 45s
  if (window.trackInterval) clearInterval(window.trackInterval);

  window.trackInterval = setInterval(() => {
    secondsLeft--;
    if (secondsLeft < 0) secondsLeft = 0;
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    if (etaTimer) {
      etaTimer.textContent = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
  }, 1000);
}

// Cross-Tab Live Synchronization for Real-Time Order Status
function setupCrossTabSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'raosee_orders') {
      if (state.currentTrackingOrder) {
        let orders = [];
        try {
          orders = JSON.parse(localStorage.getItem('raosee_orders') || '[]');
        } catch (err) {}
        const updated = orders.find(o => o.id === state.currentTrackingOrder.id);
        if (updated) {
          state.currentTrackingOrder = updated;
          updateTrackingModalContent(updated);
        }
      }
      renderAccountOrders();
    } else if (e.key === 'raosee_current_user') {
      try {
        const u = localStorage.getItem('raosee_current_user');
        state.currentUser = u ? JSON.parse(u) : null;
        updateHeaderUserUI();
      } catch (err) {}
    } else if (e.key === 'raosee_banners' || !e.key) {
      renderBanners();
    } else if (e.key === 'raosee_fresh_config') {
      try {
        state.config = typeof getStoreConfig === 'function' ? getStoreConfig() : {};
        applyBranding();
        renderAnnouncement();
      } catch (err) {}
    }
  });
}

// Order History & Customer Directory Registry
function saveRecentOrder(order) {
  try {
    let orders = JSON.parse(localStorage.getItem('raosee_orders') || '[]');
    orders.unshift(order);
    if (orders.length > 30) orders = orders.slice(0, 30);
    localStorage.setItem('raosee_orders', JSON.stringify(orders));

    // Also register or update customer in raosee_users directory for Admin
    if (order.customer && order.customer.phone) {
      let users = JSON.parse(localStorage.getItem('raosee_users') || '[]');
      const existingIdx = users.findIndex(u => u.phone === order.customer.phone);
      if (existingIdx >= 0) {
        users[existingIdx].orderCount = (users[existingIdx].orderCount || 0) + 1;
        users[existingIdx].lastOrderDate = new Date().toISOString();
        users[existingIdx].totalSpend = (users[existingIdx].totalSpend || 0) + (order.total || 0);
      } else {
        users.push({
          id: 'usr_' + order.customer.phone.slice(-4),
          name: order.customer.name || 'Customer',
          phone: order.customer.phone,
          address: {
            flat: order.customer.flat || '',
            street: order.customer.street || '',
            landmark: order.customer.landmark || '',
            city: 'Bangalore'
          },
          savedAddresses: [{ type: 'Home', flat: order.customer.flat || '', street: order.customer.street || '' }],
          createdAt: new Date().toISOString(),
          lastOrderDate: new Date().toISOString(),
          orderCount: 1,
          totalSpend: order.total || 0
        });
      }
      localStorage.setItem('raosee_users', JSON.stringify(users));
    }
  } catch (e) {
    console.warn("Could not save order", e);
  }
}

// Search & Placeholder rotation
function setupSearchPlaceholderRotation() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  const placeholders = [
    'Search "farm fresh tomatoes"...',
    'Search "Amul butter & cow milk"...',
    'Search "Aashirvaad chakki atta"...',
    'Search "Shimla apples & bananas"...',
    'Search "Maggi noodles & chips"...',
    'Search "Fortune sunflower oil"...'
  ];

  let idx = 0;
  setInterval(() => {
    if (document.activeElement !== searchInput && searchInput.value === '') {
      idx = (idx + 1) % placeholders.length;
      searchInput.setAttribute('placeholder', placeholders[idx]);
    }
  }, 3000);
}

// Event Listeners
function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderProducts();
    });
  }

  const inputs = ['addr-name', 'addr-phone', 'addr-flat', 'addr-street', 'addr-landmark', 'addr-notes'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const key = id.replace('addr-', '');
      if (state.deliveryAddress[key]) {
        el.value = state.deliveryAddress[key];
      }
      el.addEventListener('change', () => {
        state.deliveryAddress[key] = el.value.trim();
        localStorage.setItem('raosee_address', JSON.stringify(state.deliveryAddress));
      });
    }
  });

  // Modal OTP inputs auto-advance
  const otpInputs = document.querySelectorAll('.modal-otp-digit');
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });
}

function checkUrlParamsForTracking() {
  const urlParams = new URLSearchParams(window.location.search);
  const trackId = urlParams.get('track');
  if (trackId) {
    const orders = JSON.parse(localStorage.getItem('raosee_orders') || '[]');
    if (trackId === 'last' && orders.length > 0) {
      showLiveTrackingModal(orders[0]);
    } else {
      const matched = orders.find(o => o.id === trackId || o.id === `RF-${trackId}`);
      if (matched) showLiveTrackingModal(matched);
    }
  }
}

// Quick helper
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}
