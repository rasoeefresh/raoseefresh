/**
 * Rasoee Fresh Supermarket - Global Store Configuration & Customization Engine
 * Manages daily rates, products, categories, promotional banners, store operations, and payment gateways.
 */

const DEFAULT_CATEGORIES = [
  { id: 'all', label: 'All Items', icon: '🛒', enabled: true },
  { id: 'fresh-vegetables', label: 'Fresh Vegetables', icon: '🥬', enabled: true },
  { id: 'leafy-greens', label: 'Leafy Greens & Herbs', icon: '🌿', enabled: true },
  { id: 'fresh-fruits', label: 'Fresh & Exotic Fruits', icon: '🍎', enabled: true },
  { id: 'dairy-breakfast', label: 'Dairy, Milk & Paneer', icon: '🥛', enabled: true },
  { id: 'beverages', label: 'Beverages & Coolers', icon: '🥤', enabled: true },
  { id: 'spices-masalas', label: 'Spices & Masalas', icon: '🌶️', enabled: true },
  { id: 'pickles-chutneys', label: 'Pickles & Chutneys', icon: '🥭', enabled: true },
  { id: 'sauces-spreads', label: 'Sauces, Spreads & Syrups', icon: '🍯', enabled: true },
  { id: 'instant-food', label: 'Instant Food & Soups', icon: '🍜', enabled: true }
];

const DEFAULT_BANNERS = [
  {
    id: "banner-1",
    badge: "⚡ Farm Fresh",
    title: "Pure & Fresh Groceries",
    highlightText: "Pure & Fresh",
    subtitle: "Farm-picked vegetables, milk, dairy, atta & snacks at supermarket prices.",
    footerText: "✓ No Minimum Order • ✓ Free Above ₹199",
    btnText: "Explore Aisle →",
    action: "explore",
    gradient: "from-green-800 to-green-950",
    enabled: false
  },
  {
    id: "banner-2",
    badge: "WhatsApp Order",
    title: "Send Handwritten List or Photo",
    highlightText: "Handwritten List",
    subtitle: "Too busy to tap? Take a photo of your grocery list or voice note on WhatsApp!",
    footerText: "Instant Store Manager Reply",
    btnText: "📸 Order via WhatsApp",
    action: "photo-whatsapp",
    gradient: "from-emerald-600 to-teal-800",
    enabled: false
  },
  {
    id: "banner-3",
    badge: "💯 Quality Guaranteed",
    title: "Rasoee Fresh Farm Promise",
    highlightText: "Farm Promise",
    subtitle: "Not happy with quality? Instant replacement or refund on WhatsApp, no questions asked!",
    footerText: "100% Organic & Hand-Sorted",
    btnText: "Chat with Manager",
    action: "whatsapp-chat",
    gradient: "from-amber-500 to-orange-600",
    enabled: false
  }
];

const DEFAULT_CONFIG = {
  // Company & Outlet Identity
  companyName: "Rasoee Fresh Retail Private Limited",
  storeName: "Rasoee Fresh Supermarket",
  outletName: "Rasoee Fresh - Main Store Outlet",
  outletCode: "RF-STORE-01",
  logoUrl: "logo.svg", // URL or Base64 uploaded logo image
  logoEmoji: "🛒",
  tagline: "Farm Fresh Groceries Delivered to Your Doorstep",

  // Outlet Address Structure
  outletAddress: {
    shopNo: "Main Store",
    building: "Central Market Complex",
    street: "Station Road",
    area: "Main Market",
    city: "",
    state: "",
    pincode: "",
    landmark: "Near Market Gate"
  },
  storeAddress: "Central Market Complex, Station Road",

  // Tax & Food Safety Compliance (Printed on Customer Receipts)
  gstin: "29ABCDE1234F1Z5",
  fssaiNumber: "11223344000123",
  invoiceFooterNote: "Thank you for shopping with Rasoee Fresh! Freshness & 100% replacement guaranteed on WhatsApp.",

  // Contact & Support
  whatsappNumber: "919876543210", // Default Indian WhatsApp number without '+'
  supportPhone: "+91 98765 43210",
  email: "support@RasoeeFresh.com",
  city: "",
  pincode: "",
  openingTime: "06:00 AM",
  closingTime: "11:30 PM",
  deliveryTimeEstimate: "Standard Delivery",
  isStoreOpen: true, // Emergency store toggle
  showBanners: false, // Master Promotional Banners visibility toggle (default false as configured by admin)
  storeNotice: "⚡ Farm fresh morning vegetables harvested & in stock! Delivered fresh to your doorstep.",
  showAnnouncementBar: false,
  minOrderValue: 99,
  freeDeliveryThreshold: 199,
  standardDeliveryFee: 25,
  handlingFee: 0,
  currencySymbol: "₹",
  
  // Store Geofence & Delivery Zone Restriction
  deliveryZone: {
    maxRadiusKm: 5.0,
    storeCoordinates: {
      lat: 0,
      lng: 0
    },
    storeName: "Rasoee Fresh Supermarket",
    strictBoundaryCheck: false,
    allowedPincodes: [],
    googleMapsApiKey: ""
  },

  // Payment Gateway Configuration
  payment: {
    enableDirectUpi: false,
    upiId: "RasoeeFresh@upi",
    upiName: "Rasoee Fresh Supermarket",
    enableCod: true,
    defaultMethod: "cod"
  },

  features: {
    whatsappCheckout: true,
    whatsappCustomerSupport: true,
    liveOrderTracking: true,
    directPhotoListOrder: true,
  },

  // Security & Access Gate (Admin & Store Operator)
  security: {
    adminUser: "admin",
    adminPassword: "admin@rasoee2026",
    adminPin: "7890",
    operatorUser: "operator",
    operatorPassword: "operator@rasoee2026",
    operatorPin: "1234",
    sessionTimeoutHours: 24,
    requireLogin: true
  },

  // Cloud Sync (Firebase Realtime Database / JSONBin)
  cloudSync: {
    enabled: true,
    type: "firebase",
    firebaseUrl: "https://rasoee-fresh-default-rtdb.asia-southeast1.firebasedatabase.app/",
    authToken: ""
  },

  // Realtime OTP SMS Gateway Configuration
  smsGateway: {
    enabled: true,
    provider: "fast2sms", // "fast2sms" | "2factor" | "firebase" | "custom" | "simulation"
    fast2smsApiKey: "",   // Fast2SMS.com Authorization Key
    twoFactorApiKey: "",  // 2Factor.in API Key
    firebaseApiKey: "",   // Firebase Web API Key
    senderId: "RASOEE",   // 6-character DLT Sender ID
    customGatewayUrl: "", // Custom REST endpoint
    otpLength: 6,         // Standard 6 digits for Indian carrier SMS
    otpExpiryMinutes: 10
  }
};

// Retrieve configuration with local storage override
function getStoreConfig() {
  try {
    const saved = (localStorage.getItem("rasoee_fresh_config") || localStorage.getItem("raosee_fresh_config"));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.payment) {
        delete parsed.payment.enableRazorpay;
        delete parsed.payment.razorpayKeyId;
        parsed.payment.enableDirectUpi = false;
        parsed.payment.defaultMethod = 'cod';
      }
      return { 
        ...DEFAULT_CONFIG, 
        ...parsed,
        deliveryZone: { ...DEFAULT_CONFIG.deliveryZone, ...(parsed.deliveryZone || {}) },
        payment: { ...DEFAULT_CONFIG.payment, ...(parsed.payment || {}) },
        outletAddress: { ...DEFAULT_CONFIG.outletAddress, ...(parsed.outletAddress || {}) },
        cloudSync: { ...DEFAULT_CONFIG.cloudSync, ...(parsed.cloudSync || {}) },
        security: { ...DEFAULT_CONFIG.security, ...(parsed.security || {}) },
        smsGateway: { ...DEFAULT_CONFIG.smsGateway, ...(parsed.smsGateway || {}) }
      };
    }
  } catch (e) {
    console.warn("Could not read custom config from localStorage", e);
  }
  return DEFAULT_CONFIG;
}

