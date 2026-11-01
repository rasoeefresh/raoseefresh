/**
 * Rasoee Fresh Supermarket - Core Application Logic
 * Integrates Blinkit-style quick commerce with Instant Direct UPI (0% Fee, GPay/PhonePe/Paytm QR),
 * Cash on Delivery, and WhatsApp order dispatch.
 */

// Global State
const state = {
  products: [],
  config: {},
  cart: {}, // { [productId]: quantity }
  activeCategory: 'all',
  searchQuery: '',
  tipAmount: 0,
  selectedPaymentMethod: 'cod', // 'cod' (primary default), 'upi_qr'
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

// ================= UNIVERSAL CUSTOMER DATA NORMALIZER & AUTO-FILL =================
function normalizeCustomerData(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const cleanPhone = String(raw.phone || raw.mobile || (raw.customer && raw.customer.phone) || '').replace(/\D/g, '').slice(-10);

  const flat = raw.flat || 
               (raw.address && typeof raw.address === 'object' ? raw.address.flat : '') || 
               (raw.savedAddresses && raw.savedAddresses[0] ? raw.savedAddresses[0].flat : '') || 
               (typeof raw.address === 'string' ? raw.address.split(',')[0].trim() : '') || '';

  const street = raw.street || 
                 (raw.address && typeof raw.address === 'object' ? raw.address.street : '') || 
                 (raw.savedAddresses && raw.savedAddresses[0] ? raw.savedAddresses[0].street : '') || 
                 (typeof raw.address === 'string' ? raw.address.split(',').slice(1).join(',').trim() : '') || '';

  const landmark = raw.landmark || 
                   (raw.address && typeof raw.address === 'object' ? raw.address.landmark : '') || 
                   (raw.savedAddresses && raw.savedAddresses[0] ? raw.savedAddresses[0].landmark : '') || '';

  const name = raw.name || raw.customerName || (raw.customer && raw.customer.name) || '';
  const instructions = raw.instructions || raw.notes || (raw.deliveryAddress && raw.deliveryAddress.instructions) || 'Leave at door & ring bell';
  const defaultCity = (typeof getStoreConfig === 'function' ? (getStoreConfig().city || '') : '');
  const defaultPin = (typeof getStoreConfig === 'function' ? (getStoreConfig().pincode || '') : '');
  const city = raw.city || (raw.address && typeof raw.address === 'object' ? raw.address.city : '') || defaultCity;
  const pincode = raw.pincode || (raw.address && typeof raw.address === 'object' ? raw.address.pincode : '') || defaultPin;

  return {
    id: raw.id || ('usr_' + (cleanPhone ? cleanPhone.slice(-4) : 'guest')),
    name: name,
    phone: cleanPhone,
    flat: flat,
    street: street,
    landmark: landmark,
    instructions: instructions,
    city: city,
    pincode: pincode,
    address: { flat, street, landmark, city, pincode },
    savedAddresses: [{ type: 'Home', flat, street, landmark, city, isDefault: true }]
  };
}

// Universal DOM Address Populator & Sync
function populateAddressFormInputs(forceSource) {
  let data = null;

  if (forceSource) {
    data = normalizeCustomerData(forceSource);
  }

  // 1. Check state.deliveryAddress
  if (!data && state.deliveryAddress && (state.deliveryAddress.phone || state.deliveryAddress.flat)) {
    data = normalizeCustomerData(state.deliveryAddress);
  }

  // 2. Check state.currentUser
  if ((!data || !data.flat) && state.currentUser) {
    const userNorm = normalizeCustomerData(state.currentUser);
    if (userNorm) {
      data = {
        name: userNorm.name || (data ? data.name : ''),
        phone: userNorm.phone || (data ? data.phone : ''),
        flat: userNorm.flat || (data ? data.flat : ''),
        street: userNorm.street || (data ? data.street : ''),
        landmark: userNorm.landmark || (data ? data.landmark : ''),
        instructions: userNorm.instructions || (data ? data.instructions : 'Leave at door & ring bell')
      };
    }
  }

  // 3. Check localStorage 'Rasoee_address'
  if (!data || !data.flat) {
    try {
      const saved = localStorage.getItem('Rasoee_address');
      if (saved) {
        const parsed = normalizeCustomerData(JSON.parse(saved));
        if (parsed && (parsed.flat || parsed.phone)) {
          data = {
            name: parsed.name || (data ? data.name : ''),
            phone: parsed.phone || (data ? data.phone : ''),
            flat: parsed.flat || (data ? data.flat : ''),
            street: parsed.street || (data ? data.street : ''),
            landmark: parsed.landmark || (data ? data.landmark : ''),
            instructions: parsed.instructions || (data ? data.instructions : 'Leave at door & ring bell')
          };
        }
      }
    } catch (e) {}
  }

  // 4. Check localStorage 'Rasoee_current_user'
  if (!data || !data.flat) {
    try {
      const savedUser = localStorage.getItem('Rasoee_current_user');
      if (savedUser) {
        const parsed = normalizeCustomerData(JSON.parse(savedUser));
        if (parsed && (parsed.flat || parsed.phone)) {
          data = {
            name: parsed.name || (data ? data.name : ''),
            phone: parsed.phone || (data ? data.phone : ''),
            flat: parsed.flat || (data ? data.flat : ''),
            street: parsed.street || (data ? data.street : ''),
            landmark: parsed.landmark || (data ? data.landmark : ''),
            instructions: parsed.instructions || (data ? data.instructions : 'Leave at door & ring bell')
          };
        }
      }
    } catch (e) {}
  }

  // 5. Check local Rasoee_users
  if ((!data || !data.flat)) {
    try {
      const users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]');
      const match = users.find(u => (data && data.phone && u.phone === data.phone) || (state.currentUser && u.phone === state.currentUser.phone));
      if (match) {
        const parsed = normalizeCustomerData(match);
        if (parsed && (parsed.flat || parsed.name)) {
          data = {
            name: parsed.name || (data ? data.name : ''),
            phone: parsed.phone || (data ? data.phone : ''),
            flat: parsed.flat || (data ? data.flat : ''),
            street: parsed.street || (data ? data.street : ''),
            landmark: parsed.landmark || (data ? data.landmark : ''),
            instructions: parsed.instructions || (data ? data.instructions : 'Leave at door & ring bell')
          };
        }
      }
    } catch (e) {}
  }

  // 6. Check recent order
  if (!data || !data.flat) {
    try {
      const orders = JSON.parse(localStorage.getItem('Rasoee_orders') || '[]');
      if (orders.length > 0 && orders[0].customer) {
        const parsed = normalizeCustomerData(orders[0].customer);
        if (parsed && (parsed.flat || parsed.name)) {
          data = {
            name: parsed.name || (data ? data.name : ''),
            phone: parsed.phone || (data ? data.phone : ''),
            flat: parsed.flat || (data ? data.flat : ''),
            street: parsed.street || (data ? data.street : ''),
            landmark: parsed.landmark || (data ? data.landmark : ''),
            instructions: parsed.instructions || (data ? data.instructions : 'Leave at door & ring bell')
          };
        }
      }
    } catch (e) {}
  }

  if (!data) return;

  const nameEl = document.getElementById('addr-name');
  const phoneEl = document.getElementById('addr-phone');
  const flatEl = document.getElementById('addr-flat');
  const streetEl = document.getElementById('addr-street');
  const landmarkEl = document.getElementById('addr-landmark');
  const notesEl = document.getElementById('addr-notes');

  if (nameEl && data.name) nameEl.value = data.name;
  if (phoneEl && data.phone) phoneEl.value = data.phone;
  if (flatEl && data.flat) flatEl.value = data.flat;
  if (streetEl && data.street) streetEl.value = data.street;
  if (landmarkEl && data.landmark) landmarkEl.value = data.landmark;
  if (notesEl && data.instructions) notesEl.value = data.instructions;

  state.deliveryAddress = {
    name: (nameEl && nameEl.value ? nameEl.value.trim() : '') || data.name || state.deliveryAddress.name || '',
    phone: (phoneEl && phoneEl.value ? phoneEl.value.trim() : '') || data.phone || state.deliveryAddress.phone || '',
    flat: (flatEl && flatEl.value ? flatEl.value.trim() : '') || data.flat || state.deliveryAddress.flat || '',
    street: (streetEl && streetEl.value ? streetEl.value.trim() : '') || data.street || state.deliveryAddress.street || '',
    landmark: (landmarkEl && landmarkEl.value ? landmarkEl.value.trim() : '') || data.landmark || state.deliveryAddress.landmark || '',
    instructions: (notesEl && notesEl.value ? notesEl.value.trim() : '') || data.instructions || state.deliveryAddress.instructions || 'Leave at door & ring bell'
  };

  const badgeEl = document.querySelector('#address-section-drawer .text-green-700');
  if (badgeEl && data.name && data.flat) {
    badgeEl.innerHTML = `✓ Auto-Saved for <strong>${escapeHtml(data.name.split(' ')[0])}</strong>`;
  }
}

// Load configuration and data from storage
function loadConfigAndData() {
  state.config = typeof getStoreConfig === 'function' ? getStoreConfig() : {};
  state.products = typeof getStoredProducts === 'function' ? getStoredProducts() : [];
  
  if (state.config.payment && state.config.payment.defaultMethod) {
    state.selectedPaymentMethod = state.config.payment.defaultMethod;
  }

  // Load saved cart
  try {
    const savedCart = localStorage.getItem('Rasoee_cart');
    if (savedCart) state.cart = JSON.parse(savedCart);
  } catch (e) {
    state.cart = {};
  }

  // Load current logged-in customer profile
  try {
    const savedUser = localStorage.getItem('Rasoee_current_user');
    if (savedUser) {
      state.currentUser = normalizeCustomerData(JSON.parse(savedUser));
      if (state.currentUser) {
        state.deliveryAddress = {
          name: state.currentUser.name || '',
          phone: state.currentUser.phone || '',
          flat: state.currentUser.flat || '',
          street: state.currentUser.street || '',
          landmark: state.currentUser.landmark || '',
          instructions: state.currentUser.instructions || 'Leave at door & ring bell'
        };

        // Cross-device cart sync: pull cloud cart for logged-in user
        if (state.currentUser.phone && typeof fetchCartFromCloud === 'function') {
          fetchCartFromCloud(state.currentUser.phone).then(cloudCart => {
            if (cloudCart && typeof cloudCart === 'object') {
              const localCart = state.cart || {};
              const merged = { ...cloudCart };
              for (const [k, v] of Object.entries(localCart)) {
                merged[k] = Math.max(merged[k] || 0, v);
              }
              state.cart = merged;
              localStorage.setItem('Rasoee_cart', JSON.stringify(state.cart));
              refreshAllCartButtons();
              updateCartUI();
              syncCartToCloud(state.currentUser.phone, state.cart);
            }
          }).catch(() => {});
        }
      }
    }
  } catch (e) {
    state.currentUser = null;
  }

  // Load saved address
  try {
    const savedAddress = localStorage.getItem('Rasoee_address');
    if (savedAddress) {
      const parsedAddr = normalizeCustomerData(JSON.parse(savedAddress));
      if (parsedAddr) {
        state.deliveryAddress = { ...state.deliveryAddress, ...parsedAddr };
      }
    } else if (state.currentUser && Array.isArray(state.currentUser.savedAddresses) && state.currentUser.savedAddresses.length > 0) {
      state.deliveryAddress = state.currentUser.savedAddresses.find(a => a.isDefault) || state.currentUser.savedAddresses[0];
      state.selectedAddressId = state.deliveryAddress.id;
    }
  } catch (e) {
    // defaults
  }

  updateHeaderUserUI();
  populateAddressFormInputs();
  renderSelectedAddressInDrawer();
  updateCheckoutButtonText();

  // Multi-device Cloud lookup: if logged-in customer is missing address or name, pull from Cloud RTDB
  if (state.currentUser && state.currentUser.phone && typeof fetchCustomerFromCloud === 'function') {
    fetchCustomerFromCloud(state.currentUser.phone).then(cloudCust => {
      if (cloudCust && (cloudCust.flat || cloudCust.street || cloudCust.name || cloudCust.savedAddresses)) {
        const normalized = normalizeCustomerData(cloudCust);
        if (normalized) {
          state.currentUser = { ...state.currentUser, ...normalized };
          if (Array.isArray(normalized.savedAddresses) && normalized.savedAddresses.length > 0) {
            state.currentUser.savedAddresses = normalized.savedAddresses;
            if (!state.deliveryAddress || (!state.deliveryAddress.flat && !state.deliveryAddress.street)) {
              state.deliveryAddress = normalized.savedAddresses.find(a => a.isDefault) || normalized.savedAddresses[0];
              state.selectedAddressId = state.deliveryAddress.id;
            }
          }
          localStorage.setItem('Rasoee_current_user', JSON.stringify(state.currentUser));
          if (state.deliveryAddress) {
            localStorage.setItem('Rasoee_address', JSON.stringify(state.deliveryAddress));
          }
          populateAddressFormInputs(normalized);
          renderSelectedAddressInDrawer();
          updateCheckoutButtonText();
          updateHeaderUserUI();
        }
      }
    }).catch(e => console.warn("Background customer sync check error", e));
  }

  // Proactively back up all local customers from users registry & order records to Cloud RTDB
  if (typeof syncAllLocalCustomersToCloud === 'function') {
    syncAllLocalCustomersToCloud().catch(() => {});
  }

  // Apply branding
  applyBranding();
  renderBanners();
  renderAnnouncement();

  if (state.config?.deliveryZone?.googleMapsApiKey) {
    loadGoogleMapsPlacesSDK(state.config.deliveryZone.googleMapsApiKey);
  }

  // Async direct cloud sync pull for config, banners and catalog
  if (typeof fetchConfigFromCloud === 'function') {
    fetchConfigFromCloud().then(cfg => {
      if (cfg) {
        state.config = cfg;
        applyBranding();
        renderAnnouncement();
        renderBanners();
        updateCheckoutButtonText();
        if (cfg.deliveryZone?.googleMapsApiKey) {
          loadGoogleMapsPlacesSDK(cfg.deliveryZone.googleMapsApiKey);
        }
      }
    }).catch(() => {});
  }
  if (typeof fetchBannersFromCloud === 'function') {
    fetchBannersFromCloud().then(() => {
      renderBanners();
    }).catch(() => {});
  }
  if (typeof syncFromCloud === 'function') {
    syncFromCloud().then(() => {
      state.config = typeof getStoreConfig === 'function' ? getStoreConfig() : {};
      state.products = typeof getStoredProducts === 'function' ? getStoredProducts() : [];
      applyBranding();
      renderBanners();
      renderAnnouncement();
      renderCategories();
      renderProducts();
    }).catch(e => console.warn("Cloud sync check error", e));
  }

  // Direct multi-device live product catalog sync from Firebase RTDB
  startLiveCatalogSync();
}

// Continuous Multi-Device Realtime Catalog, Config & Image Sync
function startLiveCatalogSync() {
  const syncCatalog = async () => {
    try {
      // 1. Check live config and banners
      if (typeof fetchConfigFromCloud === 'function') {
        const cloudCfg = await fetchConfigFromCloud();
        if (cloudCfg) {
          state.config = cloudCfg;
          renderBanners();
          renderAnnouncement();
          applyBranding();
        }
      }
      if (typeof fetchBannersFromCloud === 'function') {
        await fetchBannersFromCloud();
        renderBanners();
      }
    } catch (err) {}

    try {
      const res = await fetch("https://rasoee-fresh-default-rtdb.asia-southeast1.firebasedatabase.app/store_live_data/products.json?_t=" + Date.now(), { 
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) return;
      const cloudProducts = await res.json();
      if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
        cloudProducts.forEach(p => {
          if (p.image && typeof normalizeImageUrl === 'function') {
            p.image = normalizeImageUrl(p.image);
          }
          if ((p.id === 'prod-59' || p.id === 'prod-591' || p.name === 'Allu Paan') && (!p.image || p.image.includes('photo-1540420773420') || p.image.includes('drive.google.com/file/d/') || p.image.includes('thumbnail?id='))) {
            p.image = 'https://lh3.googleusercontent.com/d/1a3iYdVtj-nfKt9fZlPW58k2G9nQTzCLO=w400';
          }
        });

        // Determine if images, prices, names, stock, or items changed
        const currentSig = (state.products || []).map(p => `${p.id}:${p.name}:${p.price}:${p.image ? (p.image.startsWith('data:') ? p.image.slice(-30) : p.image) : ''}:${p.inStock}:${p.enabled !== false}`).join('|');
        const newSig = cloudProducts.map(p => `${p.id}:${p.name}:${p.price}:${p.image ? (p.image.startsWith('data:') ? p.image.slice(-30) : p.image) : ''}:${p.inStock}:${p.enabled !== false}`).join('|');

        if (currentSig !== newSig || (state.products || []).length !== cloudProducts.length) {
          state.products = cloudProducts;
          try {
            localStorage.removeItem("raosee_fresh_products");
            localStorage.removeItem("Rasoee_products");
            localStorage.setItem("rasoee_fresh_products", JSON.stringify(cloudProducts));
          } catch (e) {
            console.warn("Could not write products to localStorage (quota exceeded)", e);
          }
          if (typeof saveToIndexedDB === 'function') {
            saveToIndexedDB("rasoee_fresh_products", cloudProducts);
          }
          renderProducts();
        }
      }
    } catch (e) {
      console.warn("Catalog sync error:", e);
    }
  };

  // Immediate initial sync
  syncCatalog();

  // Background poll every 8 seconds
  setInterval(syncCatalog, 8000);

  // Instant re-sync when customer switches tabs or resumes app
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncCatalog();
      }
    });
    window.addEventListener('focus', syncCatalog);
  }
}

