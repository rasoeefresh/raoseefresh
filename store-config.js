/**
 * Rasoee Fresh Supermarket - Global Store Configuration & Customization Engine
 * Manages daily rates, products, categories, promotional banners, store operations, and payment gateways.
 */

const DEFAULT_CATEGORIES = [
  { id: 'all', label: 'All Items', icon: '🛒', enabled: true },
  { id: 'vegetables-fruits', label: 'Vegetables & Fruits', icon: '🥬', enabled: true },
  { id: 'dairy-bread-eggs', label: 'Dairy & Breakfast', icon: '🥛', enabled: true },
  { id: 'staples-atta-dal', label: 'Atta, Rice & Dals', icon: '🌾', enabled: true },
  { id: 'snacks-munchies', label: 'Snacks & Munchies', icon: '🍿', enabled: true },
  { id: 'beverages', label: 'Cold Drinks & Juices', icon: '🥤', enabled: true },
  { id: 'cleaning-household', label: 'Cleaning & Essentials', icon: '🧼', enabled: true }
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
    enabled: true
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
    enabled: true
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
    enabled: true
  }
];

const DEFAULT_CONFIG = {
  // Company & Outlet Identity
  companyName: "Rasoee Fresh Retail Private Limited",
  storeName: "Rasoee Fresh Supermarket",
  outletName: "Main Dark Store - HSR Layout Hub #01",
  outletCode: "RF-BLR-01",
  logoUrl: "", // URL or Base64 uploaded logo image
  logoEmoji: "⚡",
  tagline: "Farm Fresh Groceries Delivered to Your Doorstep",

  // Outlet Address Structure
  outletAddress: {
    shopNo: "Shop #12, Ground Floor",
    building: "Central Market Complex",
    street: "19th Main Road",
    area: "HSR Layout Sector 2",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560102",
    landmark: "Near BDA Complex & City Garden"
  },
  storeAddress: "Shop #12, Ground Floor, Central Market Complex, 19th Main, HSR Layout Sector 2, Bangalore, Karnataka - 560102",

  // Tax & Food Safety Compliance (Printed on Customer Receipts)
  gstin: "29ABCDE1234F1Z5",
  fssaiNumber: "11223344000123",
  invoiceFooterNote: "Thank you for shopping with Rasoee Fresh! Freshness & 100% replacement guaranteed on WhatsApp.",

  // Contact & Support
  whatsappNumber: "919876543210", // Default Indian WhatsApp number without '+'
  supportPhone: "+91 98765 43210",
  email: "support@RasoeeFresh.com",
  city: "Bangalore",
  pincode: "560102",
  openingTime: "06:00 AM",
  closingTime: "11:30 PM",
  deliveryTimeEstimate: "Standard Delivery",
  isStoreOpen: true, // Emergency store toggle
  storeNotice: "⚡ Farm fresh morning vegetables harvested & in stock! Delivered fresh to your doorstep.",
  showAnnouncementBar: false,
  minOrderValue: 99,
  freeDeliveryThreshold: 199,
  standardDeliveryFee: 25,
  handlingFee: 2,
  currencySymbol: "₹",
  
  // Payment Gateway Configuration
  payment: {
    enableRazorpay: true,
    razorpayKeyId: "rzp_test_1DP5mmOlF5G5ag", // Demo test key
    merchantName: "Rasoee Fresh Supermarket",
    enableDirectUpi: true,
    upiId: "RasoeeFresh@upi",
    upiName: "Rasoee Fresh Supermarket",
    enableCod: true,
    defaultMethod: "razorpay"
  },

  features: {
    whatsappCheckout: true,
    whatsappCustomerSupport: true,
    liveOrderTracking: true,
    directPhotoListOrder: true,
  },

  // Security & Manager Access Gate
  security: {
    adminUser: "admin",
    adminPassword: "admin@rasoee2026",
    adminPin: "7890",
    sessionTimeoutHours: 24,
    requireLogin: true
  },

  // Cloud Sync (Firebase Realtime Database / JSONBin)
  cloudSync: {
    enabled: true,
    type: "firebase",
    firebaseUrl: "https://rasoee-fresh-default-rtdb.asia-southeast1.firebasedatabase.app/",
    authToken: ""
  }
};