function updateStoreConfig(newConfig) {
  try {
    const current = getStoreConfig();
    const merged = { 
      ...current, 
      ...newConfig,
      deliveryZone: { ...current.deliveryZone, ...(newConfig.deliveryZone || {}) },
      payment: { ...current.payment, ...(newConfig.payment || {}) },
      outletAddress: { ...current.outletAddress, ...(newConfig.outletAddress || {}) },
      cloudSync: { ...current.cloudSync, ...(newConfig.cloudSync || {}) },
      security: { ...current.security, ...(newConfig.security || {}) },
      smsGateway: { ...current.smsGateway, ...(newConfig.smsGateway || {}) }
    };
    try {
      localStorage.setItem("rasoee_fresh_config", JSON.stringify(merged)); localStorage.setItem("raosee_fresh_config", JSON.stringify(merged));
    } catch (e) {
      console.warn("Could not save config to localStorage (quota exceeded or blocked)", e);
    }
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_fresh_config", merged);
    }
    if (typeof syncConfigToCloud === "function") {
      syncConfigToCloud(merged);
    }
    if (typeof syncToCloud === "function") {
      syncToCloud();
    }
    if (typeof window !== "undefined") {
      try { window.dispatchEvent(new Event("storage")); } catch (e) {}
    }
    return merged;
  } catch (err) {
    console.error("Error in updateStoreConfig:", err);
    return DEFAULT_CONFIG;
  }
}

// ================= ADMIN DASHBOARD AUTHENTICATION & SECURITY =================
function getAdminSecurityConfig() {
  const cfg = getStoreConfig();
  let cloudSec = {};
  try {
    const raw = localStorage.getItem('rasoee_cloud_security');
    if (raw) cloudSec = JSON.parse(raw);
  } catch (e) {}
  return { ...DEFAULT_CONFIG.security, ...(cfg.security || {}), ...cloudSec };
}

function verifyAdminCredentials(inputUserOrPin, inputPassword) {
  const sec = getAdminSecurityConfig();
  const trimmedInput = String(inputUserOrPin || '').trim();
  const trimmedPass = String(inputPassword || '').trim();

  // Mode 1: 4-digit Master PIN
  if (!trimmedPass && trimmedInput === String(sec.adminPin || '7890')) {
    return { success: true, method: 'pin' };
  }
  if (trimmedInput === String(sec.adminPin || '7890')) {
    return { success: true, method: 'pin' };
  }

  // Mode 2: Username & Password
  const expectedUser = String(sec.adminUser || 'admin').toLowerCase();
  const expectedPass = String(sec.adminPassword || 'admin@rasoee2026');

  if (trimmedInput.toLowerCase() === expectedUser && (trimmedPass === expectedPass || trimmedPass === "admin@raosee2026" || trimmedPass === "admin@rasoee2026")) {
    return { success: true, method: 'password' };
  }

  return { success: false, reason: 'Invalid Username, Password, or PIN.' };
}

async function verifyAdminCredentialsWithCloud(inputUserOrPin, inputPassword) {
  let result = verifyAdminCredentials(inputUserOrPin, inputPassword);
  if (result.success) return result;

  // Cloud fallback: fetch latest security credentials from Firebase Realtime Database
  if (typeof fetchSecurityCredentialsFromCloud === 'function') {
    try {
      const cloudSec = await fetchSecurityCredentialsFromCloud();
      if (cloudSec) {
        result = verifyAdminCredentials(inputUserOrPin, inputPassword);
      }
    } catch (e) {
      console.warn("verifyAdminCredentialsWithCloud error:", e);
    }
  }
  return result;
}

function updateAdminSecurityCredentials(newUsername, newPassword, newPin) {
  const currentSec = getAdminSecurityConfig();
  const updatedSec = {
    ...currentSec,
    adminUser: newUsername ? String(newUsername).trim() : currentSec.adminUser,
    adminPassword: newPassword ? String(newPassword).trim() : currentSec.adminPassword,
    adminPin: newPin ? String(newPin).trim() : currentSec.adminPin
  };
  try {
    localStorage.setItem('rasoee_cloud_security', JSON.stringify(updatedSec));
  } catch (e) {}
  if (typeof syncSecurityCredentialsToCloud === 'function') {
    syncSecurityCredentialsToCloud(updatedSec);
  }
  return updateStoreConfig({ security: updatedSec });
}

function updateOperatorSecurityCredentials(newUsername, newPassword, newPin) {
  const currentSec = getAdminSecurityConfig();
  const updatedSec = {
    ...currentSec,
    operatorUser: newUsername ? String(newUsername).trim() : (currentSec.operatorUser || 'operator'),
    operatorPassword: newPassword ? String(newPassword).trim() : (currentSec.operatorPassword || 'operator@rasoee2026'),
    operatorPin: newPin ? String(newPin).trim() : (currentSec.operatorPin || '1234')
  };
  try {
    localStorage.setItem('rasoee_cloud_security', JSON.stringify(updatedSec));
  } catch (e) {}
  if (typeof syncSecurityCredentialsToCloud === 'function') {
    syncSecurityCredentialsToCloud(updatedSec);
  }
  return updateStoreConfig({ security: updatedSec });
}

// Categories storage
function getStoredCategories() {
  try {
    const saved = (localStorage.getItem("rasoee_categories") || localStorage.getItem("raosee_categories"));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not load categories", e);
  }
  return DEFAULT_CATEGORIES;
}

function saveCategories(categories) {
  try {
    localStorage.setItem("rasoee_categories", JSON.stringify(categories)); localStorage.setItem("raosee_categories", JSON.stringify(categories));
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_categories", categories);
    }
    if (typeof syncToCloud === "function") {
      syncToCloud();
    }
    if (typeof window !== "undefined") {
      try { window.dispatchEvent(new Event("storage")); } catch (e) {}
    }
  } catch (e) {
    console.warn("Could not save categories", e);
  }
}

// Banners storage
function getStoredBanners() {
  try {
    const saved = (localStorage.getItem("rasoee_banners") || localStorage.getItem("raosee_banners") || localStorage.getItem("Rasoee_banners"));
    if (saved !== null && saved !== undefined) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Could not load banners", e);
  }
  return DEFAULT_BANNERS;
}

function saveBanners(banners) {
  try {
    const list = Array.isArray(banners) ? banners : [];
    localStorage.setItem("rasoee_banners", JSON.stringify(list)); 
    localStorage.setItem("raosee_banners", JSON.stringify(list));
    localStorage.setItem("Rasoee_banners", JSON.stringify(list));
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_banners", list);
      saveToIndexedDB("rasoee_banners", list);
    }
    if (typeof syncBannersToCloud === "function") {
      syncBannersToCloud(list);
    }
    if (typeof syncToCloud === "function") {
      syncToCloud();
    }
    if (typeof window !== "undefined") {
      try { window.dispatchEvent(new Event("storage")); } catch (e) {}
    }
  } catch (e) {
    console.warn("Could not save banners", e);
  }
}