function applyBranding() {
  const cfg = state.config || {};

  const storeNameEls = document.querySelectorAll('.js-store-name');
  storeNameEls.forEach(el => el.textContent = cfg.storeName || 'Rasoee Fresh');

  const companyNameEls = document.querySelectorAll('.js-company-name');
  companyNameEls.forEach(el => el.textContent = cfg.companyName || cfg.storeName || 'Rasoee Fresh Retail Pvt Ltd');

  const outletNameEls = document.querySelectorAll('.js-outlet-name');
  outletNameEls.forEach(el => el.textContent = cfg.outletName || 'Main Store Outlet');

  const outletAddrEls = document.querySelectorAll('.js-outlet-address');
  outletAddrEls.forEach(el => el.textContent = cfg.storeAddress || (cfg.outletName || 'Store Outlet'));

  const gstinEls = document.querySelectorAll('.js-store-gstin');
  gstinEls.forEach(el => el.textContent = cfg.gstin || '29ABCDE1234F1Z5');

  const fssaiEls = document.querySelectorAll('.js-store-fssai');
  fssaiEls.forEach(el => el.textContent = cfg.fssaiNumber || '11223344000123');

  const taglineEls = document.querySelectorAll('.js-store-tagline');
  taglineEls.forEach(el => el.textContent = cfg.tagline || 'Farm Fresh Groceries Delivered to Your Doorstep');

  const outletCodeEls = document.querySelectorAll('.js-outlet-code');
  outletCodeEls.forEach(el => el.textContent = cfg.outletCode || 'RF-STORE-01');

  const emailEls = document.querySelectorAll('.js-store-email');
  emailEls.forEach(el => el.textContent = cfg.email || 'support@Rasoeefresh.com');

  // Handle Logo display
  const logoEls = document.querySelectorAll('.js-store-logo');
  logoEls.forEach(el => {
    if (cfg.logoUrl) {
      el.innerHTML = `<img src="${cfg.logoUrl}" alt="${escapeHtml(cfg.storeName || 'Logo')}" class="w-full h-full object-contain rounded-2xl" onerror="this.onerror=null; this.parentElement.innerHTML='${cfg.logoEmoji || '🛒'}';" />`;
    } else {
      el.innerHTML = cfg.logoEmoji || '🛒';
    }
  });

  const phoneEls = document.querySelectorAll('.js-store-phone');
  phoneEls.forEach(el => el.textContent = cfg.supportPhone || '+91 98765 43210');

  const deliveryTimeEls = document.querySelectorAll('.js-delivery-time');
  deliveryTimeEls.forEach(el => el.textContent = cfg.deliveryTimeEstimate || 'Standard');

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

// Dynamic Announcement Ticker (Removed from storefront)
function renderAnnouncement() {
  const container = document.getElementById('announcement-ticker');
  if (container) container.remove();
}

// Dynamic Promotional Banners
function renderBanners() {
  const container = document.getElementById('promo-banners-grid');
  if (!container) return;

  if (state.config && state.config.showBanners === false) {
    container.classList.add('hidden');
    return;
  }

  const banners = typeof getStoredBanners === 'function' ? getStoredBanners() : [];
  const activeBanners = banners.filter(b => b.enabled !== false);

  if (activeBanners.length === 0) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');

  container.innerHTML = activeBanners.map(banner => {
    let actionAttr = `onclick="openWhatsAppChat('Hi Rasoee Fresh team, I would like to know more about: ${encodeURIComponent(banner.title)}')"`;
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
        <button onclick="openWhatsAppChat('Hi Rasoee Fresh team, do you have ${encodeURIComponent(state.searchQuery || 'this item')} available?')" class="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-transform active:scale-95">
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
    const isOutOfStock = product.inStock === false;
    const imgUrl = typeof normalizeImageUrl === 'function' ? normalizeImageUrl(product.image) : (product.image || '');

    return `
      <div class="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative group ${isOutOfStock ? 'opacity-80' : ''}">
        <!-- Tag / Discount badge -->
        <div class="flex items-center justify-between gap-1 mb-2">
          ${discount > 0 ? `
            <span class="bg-blue-50 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              ${discount}% OFF
            </span>
          ` : '<span></span>'}
          ${isOutOfStock ? `
            <span class="bg-rose-50 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
              Out of Stock
            </span>
          ` : `
            <span class="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
              🥬 Fresh Stock
            </span>
          `}
        </div>

        <!-- Product Image -->
        <div class="relative w-full aspect-square mb-2.5 overflow-hidden rounded-2xl bg-white border border-gray-100 flex items-center justify-center p-2.5 group-hover:border-green-200 transition-colors">
          <img 
            src="${imgUrl}" 
            alt="${escapeHtml(product.name)}"
            loading="lazy"
            class="max-w-full max-h-full object-contain mx-auto group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'grayscale opacity-60' : ''}"
            onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'"
          />
          ${product.tag ? `
            <span class="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              ${product.tag}
            </span>
          ` : ''}
          ${isOutOfStock ? `
            <div class="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
              <span class="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase shadow">Sold Out</span>
            </div>
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
            ${isOutOfStock ? `
              <span class="text-[11px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl cursor-not-allowed inline-block">
                Out of Stock
              </span>
            ` : renderCartButton(product.id, qty)}
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
  if (delta > 0) {
    const product = state.products.find(p => p.id === productId);
    if (product && product.inStock === false) {
      alert(`Sorry, "${product.name}" is currently out of stock.`);
      return;
    }
  }

  const current = state.cart[productId] || 0;
  const newQty = Math.max(0, current + delta);

  if (newQty === 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = newQty;
  }

  localStorage.setItem('Rasoee_cart', JSON.stringify(state.cart));

  if (state.currentUser && state.currentUser.phone && typeof syncCartToCloud === 'function') {
    syncCartToCloud(state.currentUser.phone, state.cart);
  }

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
  const handlingFee = 0;
  const savings = Math.max(0, totalMrp - subtotal);
  const grandTotal = subtotal + deliveryFee + (state.tipAmount || 0);

  return {
    items,
    itemCount,
    subtotal,
    totalMrp,
    deliveryFee,
    isFreeDelivery,
    freeDeliveryThreshold,
    amountNeededForFreeDelivery: Math.max(0, freeDeliveryThreshold - subtotal),
    handlingFee: 0,
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

  // Adjust floating WhatsApp container to prevent overlapping mobile cart bar
  const waContainer = document.getElementById('floating-whatsapp-container');
  if (waContainer) {
    if (summary.itemCount > 0 && window.innerWidth < 768) {
      waContainer.style.bottom = '8.5rem';
    } else {
      waContainer.style.bottom = '';
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

// Select Payment Method in Drawer (Cash / UPI on Delivery Default)
function selectPaymentMethod(method = 'cod') {
  state.selectedPaymentMethod = 'cod';
  
  const el = document.getElementById('pay-opt-cod');
  const radio = document.getElementById('radio-cod');
  if (el) {
    el.classList.add('border-green-600', 'bg-green-50/70');
    el.classList.remove('border-gray-200', 'bg-white');
  }
  if (radio) radio.checked = true;

  updateCheckoutButtonText();
}

// ================= 5 KM DELIVERY BARRIER & ZONE VALIDATION =================
function validateDeliveryZone() {
  const cfg = state.config?.deliveryZone || { 
    maxRadiusKm: 5.0, 
    storeCoordinates: { lat: 0, lng: 0 }
  };
  const storeLat = parseFloat(cfg.storeCoordinates?.lat) || 0;
  const storeLng = parseFloat(cfg.storeCoordinates?.lng) || 0;
  const maxRadius = parseFloat(cfg.maxRadiusKm) || 5.0;
  const storeLabel = cfg.outletName || cfg.storeName || 'our store';

  // If store coordinates not configured yet, allow delivery with default notice
  if (storeLat === 0 && storeLng === 0) {
    return {
      isWithin: true,
      distanceKm: null,
      maxRadius,
      method: 'default',
      message: `📍 Outlet Delivery Zone: Limited to ${maxRadius} km from ${storeLabel}.`
    };
  }

  // 1. Direct GPS Location check if detected
  if (state.userGpsCoords && state.userGpsCoords.lat && state.userGpsCoords.lng) {
    const dist = typeof calculateDistanceKm === 'function' 
      ? calculateDistanceKm(storeLat, storeLng, state.userGpsCoords.lat, state.userGpsCoords.lng)
      : 0;
    const isWithin = dist <= maxRadius;
    return {
      isWithin,
      distanceKm: dist,
      maxRadius,
      method: 'gps',
      message: isWithin 
        ? `📍 GPS Location: ${dist} km away (Within ${maxRadius} km delivery zone)`
        : `🚫 GPS Location is ${dist} km away. We deliver strictly within ${maxRadius} km of ${storeLabel}.`
    };
  }

  // 2. Check selected delivery address coordinates
  const addressObj = state.deliveryAddress || {};
  if (addressObj.lat && addressObj.lng) {
    const dist = typeof calculateDistanceKm === 'function'
      ? calculateDistanceKm(storeLat, storeLng, addressObj.lat, addressObj.lng)
      : 0;
    const isWithin = dist <= maxRadius;
    return {
      isWithin,
      distanceKm: dist,
      maxRadius,
      method: 'address_coords',
      message: isWithin 
        ? `📍 Delivery Location: ${dist} km away (Within ${maxRadius} km delivery zone)`
        : `🚫 Delivery Location is ${dist} km away. We deliver strictly within ${maxRadius} km of ${storeLabel}.`
    };
  }

  return {
    isWithin: true,
    distanceKm: addressObj.distanceKm || null,
    maxRadius,
    method: 'default',
    message: `📍 Outlet Delivery Zone: Limited to ${maxRadius} km from ${storeLabel}.`
  };
}

// GPS Auto-Detection handler for customers
function detectUserGpsLocation() {
  const btn = document.getElementById('btn-detect-gps');
  if (btn) btn.innerHTML = `<span>⏳ Detecting...</span>`;

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser or device.");
    if (btn) btn.innerHTML = `<span>📍 Auto-Detect</span>`;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      state.userGpsCoords = { lat, lng };

      const cfg = state.config?.deliveryZone || { maxRadiusKm: 5.0, storeCoordinates: { lat: 0, lng: 0 } };
      const storeLat = parseFloat(cfg.storeCoordinates?.lat) || 0;
      const storeLng = parseFloat(cfg.storeCoordinates?.lng) || 0;
      const dist = (storeLat !== 0 && storeLng !== 0 && typeof calculateDistanceKm === 'function')
        ? calculateDistanceKm(storeLat, storeLng, lat, lng)
        : 0;

      if (btn) {
        if (storeLat === 0 && storeLng === 0) {
          btn.innerHTML = `<span class="text-emerald-700 font-bold">✓ Location Set</span>`;
        } else if (dist <= (cfg.maxRadiusKm || 5.0)) {
          btn.innerHTML = `<span class="text-emerald-700 font-bold">✓ ${dist} km (In Zone)</span>`;
        } else {
          btn.innerHTML = `<span class="text-rose-700 font-bold">✕ ${dist} km (Out of Zone)</span>`;
        }
      }

      updateCheckoutButtonText();
    },
    (err) => {
      console.warn("GPS detection error:", err);
      alert("Unable to detect GPS position. Please check browser location permissions or drop a pin on the map.");
      if (btn) btn.innerHTML = `<span>📍 Auto-Detect</span>`;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
}

// ================= INTERACTIVE LEAFLET MAP & BLINKIT/ZEPTO ADDRESS PICKER =================
let deliveryMap = null;
let deliveryMarker = null;
let deliveryCircle = null;
let currentMapCoords = { lat: 0, lng: 0 };
let currentRecipientType = 'self';
let currentAddressTag = 'Home';

function initDeliveryMap(targetLat, targetLng) {
  const container = document.getElementById('delivery-map-picker');
  if (!container) return;

  const cfg = state.config?.deliveryZone || {};
  const storeLat = parseFloat(cfg.storeCoordinates?.lat) || 0;
  const storeLng = parseFloat(cfg.storeCoordinates?.lng) || 0;
  const maxRadiusKm = parseFloat(cfg.maxRadiusKm) || 5.0;

  // Default coordinate selection
  let initLat = targetLat || (storeLat !== 0 ? storeLat : 18.455585);
  let initLng = targetLng || (storeLng !== 0 ? storeLng : 73.873529);

  if (typeof L === 'undefined') {
    container.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center p-4 text-center space-y-2 bg-gray-50 text-gray-500">
        <span class="text-3xl">🗺️</span>
        <p class="font-bold text-xs text-gray-800">Map loading...</p>
        <p class="text-[11px]">If offline, you can use the GPS button or enter your address details below.</p>
      </div>
    `;
    return;
  }

  try {
    if (deliveryMap) {
      deliveryMap.remove();
      deliveryMap = null;
    }

    deliveryMap = L.map('delivery-map-picker', {
      zoomControl: true,
      attributionControl: false
    }).setView([initLat, initLng], 15);

    // Google Maps Tile Layers (High-resolution Google Roadmap & Satellite Imagery)
    googleRoadmapLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Map data © Google'
    });

    googleSatelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Imagery © Google'
    });

    if (currentMapTileType === 'satellite') {
      googleSatelliteLayer.addTo(deliveryMap);
    } else {
      googleRoadmapLayer.addTo(deliveryMap);
    }

    // Draw store hub & 5km circle if store coordinates exist
    if (storeLat !== 0 && storeLng !== 0) {
      const storeIcon = L.divIcon({
        className: 'store-map-icon',
        html: '<div style="background:#0C831F;color:white;padding:3px 8px;border-radius:10px;font-weight:900;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,0.3);white-space:nowrap;display:flex;align-items:center;gap:3px;border:1.5px solid white;">🏪 Store Hub</div>',
        iconSize: [80, 22],
        iconAnchor: [40, 11]
      });
      L.marker([storeLat, storeLng], { icon: storeIcon, interactive: false }).addTo(deliveryMap);

      // Translucent 5 km Delivery Zone boundary
      deliveryCircle = L.circle([storeLat, storeLng], {
        radius: maxRadiusKm * 1000,
        color: '#0C831F',
        fillColor: '#10b981',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(deliveryMap);
    }

    // Draggable customer pin
    const pinIcon = L.divIcon({
      className: 'customer-pin-icon',
      html: '<div style="font-size:32px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.45));cursor:grab;line-height:1;">📍</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    deliveryMarker = L.marker([initLat, initLng], {
      draggable: true,
      icon: pinIcon
    }).addTo(deliveryMap);

    currentMapCoords = { lat: initLat, lng: initLng };
    updateMapDistanceBadge(initLat, initLng);

    deliveryMarker.on('drag', function (e) {
      const pos = e.target.getLatLng();
      currentMapCoords = { lat: pos.lat, lng: pos.lng };
      updateMapDistanceBadge(pos.lat, pos.lng);
    });

    deliveryMarker.on('dragend', function (e) {
      const pos = e.target.getLatLng();
      currentMapCoords = { lat: pos.lat, lng: pos.lng };
      const check = updateMapDistanceBadge(pos.lat, pos.lng);
      reverseGeocode(pos.lat, pos.lng);
      if (check.isWithin) {
        showNotificationToast(`📍 Exact pin location locked (${check.distanceKm} km from store) ✓`);
      }
    });

    deliveryMap.on('click', function (e) {
      deliveryMarker.setLatLng(e.latlng);
      currentMapCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
      const check = updateMapDistanceBadge(e.latlng.lat, e.latlng.lng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
      if (check.isWithin) {
        showNotificationToast(`📍 Pin placed at location (${check.distanceKm} km) ✓`);
      }
    });

    setTimeout(() => {
      if (deliveryMap) deliveryMap.invalidateSize();
    }, 250);
  } catch (err) {
    console.warn("Leaflet map initialization error:", err);
  }
}

// ================= BLINKIT/ZEPTO 3-TIER GOOGLE MAPS GUIDED SEARCH ENGINE =================
// Tier 1: Local High-Precision Society & Apartment Index (Kondhwa, NIBM, Wanowrie, Salunke Vihar, Undri, Bibwewadi, Katraj)
// Tier 2: Google Maps Places API Autocomplete (Live buildings, landmarks, gates via Google Maps JS SDK)
// Tier 3: Photon Fast Fuzzy Geocoder + OpenStreetMap Fallback

const LOCAL_PUNE_SOCIETIES = [
  // Kondhwa / NIBM Road
  { name: "Kumar Palmcrest", area: "Kondhwa", road: "Kondhwa Main Road", pincode: "411048", lat: 18.4721, lng: 73.8864 },
  { name: "Kumar Sublime", area: "Kondhwa", road: "Kondhwa Budruk", pincode: "411048", lat: 18.4682, lng: 73.8841 },
  { name: "Kumar Surabhi", area: "Pune-Satara Road", road: "Parvati", pincode: "411009", lat: 18.4891, lng: 73.8562 },
  { name: "Kumar Prithvi", area: "Market Yard", road: "Salisbury Park", pincode: "411037", lat: 18.4905, lng: 73.8712 },
  { name: "Kumar Pebble Park", area: "Hadapsar", road: "Handewadi Road", pincode: "411028", lat: 18.4851, lng: 73.9312 },
  { name: "Ganga Satellite", area: "Wanowrie", road: "Wanowrie", pincode: "411040", lat: 18.4883, lng: 73.8967 },
  { name: "Ganga Florentina", area: "NIBM", road: "NIBM Undri Road", pincode: "411048", lat: 18.4705, lng: 73.8998 },
  { name: "Ganga Kingston", area: "Mohammadwadi", road: "NIBM Annexe", pincode: "411060", lat: 18.4752, lng: 73.9101 },
  { name: "Bramha Sun City", area: "Kalyani Nagar / Wadgaon Sheri", road: "New Kalyani Nagar", pincode: "411014", lat: 18.5478, lng: 73.9065 },
  { name: "Bramha Avenue", area: "Kondhwa", road: "Jyoti Chowk", pincode: "411048", lat: 18.4789, lng: 73.8885 },
  { name: "Bramha Emerald County", area: "Kondhwa", road: "NIBM Road", pincode: "411048", lat: 18.4764, lng: 73.8912 },
  { name: "Dorabjee Heritage Mall", area: "NIBM", road: "NIBM Undri Road", pincode: "411048", lat: 18.4691, lng: 73.8985 },
  { name: "Dorabjee Paradise", area: "Mohammadwadi", road: "Corinthians Club Road", pincode: "411060", lat: 18.4688, lng: 73.9056 },
  { name: "Clover Highlands", area: "NIBM Road", road: "NIBM Road", pincode: "411048", lat: 18.4735, lng: 73.8972 },
  { name: "Clover Palisades", area: "NIBM Undri Road", road: "Undri Road", pincode: "411048", lat: 18.4668, lng: 73.9012 },
  { name: "Clover Hills", area: "NIBM", road: "NIBM Road", pincode: "411048", lat: 18.4771, lng: 73.8945 },
  { name: "Clover Park View", area: "Mohammadwadi", road: "NIBM Annexe", pincode: "411060", lat: 18.4741, lng: 73.9082 },
  { name: "Nyati Estate", area: "Mohammadwadi", road: "Corinthians Club Road", pincode: "411060", lat: 18.4674, lng: 73.9085 },
  { name: "Nyati Enclave", area: "Mohammadwadi", road: "Corinthians Club Road", pincode: "411060", lat: 18.4659, lng: 73.9092 },
  { name: "Nyati Windchimes", area: "Undri", road: "Undri Chowk", pincode: "411060", lat: 18.4589, lng: 73.9142 },
  { name: "Nyati County", area: "Mohammadwadi", road: "Corinthians Club Road", pincode: "411060", lat: 18.4665, lng: 73.9078 },
  { name: "Nyati Serenity", area: "Mohammadwadi", road: "Mohammadwadi", pincode: "411060", lat: 18.4698, lng: 73.9112 },
  { name: "Raheja Vistas", area: "NIBM Road", road: "Post Office Road", pincode: "411048", lat: 18.4718, lng: 73.8962 },
  { name: "Raheja Vistas Premiere", area: "Mohammadwadi", road: "NIBM Annexe", pincode: "411060", lat: 18.4729, lng: 73.9068 },
  { name: "Marvel Isola", area: "Mohammadwadi", road: "NIBM Annexe", pincode: "411060", lat: 18.4711, lng: 73.9075 },
  { name: "Marvel Ganga Sangria", area: "NIBM Undri Road", road: "Mohammadwadi", pincode: "411060", lat: 18.4645, lng: 73.9051 },
  { name: "Marvel Bounty", area: "Hadapsar", road: "Magarpatta Road", pincode: "411028", lat: 18.5085, lng: 73.9295 },
  { name: "Salunke Vihar", area: "Wanowrie", road: "Salunke Vihar Road", pincode: "411040", lat: 18.4831, lng: 73.8951 },
  { name: "Oxford Village", area: "Wanowrie", road: "Kedari Nagar", pincode: "411040", lat: 18.4875, lng: 73.8979 },
  { name: "Sacred Heart Town", area: "Wanowrie", road: "Wanowrie", pincode: "411040", lat: 18.4902, lng: 73.8935 },
  { name: "Mayfair Elegance", area: "NIBM", road: "NIBM Road", pincode: "411048", lat: 18.4745, lng: 73.8965 },
  { name: "Sunshree Emerald", area: "NIBM", road: "NIBM Road", pincode: "411048", lat: 18.4782, lng: 73.8931 },
  { name: "Sunshree Woods", area: "NIBM", road: "Salunke Vihar Road", pincode: "411048", lat: 18.4795, lng: 73.8942 },
  { name: "Sunshree Kangan", area: "NIBM", road: "NIBM Road", pincode: "411048", lat: 18.4778, lng: 73.8925 },
  { name: "Kausar Baugh", area: "Kondhwa", road: "Kausar Baugh Road", pincode: "411048", lat: 18.4761, lng: 73.8892 },
  { name: "Meeta Nagar", area: "Kondhwa", road: "Kondhwa", pincode: "411048", lat: 18.4731, lng: 73.8845 },
  { name: "Mithanagar", area: "Kondhwa", road: "Kondhwa Khurd", pincode: "411048", lat: 18.4755, lng: 73.8832 },
  { name: "Lullanagar", area: "Wanowrie", road: "Lullanagar Chowk", pincode: "411040", lat: 18.4912, lng: 73.8856 },
  { name: "Kedari Nagar", area: "Wanowrie", road: "Kedari Road", pincode: "411040", lat: 18.4862, lng: 73.8981 },
  { name: "Fatima Nagar", area: "Wanowrie", road: "Solapur Road", pincode: "411013", lat: 18.5025, lng: 73.9015 },
  { name: "Market Yard", area: "Gultekdi", road: "Market Yard Road", pincode: "411037", lat: 18.4885, lng: 73.8682 },
  { name: "Bibwewadi", area: "Bibwewadi", road: "Bibwewadi Road", pincode: "411037", lat: 18.4735, lng: 73.8612 },
  { name: "Katraj", area: "Katraj", road: "Katraj Chowk", pincode: "411046", lat: 18.4552, lng: 73.8582 },
  { name: "Katraj Kondhwa Road", area: "Katraj / Kondhwa", road: "Katraj Kondhwa Road", pincode: "411046", lat: 18.4582, lng: 73.8715 },
  { name: "Upper Indira Nagar", area: "Bibwewadi", road: "Bibwewadi", pincode: "411037", lat: 18.4682, lng: 73.8645 },
  { name: "Undri Chowk", area: "Undri", road: "Undri Main Road", pincode: "411060", lat: 18.4561, lng: 73.9118 },
  { name: "Mohammadwadi", area: "Mohammadwadi", road: "Tarawade Vasti", pincode: "411060", lat: 18.4715, lng: 73.9082 },
  { name: "NIBM Road", area: "Kondhwa", road: "NIBM Road", pincode: "411048", lat: 18.4748, lng: 73.8955 },
  { name: "NIBM Undri Road", area: "Undri / NIBM", road: "NIBM Undri Road", pincode: "411048", lat: 18.4655, lng: 73.9015 },
  { name: "Salunke Vihar Road", area: "Wanowrie", road: "Salunke Vihar Road", pincode: "411040", lat: 18.4822, lng: 73.8942 },
  { name: "Kondhwa Budruk", area: "Kondhwa", road: "Saswad Road", pincode: "411048", lat: 18.4612, lng: 73.8895 },
  { name: "Kondhwa Khurd", area: "Kondhwa", road: "Kondhwa", pincode: "411048", lat: 18.4772, lng: 73.8865 },
  { name: "Dynamic Grandeur", area: "Undri", road: "Undri Chowk", pincode: "411060", lat: 18.4542, lng: 73.9165 },
  { name: "Godrej Horizon", area: "Undri", road: "Undri Road", pincode: "411060", lat: 18.4525, lng: 73.9178 },
  { name: "Godrej Greens", area: "Undri", road: "Undri Road", pincode: "411060", lat: 18.4510, lng: 73.9192 },
  { name: "Amit Colori", area: "Undri", road: "Undri", pincode: "411060", lat: 18.4538, lng: 73.9145 },
  { name: "Hill Mist Garden", area: "NIBM", road: "NIBM Road", pincode: "411048", lat: 18.4715, lng: 73.8941 },
  { name: "Cloud 9", area: "NIBM", road: "NIBM Road", pincode: "411048", lat: 18.4758, lng: 73.8981 },
  { name: "Palace Orchard", area: "NIBM", road: "Undri Road", pincode: "411048", lat: 18.4695, lng: 73.8971 },
  { name: "Green Valley", area: "Wanowrie", road: "Wanowrie", pincode: "411040", lat: 18.4845, lng: 73.8912 },
  { name: "Kubera Park", area: "Kondhwa", road: "Lullanagar", pincode: "411040", lat: 18.4895, lng: 73.8872 },
  { name: "Konark Indrayu", area: "Kondhwa", road: "Kondhwa", pincode: "411048", lat: 18.4768, lng: 73.8878 },
  { name: "Konark Pooram", area: "Kondhwa", road: "Kondhwa", pincode: "411048", lat: 18.4782, lng: 73.8889 },
  { name: "Archana Paradise", area: "Wanowrie", road: "Salunke Vihar Road", pincode: "411040", lat: 18.4852, lng: 73.8961 },
  { name: "Bizzbay Mall", area: "NIBM", road: "NIBM Undri Road", pincode: "411048", lat: 18.4685, lng: 73.8992 },
  { name: "Magarpatta City", area: "Hadapsar", road: "Magarpatta Road", pincode: "411028", lat: 18.5132, lng: 73.9272 },
  { name: "Amanora Park Town", area: "Hadapsar", road: "Amanora Park Town", pincode: "411028", lat: 18.5185, lng: 73.9352 },
  { name: "Runwal Seagull", area: "Handewadi", road: "Handewadi Road", pincode: "411028", lat: 18.4762, lng: 73.9315 },
  { name: "Wanowrie", area: "Wanowrie", road: "Wanowrie Bazar", pincode: "411040", lat: 18.4872, lng: 73.8945 },
  { name: "Camp MG Road", area: "Camp", road: "MG Road", pincode: "411001", lat: 18.5172, lng: 73.8785 }
];

let addressSearchDebounceTimer = null;
let googleMapsPlacesService = null;
let googleMapsAutocompleteService = null;
let isGoogleMapsPlacesLoading = false;

// Dynamically load Google Maps Places JavaScript SDK when an API key is configured
function loadGoogleMapsPlacesSDK(apiKey) {
  if (typeof window === 'undefined') return;
  if (window.google && window.google.maps && window.google.maps.places) {
    if (!googleMapsAutocompleteService) {
      try {
        googleMapsAutocompleteService = new google.maps.places.AutocompleteService();
        const dummyNode = document.createElement('div');
        googleMapsPlacesService = new google.maps.places.PlacesService(dummyNode);
      } catch (e) {}
    }
    return;
  }
  const key = apiKey || state.config?.deliveryZone?.googleMapsApiKey || window.googleMapsApiKey;
  if (!key || isGoogleMapsPlacesLoading) return;

  isGoogleMapsPlacesLoading = true;
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    isGoogleMapsPlacesLoading = false;
    try {
      if (window.google && window.google.maps && window.google.maps.places) {
        googleMapsAutocompleteService = new google.maps.places.AutocompleteService();
        const dummyNode = document.createElement('div');
        googleMapsPlacesService = new google.maps.places.PlacesService(dummyNode);
        console.log("✓ Google Maps Places SDK loaded for guided address search");
      }
    } catch (e) {
      console.warn("Google Maps Places initialization error:", e);
    }
  };
  script.onerror = () => {
    isGoogleMapsPlacesLoading = false;
    console.warn("Could not load Google Maps Places SDK (verify API key or network)");
  };
  document.head.appendChild(script);
}

// Search pre-indexed societies in Pune store delivery zone (Instant, 0ms latency)
function searchLocalSocieties(query, storeLat, storeLng, maxRadiusKm) {
  const q = (query || '').toLowerCase().trim();
  if (q.length < 2) return [];

  const tokens = q.split(/\s+/).filter(Boolean);

  const matched = [];
  LOCAL_PUNE_SOCIETIES.forEach(soc => {
    const fullText = `${soc.name} ${soc.area} ${soc.road} ${soc.pincode}`.toLowerCase();
    
    // Check if every token matches
    const allTokensMatch = tokens.every(t => fullText.includes(t));
    if (!allTokensMatch) return;

    let dist = 0;
    if (storeLat !== 0 && storeLng !== 0) {
      dist = calculateDistanceKm(storeLat, storeLng, soc.lat, soc.lng);
    }
    const isWithin = dist <= maxRadiusKm;

    // Relevance score
    let score = 10;
    if (soc.name.toLowerCase() === q) score += 100;
    else if (soc.name.toLowerCase().startsWith(q)) score += 50;
    else if (soc.name.toLowerCase().includes(q)) score += 30;

    matched.push({
      primaryName: soc.name,
      secondaryName: `${soc.road}, ${soc.area} • ${soc.pincode}`,
      road: soc.road,
      suburb: soc.area,
      postcode: soc.pincode,
      lat: soc.lat,
      lng: soc.lng,
      dist: dist,
      isWithin: isWithin,
      badge: '⚡ Local Society',
      score: score
    });
  });

  return matched.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Query Photon Geocoder (Fast Elasticsearch geocoder with typo tolerance)
async function fetchPhotonSuggestions(query, storeLat, storeLng, maxRadiusKm) {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${storeLat}&lon=${storeLng}&limit=5`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.features)) return [];

    return data.features.map(f => {
      const p = f.properties || {};
      const coords = f.geometry && f.geometry.coordinates;
      if (!coords || coords.length < 2) return null;
      const lon = coords[0];
      const lat = coords[1];

      let dist = 0;
      if (storeLat !== 0 && storeLng !== 0) {
        dist = calculateDistanceKm(storeLat, storeLng, lat, lon);
      }
      const isWithin = dist <= maxRadiusKm;

      const primary = p.name || query;
      const secondary = [p.street, p.district || p.suburb, p.city, p.postcode].filter(Boolean).join(', ');

      return {
        primaryName: primary,
        secondaryName: secondary || p.state || 'Pune',
        road: p.street || p.name || '',
        suburb: p.district || p.suburb || p.city || '',
        postcode: p.postcode || '',
        lat: lat,
        lng: lon,
        dist: dist,
        isWithin: isWithin,
        badge: '📍 Guided Place'
      };
    }).filter(Boolean);
  } catch (e) {
    return [];
  }
}

// Query OpenStreetMap Nominatim Fallback
async function fetchNominatimSuggestions(query, storeLat, storeLng, maxRadiusKm) {
  try {
    const minLon = (storeLng - 0.20).toFixed(4);
    const maxLat = (storeLat + 0.20).toFixed(4);
    const maxLon = (storeLng + 0.20).toFixed(4);
    const minLat = (storeLat - 0.20).toFixed(4);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=0&limit=5&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return [];
    let data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      const city = state.config?.outletAddress?.city || 'Pune';
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', ' + city)}&limit=5&addressdetails=1`;
      const fallbackRes = await fetch(fallbackUrl, { headers: { 'Accept-Language': 'en' } });
      if (fallbackRes.ok) data = await fallbackRes.json();
    }

    if (!Array.isArray(data)) return [];

    return data.map(item => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      let dist = 0;
      if (storeLat !== 0 && storeLng !== 0) {
        dist = calculateDistanceKm(storeLat, storeLng, lat, lon);
      }
      const isWithin = dist <= maxRadiusKm;
      const nameParts = (item.display_name || '').split(',');
      const primaryName = nameParts[0] || query;
      const secondaryName = nameParts.slice(1, 4).join(',').trim();

      const road = item.address?.road || item.address?.pedestrian || item.address?.suburb || primaryName;
      const suburb = item.address?.suburb || item.address?.neighbourhood || item.address?.city_district || '';
      const postcode = item.address?.postcode || '';

      return {
        primaryName,
        secondaryName,
        road,
        suburb,
        postcode,
        lat,
        lng: lon,
        dist,
        isWithin,
        badge: '🗺️ Map Area'
      };
    });
  } catch (e) {
    return [];
  }
}

// Google Places Autocomplete query
function fetchGooglePlacesPredictions(query, storeLat, storeLng) {
  return new Promise((resolve) => {
    if (!googleMapsAutocompleteService || !window.google || !window.google.maps) {
      return resolve([]);
    }
    try {
      const loc = (storeLat !== 0 && storeLng !== 0) ? new google.maps.LatLng(storeLat, storeLng) : undefined;
      googleMapsAutocompleteService.getPlacePredictions({
        input: query,
        location: loc,
        radius: 7000,
        componentRestrictions: { country: 'in' }
      }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && Array.isArray(predictions)) {
          resolve(predictions);
        } else {
          resolve([]);
        }
      });
    } catch (e) {
      resolve([]);
    }
  });
}

function resolveGooglePlaceDetails(placeId) {
  return new Promise((resolve) => {
    if (!googleMapsPlacesService || !window.google || !window.google.maps) {
      return resolve(null);
    }
    try {
      googleMapsPlacesService.getDetails({
        placeId: placeId,
        fields: ['geometry', 'name', 'formatted_address', 'address_components']
      }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          resolve({ lat, lng, place });
        } else {
          resolve(null);
        }
      });
    } catch (e) {
      resolve(null);
    }
  });
}

function handleAddressSearchInput(query) {
  const suggestionsBox = document.getElementById('map-search-suggestions');
  if (!suggestionsBox) return;

  if (addressSearchDebounceTimer) {
    clearTimeout(addressSearchDebounceTimer);
  }

  const q = (query || '').trim();
  if (q.length < 2) {
    suggestionsBox.innerHTML = '';
    suggestionsBox.classList.add('hidden');
    return;
  }

  const cfg = state.config?.deliveryZone || {};
  const storeLat = parseFloat(cfg.storeCoordinates?.lat) || 18.455585;
  const storeLng = parseFloat(cfg.storeCoordinates?.lng) || 73.873529;
  const maxRadiusKm = parseFloat(cfg.maxRadiusKm) || 5.0;

  // Attempt to load Google Places SDK if key is in config
  if (cfg.googleMapsApiKey && !googleMapsAutocompleteService) {
    loadGoogleMapsPlacesSDK(cfg.googleMapsApiKey);
  }

  // Tier 1: Instant local society match (0ms latency)
  const localMatches = searchLocalSocieties(q, storeLat, storeLng, maxRadiusKm);
  if (localMatches.length > 0) {
    renderAddressSuggestions(localMatches, suggestionsBox, q);
  } else {
    suggestionsBox.innerHTML = `
      <div class="p-3 text-center text-gray-400 font-medium text-xs flex items-center justify-center gap-2">
        <svg class="animate-spin h-3.5 w-3.5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Searching Google Maps &amp; Pune societies for "${escapeHtml(q)}"...</span>
      </div>
    `;
    suggestionsBox.classList.remove('hidden');
  }

  addressSearchDebounceTimer = setTimeout(async () => {
    try {
      // Parallel Tier 2 & 3 queries: Google Places, Photon, Nominatim
      const [googlePredictions, photonResults, nominatimResults] = await Promise.all([
        fetchGooglePlacesPredictions(q, storeLat, storeLng),
        fetchPhotonSuggestions(q, storeLat, storeLng, maxRadiusKm),
        fetchNominatimSuggestions(q, storeLat, storeLng, maxRadiusKm)
      ]);

      const combined = [...localMatches];
      const seen = new Set(localMatches.map(m => m.primaryName.toLowerCase()));

      // Process Google Places predictions
      if (googlePredictions && googlePredictions.length > 0) {
        googlePredictions.slice(0, 4).forEach(gp => {
          const mainText = gp.structured_formatting?.main_text || gp.description.split(',')[0];
          if (!seen.has(mainText.toLowerCase())) {
            seen.add(mainText.toLowerCase());
            combined.push({
              primaryName: mainText,
              secondaryName: gp.structured_formatting?.secondary_text || gp.description,
              placeId: gp.place_id,
              badge: '🗺️ Google Place',
              isGooglePlace: true,
              isWithin: true
            });
          }
        });
      }

      // Add Photon results
      photonResults.forEach(pr => {
        if (!seen.has(pr.primaryName.toLowerCase())) {
          seen.add(pr.primaryName.toLowerCase());
          combined.push(pr);
        }
      });

      // Add Nominatim results
      nominatimResults.forEach(nr => {
        if (!seen.has(nr.primaryName.toLowerCase())) {
          seen.add(nr.primaryName.toLowerCase());
          combined.push(nr);
        }
      });

      if (combined.length === 0) {
        suggestionsBox.innerHTML = `
          <div class="p-3 text-center text-gray-500 text-xs">
            <span class="block text-gray-700 font-semibold mb-0.5">No exact area found for "${escapeHtml(q)}"</span>
            <span class="text-[10px] text-gray-400">Click "Guide Pin 📍" or drag the pin directly on the Google Map.</span>
          </div>
        `;
        suggestionsBox.classList.remove('hidden');
        return;
      }

      renderAddressSuggestions(combined.slice(0, 7), suggestionsBox, q);
    } catch (err) {
      console.warn("Address search error:", err);
    }
  }, 220);
}

function renderAddressSuggestions(items, suggestionsBox, query) {
  if (!items || items.length === 0) {
    suggestionsBox.classList.add('hidden');
    return;
  }

  suggestionsBox.innerHTML = items.map((item, idx) => {
    const isGoogle = !!item.isGooglePlace;
    const safePrimary = (item.primaryName || query).replace(/'/g, "\\'");
    const safeRoad = (item.road || '').replace(/'/g, "\\'");
    const safeSuburb = (item.suburb || '').replace(/'/g, "\\'");
    const safePostcode = (item.postcode || '').replace(/'/g, "\\'");
    const placeIdArg = item.placeId ? `'${item.placeId}'` : 'null';

    const distLabel = item.dist > 0 ? `${item.dist} km` : (isGoogle ? 'Google Map' : 'In Zone');
    const isWithin = item.isWithin !== false;

    return `
      <div 
        onclick="selectGuidedAddressSuggestion(${item.lat || 0}, ${item.lng || 0}, '${safePrimary}', '${safeRoad}', '${safeSuburb}', '${safePostcode}', ${placeIdArg})"
        class="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-start justify-between gap-2 transition-colors border-b border-gray-100 last:border-b-0"
      >
        <div class="flex items-start gap-2.5 flex-1 min-w-0">
          <span class="text-base flex-shrink-0 mt-0.5">${item.badge?.includes('Local') ? '🏢' : '📍'}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-gray-900 text-xs truncate">${escapeHtml(item.primaryName)}</span>
              ${item.badge ? `<span class="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">${item.badge}</span>` : ''}
            </div>
            <div class="text-[10px] text-gray-500 truncate mt-0.5">${escapeHtml(item.secondaryName || '')}</div>
          </div>
        </div>
        <div class="flex-shrink-0 text-right">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isWithin ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${distLabel}
          </span>
        </div>
      </div>
    `;
  }).join('');

  suggestionsBox.classList.remove('hidden');
}

async function selectGuidedAddressSuggestion(lat, lng, primaryName, road, suburb, postcode, placeId = null) {
  const suggestionsBox = document.getElementById('map-search-suggestions');
  if (suggestionsBox) suggestionsBox.classList.add('hidden');

  let finalLat = parseFloat(lat) || 0;
  let finalLng = parseFloat(lng) || 0;

  // If this was a Google Place without lat/lng yet, resolve coordinates via PlacesService
  if (placeId && (finalLat === 0 || finalLng === 0)) {
    const details = await resolveGooglePlaceDetails(placeId);
    if (details) {
      finalLat = details.lat;
      finalLng = details.lng;
    }
  }

  const searchInput = document.getElementById('map-search-input');
  if (searchInput) searchInput.value = primaryName || '';

  const streetInput = document.getElementById('map-input-street');
  if (streetInput) {
    const combined = [road, suburb].filter(Boolean).join(', ');
    streetInput.value = combined || primaryName || '';
  }

  const pinInput = document.getElementById('map-input-pincode');
  if (pinInput && postcode && !pinInput.value) {
    pinInput.value = postcode;
  }

  if (finalLat === 0 || finalLng === 0) {
    const cfg = state.config?.deliveryZone || {};
    finalLat = parseFloat(cfg.storeCoordinates?.lat) || 18.455585;
    finalLng = parseFloat(cfg.storeCoordinates?.lng) || 73.873529;
  }

  currentMapCoords = { lat: finalLat, lng: finalLng };

  if (deliveryMap) {
    deliveryMap.flyTo([finalLat, finalLng], 17, { animate: true, duration: 1.2 });
  }
  if (deliveryMarker) {
    deliveryMarker.setLatLng([finalLat, finalLng]);

    // Guided popup prompting customer to fine-tune pin onto exact building / gate
    deliveryMarker.bindPopup(`
      <div class="p-1 text-center" style="min-width:180px;">
        <div class="font-black text-xs text-emerald-800">📍 Guided to ${escapeHtml(primaryName)}!</div>
        <div class="text-[11px] text-gray-700 font-semibold mt-1">Now drag this pin to your exact building or gate 👇</div>
      </div>
    `).openPopup();

    setTimeout(() => {
      if (deliveryMarker && deliveryMarker.closePopup) {
        deliveryMarker.closePopup();
      }
    }, 4500);
  }

  updateMapDistanceBadge(finalLat, finalLng);
  showNotificationToast(`📍 Guided to ${primaryName}! Drag pin to your exact building or gate.`);
}

async function searchAndGuideMapPin(query) {
  const q = (query || document.getElementById('map-search-input')?.value || document.getElementById('map-input-street')?.value || '').trim();
  const suggestionsBox = document.getElementById('map-search-suggestions');
  if (suggestionsBox) suggestionsBox.classList.add('hidden');

  if (!q) {
    showNotificationToast("Please type an area or locality name to guide pin.");
    const input = document.getElementById('map-search-input');
    if (input) input.focus();
    return;
  }

  const btn = document.getElementById('btn-map-search-guide');
  const origText = btn ? btn.innerHTML : "Guide Pin 📍";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳ Guiding...</span>`;
  }

  try {
    const cfg = state.config?.deliveryZone || {};
    const storeLat = parseFloat(cfg.storeCoordinates?.lat) || 18.455585;
    const storeLng = parseFloat(cfg.storeCoordinates?.lng) || 73.873529;
    const maxRadiusKm = parseFloat(cfg.maxRadiusKm) || 5.0;

    // 1. Check local Pune societies first (instant)
    const localMatches = searchLocalSocieties(q, storeLat, storeLng, maxRadiusKm);
    if (localMatches.length > 0) {
      const top = localMatches[0];
      selectGuidedAddressSuggestion(top.lat, top.lng, top.primaryName, top.road, top.suburb, top.postcode);
      return;
    }

    // 2. Check Google Places if SDK loaded
    if (googleMapsAutocompleteService) {
      const gResults = await fetchGooglePlacesPredictions(q, storeLat, storeLng);
      if (gResults.length > 0) {
        const topG = gResults[0];
        const mainText = topG.structured_formatting?.main_text || topG.description.split(',')[0];
        const details = await resolveGooglePlaceDetails(topG.place_id);
        if (details) {
          selectGuidedAddressSuggestion(details.lat, details.lng, mainText, mainText, details.place?.formatted_address || '', '');
          return;
        }
      }
    }

    // 3. Check Photon fast geocoder
    const photonResults = await fetchPhotonSuggestions(q, storeLat, storeLng, maxRadiusKm);
    if (photonResults.length > 0) {
      const topP = photonResults[0];
      selectGuidedAddressSuggestion(topP.lat, topP.lng, topP.primaryName, topP.road, topP.suburb, topP.postcode);
      return;
    }

    // 4. Nominatim fallback
    const nominatimResults = await fetchNominatimSuggestions(q, storeLat, storeLng, maxRadiusKm);
    if (nominatimResults.length > 0) {
      const topN = nominatimResults[0];
      selectGuidedAddressSuggestion(topN.lat, topN.lng, topN.primaryName, topN.road, topN.suburb, topN.postcode);
      return;
    }

    showNotificationToast(`Could not find "${q}" nearby. Please use '🎯 Auto-Detect' or drag pin directly.`);
  } catch (err) {
    console.warn("Search & Guide error:", err);
    showNotificationToast("Network error looking up address. Please drag pin manually.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

// Close suggestions dropdown on outside click
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const box = document.getElementById('map-search-suggestions');
    const input = document.getElementById('map-search-input');
    if (box && !box.classList.contains('hidden')) {
      if (!box.contains(e.target) && e.target !== input) {
        box.classList.add('hidden');
      }
    }
  });
}

function updateMapDistanceBadge(lat, lng) {
  const pill = document.getElementById('map-live-pill');
  const btnSave = document.getElementById('btn-confirm-address-selection');
  const errBox = document.getElementById('modal-address-error');
  const cfg = state.config?.deliveryZone || {};
  const storeLat = parseFloat(cfg.storeCoordinates?.lat) || 0;
  const storeLng = parseFloat(cfg.storeCoordinates?.lng) || 0;
  const maxRadiusKm = parseFloat(cfg.maxRadiusKm) || 5.0;

  if (storeLat === 0 && storeLng === 0) {
    if (pill) {
      pill.className = "absolute top-2.5 left-2.5 z-[500] bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full shadow-md border border-emerald-300 text-[11px] font-black flex items-center gap-1.5";
      pill.innerHTML = `<span>🟢</span> <span>Location Pin Placed</span>`;
    }
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.className = "w-full bg-[#0C831F] hover:bg-emerald-800 active:scale-98 text-white py-3.5 rounded-2xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer";
      btnSave.innerHTML = `<span>✓ Confirm & Deliver to This Location</span>`;
    }
    if (errBox) errBox.classList.add('hidden');
    return { isWithin: true, distanceKm: 0 };
  }

  const dist = typeof calculateDistanceKm === 'function' ? calculateDistanceKm(storeLat, storeLng, lat, lng) : 0;
  const isWithin = dist <= maxRadiusKm;

  if (pill) {
    if (isWithin) {
      pill.className = "absolute top-2.5 left-2.5 z-[500] bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-full shadow-md border border-emerald-300 text-[11px] font-black flex items-center gap-1.5";
      pill.innerHTML = `<span>🟢</span> <span>${dist} km from store (Within 5 km Zone)</span>`;
    } else {
      pill.className = "absolute top-2.5 left-2.5 z-[500] bg-rose-50 text-rose-900 px-3 py-1.5 rounded-full shadow-md border border-rose-300 text-[11px] font-black flex items-center gap-1.5";
      pill.innerHTML = `<span>🚫</span> <span>${dist} km from store (Outside 5 km Limit)</span>`;
    }
  }

  if (btnSave) {
    if (isWithin) {
      btnSave.disabled = false;
      btnSave.className = "w-full bg-[#0C831F] hover:bg-emerald-800 active:scale-98 text-white py-3.5 rounded-2xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer";
      btnSave.innerHTML = `<span>✓ Confirm & Deliver to This Location (${dist} km)</span>`;
      if (errBox) errBox.classList.add('hidden');
    } else {
      btnSave.disabled = true;
      btnSave.className = "w-full bg-slate-300 text-slate-500 py-3.5 rounded-2xl font-black text-sm shadow-none transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-80";
      btnSave.innerHTML = `<span>🚫 Location is ${dist} km Away (Limit is ${maxRadiusKm} km)</span>`;
      if (errBox) {
        errBox.textContent = `This dropped pin is ${dist} km away. We deliver strictly within ${maxRadiusKm} km of our outlet. Please move the pin closer.`;
        errBox.classList.remove('hidden');
      }
    }
  }

  return { isWithin, distanceKm: dist };
}

function locateUserOnMap() {
  const btn = document.getElementById('btn-map-locate-gps');
  if (btn) btn.innerHTML = `<span>⏳ Locating...</span>`;

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser or device.");
    if (btn) btn.innerHTML = `<span>🎯 Locate Me</span>`;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      state.userGpsCoords = { lat, lng };
      currentMapCoords = { lat, lng };

      if (deliveryMap) {
        deliveryMap.setView([lat, lng], 15);
        if (deliveryMarker) deliveryMarker.setLatLng([lat, lng]);
      }
      updateMapDistanceBadge(lat, lng);
      reverseGeocode(lat, lng);
      if (btn) btn.innerHTML = `<span>✓ Found</span>`;
      setTimeout(() => { if (btn) btn.innerHTML = `<span>🎯 Locate Me</span>`; }, 2000);
    },
    (err) => {
      console.warn("Geolocation error:", err);
      alert("Unable to detect GPS position. Please drag the pin on the map to your location.");
      if (btn) btn.innerHTML = `<span>🎯 Locate Me</span>`;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { 'Accept-Language': 'en' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const road = data.address.road || data.address.pedestrian || data.address.suburb || data.address.neighbourhood || '';
        const suburb = data.address.suburb || data.address.neighbourhood || data.address.city_district || '';
        const streetInput = document.getElementById('map-input-street');
        if (streetInput && (!streetInput.value || streetInput.value.trim().length < 3)) {
          const combined = [road, suburb].filter(Boolean).join(', ');
          if (combined) streetInput.value = combined;
        }
        const pinInput = document.getElementById('map-input-pincode');
        if (pinInput && data.address.postcode && !pinInput.value) {
          pinInput.value = data.address.postcode;
        }
      }
    }
  } catch (e) {}
}