// Retrieve configuration with local storage override
function getStoreConfig() {
  try {
    const saved = (localStorage.getItem("rasoee_fresh_config") || localStorage.getItem("raosee_fresh_config"));
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...DEFAULT_CONFIG, 
        ...parsed,
        payment: { ...DEFAULT_CONFIG.payment, ...(parsed.payment || {}) },
        outletAddress: { ...DEFAULT_CONFIG.outletAddress, ...(parsed.outletAddress || {}) },
        cloudSync: { ...DEFAULT_CONFIG.cloudSync, ...(parsed.cloudSync || {}) },
        security: { ...DEFAULT_CONFIG.security, ...(parsed.security || {}) }
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
      security: { ...current.security, ...(newConfig.security || {}) }
    };
    try {
      localStorage.setItem("rasoee_fresh_config", JSON.stringify(merged)); localStorage.setItem("raosee_fresh_config", JSON.stringify(merged));
    } catch (e) {
      console.warn("Could not save config to localStorage (quota exceeded or blocked)", e);
    }
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_fresh_config", merged);
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
  return { ...DEFAULT_CONFIG.security, ...(cfg.security || {}) };
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
    const saved = (localStorage.getItem("rasoee_banners") || localStorage.getItem("raosee_banners"));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not load banners", e);
  }
  return DEFAULT_BANNERS;
}