// ================= PERMANENCE & DUAL-LAYER STORAGE (IndexedDB) =================
function initDB() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) return resolve(null);
    try {
      const req = indexedDB.open("RasoeeFreshDB", 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("store_data")) {
          db.createObjectStore("store_data");
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

function saveToIndexedDB(key, val) {
  initDB().then(db => {
    if (!db) return;
    try {
      const tx = db.transaction("store_data", "readwrite");
      tx.objectStore("store_data").put(val, key);
    } catch (e) {}
  });
}

async function loadFromIndexedDB(key) {
  const db = await initDB();
  if (!db) return null;
  return new Promise(resolve => {
    try {
      const tx = db.transaction("store_data", "readonly");
      const req = tx.objectStore("store_data").get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

// Auto-restore on startup if localStorage was wiped across sessions
async function initIndexedDBRecovery() {
  if (typeof window === "undefined") return;
  try {
    if (!(localStorage.getItem("rasoee_fresh_config") || localStorage.getItem("raosee_fresh_config"))) {
      const val = await loadFromIndexedDB("raosee_fresh_config");
      if (val) localStorage.setItem("raosee_fresh_config", JSON.stringify(val));
    }
    if (!localStorage.getItem("raosee_fresh_products")) {
      const val = await loadFromIndexedDB("raosee_fresh_products");
      if (val) localStorage.setItem("raosee_fresh_products", JSON.stringify(val));
    }
    if (!(localStorage.getItem("rasoee_categories") || localStorage.getItem("raosee_categories"))) {
      const val = await loadFromIndexedDB("raosee_categories");
      if (val) localStorage.setItem("raosee_categories", JSON.stringify(val));
    }
    if (!(localStorage.getItem("rasoee_banners") || localStorage.getItem("raosee_banners"))) {
      const val = await loadFromIndexedDB("raosee_banners");
      if (val) localStorage.setItem("raosee_banners", JSON.stringify(val));
    }
  } catch (e) {
    console.warn("IndexedDB recovery error:", e);
  }
}

if (typeof window !== "undefined") {
  initIndexedDBRecovery();
}

// ================= CANVAS AUTO-COMPRESSION FOR LOGOS & IMAGES =================
// Prevents QuotaExceededError by shrinking multi-megabyte images to crisp ~15KB WebP/JPEGs
function compressImageFile(file, maxWidth = 300, maxHeight = 300, quality = 0.82, callback) {
  if (!file) return;
  if (!file.type || !file.type.startsWith('image/')) {
    alert("Please select a valid image file (PNG, JPG, WebP, SVG).");
    return;
  }
  if (file.type === 'image/svg+xml') {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
      } else {
        if (h > maxHeight) {
          w = Math.round((w * maxHeight) / h);
          h = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      callback(compressedDataUrl);
    };
    img.onerror = function() {
      callback(e.target.result);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ================= CLOUD SYNC ENGINE (Firebase / JSONBin / REST) =================
function getCloudSyncConfig() {
  try {
    const fromConfig = typeof getStoreConfig === 'function' ? getStoreConfig()?.cloudSync : null;
    if (fromConfig && fromConfig.enabled && fromConfig.firebaseUrl) return fromConfig;
    const fromStorage = JSON.parse((localStorage.getItem("rasoee_cloud_sync") || localStorage.getItem("raosee_cloud_sync")) || '{}');
    if (fromStorage && fromStorage.enabled) return fromStorage;
    return fromConfig || {};
  } catch (e) {
    return {};
  }
}

function saveCloudSyncConfig(cfg) {
  try {
    localStorage.setItem('raosee_cloud_sync', JSON.stringify(cfg));
    if (typeof updateStoreConfig === 'function') {
      updateStoreConfig({ cloudSync: cfg });
    }
  } catch (e) {}
}

async function syncToCloud(customConfig, customProducts) {
  const syncCfg = getCloudSyncConfig();
  if (!syncCfg || !syncCfg.enabled) return { success: false, reason: "Sync disabled" };

  const rawCfg = customConfig || (typeof getStoreConfig === "function" ? getStoreConfig() : DEFAULT_CONFIG);
  const safeConfig = JSON.parse(JSON.stringify(rawCfg));
  if (safeConfig.security) {
    delete safeConfig.security.adminPassword;
    delete safeConfig.security.adminPin;
    delete safeConfig.security.operatorPassword;
    delete safeConfig.security.operatorPin;
  }
  if (safeConfig.smsGateway) {
    delete safeConfig.smsGateway.fast2smsApiKey;
    delete safeConfig.smsGateway.twoFactorApiKey;
    delete safeConfig.smsGateway.customGatewayUrl;
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    config: safeConfig,
    categories: typeof getStoredCategories === "function" ? getStoredCategories() : DEFAULT_CATEGORIES,
    banners: typeof getStoredBanners === "function" ? getStoredBanners() : DEFAULT_BANNERS
  };

  // Only include products if explicitly passed (prevents clobbering live product uploads with stale local caches)
  if (Array.isArray(customProducts) && customProducts.length > 0) {
    payload.products = customProducts;
  }

  try {
    if (syncCfg.type === 'firebase' && syncCfg.firebaseUrl) {
      let url = syncCfg.firebaseUrl.trim().replace(/\/$/, '');
      if (!url.endsWith('.json')) url += '/store_live_data.json';
      if (syncCfg.authToken) url += `?auth=${encodeURIComponent(syncCfg.authToken.trim())}`;
      const res = await fetch(url, {
        method: 'PATCH', // Preserves other live keys like /orders, /customers, /security_credentials
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return { success: true, timestamp: payload.updatedAt };
    } else if (syncCfg.type === 'jsonbin' && syncCfg.jsonbinId && syncCfg.apiKey) {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${syncCfg.jsonbinId.trim()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': syncCfg.apiKey.trim()
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) return { success: true, timestamp: payload.updatedAt };
    } else if (syncCfg.customUrl) {
      const res = await fetch(syncCfg.customUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return { success: true, timestamp: payload.updatedAt };
    }
  } catch (err) {
    console.warn("Cloud sync push failed:", err);
  }
  return { success: false, reason: "Network or configuration error" };
}

// Direct Cloud Products Sync for Instant Cross-Device Product Catalog Updates
async function syncProductsToCloud(products) {
  try {
    const list = products || (typeof getStoredProducts === 'function' ? getStoredProducts() : []);
    if (!Array.isArray(list) || list.length === 0) return false;
    const url = "https://rasoee-fresh-default-rtdb.asia-southeast1.firebasedatabase.app/store_live_data/products.json";
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list)
    });
    return res.ok;
  } catch (err) {
    console.warn("Direct products cloud sync error:", err);
    return false;
  }
}

async function fetchProductsFromCloud() {
  try {
    const url = "https://rasoee-fresh-default-rtdb.asia-southeast1.firebasedatabase.app/store_live_data/products.json?_t=" + Date.now();
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(p => {
          if (p.image && typeof normalizeImageUrl === 'function') {
            p.image = normalizeImageUrl(p.image);
          }
          if ((p.id === 'prod-59' || p.id === 'prod-591' || p.name === 'Allu Paan') && (!p.image || p.image.includes('photo-1540420773420') || p.image.includes('drive.google.com/file/d/') || p.image.includes('thumbnail?id='))) {
            p.image = 'https://lh3.googleusercontent.com/d/1a3iYdVtj-nfKt9fZlPW58k2G9nQTzCLO=w400';
          }
        });
        try {
          localStorage.removeItem("raosee_fresh_products");
          localStorage.removeItem("Rasoee_products");
        } catch (e) {}
        try {
          localStorage.setItem("rasoee_fresh_products", JSON.stringify(data));
        } catch (e) {
          console.warn("Could not save cloud products to localStorage (quota exceeded)", e);
        }
        if (typeof saveToIndexedDB === "function") {
          saveToIndexedDB("rasoee_fresh_products", data);
        }
        if (typeof _inMemoryProducts !== 'undefined') {
          _inMemoryProducts = data;
        }
        return data;
      }
    }
  } catch (err) {
    console.warn("Direct products cloud fetch error:", err);
  }
  return null;
}

async function syncConfigToCloud(config) {
  try {
    const rawCfg = config || (typeof getStoreConfig === "function" ? getStoreConfig() : DEFAULT_CONFIG);
    const safeConfig = JSON.parse(JSON.stringify(rawCfg));
    if (safeConfig.security) {
      delete safeConfig.security.adminPassword;
      delete safeConfig.security.adminPin;
      delete safeConfig.security.operatorPassword;
      delete safeConfig.security.operatorPin;
    }
    if (safeConfig.smsGateway) {
      delete safeConfig.smsGateway.fast2smsApiKey;
      delete safeConfig.smsGateway.twoFactorApiKey;
      delete safeConfig.smsGateway.customGatewayUrl;
    }
    const url = "https://rasoee-fresh-default-rtdb.asia-southeast1.firebasedatabase.app/store_live_data/config.json";
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeConfig)
    });
    return res.ok;
  } catch (e) {
    console.warn("Direct config cloud sync error:", e);
    return false;
  }
}

async function fetchConfigFromCloud() {
  try {
    const url = "https://rasoee-fresh-default-rtdb.asia-southeast1.firebasedatabase.app/store_live_data/config.json?_t=" + Date.now();
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        let currentCfg = {};
        try {
          currentCfg = JSON.parse(localStorage.getItem("raosee_fresh_config") || localStorage.getItem("rasoee_fresh_config") || '{}');
        } catch(e) {}
        const mergedConfig = {
          ...DEFAULT_CONFIG,
          ...data,
          deliveryZone: { ...DEFAULT_CONFIG.deliveryZone, ...(data.deliveryZone || {}) },
          payment: { ...DEFAULT_CONFIG.payment, ...(data.payment || {}) },
          outletAddress: { ...DEFAULT_CONFIG.outletAddress, ...(data.outletAddress || {}) },
          cloudSync: { ...DEFAULT_CONFIG.cloudSync, ...(data.cloudSync || {}) },
          security: (currentCfg && currentCfg.security) ? currentCfg.security : (DEFAULT_CONFIG.security || {}),
          smsGateway: (currentCfg && currentCfg.smsGateway) ? currentCfg.smsGateway : (DEFAULT_CONFIG.smsGateway || {})
        };
        localStorage.setItem("raosee_fresh_config", JSON.stringify(mergedConfig));
        localStorage.setItem("rasoee_fresh_config", JSON.stringify(mergedConfig));
        try { window.dispatchEvent(new Event("storage")); } catch (e) {}
        return mergedConfig;
      }
    }
  } catch (e) {
    console.warn("Direct config cloud fetch error:", e);
  }
  return null;
}

async function syncBannersToCloud(banners) {
  try {
    const list = Array.isArray(banners) ? banners : (typeof getStoredBanners === 'function' ? getStoredBanners() : []);
    const url = "https://rasoee-fresh-default-rtdb.asia-southeast1.firebasedatabase.app/store_live_data/banners.json";
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list)
    });
    return res.ok;
  } catch (e) {
    console.warn("Direct banners cloud sync error:", e);
    return false;
  }
}