function setRecipientType(type) {
  currentRecipientType = type;
  const btnSelf = document.getElementById('btn-recipient-self');
  const btnFriend = document.getElementById('btn-recipient-friend');
  const friendFields = document.getElementById('friend-contact-fields');
  const selfFields = document.getElementById('self-contact-fields');

  if (type === 'friend') {
    if (btnFriend) {
      btnFriend.className = "py-2 px-3 rounded-xl border-2 border-blinkit-green bg-green-50/80 font-bold text-gray-900 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer";
    }
    if (btnSelf) {
      btnSelf.className = "py-2 px-3 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 font-bold text-gray-600 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer";
    }
    if (friendFields) friendFields.classList.remove('hidden');
    if (selfFields) selfFields.classList.add('hidden');
    setMapAddressTag('Friend');
  } else {
    if (btnSelf) {
      btnSelf.className = "py-2 px-3 rounded-xl border-2 border-blinkit-green bg-green-50/80 font-bold text-gray-900 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer";
    }
    if (btnFriend) {
      btnFriend.className = "py-2 px-3 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 font-bold text-gray-600 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer";
    }
    if (friendFields) friendFields.classList.add('hidden');
    if (selfFields) selfFields.classList.remove('hidden');
    setMapAddressTag('Home');
  }
}