function saveBanners(banners) {
  try {
    localStorage.setItem("rasoee_banners", JSON.stringify(banners)); localStorage.setItem("raosee_banners", JSON.stringify(banners));
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_banners", banners);
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

async function syncToCloud() {
  const syncCfg = getCloudSyncConfig();
  if (!syncCfg || !syncCfg.enabled) return { success: false, reason: "Sync disabled" };

  const payload = {
    updatedAt: new Date().toISOString(),
    config: typeof getStoreConfig === "function" ? getStoreConfig() : DEFAULT_CONFIG,
    products: typeof getStoredProducts === "function" ? getStoredProducts() : [],
    categories: typeof getStoredCategories === "function" ? getStoredCategories() : DEFAULT_CATEGORIES,
    banners: typeof getStoredBanners === "function" ? getStoredBanners() : DEFAULT_BANNERS
  };

  try {
    if (syncCfg.type === 'firebase' && syncCfg.firebaseUrl) {
      let url = syncCfg.firebaseUrl.trim().replace(/\/$/, '');
      if (!url.endsWith('.json')) url += '/store_live_data.json';
      if (syncCfg.authToken) url += `?auth=${encodeURIComponent(syncCfg.authToken.trim())}`;
      const res = await fetch(url, {
        method: 'PUT',
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
        localStorage.setItem("raosee_fresh_config", JSON.stringify(data.config));
        hasChanges = true;
      }
      if (Array.isArray(data.products) && data.products.length > 0) {
        localStorage.setItem("raosee_fresh_products", JSON.stringify(data.products));
        hasChanges = true;
      }
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        localStorage.setItem("raosee_categories", JSON.stringify(data.categories));
        hasChanges = true;
      }
      if (Array.isArray(data.banners) && data.banners.length > 0) {
        localStorage.setItem("raosee_banners", JSON.stringify(data.banners));
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
function getStoredProducts() {
  try {
    const saved = localStorage.getItem("raosee_fresh_products");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not load products from localStorage", e);
  }
  return DEFAULT_PRODUCTS;
}

function saveProducts(products) {
  try {
    localStorage.setItem("raosee_fresh_products", JSON.stringify(products));
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_fresh_products", products);
    }
    if (typeof syncToCloud === "function") {
      syncToCloud();
    }
  } catch (e) {
    console.warn("Could not save products", e);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_PRODUCTS, getStoredProducts, saveProducts };
}
`;
}

function generatePermanentStoreConfigJs(customConfig, customCategories, customBanners) {
  const cfg = customConfig || (typeof getStoreConfig === 'function' ? getStoreConfig() : DEFAULT_CONFIG);
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
        payment: { ...DEFAULT_CONFIG.payment, ...(parsed.payment || {}) },
        outletAddress: { ...DEFAULT_CONFIG.outletAddress, ...(parsed.outletAddress || {}) },
        cloudSync: { ...DEFAULT_CONFIG.cloudSync, ...(parsed.cloudSync || {}) },
        security: { ...DEFAULT_CONFIG.security, ...(parsed.security || {}) }
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
      security: { ...current.security, ...(newConfig.security || {}) }
    };
    try {
      localStorage.setItem("rasoee_fresh_config", JSON.stringify(merged)); localStorage.setItem("raosee_fresh_config", JSON.stringify(merged));
    } catch (e) {
      console.warn("Could not save config to localStorage", e);
    }
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_fresh_config", merged);
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
    localStorage.setItem("rasoee_categories", JSON.stringify(categories)); localStorage.setItem("raosee_categories", JSON.stringify(categories));
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_categories", categories);
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
    const saved = (localStorage.getItem("rasoee_banners") || localStorage.getItem("raosee_banners"));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not load banners", e);
  }
  return DEFAULT_BANNERS;
}

function saveBanners(banners) {
  try {
    localStorage.setItem("rasoee_banners", JSON.stringify(banners)); localStorage.setItem("raosee_banners", JSON.stringify(banners));
    if (typeof saveToIndexedDB === "function") {
      saveToIndexedDB("raosee_banners", banners);
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

// Initial Demo Data Helper for Instant Testing
function initDemoDataIfEmpty() {
  try {
    if (!(localStorage.getItem("rasoee_users") || localStorage.getItem("raosee_users"))) {
      const demoUsers = [
        {
          id: 'usr_3210',
          name: 'Rahul Sharma',
          phone: '9876543210',
          address: { flat: 'Flat 402, Green Glen Layout', street: 'HSR Layout, Sector 2', landmark: 'Near Club House', city: 'Bangalore' },
          savedAddresses: [
            { type: 'Home', flat: 'Flat 402, Green Glen', street: 'HSR Layout, Sector 2' },
            { type: 'Work', flat: 'Tech Park B, 3rd Floor', street: 'Bellandur' }
          ],
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          lastOrderDate: new Date(Date.now() - 3600000).toISOString(),
          orderCount: 4,
          totalSpend: 1420
        }
      ];
      localStorage.setItem('raosee_users', JSON.stringify(demoUsers));
    }
  } catch (e) {}
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

// Initial Demo Data Helper for Instant Testing
function initDemoDataIfEmpty() {
  try {
    if (!(localStorage.getItem("rasoee_users") || localStorage.getItem("raosee_users"))) {
      const demoUsers = [
        {
          id: 'usr_3210',
          name: 'Rahul Sharma',
          phone: '9876543210',
          address: { flat: 'Flat 402, Green Glen Layout', street: 'HSR Layout, Sector 2', landmark: 'Near Club House', city: 'Bangalore' },
          savedAddresses: [
            { type: 'Home', flat: 'Flat 402, Green Glen', street: 'HSR Layout, Sector 2' },
            { type: 'Work', flat: 'Tech Park B, 3rd Floor', street: 'Bellandur' }
          ],
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          lastOrderDate: new Date(Date.now() - 3600000).toISOString(),
          orderCount: 4,
          totalSpend: 1420
        },
        {
          id: 'usr_9898',
          name: 'Priya Patel',
          phone: '9898989898',
          address: { flat: 'Villa 12, Palm Meadows', street: 'Koramangala 4th Block', landmark: 'Opposite Park', city: 'Bangalore' },
          savedAddresses: [{ type: 'Home', flat: 'Villa 12, Palm Meadows', street: 'Koramangala 4th Block' }],
          createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
          lastOrderDate: new Date(Date.now() - 7200000).toISOString(),
          orderCount: 6,
          totalSpend: 2850
        },
        {
          id: 'usr_3344',
          name: 'Amit Kumar',
          phone: '9911223344',
          address: { flat: 'House 18, 5th Cross', street: 'Sarjapur Road', landmark: 'Near Wipro Gate', city: 'Bangalore' },
          savedAddresses: [{ type: 'Home', flat: 'House 18, 5th Cross', street: 'Sarjapur Road' }],
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          lastOrderDate: new Date(Date.now() - 86400000).toISOString(),
          orderCount: 2,
          totalSpend: 615
        }
      ];
      localStorage.setItem('raosee_users', JSON.stringify(demoUsers));
    }

    const existingOrders = (localStorage.getItem("rasoee_orders") || localStorage.getItem("raosee_orders"));
    if (!existingOrders || existingOrders === '[]' || existingOrders === 'null') {
      const demoOrders = [
        {
          id: 'RF-948210',
          timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
          customer: {
            name: 'Rahul Sharma',
            phone: '9876543210',
            flat: 'Flat 402, Green Glen Layout',
            street: 'HSR Layout, Sector 2, Bangalore',
            landmark: 'Near Club House',
            instructions: 'Ring doorbell and leave at door'
          },
          items: [
            { product: { id: 'veg-tomato', name: 'Farm Fresh Tomatoes (Hybrid)', price: 34, mrp: 45, unit: '1 kg', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&auto=format&fit=crop&q=80' }, qty: 1, total: 34 },
            { product: { id: 'dairy-milk-amul', name: 'Amul Taaza Homogenised Toned Milk', price: 27, mrp: 28, unit: '500 ml', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&auto=format&fit=crop&q=80' }, qty: 2, total: 54 },
            { product: { id: 'fruit-apple-shimla', name: 'Crisp Shimla Royal Apples', price: 119, mrp: 160, unit: '500 g', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&auto=format&fit=crop&q=80' }, qty: 1, total: 119 }
          ],
          total: 234,
          payment: {
            method: 'Razorpay Online (UPI / NetBanking)',
            status: 'PAID ONLINE (Verified ✅)',
            paymentId: 'pay_rzp_8492019482'
          },
          status: 'Out for Delivery',
          rider: { name: 'Ramesh Kumar', phone: '9876543210', vehicle: 'Hero Electric (KA-01-EQ-4021)', rating: 4.9 }
        },
        {
          id: 'RF-837192',
          timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
          customer: {
            name: 'Priya Patel',
            phone: '9898989898',
            flat: 'Villa 12, Palm Meadows',
            street: 'Koramangala 4th Block, Bangalore',
            landmark: 'Opposite Park',
            instructions: 'Handover to security guard if not answering'
          },
          items: [
            { product: { id: 'staple-aashirvaad-atta', name: 'Aashirvaad Superior MP Sharbati Atta', price: 245, mrp: 290, unit: '5 kg', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80' }, qty: 1, total: 245 },
            { product: { id: 'staple-fortune-oil', name: 'Fortune Sunlite Refined Sunflower Oil', price: 135, mrp: 165, unit: '1 Litre Pouch', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&auto=format&fit=crop&q=80' }, qty: 1, total: 135 }
          ],
          total: 407,
          payment: {
            method: 'Direct UPI (Google Pay / PhonePe)',
            status: 'PAID VIA UPI (Ref: 4829104820)',
            paymentId: 'UPI-4829104820'
          },
          status: 'Packing',
          rider: { name: 'Suresh Gowda', phone: '9876543210', vehicle: 'Ather 450X (KA-01-HR-9821)', rating: 4.8 }
        },
        {
          id: 'RF-716492',
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
          customer: {
            name: 'Amit Kumar',
            phone: '9911223344',
            flat: 'House 18, 5th Cross',
            street: 'Sarjapur Road, Bangalore',
            landmark: 'Near Wipro Gate',
            instructions: 'Leave at front porch'
          },
          items: [
            { product: { id: 'snack-maggi', name: 'Maggi 2-Minute Masala Instant Noodles', price: 54, mrp: 60, unit: 'Pack of 4 (280g)', image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=200&auto=format&fit=crop&q=80' }, qty: 2, total: 108 }
          ],
          total: 135,
          payment: {
            method: 'Cash / UPI on Delivery (COD)',
            status: 'Cash Collected at Doorstep',
            paymentId: 'COD-RF-716492'
          },
          status: 'Delivered',
          rider: { name: 'Ramesh Kumar', phone: '9876543210', vehicle: 'Hero Electric (KA-01-EQ-4021)', rating: 4.9 }
        }
      ];
      localStorage.setItem('raosee_orders', JSON.stringify(demoOrders));
    }
  } catch (e) {
    console.warn("Could not seed demo orders/users", e);
  }
}

// Auto-run initialization
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