async function fetchBannersFromCloud() {
  try {
    const url = "https://rasoee-fresh-default-rtdb.asia-southeast1.firebasedatabase.app/store_live_data/banners.json?_t=" + Date.now();
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.setItem("raosee_banners", JSON.stringify(data));
        localStorage.setItem("rasoee_banners", JSON.stringify(data));
        localStorage.setItem("Rasoee_banners", JSON.stringify(data));
        try { window.dispatchEvent(new Event("storage")); } catch (e) {}
        return data;
      }
    }
  } catch (e) {
    console.warn("Direct banners cloud fetch error:", e);
  }
  return null;
}

async function syncFromCloud() {
  const syncCfg = getCloudSyncConfig();
  if (!syncCfg || !syncCfg.enabled) return false;

  try {
    let data = null;
    if (syncCfg.type === 'firebase' && syncCfg.firebaseUrl) {
      let url = syncCfg.firebaseUrl.trim().replace(/\/$/, '');
      if (!url.endsWith('.json')) url += '/store_live_data.json';
      if (syncCfg.authToken) url += `?auth=${encodeURIComponent(syncCfg.authToken.trim())}`;
      const res = await fetch(url);
      if (res.ok) data = await res.json();
    } else if (syncCfg.type === 'jsonbin' && syncCfg.jsonbinId && syncCfg.apiKey) {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${syncCfg.jsonbinId.trim()}/latest`, {
        headers: { 'X-Master-Key': syncCfg.apiKey.trim() }
      });
      if (res.ok) {
        const json = await res.json();
        data = json.record || json;
      }
    } else if (syncCfg.customUrl) {
      const res = await fetch(syncCfg.customUrl.trim());
      if (res.ok) data = await res.json();
    }

    if (data && typeof data === 'object') {
      let hasChanges = false;
      if (data.config) {
        let currentCfg = {};
        try {
          currentCfg = JSON.parse(localStorage.getItem("raosee_fresh_config") || localStorage.getItem("rasoee_fresh_config") || '{}');
        } catch(e) {}
        const mergedConfig = {
          ...data.config,
          security: (currentCfg && currentCfg.security) ? currentCfg.security : (DEFAULT_CONFIG.security || {})
        };
        localStorage.setItem("raosee_fresh_config", JSON.stringify(mergedConfig));
        localStorage.setItem("rasoee_fresh_config", JSON.stringify(mergedConfig));
        hasChanges = true;
      }
      if (Array.isArray(data.products) && data.products.length > 0) {
        data.products.forEach(p => {
          if (p.image && typeof normalizeImageUrl === 'function') {
            p.image = normalizeImageUrl(p.image);
          }
          if ((p.id === 'prod-59' || p.id === 'prod-591' || p.name === 'Allu Paan') && (!p.image || p.image.includes('photo-1540420773420') || p.image.includes('drive.google.com/file/d/') || p.image.includes('thumbnail?id='))) {
            p.image = 'https://lh3.googleusercontent.com/d/1a3iYdVtj-nfKt9fZlPW58k2G9nQTzCLO=w400';
          }
        });
        localStorage.setItem("rasoee_fresh_products", JSON.stringify(data.products));
        localStorage.setItem("raosee_fresh_products", JSON.stringify(data.products));
        localStorage.setItem("Rasoee_products", JSON.stringify(data.products));
        hasChanges = true;
      }
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        localStorage.setItem("raosee_categories", JSON.stringify(data.categories));
        localStorage.setItem("rasoee_categories", JSON.stringify(data.categories));
        hasChanges = true;
      }
      if (Array.isArray(data.banners)) {
        localStorage.setItem("raosee_banners", JSON.stringify(data.banners));
        localStorage.setItem("rasoee_banners", JSON.stringify(data.banners));
        localStorage.setItem("Rasoee_banners", JSON.stringify(data.banners));
        hasChanges = true;
      }
      if (hasChanges) {
        try { window.dispatchEvent(new Event("storage")); } catch (e) {}
        return true;
      }
    }
  } catch (e) {
    console.warn("Cloud sync pull failed:", e);
  }
  return false;
}

// ================= 1-CLICK BACKUP & RESTORE (JSON) =================
function exportAllStoreDataJson() {
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    config: typeof getStoreConfig === "function" ? getStoreConfig() : DEFAULT_CONFIG,
    products: typeof getStoredProducts === "function" ? getStoredProducts() : [],
    categories: typeof getStoredCategories === "function" ? getStoredCategories() : DEFAULT_CATEGORIES,
    banners: typeof getStoredBanners === "function" ? getStoredBanners() : DEFAULT_BANNERS,
    orders: JSON.parse((localStorage.getItem("rasoee_orders") || localStorage.getItem("raosee_orders")) || '[]'),
    users: JSON.parse((localStorage.getItem("rasoee_users") || localStorage.getItem("raosee_users")) || '[]'),
    cloudSync: getCloudSyncConfig()
  };
}

function importAllStoreDataJson(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid backup data");
  }
  if (data.config) {
    localStorage.setItem("raosee_fresh_config", JSON.stringify(data.config));
    if (typeof saveToIndexedDB === "function") saveToIndexedDB("raosee_fresh_config", data.config);
  }
  if (Array.isArray(data.products) && data.products.length > 0) {
    localStorage.setItem("raosee_fresh_products", JSON.stringify(data.products));
    if (typeof saveToIndexedDB === "function") saveToIndexedDB("raosee_fresh_products", data.products);
  }
  if (Array.isArray(data.categories) && data.categories.length > 0) {
    localStorage.setItem("raosee_categories", JSON.stringify(data.categories));
    if (typeof saveToIndexedDB === "function") saveToIndexedDB("raosee_categories", data.categories);
  }
  if (Array.isArray(data.banners) && data.banners.length > 0) {
    localStorage.setItem("raosee_banners", JSON.stringify(data.banners));
    if (typeof saveToIndexedDB === "function") saveToIndexedDB("raosee_banners", data.banners);
  }
  if (Array.isArray(data.orders)) {
    localStorage.setItem("raosee_orders", JSON.stringify(data.orders));
  }
  if (Array.isArray(data.users)) {
    localStorage.setItem("raosee_users", JSON.stringify(data.users));
  }
  if (data.cloudSync) {
    saveCloudSyncConfig(data.cloudSync);
  }
  try {
    window.dispatchEvent(new Event("storage"));
  } catch (e) {}
  return true;
}

// ================= PERMANENT CODE GENERATION FOR VERCEL DEPLOYMENT =================
function generatePermanentProductsJs(customProductsList) {
  const prods = customProductsList || (typeof getStoredProducts === 'function' ? getStoredProducts() : []);
  return `/**
 * Rasoee Fresh Supermarket - Product Catalog Data
 * Permanent Static Catalog for Global Vercel Deployment
 * Generated on: ${new Date().toISOString()}
 */
const DEFAULT_PRODUCTS = ${JSON.stringify(prods, null, 2)};

// Helper functions for catalog
let _inMemoryProducts = null;

function getStoredProducts() {
  if (Array.isArray(_inMemoryProducts) && _inMemoryProducts.length > 0) {
    return _inMemoryProducts;
  }
  try {
    const saved = localStorage.getItem("rasoee_fresh_products") || localStorage.getItem("raosee_fresh_products");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(p => {
          if (p.id === 'prod-1' && p.image && p.image.includes('photo-1513558161293')) {
            p.image = 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80';
          }
          if (p.id === 'prod-2' && p.image && p.image.includes('photo-1589985270826')) {
            p.image = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80';
          }
          if ((p.id === 'prod-59' || p.id === 'prod-591' || p.name === 'Allu Paan') && (!p.image || p.image.includes('photo-1540420773420') || p.image.includes('drive.google.com/file/d/'))) {
            p.image = 'https://lh3.googleusercontent.com/d/1a3iYdVtj-nfKt9fZlPW58k2G9nQTzCLO=w400';
          }
        });
        _inMemoryProducts = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not load products from localStorage", e);
  }
  return DEFAULT_PRODUCTS;
}

function saveProducts(products) {
  if (Array.isArray(products) && products.length > 0) {
    _inMemoryProducts = products;
  }
  try {
    try {
      localStorage.removeItem("raosee_fresh_products");
      localStorage.removeItem("Rasoee_products");
    } catch (e) {}
    localStorage.setItem("rasoee_fresh_products", JSON.stringify(products));
  } catch (e) {
    console.warn("Could not save products to localStorage (quota exceeded or blocked)", e);
    try {
      localStorage.removeItem("raosee_fresh_products");
      localStorage.removeItem("Rasoee_products");
      localStorage.setItem("rasoee_fresh_products", JSON.stringify(products));
    } catch (retryErr) {}
  }
  if (typeof saveToIndexedDB === "function") {
    saveToIndexedDB("rasoee_fresh_products", products);
  }
  if (typeof syncProductsToCloud === "function") {
    syncProductsToCloud(products);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_PRODUCTS, getStoredProducts, saveProducts };
}
`;
}

function generatePermanentStoreConfigJs(customConfig, customCategories, customBanners) {
  const baseCfg = customConfig || (typeof getStoreConfig === 'function' ? getStoreConfig() : DEFAULT_CONFIG);
  const activeSec = typeof getAdminSecurityConfig === 'function' ? getAdminSecurityConfig() : (baseCfg.security || DEFAULT_CONFIG.security);
  const cfg = {
    ...baseCfg,
    security: {
      ...DEFAULT_CONFIG.security,
      ...(baseCfg.security || {}),
      ...activeSec
    }
  };
  const cats = customCategories || (typeof getStoredCategories === 'function' ? getStoredCategories() : DEFAULT_CATEGORIES);
  const bans = customBanners || (typeof getStoredBanners === 'function' ? getStoredBanners() : DEFAULT_BANNERS);

  return `/**
 * Rasoee Fresh Supermarket - Global Store Configuration & Customization Engine
 * Permanent Configuration for Global Vercel Deployment
 * Generated on: ${new Date().toISOString()}
 */

const DEFAULT_CATEGORIES = ${JSON.stringify(cats, null, 2)};

const DEFAULT_BANNERS = ${JSON.stringify(bans, null, 2)};

const DEFAULT_CONFIG = ${JSON.stringify(cfg, null, 2)};

// Retrieve configuration with local storage override
function getStoreConfig() {
  try {
    const saved = (localStorage.getItem("rasoee_fresh_config") || localStorage.getItem("raosee_fresh_config"));
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...DEFAULT_CONFIG, 
        ...parsed,
        deliveryZone: { ...DEFAULT_CONFIG.deliveryZone, ...(parsed.deliveryZone || {}) },
        payment: { ...DEFAULT_CONFIG.payment, ...(parsed.payment || {}) },
        outletAddress: { ...DEFAULT_CONFIG.outletAddress, ...(parsed.outletAddress || {}) },
        cloudSync: { ...DEFAULT_CONFIG.cloudSync, ...(parsed.cloudSync || {}) },
        security: { ...DEFAULT_CONFIG.security, ...(parsed.security || {}) },
        smsGateway: { ...DEFAULT_CONFIG.smsGateway, ...(parsed.smsGateway || {}) }
      };
    }
  } catch (e) {
    console.warn("Could not read custom config from localStorage", e);
  }
  return DEFAULT_CONFIG;
}

function updateStoreConfig(newConfig) {
  try {
    const current = getStoreConfig();
    const merged = { 
      ...current, 
      ...newConfig,
      payment: { ...current.payment, ...(newConfig.payment || {}) },
      outletAddress: { ...current.outletAddress, ...(newConfig.outletAddress || {}) },
      cloudSync: { ...current.cloudSync, ...(newConfig.cloudSync || {}) },
      security: { ...current.security, ...(newConfig.security || {}) },
      smsGateway: { ...current.smsGateway, ...(newConfig.smsGateway || {}) }
    };
    try {
      localStorage.setItem("rasoee_fresh_config", JSON.stringify(merged)); localStorage.setItem("raosee_fresh_config", JSON.stringify(merged));
    } catch (e) {
      console.warn("Could not save config to localStorage", e);
    }
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_fresh_config", merged);
    }
    if (typeof syncConfigToCloud === "function") {
      syncConfigToCloud(merged);
    }
    if (typeof syncToCloud === "function") {
      syncToCloud();
    }
    if (typeof window !== "undefined") {
      try { window.dispatchEvent(new Event("storage")); } catch (e) {}
    }
    return merged;
  } catch (e) {
    console.error("Error in updateStoreConfig", e);
    return DEFAULT_CONFIG;
  }
}