function setMapAddressTag(tag) {
  currentAddressTag = tag;
  const tags = ['Home', 'Work', 'Friend', 'Other'];
  tags.forEach(t => {
    const btn = document.getElementById(`tag-opt-${t.toLowerCase()}`);
    if (btn) {
      if (t === tag) {
        btn.className = "map-tag-btn px-3 py-1.5 rounded-xl border-2 border-blinkit-green bg-green-50 font-bold text-gray-900 cursor-pointer text-xs";
      } else {
        btn.className = "map-tag-btn px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer text-xs";
      }
    }
  });
}

let editingAddressId = null;

function openAddressPickerModal() {
  const modal = document.getElementById('address-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const hasSaved = state.currentUser && Array.isArray(state.currentUser.savedAddresses) && state.currentUser.savedAddresses.length > 0;
  const tabSaved = document.getElementById('tab-btn-saved');
  const countBadge = document.getElementById('saved-addr-count-badge');
  const tabMapLabel = document.getElementById('tab-btn-map-label');

  if (countBadge) countBadge.textContent = hasSaved ? state.currentUser.savedAddresses.length : 0;

  if (hasSaved) {
    if (tabSaved) tabSaved.classList.remove('hidden');
    if (tabMapLabel) tabMapLabel.textContent = "➕ Add New Address";
    switchAddressModalTab('saved');
    renderSavedAddressesModalList();
  } else {
    if (tabSaved) tabSaved.classList.add('hidden');
    if (tabMapLabel) tabMapLabel.textContent = "📍 Set Delivery Location";
    addNewAddressFlow();
  }
}

function openAddressPickerModalForNew() {
  const modal = document.getElementById('address-modal');
  if (modal) modal.classList.remove('hidden');
  addNewAddressFlow();
}

function closeAddressPickerModal() {
  const modal = document.getElementById('address-modal');
  if (modal) modal.classList.add('hidden');
}

function switchAddressModalTab(tab, forceNew = false) {
  const tabMap = document.getElementById('tab-btn-map');
  const tabSaved = document.getElementById('tab-btn-saved');
  const viewMap = document.getElementById('addr-view-map');
  const viewSaved = document.getElementById('addr-view-saved');

  if (tab === 'saved' && !forceNew) {
    if (tabSaved) {
      tabSaved.className = "pb-2 px-3 border-b-2 border-blinkit-green text-blinkit-green flex items-center gap-1.5 transition-colors cursor-pointer";
    }
    if (tabMap) {
      tabMap.className = "pb-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors cursor-pointer";
    }
    if (viewSaved) viewSaved.classList.remove('hidden');
    if (viewMap) viewMap.classList.add('hidden');
    renderSavedAddressesModalList();
  } else {
    // When switching to map tab or clicking "Add another address", always follow the clean guided process!
    addNewAddressFlow();
  }
}

function addNewAddressFlow() {
  editingAddressId = null;

  // 1. Reset all inputs cleanly
  const searchInput = document.getElementById('map-search-input');
  const flatInput = document.getElementById('map-input-flat');
  const streetInput = document.getElementById('map-input-street');
  const landmarkInput = document.getElementById('map-input-landmark');
  const pinInput = document.getElementById('map-input-pincode');
  const friendName = document.getElementById('map-friend-name');
  const friendPhone = document.getElementById('map-friend-phone');
  const suggestionsBox = document.getElementById('map-search-suggestions');
  const errBox = document.getElementById('modal-address-error');
  const btnSave = document.getElementById('btn-confirm-address-selection');
  const backBar = document.getElementById('addr-map-back-bar');

  if (searchInput) searchInput.value = '';
  if (flatInput) flatInput.value = '';
  if (streetInput) streetInput.value = '';
  if (landmarkInput) landmarkInput.value = '';
  if (pinInput) pinInput.value = '';
  if (friendName) friendName.value = '';
  if (friendPhone) friendPhone.value = '';
  if (suggestionsBox) {
    suggestionsBox.innerHTML = '';
    suggestionsBox.classList.add('hidden');
  }
  if (errBox) {
    errBox.textContent = '';
    errBox.classList.add('hidden');
  }

  // 2. Reset recipient to self & tag to Home
  setRecipientType('self');
  setMapAddressTag('Home');

  const selfNameInput = document.getElementById('map-self-name');
  const selfPhoneInput = document.getElementById('map-self-phone');
  if (selfNameInput) selfNameInput.value = state.currentUser?.name || '';
  if (selfPhoneInput) selfPhoneInput.value = state.currentUser?.phone || '';

  // 3. UI tabs state
  const tabMap = document.getElementById('tab-btn-map');
  const tabSaved = document.getElementById('tab-btn-saved');
  const viewMap = document.getElementById('addr-view-map');
  const viewSaved = document.getElementById('addr-view-saved');

  if (tabMap) {
    tabMap.className = "pb-2 px-3 border-b-2 border-blinkit-green text-blinkit-green flex items-center gap-1.5 transition-colors cursor-pointer";
  }
  if (tabSaved) {
    tabSaved.className = "pb-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors cursor-pointer";
  }
  if (viewMap) viewMap.classList.remove('hidden');
  if (viewSaved) viewSaved.classList.add('hidden');

  const hasSaved = state.currentUser && Array.isArray(state.currentUser.savedAddresses) && state.currentUser.savedAddresses.length > 0;
  if (backBar) {
    if (hasSaved) {
      backBar.classList.remove('hidden');
      backBar.classList.add('flex');
    } else {
      backBar.classList.add('hidden');
      backBar.classList.remove('flex');
    }
  }

  if (btnSave) {
    btnSave.innerHTML = `<span>✓ Confirm & Deliver to This Location</span>`;
  }

  // 4. Center map on Store coordinates or User GPS (NOT old previous address)
  const cfg = state.config?.deliveryZone || {};
  const storeLat = parseFloat(cfg.storeCoordinates?.lat) || 18.455585;
  const storeLng = parseFloat(cfg.storeCoordinates?.lng) || 73.873529;
  const initLat = (state.userGpsCoords?.lat && state.userGpsCoords.lat !== 0) ? state.userGpsCoords.lat : storeLat;
  const initLng = (state.userGpsCoords?.lng && state.userGpsCoords.lng !== 0) ? state.userGpsCoords.lng : storeLng;

  currentMapCoords = { lat: initLat, lng: initLng };

  setTimeout(() => {
    initDeliveryMap(initLat, initLng);
    if (deliveryMap) {
      deliveryMap.invalidateSize();
      deliveryMap.setView([initLat, initLng], 15);
    }
    if (deliveryMarker) {
      deliveryMarker.setLatLng([initLat, initLng]);
      deliveryMarker.bindPopup(`
        <div class="p-1 text-center" style="min-width:180px;">
          <div class="font-black text-xs text-emerald-800">⚡ Adding Another Address</div>
          <div class="text-[11px] text-gray-700 font-semibold mt-1">1. Type area in search above to fly here ✈️<br>2. Drag pin to exact building or gate 📍</div>
        </div>
      `).openPopup();

      setTimeout(() => {
        if (deliveryMarker && deliveryMarker.closePopup) deliveryMarker.closePopup();
      }, 4000);
    }

    updateMapDistanceBadge(initLat, initLng);

    // 5. Step 1: Auto-focus the search bar so the user immediately starts typing
    if (searchInput) {
      searchInput.focus();
    }
  }, 150);

  showNotificationToast("📍 Step 1: Type area or society name above to guide pin nearby.");
}

function editSavedAddress(id) {
  const addresses = (state.currentUser && Array.isArray(state.currentUser.savedAddresses)) ? state.currentUser.savedAddresses : [];
  const addr = addresses.find(a => a.id === id);
  if (!addr) return;

  editingAddressId = id;

  const searchInput = document.getElementById('map-search-input');
  const flatInput = document.getElementById('map-input-flat');
  const streetInput = document.getElementById('map-input-street');
  const landmarkInput = document.getElementById('map-input-landmark');
  const pinInput = document.getElementById('map-input-pincode');
  const friendName = document.getElementById('map-friend-name');
  const friendPhone = document.getElementById('map-friend-phone');
  const suggestionsBox = document.getElementById('map-search-suggestions');
  const errBox = document.getElementById('modal-address-error');
  const btnSave = document.getElementById('btn-confirm-address-selection');
  const backBar = document.getElementById('addr-map-back-bar');

  if (searchInput) searchInput.value = addr.street || '';
  if (flatInput) flatInput.value = addr.flat || '';
  if (streetInput) streetInput.value = addr.street || '';
  if (landmarkInput) landmarkInput.value = addr.landmark || '';
  if (pinInput) pinInput.value = addr.pincode || '';
  if (suggestionsBox) suggestionsBox.classList.add('hidden');
  if (errBox) {
    errBox.textContent = '';
    errBox.classList.add('hidden');
  }

  if (addr.isFriendOrder || addr.tag === 'Friend') {
    setRecipientType('friend');
    if (friendName) friendName.value = addr.receiverName || '';
    if (friendPhone) friendPhone.value = addr.receiverPhone || '';
  } else {
    setRecipientType('self');
  }

  setMapAddressTag(addr.tag || 'Home');

  const tabMap = document.getElementById('tab-btn-map');
  const tabSaved = document.getElementById('tab-btn-saved');
  const viewMap = document.getElementById('addr-view-map');
  const viewSaved = document.getElementById('addr-view-saved');

  if (tabMap) tabMap.className = "pb-2 px-3 border-b-2 border-blinkit-green text-blinkit-green flex items-center gap-1.5 transition-colors cursor-pointer";
  if (tabSaved) tabSaved.className = "pb-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors cursor-pointer";
  if (viewMap) viewMap.classList.remove('hidden');
  if (viewSaved) viewSaved.classList.add('hidden');

  if (backBar) {
    backBar.classList.remove('hidden');
    backBar.classList.add('flex');
  }

  if (btnSave) {
    btnSave.innerHTML = `<span>✓ Update Delivery Location</span>`;
  }

  const editLat = parseFloat(addr.lat) || 18.455585;
  const editLng = parseFloat(addr.lng) || 73.873529;
  currentMapCoords = { lat: editLat, lng: editLng };

  setTimeout(() => {
    initDeliveryMap(editLat, editLng);
    if (deliveryMap) {
      deliveryMap.invalidateSize();
      deliveryMap.setView([editLat, editLng], 17);
    }
    if (deliveryMarker) {
      deliveryMarker.setLatLng([editLat, editLng]);
      deliveryMarker.bindPopup(`
        <div class="p-1 text-center" style="min-width:160px;">
          <div class="font-black text-xs text-emerald-800">Editing Address</div>
          <div class="text-[11px] text-gray-700 font-semibold mt-1">Drag pin to adjust location if needed 👇</div>
        </div>
      `).openPopup();
      setTimeout(() => {
        if (deliveryMarker && deliveryMarker.closePopup) deliveryMarker.closePopup();
      }, 3000);
    }
    updateMapDistanceBadge(editLat, editLng);
  }, 150);
}

function renderSavedAddressesModalList() {
  const container = document.getElementById('saved-addresses-modal-list');
  const countBadge = document.getElementById('saved-addr-count-badge');
  if (!container) return;

  const addresses = (state.currentUser && Array.isArray(state.currentUser.savedAddresses)) ? state.currentUser.savedAddresses : [];
  if (countBadge) countBadge.textContent = addresses.length;

  if (addresses.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl space-y-1">
        <span class="text-3xl block mb-1">📍</span>
        <p class="font-bold text-gray-700 text-xs">No saved addresses yet</p>
        <p class="text-[11px]">Type an area or drop a pin to add your first delivery location!</p>
      </div>
    `;
    return;
  }

  const cfg = state.config?.deliveryZone || {};
  const storeLat = parseFloat(cfg.storeCoordinates?.lat) || 0;
  const storeLng = parseFloat(cfg.storeCoordinates?.lng) || 0;
  const maxRadiusKm = parseFloat(cfg.maxRadiusKm) || 5.0;

  container.innerHTML = addresses.map(addr => {
    let dist = addr.distanceKm;
    if (dist == null && storeLat !== 0 && storeLng !== 0 && addr.lat && addr.lng) {
      dist = calculateDistanceKm(storeLat, storeLng, addr.lat, addr.lng);
      addr.distanceKm = dist;
    }
    const isWithin = (storeLat === 0 && storeLng === 0) ? true : (dist != null ? (dist <= maxRadiusKm) : true);
    const isSelected = state.selectedAddressId === addr.id || (state.deliveryAddress && state.deliveryAddress.id === addr.id);
    const tagIcons = { Home: '🏠', Work: '🏢', Friend: '🎁', Other: '📍' };
    const tagIcon = tagIcons[addr.tag] || '📍';

    return `
      <div class="p-3.5 rounded-2xl border-2 ${isSelected ? 'border-blinkit-green bg-green-50/70' : 'border-gray-200 bg-white hover:border-gray-300'} transition-all flex items-start justify-between gap-3">
        <div class="flex-1 space-y-1 cursor-pointer" onclick="selectSavedAddress('${addr.id}')">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs font-black uppercase text-gray-900">${tagIcon} ${addr.tag || 'Home'}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isWithin ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${dist != null ? `${dist} km away` : 'In Zone'}
            </span>
            ${addr.isFriendOrder ? '<span class="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">🎁 Friend Order</span>' : ''}
          </div>
          <div class="text-xs font-bold text-gray-900">
            ${escapeHtml(addr.receiverName || 'Recipient')} (${addr.receiverPhone || ''})
          </div>
          <div class="text-[11px] text-gray-600">
            ${escapeHtml(addr.flat ? addr.flat + ', ' : '')}${escapeHtml(addr.street || '')}${addr.landmark ? ', Near ' + escapeHtml(addr.landmark) : ''}
          </div>
        </div>
        <div class="flex flex-col items-end gap-1.5">
          <button type="button" onclick="selectSavedAddress('${addr.id}')" class="px-3 py-1.5 rounded-xl font-bold text-[11px] ${isSelected ? 'bg-blinkit-green text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} cursor-pointer">
            ${isSelected ? '✓ Selected' : 'Deliver Here'}
          </button>
          <div class="flex items-center gap-2">
            <button type="button" onclick="editSavedAddress('${addr.id}')" class="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold transition-colors cursor-pointer">
              Edit ✏️
            </button>
            <span class="text-gray-300">|</span>
            <button type="button" onclick="deleteSavedAddress('${addr.id}')" class="text-[10px] text-gray-400 hover:text-red-600 transition-colors cursor-pointer">
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function selectSavedAddress(id) {
  const addresses = (state.currentUser && Array.isArray(state.currentUser.savedAddresses)) ? state.currentUser.savedAddresses : [];
  const found = addresses.find(a => a.id === id);
  if (!found) return;

  const cfg = state.config?.deliveryZone || {};
  const storeLat = parseFloat(cfg.storeCoordinates?.lat) || 0;
  const storeLng = parseFloat(cfg.storeCoordinates?.lng) || 0;
  const maxRadiusKm = parseFloat(cfg.maxRadiusKm) || 5.0;

  if (storeLat !== 0 && storeLng !== 0 && found.lat && found.lng) {
    const dist = calculateDistanceKm(storeLat, storeLng, found.lat, found.lng);
    found.distanceKm = dist;
    if (dist > maxRadiusKm) {
      alert(`🚫 Cannot deliver to this address!\n\nThis address is ${dist} km away, which exceeds our ${maxRadiusKm} km delivery limit.\nPlease choose an address within 5.0 km.`);
      return;
    }
  }

  state.deliveryAddress = found;
  state.selectedAddressId = id;
  localStorage.setItem('Rasoee_address', JSON.stringify(found));
  closeAddressPickerModal();
  renderSelectedAddressInDrawer();
  updateCheckoutButtonText();
}

function deleteSavedAddress(idOrIndex) {
  if (!state.currentUser || !Array.isArray(state.currentUser.savedAddresses)) return;
  
  let targetId = null;
  if (typeof idOrIndex === 'number') {
    const item = state.currentUser.savedAddresses[idOrIndex];
    if (item) targetId = item.id;
    state.currentUser.savedAddresses.splice(idOrIndex, 1);
  } else {
    targetId = idOrIndex;
    state.currentUser.savedAddresses = state.currentUser.savedAddresses.filter(a => a.id !== targetId);
  }

  const userPhone = state.currentUser?.phone ? String(state.currentUser.phone).replace(/\D/g, '').slice(-10) : '';

  try {
    localStorage.setItem('Rasoee_current_user', JSON.stringify(state.currentUser));
    let users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]');
    const uIdx = users.findIndex(u => String(u?.phone || '').replace(/\D/g, '').slice(-10) === userPhone);
    if (uIdx >= 0) {
      users[uIdx].savedAddresses = state.currentUser.savedAddresses;
      localStorage.setItem('Rasoee_users', JSON.stringify(users));
    }
    if (userPhone && typeof syncCustomerToCloud === 'function') {
      syncCustomerToCloud(state.currentUser);
    }
  } catch (e) {}

  renderSavedAddressesModalList();
  if (typeof renderSavedAddressesList === 'function') {
    renderSavedAddressesList();
  }

  if (state.selectedAddressId === targetId || (state.deliveryAddress && state.deliveryAddress.id === targetId)) {
    state.deliveryAddress = state.currentUser.savedAddresses[0] || null;
    state.selectedAddressId = state.deliveryAddress ? state.deliveryAddress.id : null;
    if (state.deliveryAddress) {
      localStorage.setItem('Rasoee_address', JSON.stringify(state.deliveryAddress));
    } else {
      localStorage.removeItem('Rasoee_address');
    }
    renderSelectedAddressInDrawer();
    updateCheckoutButtonText();
  }
}

async function confirmAndSaveAddressFromMap() {
  const isFriend = currentRecipientType === 'friend';
  const friendName = document.getElementById('map-friend-name')?.value.trim();
  const friendPhone = document.getElementById('map-friend-phone')?.value.trim().replace(/\D/g, '').slice(-10);
  const selfName = document.getElementById('map-self-name')?.value.trim();
  const userPhone = state.currentUser?.phone ? String(state.currentUser.phone).replace(/\D/g, '').slice(-10) : '';

  const receiverName = isFriend ? friendName : (selfName || state.currentUser?.name || 'Customer');
  const receiverPhone = isFriend ? friendPhone : (userPhone || document.getElementById('map-self-phone')?.value.trim());

  const flat = document.getElementById('map-input-flat')?.value.trim();
  const street = document.getElementById('map-input-street')?.value.trim();
  const landmark = document.getElementById('map-input-landmark')?.value.trim();
  const pincode = document.getElementById('map-input-pincode')?.value.trim();

  const errBox = document.getElementById('modal-address-error');

  if (isFriend && (!friendName || !friendPhone || friendPhone.length !== 10)) {
    if (errBox) {
      errBox.textContent = "Please provide your friend's full name and 10-digit mobile number so our delivery boy can contact them.";
      errBox.classList.remove('hidden');
    } else {
      alert("Please provide your friend's name and 10-digit mobile number.");
    }
    return;
  }

  if (!isFriend && !receiverName) {
    if (errBox) {
      errBox.textContent = "Please enter your name.";
      errBox.classList.remove('hidden');
    }
    return;
  }

  if (!flat || !street) {
    if (errBox) {
      errBox.textContent = "Please fill your Flat / House number and Street / Locality.";
      errBox.classList.remove('hidden');
    } else {
      alert("Please fill your Flat/House number and Street/Locality.");
    }
    return;
  }

  // Distance verification
  const cfg = state.config?.deliveryZone || {};
  const storeLat = parseFloat(cfg.storeCoordinates?.lat) || 0;
  const storeLng = parseFloat(cfg.storeCoordinates?.lng) || 0;
  const maxRadiusKm = parseFloat(cfg.maxRadiusKm) || 5.0;

  let distanceKm = 0;
  if (storeLat !== 0 && storeLng !== 0 && currentMapCoords.lat !== 0 && currentMapCoords.lng !== 0) {
    distanceKm = calculateDistanceKm(storeLat, storeLng, currentMapCoords.lat, currentMapCoords.lng);
    if (distanceKm > maxRadiusKm) {
      if (errBox) {
        errBox.textContent = `🚫 Cannot deliver: Location is ${distanceKm} km away (Limit is ${maxRadiusKm} km). Please move pin closer.`;
        errBox.classList.remove('hidden');
      }
      return;
    }
  }

  const addressId = editingAddressId || ('addr_' + Date.now());
  const newAddress = {
    id: addressId,
    tag: currentAddressTag || (isFriend ? 'Friend' : 'Home'),
    receiverName,
    receiverPhone,
    placedByName: state.currentUser?.name || receiverName,
    placedByPhone: userPhone || receiverPhone,
    isFriendOrder: isFriend,
    flat,
    street,
    landmark,
    pincode,
    lat: currentMapCoords.lat,
    lng: currentMapCoords.lng,
    distanceKm,
    isWithinZone: true,
    isDefault: true,
    createdAt: new Date().toISOString()
  };

  if (!state.currentUser) {
    state.currentUser = {
      id: 'usr_' + (userPhone ? userPhone.slice(-4) : Date.now().toString().slice(-4)),
      name: receiverName,
      phone: userPhone || receiverPhone,
      savedAddresses: []
    };
  }
  if (!Array.isArray(state.currentUser.savedAddresses)) {
    state.currentUser.savedAddresses = [];
  }

  if (editingAddressId) {
    const existingIdx = state.currentUser.savedAddresses.findIndex(a => a.id === editingAddressId);
    if (existingIdx >= 0) {
      state.currentUser.savedAddresses[existingIdx] = newAddress;
    } else {
      state.currentUser.savedAddresses.unshift(newAddress);
    }
  } else {
    state.currentUser.savedAddresses.forEach(a => a.isDefault = false);
    state.currentUser.savedAddresses.unshift(newAddress);
  }

  editingAddressId = null;
  state.deliveryAddress = newAddress;
  state.selectedAddressId = addressId;

  try {
    localStorage.setItem('Rasoee_address', JSON.stringify(newAddress));
    localStorage.setItem('Rasoee_current_user', JSON.stringify(state.currentUser));
    let users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]');
    const uIdx = users.findIndex(u => String(u?.phone || '').replace(/\D/g, '').slice(-10) === userPhone);
    if (uIdx >= 0) {
      users[uIdx].savedAddresses = state.currentUser.savedAddresses;
      users[uIdx].name = users[uIdx].name || state.currentUser.name;
    } else {
      users.push(state.currentUser);
    }
    localStorage.setItem('Rasoee_users', JSON.stringify(users));
  } catch (e) {}

  if (userPhone && typeof syncCustomerToCloud === 'function') {
    syncCustomerToCloud(state.currentUser);
  }

  closeAddressPickerModal();
  renderSelectedAddressInDrawer();
  updateCheckoutButtonText();
  if (typeof renderSavedAddressesList === 'function') {
    renderSavedAddressesList();
  }
  showNotificationToast("✓ Delivery address saved and selected!");
}

function renderSelectedAddressInDrawer() {
  const container = document.getElementById('drawer-selected-address-card');
  if (!container) return;

  const addr = state.deliveryAddress;
  if (!addr || (!addr.flat && !addr.street)) {
    container.innerHTML = `
      <button type="button" onclick="openAddressPickerModal()" class="w-full bg-emerald-50/80 hover:bg-emerald-100/80 border-2 border-dashed border-emerald-400 rounded-2xl p-4 text-center cursor-pointer transition-all group">
        <span class="text-2xl block mb-1 group-hover:scale-110 transition-transform">📍</span>
        <div class="text-xs font-black text-emerald-900">Add Delivery Location (Within 5 km)</div>
        <div class="text-[11px] text-emerald-700">Drop pin on map or select saved address</div>
      </button>
    `;
    return;
  }

  const isFriend = addr.isFriendOrder || addr.tag === 'Friend';
  const tagIcons = { Home: '🏠', Work: '🏢', Friend: '🎁', Other: '📍' };
  const tagIcon = tagIcons[addr.tag] || '📍';
  const distText = addr.distanceKm != null ? `${addr.distanceKm} km from store` : 'Inside 5 km';

  container.innerHTML = `
    <div class="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-200 text-emerald-950 uppercase flex items-center gap-1">
            <span>${tagIcon}</span> <span>${addr.tag || 'Home'}</span>
          </span>
          <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${addr.isWithinZone !== false ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}">
            🟢 ${distText}
          </span>
          ${isFriend ? '<span class="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">🎁 Friend Order</span>' : ''}
        </div>
        <button type="button" onclick="openAddressPickerModal()" class="text-xs font-bold text-blinkit-green hover:underline cursor-pointer">
          Change ✏️
        </button>
      </div>

      <div class="space-y-0.5">
        <div class="text-xs font-black text-gray-900 flex items-center gap-1">
          <span>Deliver To:</span>
          <span>${escapeHtml(addr.receiverName || state.currentUser?.name || 'Customer')}</span>
          <span class="text-gray-500 font-mono font-normal">(${addr.receiverPhone || state.currentUser?.phone || ''})</span>
        </div>
        <div class="text-[11px] text-gray-600 leading-tight">
          ${escapeHtml(addr.flat ? addr.flat + ', ' : '')}${escapeHtml(addr.street || '')}${addr.landmark ? ', Near ' + escapeHtml(addr.landmark) : ''}
        </div>
      </div>
    </div>
  `;
}

function updateCheckoutButtonText() {
  const summary = getCartSummary();
  const btn = document.getElementById('btn-checkout-primary');
  const btnIcon = document.getElementById('btn-checkout-icon');
  const btnLabel = document.getElementById('btn-checkout-label');
  const btnSub = document.getElementById('btn-checkout-sub');
  const zoneBadge = document.getElementById('delivery-zone-live-badge');

  if (!btn || !btnLabel) return;

  const addr = state.deliveryAddress;
  const hasAddress = addr && (addr.flat || addr.street);

  // If no address selected yet, prompt user to add address
  if (!hasAddress) {
    if (zoneBadge) zoneBadge.classList.add('hidden');
    btn.disabled = false;
    btn.className = "w-full bg-[#0C831F] hover:bg-emerald-800 text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-between shadow-lg hover:shadow-xl active:scale-98 transition-all cursor-pointer";
    if (btnIcon) btnIcon.innerHTML = `<span class="text-xl">📍</span>`;
    btnLabel.textContent = `Select Delivery Address (Within 5 km)`;
    if (btnSub) btnSub.textContent = `Drop pin on map to verify delivery zone`;
    return;
  }

  const zoneCheck = validateDeliveryZone();

  if (zoneBadge) {
    zoneBadge.classList.remove('hidden');
    if (zoneCheck.isWithin) {
      zoneBadge.className = "bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-2.5 text-xs font-bold flex items-center justify-between";
      zoneBadge.innerHTML = `
        <span class="flex items-center gap-1.5"><span>🟢</span> <span>${zoneCheck.message}</span></span>
        <span class="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full uppercase font-black">Within 5 km</span>
      `;
    } else {
      zoneBadge.className = "bg-rose-50 border border-rose-300 text-rose-800 rounded-xl p-2.5 text-xs font-bold flex items-center justify-between";
      zoneBadge.innerHTML = `
        <span class="flex items-center gap-1.5"><span>🚫</span> <span>${zoneCheck.message}</span></span>
        <span class="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full uppercase font-black">Blocked (> 5 km)</span>
      `;
    }
  }

  // Enforce 5 km Boundary: Disable checkout button if outside zone
  if (!zoneCheck.isWithin) {
    btn.disabled = true;
    btn.className = "w-full bg-slate-300 text-slate-500 py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-between shadow-none cursor-not-allowed opacity-80";
    if (btnIcon) btnIcon.innerHTML = `<span class="text-xl">🚫</span>`;
    btnLabel.textContent = `Delivery Not Available (> 5 km)`;
    if (btnSub) btnSub.textContent = `Address is beyond 5.0 km outlet boundary`;
    return;
  }

  btn.disabled = false;
  btn.className = "w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-between shadow-lg hover:shadow-xl active:scale-98 transition-all cursor-pointer";
  if (btnIcon) btnIcon.innerHTML = `<span class="text-xl">🛵</span>`;
  btnLabel.textContent = `Place Order (Pay ₹${summary.grandTotal} on Delivery)`;
  if (btnSub) btnSub.textContent = `Cash or UPI to Rider at Doorstep`;

  btn.disabled = false;
  btn.className = "w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-between shadow-lg hover:shadow-xl active:scale-98 transition-all cursor-pointer";
  if (btnIcon) btnIcon.innerHTML = `<span class="text-xl">🛵</span>`;
  btnLabel.textContent = `Place Order (Pay ₹${summary.grandTotal} on Delivery)`;
  if (btnSub) btnSub.textContent = `Cash or UPI to Rider at Doorstep`;
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
          <span>Yay! You've unlocked <strong>FREE Standard Delivery</strong>!</span>
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
      <img src="${product.image}" class="w-14 h-14 object-contain rounded-xl bg-white border border-gray-100 p-1 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'" />
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
    populateAddressFormInputs();
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
  // If modern Blinkit/Zepto delivery address is already selected
  if (state.deliveryAddress && (state.deliveryAddress.flat || state.deliveryAddress.street)) {
    const da = state.deliveryAddress;
    const isFriend = !!(da.isFriendOrder || da.tag === 'Friend');
    const userPhone = state.currentUser?.phone ? String(state.currentUser.phone).replace(/\D/g, '').slice(-10) : '';
    const userName = state.currentUser?.name || 'Valued Customer';

    const recName = da.receiverName || userName;
    const recPhone = da.receiverPhone || userPhone;

    if (!recPhone) {
      if (typeof openLoginModal === 'function') openLoginModal();
      return null;
    }

    const payload = {
      name: recName,
      phone: recPhone,
      receiverName: recName,
      receiverPhone: recPhone,
      placedByName: da.placedByName || userName,
      placedByPhone: da.placedByPhone || userPhone,
      isFriendOrder: isFriend,
      tag: da.tag || 'Home',
      flat: da.flat || '',
      street: da.street || 'Store Area',
      landmark: da.landmark || '',
      pincode: da.pincode || '',
      lat: da.lat || null,
      lng: da.lng || null,
      distanceKm: da.distanceKm != null ? da.distanceKm : null,
      mapUrl: da.lat && da.lng ? `https://www.google.com/maps?q=${da.lat},${da.lng}` : '',
      instructions: da.instructions || 'Leave at door & ring bell'
    };

    if (typeof syncCustomerToCloud === 'function' && userPhone) {
      syncCustomerToCloud({ ...state.currentUser, ...payload });
    }
    return payload;
  }

  // Fallback if legacy input fields exist
  const nameInput = document.getElementById('addr-name');
  const phoneInput = document.getElementById('addr-phone');
  const flatInput = document.getElementById('addr-flat');
  const streetInput = document.getElementById('addr-street');
  const landmarkInput = document.getElementById('addr-landmark');
  const notesInput = document.getElementById('addr-notes');

  let customerName = nameInput ? nameInput.value.trim() : '';
  let customerPhone = phoneInput ? phoneInput.value.trim().replace(/\D/g, '').slice(-10) : '';
  let flat = flatInput ? flatInput.value.trim() : '';
  let street = streetInput ? streetInput.value.trim() : '';
  let landmark = landmarkInput ? landmarkInput.value.trim() : '';
  let notes = notesInput ? notesInput.value.trim() : '';

  const fallback = normalizeCustomerData(state.deliveryAddress) || normalizeCustomerData(state.currentUser);
  if (!customerName && fallback?.name) customerName = fallback.name;
  if (!customerPhone && fallback?.phone) customerPhone = fallback.phone;
  if (!flat && fallback?.flat) flat = fallback.flat;
  if (!street && fallback?.street) street = fallback.street;
  if (!landmark && fallback?.landmark) landmark = fallback.landmark;
  if (!notes && fallback?.instructions) notes = fallback.instructions;

  if (!customerPhone && state.currentUser?.phone) {
    customerPhone = String(state.currentUser.phone).replace(/\D/g, '').slice(-10);
  }
  if (!flat && state.currentUser) {
    const normUser = normalizeCustomerData(state.currentUser);
    if (normUser?.flat) flat = normUser.flat;
    if (!street && normUser?.street) street = normUser.street;
    if (!customerName && normUser?.name) customerName = normUser.name;
  }

  if (!customerPhone || !flat) {
    if (typeof openAddressPickerModal === 'function') {
      openAddressPickerModal();
    } else {
      alert("Please select or enter your delivery address!");
    }
    return null;
  }

  state.deliveryAddress = {
    name: customerName || 'Valued Customer',
    phone: customerPhone,
    receiverName: customerName || 'Valued Customer',
    receiverPhone: customerPhone,
    placedByName: customerName || 'Valued Customer',
    placedByPhone: customerPhone,
    isFriendOrder: false,
    tag: 'Home',
    flat,
    street: street || 'Main Road',
    landmark,
    pincode: '',
    gpsCoords: state.userGpsCoords || null,
    instructions: notes || 'Leave at door & ring bell'
  };
  localStorage.setItem('Rasoee_address', JSON.stringify(state.deliveryAddress));

  if (typeof syncCustomerToCloud === 'function') {
    syncCustomerToCloud(state.deliveryAddress);
  }

  return state.deliveryAddress;
}

// Unified Checkout Handler: Routes to Direct UPI QR / Cash on Delivery (COD)
function handleUnifiedCheckout() {
  const summary = getCartSummary();
  if (summary.itemCount === 0) {
    alert("Your cart is empty! Please add some grocery items first.");
    return;
  }

  // Check login
  if (!state.currentUser) {
    openLoginModal();
    return;
  }

  // Check address presence
  if (!state.deliveryAddress || (!state.deliveryAddress.flat && !state.deliveryAddress.street)) {
    openAddressPickerModal();
    return;
  }

  // Strict 5 km Outlet Delivery Boundary Enforcement
  const zoneCheck = validateDeliveryZone();
  if (!zoneCheck.isWithin) {
    alert(`🚫 Delivery Restricted Outside 5 KM Boundary!\n\n${zoneCheck.message}\n\nPlease choose an address within 5.0 km of our dark store.`);
    openAddressPickerModal();
    return;
  }

  const customer = extractAddressForm();
  if (!customer) return;

  const orderId = `RF-${Date.now().toString().slice(-6)}`;

  // Default & Primary: Cash / UPI on Delivery
  processOrderCompletion(orderId, summary, customer, {
    method: 'Cash / UPI on Delivery',
    status: 'Pay at Doorstep (Cash or UPI)',
    paymentId: 'COD-' + orderId
  });
}

// 1. Direct Instant UPI (0% Fee) QR & App Intent
function initiateDirectUpiPayment(orderId, summary, customer) {
  const upiId = state.config.payment?.upiId || 'Rasoeefresh@upi';
  const upiName = encodeURIComponent(state.config.storeName || 'Rasoee Fresh Supermarket');
  const amount = summary.grandTotal.toFixed(2);
  const note = encodeURIComponent(`Order ${orderId} Rasoee Fresh`);

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
  const errEl = document.getElementById('upi-utr-error');
  const utr = refInput ? refInput.value.trim().replace(/\s+/g, '') : '';

  // Mandatory 12-Digit Indian UPI Reference / UTR validation
  if (!utr || utr.length < 12) {
    if (errEl) {
      errEl.textContent = '⚠️ Payment confirmation required! Please enter the valid 12-digit UPI Reference / UTR Number from Google Pay / PhonePe / Paytm.';
      errEl.classList.remove('hidden');
    } else {
      alert('⚠️ Payment confirmation required!\nPlease enter the 12-digit UPI Reference / UTR Number from Google Pay / PhonePe / Paytm before submitting your order.');
    }
    if (refInput) {
      refInput.focus();
      refInput.classList.add('border-rose-500', 'bg-rose-50');
    }
    return;
  }

  if (errEl) errEl.classList.add('hidden');
  if (refInput) refInput.classList.remove('border-rose-500', 'bg-rose-50');

  const { orderId, summary, customer } = state.pendingUpiOrder;
  closeUpiQrModal();

  processOrderCompletion(orderId, summary, customer, {
    method: 'Direct UPI (QR Payment)',
    status: 'PAID VIA UPI (UTR: ' + utr + ')',
    paymentId: utr,
    utr: utr,
    paidAt: new Date().toISOString()
  });
}

// 3. Process Completed Order & Send to WhatsApp
function processOrderCompletion(orderId, summary, customer, paymentDetails) {
  const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Build clean, professional WhatsApp Message
  let message = `🛒 *NEW ORDER: ${state.config.storeName || 'Rasoee Fresh Supermarket'}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔖 *Order ID:* #${orderId}\n`;
  message += `⏰ *Time:* ${dateStr} \n\n`;

  message += `💳 *PAYMENT DETAILS:*\n`;
  message += `• Status: *${paymentDetails.status}*\n`;
  message += `• Method: ${paymentDetails.method}\n`;
  if (paymentDetails.paymentId) message += `• Transaction/Ref ID: \`${paymentDetails.paymentId}\`\n\n`;

  message += `📍 *DELIVERY & CONTACT DETAILS:*\n`;
  if (customer.isFriendOrder) {
    message += `• 🎁 *ORDER TYPE: DELIVER TO FRIEND*\n`;
    message += `• Deliver To (Recipient): *${customer.receiverName || customer.name}*\n`;
    message += `• Recipient Phone: *${customer.receiverPhone || customer.phone}* (📞 Call on Arrival)\n`;
    message += `• Placed By: ${customer.placedByName || 'Customer'} (${customer.placedByPhone || ''})\n`;
  } else {
    message += `• Customer Name: *${customer.name}*\n`;
    if (customer.phone) message += `• Phone: *${customer.phone}*\n`;
  }
  message += `• Address Type: *${customer.tag || 'Home'}*\n`;
  message += `• Address: ${customer.flat ? customer.flat + ', ' : ''}${customer.street ? customer.street : 'Store Area'}\n`;
  if (customer.landmark) message += `• Landmark: ${customer.landmark}\n`;
  if (customer.distanceKm != null) message += `• Distance: *${customer.distanceKm} km from dark store* (Inside 5 km zone)\n`;
  if (customer.mapUrl) message += `• 📍 GPS Pin: ${customer.mapUrl}\n`;
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
  localStorage.removeItem('Rasoee_cart');
  if (customer && customer.phone && typeof syncCartToCloud === 'function') {
    syncCartToCloud(customer.phone, {});
  }
  refreshAllCartButtons();
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
  const defaultMsg = customMessage || `Hello Rasoee Fresh Supermarket team, I need help with grocery ordering/delivery.`;
  const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMsg)}`;
  window.open(url, '_blank');
}

function openPhotoOrderWhatsApp() {
  const waNumber = (state.config.whatsappNumber || '919876543210').replace(/\D/g, '');
  const msg = `Hi Rasoee Fresh! I am sending a photo/text list of groceries I want to order for home delivery. Please check and reply with bill and delivery ETA!`;
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
    populateAddressFormInputs(state.currentUser);
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
let modalOtpTimer = null;
let modalGeneratedOtp = '1234';
let currentSelectedAddressTag = 'Home';

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
  if (modalOtpTimer) {
    clearInterval(modalOtpTimer);
    modalOtpTimer = null;
  }
}

function backToModalPhoneStep() {
  document.getElementById('modal-login-step-otp')?.classList.add('hidden');
  document.getElementById('modal-login-step-profile')?.classList.add('hidden');
  document.getElementById('modal-login-step-phone')?.classList.remove('hidden');
  const phoneInput = document.getElementById('modal-login-phone');
  if (phoneInput) phoneInput.focus();
}

function startModalOtpTimer(duration = 30) {
  if (modalOtpTimer) clearInterval(modalOtpTimer);
  let left = duration;
  const countEl = document.getElementById('modal-otp-countdown');
  const timerText = document.getElementById('modal-otp-timer-text');
  const resendBtn = document.getElementById('modal-btn-resend-otp');

  if (timerText) timerText.classList.remove('hidden');
  if (resendBtn) resendBtn.classList.add('hidden');
  if (countEl) countEl.textContent = left;

  modalOtpTimer = setInterval(() => {
    left--;
    if (countEl) countEl.textContent = left;
    if (left <= 0) {
      clearInterval(modalOtpTimer);
      modalOtpTimer = null;
      if (timerText) timerText.classList.add('hidden');
      if (resendBtn) resendBtn.classList.remove('hidden');
    }
  }, 1000);
}

async function handleModalSendOtp() {
  const input = document.getElementById('modal-login-phone');
  const raw = input ? input.value.trim() : '';
  const phone = raw.replace(/\D/g, '').slice(-10);
  if (phone.length !== 10) {
    alert("Please enter a valid 10-digit mobile number.");
    input?.focus();
    return;
  }
  modalActivePhone = phone;
  window.__prefetchedCloudCustomer = null;

  // 1. Immediately check local registry / order records for instant pre-fill
  if (typeof findCustomerLocally === 'function') {
    const local = findCustomerLocally(phone);
    if (local) window.__prefetchedCloudCustomer = local;
  }

  // 2. Pre-fetch customer profile from Cloud RTDB in background while OTP is entered
  if (typeof fetchCustomerFromCloud === 'function') {
    fetchCustomerFromCloud(phone).then(cust => {
      if (cust) window.__prefetchedCloudCustomer = { ...(window.__prefetchedCloudCustomer || {}), ...cust };
    }).catch(() => {});
  }
  const errEl = document.getElementById('modal-otp-error');
  if (errEl) {
    errEl.classList.add('hidden');
    errEl.textContent = '';
  }

  // Trigger Realtime SMS via window.SmsService
  let sendResult = null;
  if (window.SmsService && typeof window.SmsService.sendRealtimeOtp === 'function') {
    sendResult = await window.SmsService.sendRealtimeOtp(phone);
    modalGeneratedOtp = sendResult.otp || '123456';
  } else {
    modalGeneratedOtp = '123456';
  }

  const disp = document.getElementById('modal-otp-phone-display');
  if (disp) disp.textContent = `+91 ${phone}`;

  const hint = document.getElementById('modal-otp-code-hint');
  if (hint) hint.textContent = modalGeneratedOtp;

  // Update status badge if available
  const statusBadge = document.getElementById('modal-sms-live-status');
  if (statusBadge && sendResult) {
    statusBadge.innerHTML = `
      <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> <span>${sendResult.carrierDispatched ? 'Realtime SMS Dispatched via Carrier' : 'Realtime OTP Generated & Ready'}</span></span>
      <span class="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold uppercase">${sendResult.provider || 'Carrier SMS'}</span>
    `;
  }

  document.getElementById('modal-login-step-phone')?.classList.add('hidden');
  document.getElementById('modal-login-step-otp')?.classList.remove('hidden');

  // Clear and focus OTP
  const otpInputs = document.querySelectorAll('.modal-otp-digit');
  otpInputs.forEach(i => i.value = '');
  if (otpInputs[0]) otpInputs[0].focus();

  startModalOtpTimer(30);
}

async function handleModalResendOtp() {
  const errEl = document.getElementById('modal-otp-error');
  if (errEl) {
    errEl.classList.add('hidden');
    errEl.textContent = '';
  }

  let sendResult = null;
  if (window.SmsService && typeof window.SmsService.sendRealtimeOtp === 'function') {
    sendResult = await window.SmsService.sendRealtimeOtp(modalActivePhone);
    modalGeneratedOtp = sendResult.otp || '123456';
  } else {
    modalGeneratedOtp = '123456';
  }

  const hint = document.getElementById('modal-otp-code-hint');
  if (hint) hint.textContent = modalGeneratedOtp;

  startModalOtpTimer(30);
  autoFillModalOtp();
}

function autoFillModalOtp() {
  const otpInputs = document.querySelectorAll('.modal-otp-digit');
  const digits = (modalGeneratedOtp || '123456').split('');
  otpInputs.forEach((inp, idx) => {
    inp.value = digits[idx] || '';
  });
  if (otpInputs.length > 0) {
    otpInputs[otpInputs.length - 1].focus();
  }
}

async function handleModalVerifyOtp() {
  const otpInputs = document.querySelectorAll('.modal-otp-digit');
  let code = '';
  otpInputs.forEach(i => code += i.value);

  const errEl = document.getElementById('modal-otp-error');
  if (errEl) {
    errEl.classList.add('hidden');
    errEl.textContent = '';
  }

  if (code.length < 4) {
    if (errEl) {
      errEl.textContent = "Please enter the verification code.";
      errEl.classList.remove('hidden');
    } else {
      alert("Please enter the verification code.");
    }
    return;
  }

  // Realtime OTP Verification via SmsService
  if (window.SmsService && typeof window.SmsService.verifyRealtimeOtp === 'function') {
    const verifyRes = await window.SmsService.verifyRealtimeOtp(code, modalActivePhone);
    if (!verifyRes.success) {
      if (errEl) {
        errEl.textContent = verifyRes.error || "Incorrect verification code. Please try again.";
        errEl.classList.remove('hidden');
      } else {
        alert(verifyRes.error || "Incorrect verification code.");
      }
      return;
    }
  } else {
    if (code !== '1234' && code !== '123456' && code !== modalGeneratedOtp) {
      if (errEl) {
        errEl.textContent = "Incorrect verification code. Please try again.";
        errEl.classList.remove('hidden');
      } else {
        alert("Incorrect verification code.");
      }
      return;
    }
  }

  const cleanPhone = String(modalActivePhone || '').replace(/\D/g, '').slice(-10);

  // 1. Check local customer registries and past orders
  let existing = typeof findCustomerLocally === 'function' ? findCustomerLocally(cleanPhone) : null;
  if (!existing) {
    let users = [];
    try { users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]'); } catch (e) {}
    existing = users.find(u => String(u?.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
  }

  // 2. Merge with prefetched cloud customer or fetch from Cloud RTDB
  const cloudData = window.__prefetchedCloudCustomer || (typeof fetchCustomerFromCloud === 'function' ? await fetchCustomerFromCloud(cleanPhone) : null);
  if (cloudData && (cloudData.name || cloudData.flat || cloudData.address)) {
    const normalized = normalizeCustomerData(cloudData);
    if (normalized) {
      existing = { ...(existing || {}), ...normalized };
      let users = [];
      try { users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]'); } catch (e) {}
      const idx = users.findIndex(u => String(u?.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
      if (idx >= 0) users[idx] = existing;
      else users.push(existing);
      localStorage.setItem('Rasoee_users', JSON.stringify(users));
    }
  }

  // 3. If user exists and has a name or flat address, log them in immediately without prompting again!
  if (existing && (existing.name || existing.flat || (existing.address && (existing.address.flat || existing.address.street)))) {
    setCustomerSession(existing);
    closeLoginModal();
    alert(`Welcome back, ${existing.name || 'Valued Customer'}! 🎉`);
    return;
  } else {
    // New customer: ask for Name & Delivery Flat
    document.getElementById('modal-login-step-otp')?.classList.add('hidden');
    document.getElementById('modal-login-step-profile')?.classList.remove('hidden');
    const nameInp = document.getElementById('modal-profile-name');
    if (nameInp) nameInp.focus();
  }
}

function handleModalSaveProfile() {
  const name = document.getElementById('modal-profile-name')?.value.trim();
  if (!name) {
    alert("Please enter your name to start shopping.");
    document.getElementById('modal-profile-name')?.focus();
    return;
  }
  const cleanPhone = String(modalActivePhone || '').replace(/\D/g, '').slice(-10);

  const newUser = normalizeCustomerData({
    id: 'usr_' + Date.now().toString().slice(-6),
    name: name,
    phone: cleanPhone,
    flat: '',
    street: '',
    landmark: '',
    instructions: 'Leave at door & ring bell',
    savedAddresses: [],
    createdAt: new Date().toISOString(),
    orderCount: 0
  });

  let users = [];
  try {
    users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]');
  } catch (e) {
    users = [];
  }
  const idx = users.findIndex(u => u.phone === cleanPhone);
  if (idx >= 0) users[idx] = { ...users[idx], ...newUser };
  else users.push(newUser);
  localStorage.setItem('Rasoee_users', JSON.stringify(users));

  // Permanently sync customer to Cloud RTDB by mobile number
  if (typeof syncCustomerToCloud === 'function') {
    syncCustomerToCloud(newUser);
  }

  setCustomerSession(newUser);
  closeLoginModal();
  alert(`Welcome to ${state.config?.storeName || 'Rasoee Fresh Supermarket'}, ${newUser.name}! 🛒`);
}

function quickModalLogin(name, phone, flat) {
  const defaultCity = (typeof getStoreConfig === 'function' ? (getStoreConfig().city || '') : '');
  const user = normalizeCustomerData({
    id: 'usr_' + phone.slice(-4),
    name: name,
    phone: phone,
    flat: flat,
    street: '',
    landmark: '',
    instructions: 'Leave at door & ring bell',
    address: { flat: flat, street: '', landmark: '', city: defaultCity, tag: 'Home' },
    savedAddresses: [{ type: 'Home', flat: flat, street: '', landmark: '', city: defaultCity, isDefault: true }],
    createdAt: new Date().toISOString(),
    orderCount: 0
  });

  let users = [];
  try {
    users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]');
  } catch (e) {
    users = [];
  }
  const idx = users.findIndex(u => u.phone === phone);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  localStorage.setItem('Rasoee_users', JSON.stringify(users));

  setCustomerSession(user);
  closeLoginModal();
}

function setCustomerSession(user) {
  const normalized = normalizeCustomerData(user);
  if (!normalized) return;

  state.currentUser = normalized;
  localStorage.setItem('Rasoee_current_user', JSON.stringify(normalized));

  // Blinkit/Zepto multiple address support: select default or first saved address
  if (Array.isArray(normalized.savedAddresses) && normalized.savedAddresses.length > 0) {
    const active = normalized.savedAddresses.find(a => a.isDefault) || normalized.savedAddresses[0];
    state.deliveryAddress = { ...active };
    state.selectedAddressId = active.id;
  } else if (normalized.flat || normalized.street) {
    state.deliveryAddress = {
      name: normalized.name || '',
      phone: normalized.phone || '',
      flat: normalized.flat || '',
      street: normalized.street || '',
      landmark: normalized.landmark || '',
      instructions: normalized.instructions || 'Leave at door & ring bell'
    };
    state.selectedAddressId = null;
  } else {
    state.deliveryAddress = null;
    state.selectedAddressId = null;
  }

  if (state.deliveryAddress) {
    localStorage.setItem('Rasoee_address', JSON.stringify(state.deliveryAddress));
  } else {
    localStorage.removeItem('Rasoee_address');
  }

  // Update in Rasoee_users directory
  let users = [];
  try { users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]'); } catch (e) {}
  const idx = users.findIndex(u => u.phone === normalized.phone);
  if (idx >= 0) users[idx] = { ...users[idx], ...normalized };
  else users.push(normalized);
  localStorage.setItem('Rasoee_users', JSON.stringify(users));

  // Auto-populate cart drawer delivery fields immediately
  populateAddressFormInputs(normalized);
  renderSelectedAddressInDrawer();
  updateCheckoutButtonText();

  updateHeaderUserUI();
  populateCustomerSettingsForm();

  // Push to cloud sync
  if (typeof syncCustomerToCloud === 'function') {
    syncCustomerToCloud(normalized);
  }

  // Cross-device cart sync: pull cloud cart and merge
  if (normalized.phone && typeof fetchCartFromCloud === 'function') {
    fetchCartFromCloud(normalized.phone).then(cloudCart => {
      if (cloudCart && typeof cloudCart === 'object') {
        const localCart = state.cart || {};
        const merged = { ...cloudCart };
        for (const [k, v] of Object.entries(localCart)) {
          merged[k] = Math.max(merged[k] || 0, v);
        }
        state.cart = merged;
        localStorage.setItem('Rasoee_cart', JSON.stringify(state.cart));
        refreshAllCartButtons();
        updateCartUI();
        syncCartToCloud(normalized.phone, state.cart);
      }
    }).catch(() => {});
  }
}

function logoutCustomer() {
  if (confirm("Are you sure you want to log out?")) {
    state.currentUser = null;
    localStorage.removeItem('Rasoee_current_user');
    updateHeaderUserUI();
    closeAccountDrawer();
  }
}

// ================= MY ACCOUNT & CUSTOMER SETTINGS DRAWER =================
function openAccountDrawer() {
  const drawer = document.getElementById('account-drawer');
  const overlay = document.getElementById('account-drawer-overlay');
  const panel = document.getElementById('account-drawer-panel');
  if (!drawer || !overlay || !panel) return;

  // Fill user details in header
  const nameEl = document.getElementById('account-user-name');
  const phoneEl = document.getElementById('account-user-phone');
  const addrEl = document.getElementById('account-user-address');

  if (state.currentUser) {
    if (nameEl) nameEl.textContent = state.currentUser.name || 'Valued Customer';
    if (phoneEl) phoneEl.textContent = `+91 ${state.currentUser.phone || ''}`;
    if (addrEl && state.currentUser.address) {
      addrEl.textContent = `${state.currentUser.address.flat || ''}, ${state.currentUser.address.street || ''}`;
    }
  } else if (state.deliveryAddress) {
    if (nameEl) nameEl.textContent = state.deliveryAddress.name || 'Customer Account';
    if (phoneEl) phoneEl.textContent = state.deliveryAddress.phone ? `+91 ${state.deliveryAddress.phone}` : '+91 98765 43210';
    if (addrEl && state.deliveryAddress.flat) {
      addrEl.textContent = `${state.deliveryAddress.flat}, ${state.deliveryAddress.street || ''}`;
    }
  }

  // Update order count badge
  let allOrders = [];
  try {
    allOrders = JSON.parse(localStorage.getItem('Rasoee_orders') || '[]');
  } catch (e) {
    allOrders = [];
  }
  const userPhone = state.currentUser?.phone || state.deliveryAddress?.phone;
  const userOrders = userPhone 
    ? allOrders.filter(o => !o.customer?.phone || o.customer.phone === userPhone || o.customer.phone.includes(userPhone))
    : allOrders;
  const badgeEl = document.getElementById('account-tab-order-badge');
  if (badgeEl) badgeEl.textContent = userOrders.length;

  renderAccountOrders();
  populateCustomerSettingsForm();

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

function openCustomerProfileSettingsDrawer() {
  toggleCartDrawer(false);
  openAccountDrawer();
  setAccountDrawerTab('settings');
}

function setAccountDrawerTab(tab) {
  const ordersView = document.getElementById('account-view-orders');
  const settingsView = document.getElementById('account-view-settings');
  const ordersBtn = document.getElementById('account-tab-btn-orders');
  const settingsBtn = document.getElementById('account-tab-btn-settings');

  if (tab === 'settings') {
    if (ordersView) ordersView.classList.add('hidden');
    if (settingsView) settingsView.classList.remove('hidden');

    if (ordersBtn) {
      ordersBtn.className = "py-2.5 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition-all flex items-center gap-1.5 font-bold";
    }
    if (settingsBtn) {
      settingsBtn.className = "py-2.5 px-3 border-b-2 border-blinkit-green text-blinkit-green font-black transition-all flex items-center gap-1.5";
    }

    populateCustomerSettingsForm();
  } else {
    if (ordersView) ordersView.classList.remove('hidden');
    if (settingsView) settingsView.classList.add('hidden');

    if (ordersBtn) {
      ordersBtn.className = "py-2.5 px-3 border-b-2 border-blinkit-green text-blinkit-green font-black transition-all flex items-center gap-1.5";
    }
    if (settingsBtn) {
      settingsBtn.className = "py-2.5 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition-all flex items-center gap-1.5 font-bold";
    }

    renderAccountOrders();
  }
}

function setCustomerAddressTag(tag) {
  currentSelectedAddressTag = tag || 'Home';
  const tags = ['Home', 'Work', 'Other'];
  tags.forEach(t => {
    const btn = document.getElementById(`tag-btn-${t}`);
    if (btn) {
      if (t === currentSelectedAddressTag) {
        btn.className = "px-2 py-0.5 rounded-lg text-[10px] font-bold bg-green-100 text-green-800 border border-green-300 shadow-2xs";
      } else {
        btn.className = "px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200";
      }
    }
  });
}

function populateCustomerSettingsForm() {
  const user = state.currentUser || {};
  const addr = user.address || state.deliveryAddress || {};

  const nameInput = document.getElementById('cust-setting-name');
  const phoneInput = document.getElementById('cust-setting-phone');
  const emailInput = document.getElementById('cust-setting-email');
  const flatInput = document.getElementById('cust-setting-flat');
  const bldgInput = document.getElementById('cust-setting-building');
  const streetInput = document.getElementById('cust-setting-street');
  const lmarkInput = document.getElementById('cust-setting-landmark');
  const cityInput = document.getElementById('cust-setting-city');
  const instSelect = document.getElementById('cust-setting-instruction');

  if (nameInput) nameInput.value = user.name || state.deliveryAddress?.name || '';
  if (phoneInput) {
    const rawPhone = user.phone || state.deliveryAddress?.phone || '';
    phoneInput.value = rawPhone ? (rawPhone.startsWith('+91') ? rawPhone : `+91 ${rawPhone}`) : '+91 98765 43210';
  }
  if (emailInput) emailInput.value = user.email || '';
  if (flatInput) flatInput.value = addr.flat || '';
  if (bldgInput) bldgInput.value = addr.building || '';
  if (streetInput) streetInput.value = addr.street || '';
  if (lmarkInput) lmarkInput.value = addr.landmark || '';
  const defaultCity = (typeof getStoreConfig === 'function' ? (getStoreConfig().city || '') : '');
  if (cityInput) cityInput.value = addr.city || defaultCity;
  if (instSelect && user.instruction) instSelect.value = user.instruction;

  setCustomerAddressTag(addr.tag || 'Home');
  renderSavedAddressesList();
}

function renderSavedAddressesList() {
  const container = document.getElementById('cust-saved-addresses-list');
  if (!container) return;

  const defaultCity = (typeof getStoreConfig === 'function' ? (getStoreConfig().city || '') : '');
  const user = state.currentUser;
  let saved = (user && Array.isArray(user.savedAddresses) && user.savedAddresses.length > 0)
    ? user.savedAddresses
    : [];

  if (saved.length === 0 && user && user.address && (user.address.flat || user.address.street)) {
    saved = [{
      id: 'addr_' + Date.now(),
      tag: user.address.tag || 'Home',
      type: user.address.tag || 'Home',
      flat: user.address.flat || '',
      building: user.address.building || '',
      street: user.address.street || '',
      landmark: user.address.landmark || '',
      city: user.address.city || defaultCity,
      isDefault: true
    }];
    user.savedAddresses = saved;
  }

  if (saved.length === 0) {
    container.innerHTML = `
      <div class="text-center py-3 text-gray-400 text-[11px] bg-gray-50 rounded-xl border border-dashed border-gray-200">
        No addresses saved yet. Click "➕ Add Another (Guided Pin 📍)" to add your delivery location.
      </div>
    `;
    return;
  }

  container.innerHTML = saved.map((item, index) => {
    const isPrimary = item.isDefault || index === 0;
    const itemTag = item.tag || item.type || 'Home';
    const tagEmoji = itemTag === 'Work' ? '🏢' : ((itemTag === 'Friend' || item.isFriendOrder) ? '🎁' : (itemTag === 'Other' ? '📍' : '🏠'));
    const fullText = [item.flat, item.building, item.street, item.landmark].filter(Boolean).join(', ');

    return `
      <div class="p-2.5 rounded-xl border ${isPrimary ? 'bg-green-50/60 border-green-200' : 'bg-gray-50 border-gray-200'} flex items-center justify-between gap-2">
        <div class="flex-1 min-w-0 cursor-pointer" onclick="setPrimarySavedAddress(${index})">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs">${tagEmoji}</span>
            <span class="font-bold text-gray-900 text-xs">${itemTag}</span>
            ${isPrimary ? '<span class="bg-green-100 text-green-800 text-[9px] font-black px-1.5 py-0.2 rounded-full">Primary</span>' : ''}
            ${item.distanceKm != null ? `<span class="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">${item.distanceKm} km</span>` : ''}
            ${item.isFriendOrder ? '<span class="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">🎁 Friend</span>' : ''}
          </div>
          <p class="text-[11px] text-gray-600 truncate mt-0.5" title="${escapeHtml(fullText)}">${escapeHtml(fullText)}</p>
        </div>
        <div class="flex items-center gap-1.5">
          ${!isPrimary ? `
            <button type="button" onclick="setPrimarySavedAddress(${index})" class="px-2 py-1 bg-white hover:bg-green-50 text-blinkit-green border border-green-200 rounded-lg text-[10px] font-bold cursor-pointer">
              Use
            </button>
          ` : ''}
          <button type="button" onclick="editSavedAddress('${item.id || ''}')" class="p-1 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-50 text-xs cursor-pointer" title="Edit address on map">
            ✏️
          </button>
          <button type="button" onclick="deleteSavedAddress('${item.id || index}')" class="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 text-xs cursor-pointer" title="Remove address">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function setPrimarySavedAddress(index) {
  if (!state.currentUser || !state.currentUser.savedAddresses) return;
  const list = state.currentUser.savedAddresses;
  if (!list[index]) return;

  list.forEach((item, i) => item.isDefault = (i === index));
  const chosen = list[index];

  state.deliveryAddress = chosen;
  state.selectedAddressId = chosen.id || null;

  const flatInput = document.getElementById('cust-setting-flat');
  const bldgInput = document.getElementById('cust-setting-building');
  const streetInput = document.getElementById('cust-setting-street');
  const lmarkInput = document.getElementById('cust-setting-landmark');
  const cityInput = document.getElementById('cust-setting-city');

  if (flatInput) flatInput.value = chosen.flat || '';
  if (bldgInput) bldgInput.value = chosen.building || '';
  if (streetInput) streetInput.value = chosen.street || '';
  if (lmarkInput) lmarkInput.value = chosen.landmark || '';
  const defaultCity = (typeof getStoreConfig === 'function' ? (getStoreConfig().city || '') : '');
  if (cityInput) cityInput.value = chosen.city || defaultCity;

  setCustomerAddressTag(chosen.tag || chosen.type || 'Home');
  saveCustomerProfileSettings();

  try {
    localStorage.setItem('Rasoee_address', JSON.stringify(chosen));
    localStorage.setItem('Rasoee_current_user', JSON.stringify(state.currentUser));
    if (state.currentUser?.phone && typeof syncCustomerToCloud === 'function') {
      syncCustomerToCloud(state.currentUser);
    }
  } catch (e) {}

  renderSelectedAddressInDrawer();
  updateCheckoutButtonText();
  renderSavedAddressesModalList();
}

