/**
 * Raosee Fresh Supermarket - Global Store Configuration & Customization Engine
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
    badge: "⚡ Superfast Delivery",
    title: "Fresh Groceries in 10-15 Mins",
    highlightText: "10-15 Mins",
    subtitle: "Farm-picked vegetables, milk, dairy, atta & snacks at supermarket prices.",
    footerText: "✓ No Minimum Order • ✓ Free Above ₹199",
    btnText: "Explore Aisle →",
    action: "explore",
    gradient: "from-green-800 to-green-950",
    enabled: true
  },
  {
    id: "banner-2",
    badge: "WhatsApp Express",
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
    title: "Raosee Fresh Farm Promise",
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
  companyName: "Raosee Fresh Retail Private Limited",
  storeName: "Raosee Fresh Supermarket",
  outletName: "Main Dark Store - HSR Layout Hub #01",
  outletCode: "RF-BLR-01",
  logoUrl: "", // URL or Base64 uploaded logo image
  logoEmoji: "⚡",
  tagline: "Farm Fresh Groceries Delivered in 10-15 Mins",

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
  invoiceFooterNote: "Thank you for shopping with Raosee Fresh! Freshness & 100% replacement guaranteed on WhatsApp.",

  // Contact & Support
  whatsappNumber: "919876543210", // Default Indian WhatsApp number without '+'
  supportPhone: "+91 98765 43210",
  email: "support@raoseefresh.com",
  city: "Bangalore",
  pincode: "560102",
  openingTime: "06:00 AM",
  closingTime: "11:30 PM",
  deliveryTimeEstimate: "10-15 mins",
  isStoreOpen: true, // Emergency store toggle
  storeNotice: "⚡ Farm fresh morning vegetables harvested & in stock! Delivery in 10-15 mins.",
  showAnnouncementBar: true,
  minOrderValue: 99,
  freeDeliveryThreshold: 199,
  standardDeliveryFee: 25,
  handlingFee: 2,
  currencySymbol: "₹",
  
  // Payment Gateway Configuration
  payment: {
    enableRazorpay: true,
    razorpayKeyId: "rzp_test_1DP5mmOlF5G5ag", // Demo test key
    merchantName: "Raosee Fresh Supermarket",
    enableDirectUpi: true,
    upiId: "raoseefresh@upi",
    upiName: "Raosee Fresh Supermarket",
    enableCod: true,
    defaultMethod: "razorpay"
  },

  features: {
    whatsappCheckout: true,
    whatsappCustomerSupport: true,
    liveOrderTracking: true,
    directPhotoListOrder: true,
  }
};

// Retrieve configuration with local storage override
function getStoreConfig() {
  try {
    const saved = localStorage.getItem("raosee_fresh_config");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...DEFAULT_CONFIG, 
        ...parsed,
        payment: { ...DEFAULT_CONFIG.payment, ...(parsed.payment || {}) },
        outletAddress: { ...DEFAULT_CONFIG.outletAddress, ...(parsed.outletAddress || {}) }
      };
    }
  } catch (e) {
    console.warn("Could not read custom config from localStorage", e);
  }
  return DEFAULT_CONFIG;
}

function updateStoreConfig(newConfig) {
  const current = getStoreConfig();
  const merged = { 
    ...current, 
    ...newConfig,
    payment: { ...current.payment, ...(newConfig.payment || {}) },
    outletAddress: { ...current.outletAddress, ...(newConfig.outletAddress || {}) }
  };
  localStorage.setItem("raosee_fresh_config", JSON.stringify(merged));
  return merged;
}

// Categories storage
function getStoredCategories() {
  try {
    const saved = localStorage.getItem("raosee_categories");
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
  localStorage.setItem("raosee_categories", JSON.stringify(categories));
}

// Banners storage
function getStoredBanners() {
  try {
    const saved = localStorage.getItem("raosee_banners");
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
    localStorage.setItem("raosee_banners", JSON.stringify(banners));
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}
    }
  } catch (e) {
    console.warn("Could not save banners", e);
  }
}

// Initial Demo Data Helper for Instant Testing
function initDemoDataIfEmpty() {
  try {
    if (!localStorage.getItem('raosee_users')) {
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

    const existingOrders = localStorage.getItem('raosee_orders');
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
    initDemoDataIfEmpty
  };
}