// Categories storage
function getStoredCategories() {
  try {
    const saved = (localStorage.getItem("rasoee_categories") || localStorage.getItem("raosee_categories"));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not load categories", e);
  }
  return DEFAULT_CATEGORIES;
}

function saveCategories(categories) {
  try {
    const list = Array.isArray(categories) ? categories : [];
    localStorage.setItem("rasoee_categories", JSON.stringify(list)); 
    localStorage.setItem("raosee_categories", JSON.stringify(list));
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_categories", list);
    }
    if (typeof syncToCloud === "function") {
      syncToCloud();
    }
  } catch (e) {
    console.warn("Could not save categories", e);
  }
}

// Banners storage
function getStoredBanners() {
  try {
    const saved = (localStorage.getItem("rasoee_banners") || localStorage.getItem("raosee_banners") || localStorage.getItem("Rasoee_banners"));
    if (saved !== null && saved !== undefined) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Could not load banners", e);
  }
  return DEFAULT_BANNERS;
}

function saveBanners(banners) {
  try {
    const list = Array.isArray(banners) ? banners : [];
    localStorage.setItem("rasoee_banners", JSON.stringify(list));
    localStorage.setItem("raosee_banners", JSON.stringify(list));
    localStorage.setItem("Rasoee_banners", JSON.stringify(list));
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_banners", list);
      saveToIndexedDB("rasoee_banners", list);
    }
    if (typeof syncBannersToCloud === "function") {
      syncBannersToCloud(list);
    }
    if (typeof syncToCloud === "function") {
      syncToCloud();
    }
    if (typeof window !== "undefined") {
      try { window.dispatchEvent(new Event("storage")); } catch (e) {}
    }
  } catch (e) {
    console.warn("Could not save banners", e);
  }
}

// Initial Data Helper (Clean Store Mode)
function initDemoDataIfEmpty() {
  // Production Mode: Do not seed mock demo users or mock sample orders.
  return;
}