function addNewAddressSlot() {
  if (typeof closeAccountDrawer === 'function') {
    closeAccountDrawer();
  }
  openAddressPickerModalForNew();
}

function saveCustomerProfileSettings() {
  const nameInput = document.getElementById('cust-setting-name');
  const emailInput = document.getElementById('cust-setting-email');
  const flatInput = document.getElementById('cust-setting-flat');
  const bldgInput = document.getElementById('cust-setting-building');
  const streetInput = document.getElementById('cust-setting-street');
  const lmarkInput = document.getElementById('cust-setting-landmark');
  const cityInput = document.getElementById('cust-setting-city');
  const instSelect = document.getElementById('cust-setting-instruction');

  const defaultCity = (typeof getStoreConfig === 'function' ? (getStoreConfig().city || '') : '');
  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const flat = flatInput ? flatInput.value.trim() : '';
  const building = bldgInput ? bldgInput.value.trim() : '';
  const street = streetInput ? streetInput.value.trim() : '';
  const landmark = lmarkInput ? lmarkInput.value.trim() : '';
  const city = cityInput ? cityInput.value.trim() : defaultCity;
  const instruction = instSelect ? instSelect.value : 'Leave at door & ring bell';
  const tag = currentSelectedAddressTag || 'Home';

  if (!name) {
    alert("Please enter customer name.");
    nameInput?.focus();
    return;
  }
  if (!flat || !street) {
    alert("Please enter flat/house and street for delivery.");
    if (!flat) flatInput?.focus();
    else streetInput?.focus();
    return;
  }

  // Ensure current user session exists
  if (!state.currentUser) {
    state.currentUser = {
      id: 'usr_' + Date.now().toString().slice(-6),
      name: name,
      phone: state.deliveryAddress.phone || '9876543210',
      email: email,
      createdAt: new Date().toISOString()
    };
  }

  state.currentUser.name = name;
  state.currentUser.email = email;
  state.currentUser.instruction = instruction;
  state.currentUser.address = {
    flat: flat,
    building: building,
    street: street,
    landmark: landmark,
    city: city,
    tag: tag
  };

  // Maintain saved addresses list
  if (!Array.isArray(state.currentUser.savedAddresses)) {
    state.currentUser.savedAddresses = [];
  }
  let primaryFound = false;
  state.currentUser.savedAddresses.forEach(a => {
    if (a.isDefault) {
      a.flat = flat;
      a.building = building;
      a.street = street;
      a.landmark = landmark;
      a.city = city;
      a.type = tag;
      primaryFound = true;
    }
  });
  if (!primaryFound) {
    state.currentUser.savedAddresses.unshift({
      type: tag,
      flat: flat,
      building: building,
      street: street,
      landmark: landmark,
      city: city,
      isDefault: true
    });
  }

  // Save to localStorage
  localStorage.setItem('Rasoee_current_user', JSON.stringify(state.currentUser));

  // Update in Rasoee_users database
  let users = [];
  try {
    users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]');
  } catch (e) {
    users = [];
  }
  const uIdx = users.findIndex(u => u.phone === state.currentUser.phone);
  if (uIdx >= 0) {
    users[uIdx] = { ...users[uIdx], ...state.currentUser };
  } else {
    users.push(state.currentUser);
  }
  localStorage.setItem('Rasoee_users', JSON.stringify(users));

  // Sync to checkout delivery address
  state.deliveryAddress.name = name;
  state.deliveryAddress.phone = state.currentUser.phone;
  state.deliveryAddress.flat = flat;
  state.deliveryAddress.street = street;
  state.deliveryAddress.landmark = landmark;
  state.deliveryAddress.city = city;
  localStorage.setItem('Rasoee_address', JSON.stringify(state.deliveryAddress));

  // Sync to cart checkout inputs
  const nameInp = document.getElementById('addr-name');
  const phoneInp = document.getElementById('addr-phone');
  const flatInp = document.getElementById('addr-flat');
  const streetInp = document.getElementById('addr-street');
  const lmarkInp = document.getElementById('addr-landmark');
  if (nameInp) nameInp.value = name;
  if (phoneInp) phoneInp.value = state.currentUser.phone;
  if (flatInp) flatInp.value = flat;
  if (streetInp) streetInp.value = street;
  if (lmarkInp) lmarkInp.value = landmark;

  // Update UI headers
  updateHeaderUserUI();

  const drawerName = document.getElementById('account-user-name');
  const drawerPhone = document.getElementById('account-user-phone');
  const drawerAddr = document.getElementById('account-user-address');
  if (drawerName) drawerName.textContent = name;
  if (drawerPhone) drawerPhone.textContent = `+91 ${state.currentUser.phone}`;
  if (drawerAddr) drawerAddr.textContent = `${flat}, ${street}`;

  // Sync to Cloud
  if (typeof syncToCloud === 'function') {
    syncToCloud();
  }

  // Render updated list
  renderSavedAddressesList();

  // Show success toast
  const successMsg = document.getElementById('settings-save-success-msg');
  if (successMsg) {
    successMsg.classList.remove('hidden');
    setTimeout(() => successMsg.classList.add('hidden'), 3500);
  }
}

function renderAccountOrders() {
  const container = document.getElementById('account-orders-container');
  if (!container) return;

  let allOrders = [];
  try {
    allOrders = JSON.parse(localStorage.getItem('Rasoee_orders') || '[]');
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
        <p class="text-[11px] text-gray-400">Order fresh groceries delivered to your doorstep!</p>
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
    if (status.toLowerCase().includes('cancel')) statusBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-black';

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
    allOrders = JSON.parse(localStorage.getItem('Rasoee_orders') || '[]');
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

  localStorage.setItem('Rasoee_cart', JSON.stringify(state.cart));
  if (state.currentUser && state.currentUser.phone && typeof syncCartToCloud === 'function') {
    syncCartToCloud(state.currentUser.phone, state.cart);
  }
  refreshAllCartButtons();
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
    allOrders = JSON.parse(localStorage.getItem('Rasoee_orders') || '[]');
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
  if (receiptCompanyEl) receiptCompanyEl.textContent = cfg.companyName || cfg.storeName || 'Rasoee Fresh Retail Pvt Ltd';

  const receiptOutletNameEl = document.getElementById('receipt-outlet-name');
  if (receiptOutletNameEl) receiptOutletNameEl.textContent = cfg.outletName || 'Rasoee Fresh - Main Store Outlet';

  const receiptOutletAddrEl = document.getElementById('receipt-outlet-address');
  if (receiptOutletAddrEl) receiptOutletAddrEl.textContent = cfg.storeAddress || (cfg.outletName || 'Rasoee Fresh Supermarket');

  const receiptGstinEl = document.getElementById('receipt-gstin');
  if (receiptGstinEl) receiptGstinEl.textContent = cfg.gstin || '29ABCDE1234F1Z5';

  const receiptFssaiEl = document.getElementById('receipt-fssai');
  if (receiptFssaiEl) receiptFssaiEl.textContent = cfg.fssaiNumber || '11223344000123';

  const receiptFooterNoteEl = document.getElementById('receipt-footer-note');
  if (receiptFooterNoteEl) receiptFooterNoteEl.textContent = cfg.invoiceFooterNote || 'Thank you for shopping with Rasoee Fresh! Freshness guaranteed.';

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
  const sLower = (order.status || 'Confirmed').toLowerCase();
  if (statusEl) {
    if (sLower.includes('cancel')) {
      statusEl.textContent = 'Cancelled ✕';
      statusEl.className = 'bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-black px-2.5 py-0.5 rounded-full';
    } else if (sLower.includes('deliver')) {
      statusEl.textContent = 'Delivered ✓';
      statusEl.className = 'bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-black px-2.5 py-0.5 rounded-full';
    } else {
      statusEl.textContent = order.status || 'Confirmed';
      statusEl.className = 'bg-green-100 text-green-800 border border-green-200 text-[11px] font-black px-2.5 py-0.5 rounded-full';
    }
  }

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
              <img src="${item.product?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'}" class="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100 p-0.5 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'" />
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
    allOrders = JSON.parse(localStorage.getItem('Rasoee_orders') || '[]');
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
  const etaTimer = document.getElementById('track-eta-timer');
  const riderContainer = document.getElementById('track-modal-rider-container');

  if (orderIdEl) orderIdEl.textContent = `#${order.id}`;
  if (totalEl) totalEl.textContent = `₹${order.total}`;
  if (payBadge) {
    payBadge.textContent = order.payment ? order.payment.status : 'Confirmed';
  }
  if (fullScreenLink) {
    fullScreenLink.href = `track.html?orderId=${order.id}`;
  }
  if (itemsEl) {
    itemsEl.innerHTML = (order.items || []).map(i => `
      <div class="text-xs text-gray-600 flex justify-between py-1">
        <span>${escapeHtml(i.product?.name || i.name || 'Item')} × ${i.qty}</span>
        <span class="font-bold text-gray-900">₹${i.total}</span>
      </div>
    `).join('');
  }

  // Update status stepper based on order.status
  const status = (order.status || 'Confirmed').toLowerCase();
  applyTrackingStepHighlights(status);

  // Status milestone badge (no fake countdown)
  if (etaTimer) {
    if (status.includes('cancel')) {
      etaTimer.textContent = "Order Cancelled ✕";
      etaTimer.className = "bg-rose-600 text-white px-2.5 py-0.5 rounded-lg text-xs font-black uppercase";
    } else if (status.includes('deliver') && !status.includes('out')) {
      etaTimer.textContent = "Delivered ✓";
      etaTimer.className = "bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg text-xs font-black uppercase";
    } else if (status.includes('out') || status.includes('dispatched')) {
      etaTimer.textContent = "Out for Delivery";
      etaTimer.className = "bg-purple-600 text-white px-2.5 py-0.5 rounded-lg text-xs font-black uppercase";
    } else if (status.includes('pack')) {
      etaTimer.textContent = "Packing Items";
      etaTimer.className = "bg-blue-600 text-white px-2.5 py-0.5 rounded-lg text-xs font-black uppercase";
    } else {
      etaTimer.textContent = "Order Confirmed";
      etaTimer.className = "bg-blinkit-yellow text-blinkit-dark px-2.5 py-0.5 rounded-lg text-xs font-black uppercase";
    }
  }

  // Dynamic Rider Allotment Card or Cancellation Notice
  if (riderContainer) {
    if (status.includes('cancel')) {
      riderContainer.innerHTML = `
        <div class="bg-rose-50 rounded-2xl p-3.5 border border-rose-200 flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl font-black">
            ✕
          </div>
          <div>
            <div class="text-xs font-black text-rose-900">Order Cancelled by Supermarket</div>
            <div class="text-[10px] text-rose-700 font-medium mt-0.5">This order was cancelled by the store/operator. If you made any payment, full refund will be credited back.</div>
          </div>
        </div>
      `;
    } else if (order.rider && order.rider.name) {
      const rName = escapeHtml(order.rider.name);
      const rPhone = escapeHtml(order.rider.phone || '');
      riderContainer.innerHTML = `
        <div class="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl shadow-inner">
              🚴
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-black text-gray-800">${rName}</span>
                <span class="bg-yellow-100 text-yellow-800 text-[9px] font-bold px-1.5 py-0.5 rounded">Allotted Partner</span>
              </div>
              <div class="text-[10px] text-gray-500 font-semibold">${rPhone ? '+91 ' + rPhone : 'Rasoee Store Delivery Partner'}</div>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            ${rPhone ? `
              <a href="tel:+91${rPhone}" class="w-8 h-8 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-xs shadow-xs" title="Call Rider">📞</a>
              <button onclick="openWhatsAppChat('Hi ${rName}, checking on my live supermarket order #${order.id}')" class="w-8 h-8 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center text-xs active:scale-95 shadow-xs" title="WhatsApp Rider">💬</button>
            ` : ''}
          </div>
        </div>
      `;

      const step3Desc = document.getElementById('track-step-3-desc');
      if (step3Desc) step3Desc.textContent = `Partner ${rName} assigned for doorstep delivery`;
    } else {
      riderContainer.innerHTML = `
        <div class="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shadow-inner">
            🛵
          </div>
          <div>
            <div class="text-xs font-black text-gray-800">Delivery Partner Allocation</div>
            <div class="text-[10px] text-gray-500">Store operator is packing your items. Partner will be allotted once packed.</div>
          </div>
        </div>
      `;
    }
  }
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

  if (status.includes('cancel')) {
    setNode(step1, true);
    setNode(step2, false);
    setNode(step3, false);
    setNode(step4, false);
    setNode(step5, false);
    if (step1) {
      const dot = step1.querySelector('span');
      const title = step1.querySelector('div:first-of-type');
      if (dot) dot.className = "absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-rose-600 border-2 border-white ring-2 ring-rose-200";
      if (title) title.innerHTML = `<span class="text-xs font-black text-rose-600">Order Cancelled by Store ✕</span>`;
    }
  } else if (status.includes('deliver') && !status.includes('out')) {
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
  if (window.trackInterval) clearInterval(window.trackInterval);

  // Poll cloud orders every 4s to track live status & rider updates
  window.trackInterval = setInterval(async () => {
    if (!state.currentTrackingOrder) return;
    try {
      if (typeof fetchOrdersFromCloud === 'function') {
        const cloudOrders = await fetchOrdersFromCloud();
        const updated = (cloudOrders || []).find(o => o.id === state.currentTrackingOrder.id);
        if (updated) {
          state.currentTrackingOrder = updated;
          updateTrackingModalContent(updated);
        }
      }
    } catch (err) {}
  }, 4000);
}

// Cross-Tab Live Synchronization for Real-Time Order Status
function setupCrossTabSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'Rasoee_orders') {
      if (state.currentTrackingOrder) {
        let orders = [];
        try {
          orders = JSON.parse(localStorage.getItem('Rasoee_orders') || '[]');
        } catch (err) {}
        const updated = orders.find(o => o.id === state.currentTrackingOrder.id);
        if (updated) {
          state.currentTrackingOrder = updated;
          updateTrackingModalContent(updated);
        }
      }
      renderAccountOrders();
    } else if (e.key === 'Rasoee_current_user' || e.key === 'Rasoee_address') {
      try {
        const u = localStorage.getItem('Rasoee_current_user');
        state.currentUser = u ? normalizeCustomerData(JSON.parse(u)) : null;
        updateHeaderUserUI();
        populateAddressFormInputs();
      } catch (err) {}
    } else if (e.key === 'Rasoee_banners' || e.key === 'rasoee_banners' || e.key === 'raosee_banners' || !e.key) {
      renderBanners();
    } else if (e.key === 'Rasoee_fresh_config') {
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
    let orders = JSON.parse(localStorage.getItem('Rasoee_orders') || '[]');
    orders.unshift(order);
    if (orders.length > 30) orders = orders.slice(0, 30);
    localStorage.setItem('Rasoee_orders', JSON.stringify(orders));

    // Also register or update customer in Rasoee_users directory for Admin
    if (order.customer && order.customer.phone) {
      const normCustomer = normalizeCustomerData(order.customer);
      let users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]');
      const existingIdx = users.findIndex(u => u.phone === normCustomer.phone);
      if (existingIdx >= 0) {
        users[existingIdx] = {
          ...users[existingIdx],
          ...normCustomer,
          orderCount: (users[existingIdx].orderCount || 0) + 1,
          lastOrderDate: new Date().toISOString(),
          totalSpend: (users[existingIdx].totalSpend || 0) + (order.total || 0)
        };
      } else {
        users.push({
          ...normCustomer,
          lastOrderDate: new Date().toISOString(),
          orderCount: 1,
          totalSpend: order.total || 0
        });
      }
      localStorage.setItem('Rasoee_users', JSON.stringify(users));

      // Permanently sync customer profile to Cloud RTDB
      if (typeof syncCustomerToCloud === 'function') {
        syncCustomerToCloud(normCustomer);
      }
    }

    // Real-time Cloud RTDB sync for multi-device Operator, Admin & Customer profile
    if (typeof syncOrderToCloud === 'function') {
      syncOrderToCloud(order);
    }
  } catch (e) {
    console.warn("Could not save order", e);
  }
}