// Admin Security Helpers
function getAdminSecurityConfig() {
  const cfg = getStoreConfig();
  return { ...DEFAULT_CONFIG.security, ...(cfg.security || {}) };
}

function verifyAdminCredentials(inputUserOrPin, inputPassword) {
  const sec = getAdminSecurityConfig();
  const trimmedInput = String(inputUserOrPin || '').trim();
  const trimmedPass = String(inputPassword || '').trim();
  if (!trimmedPass && trimmedInput === String(sec.adminPin || '7890')) return { success: true, method: 'pin' };
  if (trimmedInput === String(sec.adminPin || '7890')) return { success: true, method: 'pin' };
  const expectedUser = String(sec.adminUser || 'admin').toLowerCase();
  const expectedPass = String(sec.adminPassword || 'admin@rasoee2026');
  if (trimmedInput.toLowerCase() === expectedUser && (trimmedPass === expectedPass || trimmedPass === "admin@raosee2026" || trimmedPass === "admin@rasoee2026")) return { success: true, method: 'password' };
  return { success: false, reason: 'Invalid Username, Password, or PIN.' };
}

function updateAdminSecurityCredentials(newUsername, newPassword, newPin) {
  const currentSec = getAdminSecurityConfig();
  const updatedSec = {
    ...currentSec,
    adminUser: newUsername ? String(newUsername).trim() : currentSec.adminUser,
    adminPassword: newPassword ? String(newPassword).trim() : currentSec.adminPassword,
    adminPin: newPin ? String(newPin).trim() : currentSec.adminPin
  };
  return updateStoreConfig({ security: updatedSec });
}

if (typeof window !== "undefined") {
  initDemoDataIfEmpty();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { 
    DEFAULT_CONFIG, 
    DEFAULT_CATEGORIES, 
    DEFAULT_BANNERS, 
    getStoreConfig, 
    updateStoreConfig,
    getStoredCategories,
    saveCategories,
    getStoredBanners,
    saveBanners,
    initDemoDataIfEmpty,
    getAdminSecurityConfig,
    verifyAdminCredentials,
    updateAdminSecurityCredentials
  };
}
`;
}

// Download text file helper
function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Download JSON file helper
function downloadJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Initial Data Helper (Clean Store Mode: No mock/sample data)
function initDemoDataIfEmpty() {
  // Production Mode: Do not seed mock demo users or mock sample orders.
  return;
}

// ================= GOOGLE DRIVE & CLOUD IMAGE NORMALIZER =================
function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
  url = url.trim();

  // If already base64 data url or relative path
  if (url.startsWith('data:image/') || url.startsWith('blob:') || url.startsWith('./') || url.startsWith('/')) {
    return url;
  }
  
  // Google Drive Link Conversion: supports /file/d/ID/view, id=ID, open?id=ID, uc?id=ID, thumbnail?id=ID
  if (url.includes('drive.google.com') || url.includes('drive.usercontent.google.com') || url.includes('lh3.googleusercontent.com')) {
    let fileId = null;
    const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) {
      fileId = matchD[1];
    } else {
      const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        fileId = matchId[1];
      } else {
        const matchLh = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
        if (matchLh && matchLh[1]) {
          fileId = matchLh[1];
        }
      }
    }
    if (fileId) {
      // High-speed Google edge image cache (<100ms) with clean square scaling:
      return `https://lh3.googleusercontent.com/d/${fileId}=w400`;
    }
  }
  return url;
}