// Search & Placeholder rotation
function setupSearchPlaceholderRotation() {
  const mobInput = document.getElementById('search-input');
  const deskInput = document.getElementById('search-input-desktop');
  if (!mobInput && !deskInput) return;

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
    idx = (idx + 1) % placeholders.length;
    const placeholder = placeholders[idx];
    if (mobInput && document.activeElement !== mobInput && mobInput.value === '') {
      mobInput.setAttribute('placeholder', placeholder);
    }
    if (deskInput && document.activeElement !== deskInput && deskInput.value === '') {
      deskInput.setAttribute('placeholder', placeholder);
    }
  }, 3000);
}

// Search synchronization & clearing
function handleSearchSync(val) {
  state.searchQuery = (val || '').trimStart();
  const mob = document.getElementById('search-input');
  const desk = document.getElementById('search-input-desktop');
  const mobClear = document.getElementById('search-clear-btn');
  const deskClear = document.getElementById('search-clear-desktop-btn');

  if (mob && mob.value !== state.searchQuery) mob.value = state.searchQuery;
  if (desk && desk.value !== state.searchQuery) desk.value = state.searchQuery;

  if (mobClear) mobClear.classList.toggle('hidden', !state.searchQuery);
  if (deskClear) deskClear.classList.toggle('hidden', !state.searchQuery);

  renderProducts();
}

function clearSearchInput() {
  handleSearchSync('');
  const mob = document.getElementById('search-input');
  const desk = document.getElementById('search-input-desktop');
  if (mob) mob.value = '';
  if (desk) desk.value = '';
}

// Event Listeners
function setupEventListeners() {
  const mobInput = document.getElementById('search-input');
  if (mobInput) {
    mobInput.addEventListener('input', (e) => handleSearchSync(e.target.value));
  }
  const deskInput = document.getElementById('search-input-desktop');
  if (deskInput) {
    deskInput.addEventListener('input', (e) => handleSearchSync(e.target.value));
  }

  // Proactively populate address form inputs on startup
  populateAddressFormInputs();

  const inputs = ['addr-name', 'addr-phone', 'addr-flat', 'addr-street', 'addr-landmark', 'addr-notes'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const key = id.replace('addr-', '');
      const handleInputChange = () => {
        if (key === 'notes') {
          state.deliveryAddress.instructions = el.value.trim();
        } else {
          state.deliveryAddress[key] = el.value.trim();
        }
        localStorage.setItem('Rasoee_address', JSON.stringify(state.deliveryAddress));
      };

      el.addEventListener('input', handleInputChange);
      el.addEventListener('change', handleInputChange);

      // Realtime Customer Profile Lookup on Mobile Number (Instant auto-fill across devices)
      if (id === 'addr-phone') {
        const handlePhoneLookup = async () => {
          const rawPhone = el.value.replace(/\D/g, '').slice(-10);
          if (rawPhone.length === 10) {
            // 1. Instant local lookup in Rasoee_users
            try {
              const users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]');
              const matched = users.find(u => u.phone === rawPhone);
              if (matched) {
                const norm = normalizeCustomerData(matched);
                if (norm && norm.flat) {
                  populateAddressFormInputs(norm);
                  if (!state.currentUser) {
                    state.currentUser = norm;
                    localStorage.setItem('Rasoee_current_user', JSON.stringify(norm));
                    updateHeaderUserUI();
                  }
                  return;
                }
              }
            } catch (err) {}

            // 2. Realtime Cloud RTDB lookup across devices
            if (typeof fetchCustomerFromCloud === 'function') {
              try {
                const cloudCust = await fetchCustomerFromCloud(rawPhone);
                if (cloudCust && (cloudCust.flat || cloudCust.name || cloudCust.street)) {
                  const norm = normalizeCustomerData(cloudCust);
                  if (norm) {
                    populateAddressFormInputs(norm);
                    if (!state.currentUser) {
                      state.currentUser = norm;
                      localStorage.setItem('Rasoee_current_user', JSON.stringify(norm));
                      updateHeaderUserUI();
                    }
                  }
                }
              } catch (err) {}
            }
          }
        };

        el.addEventListener('input', handlePhoneLookup);
        el.addEventListener('blur', handlePhoneLookup);
        el.addEventListener('change', handlePhoneLookup);
      }
    }
  });

  // Modal OTP inputs auto-advance, backspace navigation, paste handling, and Enter submit
  const otpInputs = document.querySelectorAll('.modal-otp-digit');
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val ? val.slice(-1) : '';
      if (e.target.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
      } else if (e.key === 'Enter') {
        handleModalVerifyOtp();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      if (text) {
        for (let i = 0; i < otpInputs.length; i++) {
          otpInputs[i].value = text[i] || '';
        }
        if (text.length >= otpInputs.length || text.length >= 4) {
          const targetIndex = Math.min(text.length - 1, otpInputs.length - 1);
          if (otpInputs[targetIndex]) otpInputs[targetIndex].focus();
          setTimeout(handleModalVerifyOtp, 150);
        } else if (otpInputs[text.length]) {
          otpInputs[text.length].focus();
        }
      }
    });
  });
}

function checkUrlParamsForTracking() {
  const urlParams = new URLSearchParams(window.location.search);
  const trackId = urlParams.get('track');
  if (trackId) {
    const orders = JSON.parse(localStorage.getItem('Rasoee_orders') || '[]');
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

// ================= MULTI-DEVICE LIVE CART SYNCHRONIZATION =================
function refreshAllCartButtons() {
  if (!state.products || !Array.isArray(state.products)) return;
  state.products.forEach(p => {
    const btn = document.getElementById(`btn-container-${p.id}`);
    if (btn) {
      btn.innerHTML = renderCartButton(p.id, state.cart[p.id] || 0);
    }
  });
}

let isSyncingCartFromCloud = false;
async function pullCloudCartAndRefresh() {
  if (isSyncingCartFromCloud) return;
  if (!state.currentUser || !state.currentUser.phone || typeof fetchCartFromCloud !== 'function') return;
  isSyncingCartFromCloud = true;
  try {
    const cloudCart = await fetchCartFromCloud(state.currentUser.phone);
    if (cloudCart && typeof cloudCart === 'object') {
      const currentCartStr = JSON.stringify(state.cart || {});
      const cloudCartStr = JSON.stringify(cloudCart);
      if (currentCartStr !== cloudCartStr) {
        state.cart = cloudCart;
        localStorage.setItem('Rasoee_cart', JSON.stringify(state.cart));
        refreshAllCartButtons();
        updateCartUI();
      }
    }
  } catch (e) {
  } finally {
    isSyncingCartFromCloud = false;
  }
}

// Window focus & tab visibility change: sync immediately
window.addEventListener('focus', pullCloudCartAndRefresh);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    pullCloudCartAndRefresh();
  }
});

// Periodic background check every 15 seconds for multi-device sync
setInterval(pullCloudCartAndRefresh, 15000);