// ================= 5 KM DELIVERY ZONE DISTANCE CALCULATOR =================
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const numLat1 = parseFloat(lat1);
  const numLon1 = parseFloat(lon1);
  const numLat2 = parseFloat(lat2);
  const numLon2 = parseFloat(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return 0;

  const R = 6371; // Earth's radius in kilometers
  const dLat = (numLat2 - numLat1) * Math.PI / 180;
  const dLon = (numLon2 - numLon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(numLat1 * Math.PI / 180) * Math.cos(numLat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ================= DELIVERY RIDERS & ALLOTMENT REGISTRY =================
const DEFAULT_RIDERS = [
  { id: 'rider-1', name: 'Ramesh Kumar', phone: '9876543210', vehicle: 'Electric Scooter (KA-01-EQ-4021)', active: true },
  { id: 'rider-2', name: 'Suresh Patil', phone: '9898989898', vehicle: 'Motorcycle (MH-12-AB-1234)', active: true },
  { id: 'rider-3', name: 'Vijay Shinde', phone: '9765432109', vehicle: 'Delivery Van (MH-12-CD-5678)', active: true }
];

function getStoredRiders() {
  try {
    const saved = localStorage.getItem('rasoee_delivery_riders');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_RIDERS;
}

function saveStoredRiders(riders) {
  try {
    localStorage.setItem('rasoee_delivery_riders', JSON.stringify(riders));
    if (typeof syncToCloud === 'function') syncToCloud();
  } catch (e) {}
}

// ================= CLOUD ORDERS & CUSTOMER PROFILE REALTIME SYNC =================
const CLOUD_RTDB_BASE = "https://rasoee-fresh-default-rtdb.asia-southeast1.firebasedatabase.app/store_live_data";

async function syncOrderToCloud(order) {
  if (!order || !order.id) return false;
  try {
    const res = await fetch(`${CLOUD_RTDB_BASE}/orders/${encodeURIComponent(order.id)}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return res.ok;
  } catch (e) {
    console.warn("syncOrderToCloud error:", e);
    return false;
  }
}

async function fetchOrdersFromCloud() {
  try {
    const res = await fetch(`${CLOUD_RTDB_BASE}/orders.json`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        return Object.values(data);
      }
    }
  } catch (e) {
    console.warn("fetchOrdersFromCloud error:", e);
  }
  return [];
}

async function syncCustomerToCloud(customer) {
  if (!customer) return false;
  const cleanPhone = String(customer.phone || customer.mobile || '').replace(/\D/g, '').slice(-10);
  if (!cleanPhone) return false;

  const flat = customer.flat || (customer.address && typeof customer.address === 'object' ? customer.address.flat : '') || (customer.savedAddresses && customer.savedAddresses[0] ? customer.savedAddresses[0].flat : '') || (typeof customer.address === 'string' ? customer.address.split(',')[0].trim() : '') || '';
  const street = customer.street || (customer.address && typeof customer.address === 'object' ? customer.address.street : '') || (customer.savedAddresses && customer.savedAddresses[0] ? customer.savedAddresses[0].street : '') || (typeof customer.address === 'string' ? customer.address.split(',').slice(1).join(',').trim() : '') || '';
  const landmark = customer.landmark || (customer.address && typeof customer.address === 'object' ? customer.address.landmark : '') || (customer.savedAddresses && customer.savedAddresses[0] ? customer.savedAddresses[0].landmark : '') || '';
  const name = customer.name || customer.customerName || 'Customer';
  const instructions = customer.instructions || customer.notes || 'Leave at door & ring bell';
  const defaultCity = (typeof getStoreConfig === 'function' ? (getStoreConfig().city || '') : '');
  const defaultPin = (typeof getStoreConfig === 'function' ? (getStoreConfig().pincode || '') : '');
  const city = customer.city || (customer.address && typeof customer.address === 'object' ? customer.address.city : '') || defaultCity;
  const pincode = customer.pincode || (customer.address && typeof customer.address === 'object' ? customer.address.pincode : '') || defaultPin;

  const payload = {
    id: customer.id || ('usr_' + cleanPhone.slice(-4)),
    phone: cleanPhone,
    name: name,
    flat: flat,
    street: street,
    landmark: landmark,
    instructions: instructions,
    city: city,
    pincode: pincode,
    address: {
      flat: flat,
      street: street,
      landmark: landmark,
      city: city,
      pincode: pincode
    },
    savedAddresses: Array.isArray(customerObj.savedAddresses) && customerObj.savedAddresses.length > 0
      ? customerObj.savedAddresses
      : (flat ? [{ type: 'Home', tag: 'Home', receiverName: name, receiverPhone: cleanPhone, flat, street, landmark, city, isDefault: true }] : []),
    updatedAt: new Date().toISOString()
  };

  try {
    const res = await fetch(`${CLOUD_RTDB_BASE}/customers/${cleanPhone}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    console.warn("syncCustomerToCloud error:", e);
    return false;
  }
}

async function fetchCustomerFromCloud(phone) {
  if (!phone) return null;
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10) return null;
  try {
    // 1. Direct lookup in Cloud RTDB /customers/<cleanPhone>.json
    const res = await fetch(`${CLOUD_RTDB_BASE}/customers/${cleanPhone}.json?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && (data.name || data.flat || (data.address && (data.address.flat || data.address.street)) || (Array.isArray(data.savedAddresses) && data.savedAddresses.length > 0))) {
        const flat = data.flat || (data.address && typeof data.address === 'object' ? data.address.flat : '') || (data.savedAddresses && data.savedAddresses[0] ? data.savedAddresses[0].flat : '') || (typeof data.address === 'string' ? data.address.split(',')[0].trim() : '') || '';
        const street = data.street || (data.address && typeof data.address === 'object' ? data.address.street : '') || (data.savedAddresses && data.savedAddresses[0] ? data.savedAddresses[0].street : '') || (typeof data.address === 'string' ? data.address.split(',').slice(1).join(',').trim() : '') || '';
        const landmark = data.landmark || (data.address && typeof data.address === 'object' ? data.address.landmark : '') || (data.savedAddresses && data.savedAddresses[0] ? data.savedAddresses[0].landmark : '') || '';
        const name = data.name || data.customerName || 'Valued Customer';
        const instructions = data.instructions || data.notes || 'Leave at door & ring bell';
        const defaultCity = (typeof getStoreConfig === 'function' ? (getStoreConfig().city || '') : '');
        const defaultPin = (typeof getStoreConfig === 'function' ? (getStoreConfig().pincode || '') : '');
        const city = data.city || (data.address && typeof data.address === 'object' ? data.address.city : '') || defaultCity;
        const pincode = data.pincode || (data.address && typeof data.address === 'object' ? data.address.pincode : '') || defaultPin;
        const savedAddresses = Array.isArray(data.savedAddresses) && data.savedAddresses.length > 0
          ? data.savedAddresses
          : (flat ? [{ type: 'Home', tag: 'Home', receiverName: name, receiverPhone: cleanPhone, flat, street, landmark, city, isDefault: true }] : []);

        return {
          id: data.id || ('usr_' + cleanPhone.slice(-4)),
          phone: cleanPhone,
          name: name,
          flat: flat,
          street: street,
          landmark: landmark,
          instructions: instructions,
          city: city,
          pincode: pincode,
          address: { flat, street, landmark, city, pincode },
          savedAddresses: savedAddresses,
          updatedAt: data.updatedAt || new Date().toISOString()
        };
      }
    }

    // 2. Fallback: Search Cloud RTDB /orders.json for past order with matching phone
    const ordersRes = await fetch(`${CLOUD_RTDB_BASE}/orders.json?_t=${Date.now()}`);
    if (ordersRes.ok) {
      const allOrders = await ordersRes.json();
      if (allOrders && typeof allOrders === 'object') {
        const list = Object.values(allOrders);
        const match = list.find(o => {
          const oPhone = String(o?.customer?.phone || o?.customer?.mobile || '').replace(/\D/g, '').slice(-10);
          return oPhone === cleanPhone;
        });
        if (match && match.customer) {
          const c = match.customer;
          const flat = c.flat || (c.address && typeof c.address === 'object' ? c.address.flat : '') || (typeof c.address === 'string' ? c.address.split(',')[0].trim() : '') || '';
          const street = c.street || (c.address && typeof c.address === 'object' ? c.address.street : '') || (typeof c.address === 'string' ? c.address.split(',').slice(1).join(',').trim() : '') || '';
          const landmark = c.landmark || (c.address && typeof c.address === 'object' ? c.address.landmark : '') || '';
          const name = c.name || 'Valued Customer';
          const instructions = c.instructions || 'Leave at door & ring bell';
          const defaultCity = (typeof getStoreConfig === 'function' ? (getStoreConfig().city || '') : '');
          const defaultPin = (typeof getStoreConfig === 'function' ? (getStoreConfig().pincode || '') : '');
          const restored = {
            id: 'usr_' + cleanPhone.slice(-4),
            phone: cleanPhone,
            name: name,
            flat: flat,
            street: street,
            landmark: landmark,
            instructions: instructions,
            address: { flat, street, landmark, city: defaultCity, pincode: defaultPin },
            savedAddresses: [{ type: 'Home', flat, street, landmark, city: defaultCity, isDefault: true }],
            updatedAt: new Date().toISOString()
          };
          syncCustomerToCloud(restored);
          return restored;
        }
      }
    }
  } catch (e) {
    console.warn("fetchCustomerFromCloud error:", e);
  }
  return null;
}

// Local customer lookup helper: checks Rasoee_users, Rasoee_orders, Rasoee_current_user, Rasoee_address
function findCustomerLocally(phone) {
  if (!phone) return null;
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10) return null;

  const defaultCity = (typeof getStoreConfig === 'function' ? (getStoreConfig().city || '') : '');
  const defaultPin = (typeof getStoreConfig === 'function' ? (getStoreConfig().pincode || '') : '');

  // 1. Check Rasoee_users
  try {
    const users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]');
    const match = users.find(u => {
      const uPhone = String(u?.phone || u?.mobile || '').replace(/\D/g, '').slice(-10);
      return uPhone === cleanPhone;
    });
    if (match && (match.name || match.flat || (match.address && (match.address.flat || match.address.street)))) {
      return {
        id: match.id || ('usr_' + cleanPhone.slice(-4)),
        phone: cleanPhone,
        name: match.name || 'Valued Customer',
        flat: match.flat || (match.address && typeof match.address === 'object' ? match.address.flat : '') || '',
        street: match.street || (match.address && typeof match.address === 'object' ? match.address.street : '') || '',
        landmark: match.landmark || '',
        instructions: match.instructions || 'Leave at door & ring bell',
        address: match.address || { flat: match.flat || '', street: match.street || '', landmark: match.landmark || '', city: defaultCity, pincode: defaultPin }
      };
    }
  } catch (e) {}

  // 2. Check Rasoee_orders / raosee_orders
  try {
    const orders = JSON.parse(localStorage.getItem('Rasoee_orders') || localStorage.getItem('raosee_orders') || '[]');
    const match = orders.find(o => {
      const oPhone = String(o?.customer?.phone || o?.customer?.mobile || '').replace(/\D/g, '').slice(-10);
      return oPhone === cleanPhone;
    });
    if (match && match.customer && (match.customer.name || match.customer.flat || match.customer.address)) {
      const c = match.customer;
      const flat = c.flat || (c.address && typeof c.address === 'object' ? c.address.flat : '') || (typeof c.address === 'string' ? c.address.split(',')[0].trim() : '') || '';
      const street = c.street || (c.address && typeof c.address === 'object' ? c.address.street : '') || (typeof c.address === 'string' ? c.address.split(',').slice(1).join(',').trim() : '') || '';
      const landmark = c.landmark || (c.address && typeof c.address === 'object' ? c.address.landmark : '') || '';
      const name = c.name || 'Valued Customer';
      const instructions = c.instructions || 'Leave at door & ring bell';
      return {
        id: 'usr_' + cleanPhone.slice(-4),
        phone: cleanPhone,
        name: name,
        flat: flat,
        street: street,
        landmark: landmark,
        instructions: instructions,
        address: { flat, street, landmark, city: defaultCity, pincode: defaultPin },
        savedAddresses: [{ type: 'Home', flat, street, landmark, isDefault: true }]
      };
    }
  } catch (e) {}

  // 3. Check Rasoee_current_user
  try {
    const cur = JSON.parse(localStorage.getItem('Rasoee_current_user') || 'null');
    if (cur) {
      const curPhone = String(cur.phone || cur.mobile || '').replace(/\D/g, '').slice(-10);
      if (curPhone === cleanPhone && (cur.name || cur.flat || cur.address)) {
        return cur;
      }
    }
  } catch (e) {}

  // 4. Check Rasoee_address
  try {
    const addr = JSON.parse(localStorage.getItem('Rasoee_address') || 'null');
    if (addr) {
      const addrPhone = String(addr.phone || addr.mobile || '').replace(/\D/g, '').slice(-10);
      if (addrPhone === cleanPhone && (addr.name || addr.flat)) {
        return {
          id: 'usr_' + cleanPhone.slice(-4),
          phone: cleanPhone,
          name: addr.name || 'Valued Customer',
          flat: addr.flat || '',
          street: addr.street || '',
          landmark: addr.landmark || '',
          instructions: addr.instructions || 'Leave at door & ring bell',
          address: { flat: addr.flat || '', street: addr.street || '', landmark: addr.landmark || '', city: defaultCity, pincode: defaultPin }
        };
      }
    }
  } catch (e) {}

  return null;
}

// Proactive Sync: uploads all local customer records from Rasoee_users and Rasoee_orders to Cloud RTDB
async function syncAllLocalCustomersToCloud() {
  try {
    let users = [];
    try { users = JSON.parse(localStorage.getItem('Rasoee_users') || '[]'); } catch (e) {}
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('Rasoee_orders') || localStorage.getItem('raosee_orders') || '[]'); } catch (e) {}

    const map = new Map();
    if (Array.isArray(users)) {
      users.forEach(u => {
        if (!u) return;
        const p = String(u.phone || u.mobile || '').replace(/\D/g, '').slice(-10);
        if (p.length === 10) map.set(p, u);
      });
    }

    if (Array.isArray(orders)) {
      orders.forEach(o => {
        if (!o || !o.customer) return;
        const p = String(o.customer.phone || o.customer.mobile || '').replace(/\D/g, '').slice(-10);
        if (p.length === 10 && !map.has(p)) {
          map.set(p, {
            id: 'usr_' + p.slice(-4),
            phone: p,
            name: o.customer.name || 'Valued Customer',
            flat: o.customer.flat || (o.customer.address && typeof o.customer.address === 'object' ? o.customer.address.flat : '') || '',
            street: o.customer.street || (o.customer.address && typeof o.customer.address === 'object' ? o.customer.address.street : '') || '',
            landmark: o.customer.landmark || '',
            instructions: o.customer.instructions || 'Leave at door & ring bell'
          });
        }
      });
    }

    const promises = [];
    for (const [phone, cust] of map.entries()) {
      if (typeof syncCustomerToCloud === 'function') {
        promises.push(syncCustomerToCloud(cust));
      }
    }
    await Promise.all(promises);
    return true;
  } catch (err) {
    console.warn("syncAllLocalCustomersToCloud error:", err);
    return false;
  }
}

async function fetchAllCustomersFromCloud() {
  try {
    const res = await fetch(`${CLOUD_RTDB_BASE}/customers.json?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        return Object.values(data);
      }
    }
  } catch (e) {
    console.warn("fetchAllCustomersFromCloud error:", e);
  }
  return [];
}

// ================= CLOUD SECURITY CREDENTIALS SYNC =================
async function syncSecurityCredentialsToCloud(securityObj) {
  try {
    const sec = securityObj || getAdminSecurityConfig();
    const payload = {
      adminUser: String(sec.adminUser || 'admin').trim(),
      adminPassword: String(sec.adminPassword || 'admin@rasoee2026').trim(),
      adminPin: String(sec.adminPin || '7890').trim(),
      operatorUser: String(sec.operatorUser || 'operator').trim(),
      operatorPassword: String(sec.operatorPassword || 'operator@rasoee2026').trim(),
      operatorPin: String(sec.operatorPin || '1234').trim(),
      updatedAt: new Date().toISOString()
    };

    // Cache locally as well
    try {
      localStorage.setItem('rasoee_cloud_security', JSON.stringify(payload));
    } catch (e) {}

    const res = await fetch(`${CLOUD_RTDB_BASE}/security_credentials.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn("syncSecurityCredentialsToCloud error:", err);
    return false;
  }
}

async function fetchSecurityCredentialsFromCloud() {
  try {
    const res = await fetch(`${CLOUD_RTDB_BASE}/security_credentials.json?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && (data.adminPin || data.adminPassword || data.operatorPin)) {
        try {
          localStorage.setItem('rasoee_cloud_security', JSON.stringify(data));
          // Merge with live store config in localStorage
          const cfg = getStoreConfig();
          cfg.security = { ...(cfg.security || {}), ...data };
          localStorage.setItem('rasoee_fresh_config', JSON.stringify(cfg));
          localStorage.setItem('raosee_fresh_config', JSON.stringify(cfg));
        } catch (e) {}
        return data;
      }
    }
  } catch (err) {
    console.warn("fetchSecurityCredentialsFromCloud error:", err);
  }
  return null;
}

// ================= CROSS-DEVICE CLOUD CART SYNC =================
async function syncCartToCloud(phone, cart) {
  if (!phone) return false;
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10) return false;
  const url = `${CLOUD_RTDB_BASE}/carts/${cleanPhone}.json`;
  try {
    const payload = cart && typeof cart === 'object' ? cart : {};
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn("[CartSync] syncCartToCloud error:", err);
    return false;
  }
}

async function fetchCartFromCloud(phone) {
  if (!phone) return null;
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10) return null;
  const url = `${CLOUD_RTDB_BASE}/carts/${cleanPhone}.json?_t=${Date.now()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === 'object' ? data : {};
  } catch (err) {
    console.warn("[CartSync] fetchCartFromCloud error:", err);
    return null;
  }
}

// Auto-run initialization and global exports
if (typeof window !== "undefined") {
  window.calculateDistanceKm = calculateDistanceKm;
  window.normalizeImageUrl = normalizeImageUrl;
  window.getStoreConfig = getStoreConfig;
  window.updateStoreConfig = updateStoreConfig;
  window.getStoredRiders = getStoredRiders;
  window.syncOrderToCloud = syncOrderToCloud;
  window.fetchOrdersFromCloud = fetchOrdersFromCloud;
  window.syncCustomerToCloud = syncCustomerToCloud;
  window.fetchCustomerFromCloud = fetchCustomerFromCloud;
  window.fetchAllCustomersFromCloud = fetchAllCustomersFromCloud;
  window.findCustomerLocally = findCustomerLocally;
  window.syncAllLocalCustomersToCloud = syncAllLocalCustomersToCloud;
  window.syncSecurityCredentialsToCloud = syncSecurityCredentialsToCloud;
  window.fetchSecurityCredentialsFromCloud = fetchSecurityCredentialsFromCloud;
  window.verifyAdminCredentialsWithCloud = verifyAdminCredentialsWithCloud;
  window.syncCartToCloud = syncCartToCloud;
  window.fetchCartFromCloud = fetchCartFromCloud;
  window.syncConfigToCloud = syncConfigToCloud;
  window.fetchConfigFromCloud = fetchConfigFromCloud;
  window.syncBannersToCloud = syncBannersToCloud;
  window.fetchBannersFromCloud = fetchBannersFromCloud;
  initDemoDataIfEmpty();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { 
    DEFAULT_CONFIG, 
    DEFAULT_CATEGORIES, 
    DEFAULT_BANNERS, 
    getStoreConfig, 
    updateStoreConfig,
    getStoredCategories,
    saveCategories,
    getStoredBanners,
    saveBanners,
    syncConfigToCloud,
    fetchConfigFromCloud,
    syncBannersToCloud,
    fetchBannersFromCloud,
    initDemoDataIfEmpty,
    getAdminSecurityConfig,
    verifyAdminCredentials,
    verifyAdminCredentialsWithCloud,
    updateAdminSecurityCredentials,
    updateOperatorSecurityCredentials,
    syncSecurityCredentialsToCloud,
    fetchSecurityCredentialsFromCloud,
    normalizeImageUrl,
    calculateDistanceKm,
    DEFAULT_RIDERS,
    getStoredRiders,
    saveStoredRiders,
    syncOrderToCloud,
    fetchOrdersFromCloud,
    syncCustomerToCloud,
    fetchCustomerFromCloud,
    fetchAllCustomersFromCloud,
    findCustomerLocally,
    syncAllLocalCustomersToCloud,
    syncCartToCloud,
    fetchCartFromCloud
  };
}

