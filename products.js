/**
 * Raosee Fresh Supermarket - Product Catalog Data
 * Contains realistic grocery items across all major supermarket categories
 */
const DEFAULT_PRODUCTS = [
  // --- Vegetables & Fruits ---
  {
    id: "veg-1",
    name: "Hybrid Tomato (Tamatar)",
    category: "vegetables-fruits",
    categoryLabel: "Vegetables & Fruits",
    price: 34,
    mrp: 45,
    unit: "1 kg",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Fresh Arrival",
    rating: 4.8,
    reviewsCount: 320,
    deliveryTime: "10 mins"
  },
  {
    id: "veg-2",
    name: "New Potato (Aloo)",
    category: "vegetables-fruits",
    categoryLabel: "Vegetables & Fruits",
    price: 28,
    mrp: 35,
    unit: "1 kg",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Bestseller",
    rating: 4.7,
    reviewsCount: 450,
    deliveryTime: "10 mins"
  },
  {
    id: "veg-3",
    name: "Nashik Red Onion (Pyaaz)",
    category: "vegetables-fruits",
    categoryLabel: "Vegetables & Fruits",
    price: 42,
    mrp: 55,
    unit: "1 kg",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Daily Essential",
    rating: 4.9,
    reviewsCount: 680,
    deliveryTime: "10 mins"
  },
  {
    id: "veg-4",
    name: "Fresh Coriander (Dhaniya)",
    category: "vegetables-fruits",
    categoryLabel: "Vegetables & Fruits",
    price: 15,
    mrp: 20,
    unit: "100 g bunch",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Organic",
    rating: 4.6,
    reviewsCount: 180,
    deliveryTime: "10 mins"
  },
  {
    id: "veg-5",
    name: "Robusta Banana (Kela)",
    category: "vegetables-fruits",
    categoryLabel: "Vegetables & Fruits",
    price: 39,
    mrp: 50,
    unit: "500 g (approx. 4-5 pcs)",
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Farm Fresh",
    rating: 4.8,
    reviewsCount: 290,
    deliveryTime: "10 mins"
  },
  {
    id: "veg-6",
    name: "Royal Gala Apples (Shimla)",
    category: "vegetables-fruits",
    categoryLabel: "Vegetables & Fruits",
    price: 139,
    mrp: 180,
    unit: "4 pcs (approx. 500-600g)",
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Premium",
    rating: 4.9,
    reviewsCount: 145,
    deliveryTime: "12 mins"
  },
  {
    id: "veg-7",
    name: "Fresh Palak (Spinach)",
    category: "vegetables-fruits",
    categoryLabel: "Vegetables & Fruits",
    price: 22,
    mrp: 30,
    unit: "250 g bunch",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Hydroponic",
    rating: 4.7,
    reviewsCount: 110,
    deliveryTime: "10 mins"
  },
  {
    id: "veg-8",
    name: "Green Capsicum (Shimla Mirch)",
    category: "vegetables-fruits",
    categoryLabel: "Vegetables & Fruits",
    price: 29,
    mrp: 40,
    unit: "500 g",
    image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Fresh",
    rating: 4.5,
    reviewsCount: 95,
    deliveryTime: "10 mins"
  },

  // --- Dairy, Bread & Eggs ---
  {
    id: "dairy-1",
    name: "Amul Taaza Homogenised Toned Milk",
    category: "dairy-bread-eggs",
    categoryLabel: "Dairy & Breakfast",
    price: 54,
    mrp: 56,
    unit: "1 Litre Pouch",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Daily Essential",
    rating: 4.9,
    reviewsCount: 1200,
    deliveryTime: "8 mins"
  },
  {
    id: "dairy-2",
    name: "Amul Salted Butter",
    category: "dairy-bread-eggs",
    categoryLabel: "Dairy & Breakfast",
    price: 58,
    mrp: 60,
    unit: "100 g Pack",
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Popular",
    rating: 4.9,
    reviewsCount: 880,
    deliveryTime: "8 mins"
  },
  {
    id: "dairy-3",
    name: "Fresh Malai Paneer (Cow Milk)",
    category: "dairy-bread-eggs",
    categoryLabel: "Dairy & Breakfast",
    price: 89,
    mrp: 105,
    unit: "200 g",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Fresh Made",
    rating: 4.8,
    reviewsCount: 420,
    deliveryTime: "8 mins"
  },
  {
    id: "dairy-4",
    name: "Farm Fresh White Eggs (Pack of 6)",
    category: "dairy-bread-eggs",
    categoryLabel: "Dairy & Breakfast",
    price: 48,
    mrp: 55,
    unit: "6 Eggs",
    image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "High Protein",
    rating: 4.8,
    reviewsCount: 640,
    deliveryTime: "8 mins"
  },
  {
    id: "dairy-5",
    name: "Modern 100% Whole Wheat Brown Bread",
    category: "dairy-bread-eggs",
    categoryLabel: "Dairy & Breakfast",
    price: 45,
    mrp: 50,
    unit: "400 g",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Healthy",
    rating: 4.7,
    reviewsCount: 390,
    deliveryTime: "8 mins"
  },
  {
    id: "dairy-6",
    name: "Mother Dairy Classic Plain Curd (Dahi)",
    category: "dairy-bread-eggs",
    categoryLabel: "Dairy & Breakfast",
    price: 35,
    mrp: 38,
    unit: "400 g Cup",
    image: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Probiotic",
    rating: 4.8,
    reviewsCount: 310,
    deliveryTime: "8 mins"
  },

  // --- Atta, Rice, Oil & Dals ---
  {
    id: "staple-1",
    name: "Aashirvaad Shudh Chakki Whole Wheat Atta",
    category: "staples-atta-dal",
    categoryLabel: "Atta, Rice & Dals",
    price: 245,
    mrp: 275,
    unit: "5 kg",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Bestseller",
    rating: 4.9,
    reviewsCount: 950,
    deliveryTime: "12 mins"
  },
  {
    id: "staple-2",
    name: "Fortune Sunlite Refined Sunflower Oil",
    category: "staples-atta-dal",
    categoryLabel: "Atta, Rice & Dals",
    price: 135,
    mrp: 165,
    unit: "1 Litre Pouch",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Heart Care",
    rating: 4.8,
    reviewsCount: 520,
    deliveryTime: "12 mins"
  },
  {
    id: "staple-3",
    name: "India Gate Basmati Rice (Feast Rozzana)",
    category: "staples-atta-dal",
    categoryLabel: "Atta, Rice & Dals",
    price: 110,
    mrp: 140,
    unit: "1 kg Pack",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Aromatic",
    rating: 4.8,
    reviewsCount: 410,
    deliveryTime: "12 mins"
  },
  {
    id: "staple-4",
    name: "Tata Sampann Unpolished Toor Dal",
    category: "staples-atta-dal",
    categoryLabel: "Atta, Rice & Dals",
    price: 165,
    mrp: 195,
    unit: "1 kg",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Pure Protein",
    rating: 4.7,
    reviewsCount: 380,
    deliveryTime: "12 mins"
  },
  {
    id: "staple-5",
    name: "Amul Pure Cow Ghee (Tin)",
    category: "staples-atta-dal",
    categoryLabel: "Atta, Rice & Dals",
    price: 330,
    mrp: 360,
    unit: "500 ml",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "100% Pure",
    rating: 4.9,
    reviewsCount: 610,
    deliveryTime: "10 mins"
  },

  // --- Snacks & Munchies ---
  {
    id: "snack-1",
    name: "Maggi 2-Minute Masala Instant Noodles",
    category: "snacks-munchies",
    categoryLabel: "Snacks & Munchies",
    price: 56,
    mrp: 60,
    unit: "Pack of 4 (280g)",
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Favorite",
    rating: 4.9,
    reviewsCount: 1500,
    deliveryTime: "10 mins"
  },
  {
    id: "snack-2",
    name: "Lay's India's Magic Masala Potato Chips",
    category: "snacks-munchies",
    categoryLabel: "Snacks & Munchies",
    price: 20,
    mrp: 20,
    unit: "50 g Pack",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Party Pack",
    rating: 4.8,
    reviewsCount: 920,
    deliveryTime: "10 mins"
  },
  {
    id: "snack-3",
    name: "Haldiram's Nagpur Aloo Bhujia",
    category: "snacks-munchies",
    categoryLabel: "Snacks & Munchies",
    price: 52,
    mrp: 60,
    unit: "200 g",
    image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Crispy",
    rating: 4.8,
    reviewsCount: 540,
    deliveryTime: "10 mins"
  },
  {
    id: "snack-4",
    name: "Parle-G Gold Glucose Biscuits",
    category: "snacks-munchies",
    categoryLabel: "Snacks & Munchies",
    price: 30,
    mrp: 35,
    unit: "1 kg Mega Pack",
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Tea-Time Classic",
    rating: 4.9,
    reviewsCount: 1100,
    deliveryTime: "10 mins"
  },

  // --- Cold Drinks & Juices ---
  {
    id: "drink-1",
    name: "Coca-Cola Zero Sugar Soft Drink Can",
    category: "beverages",
    categoryLabel: "Cold Drinks & Juices",
    price: 40,
    mrp: 40,
    unit: "300 ml Can",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Chilled",
    rating: 4.8,
    reviewsCount: 780,
    deliveryTime: "8 mins"
  },
  {
    id: "drink-2",
    name: "Real Fruit Power 100% Mixed Fruit Juice",
    category: "beverages",
    categoryLabel: "Cold Drinks & Juices",
    price: 115,
    mrp: 135,
    unit: "1 Litre Tetra Pack",
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "100% Natural",
    rating: 4.7,
    reviewsCount: 390,
    deliveryTime: "10 mins"
  },
  {
    id: "drink-3",
    name: "Fresh Tender Green Coconut (Nariyal Pani)",
    category: "beverages",
    categoryLabel: "Cold Drinks & Juices",
    price: 55,
    mrp: 65,
    unit: "1 pc with straw",
    image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Electrolytes",
    rating: 4.9,
    reviewsCount: 520,
    deliveryTime: "8 mins"
  },

  // --- Cleaning & Essentials ---
  {
    id: "clean-1",
    name: "Surf Excel Easy Wash Detergent Powder",
    category: "cleaning-household",
    categoryLabel: "Cleaning & Essentials",
    price: 139,
    mrp: 160,
    unit: "1 kg Pack",
    image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Tough Stain Removal",
    rating: 4.8,
    reviewsCount: 420,
    deliveryTime: "12 mins"
  },
  {
    id: "clean-2",
    name: "Vim Lemon Dishwash Gel Bottle",
    category: "cleaning-household",
    categoryLabel: "Cleaning & Essentials",
    price: 52,
    mrp: 60,
    unit: "250 ml",
    image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&auto=format&fit=crop&q=80",
    inStock: true,
    tag: "Grease Fighter",
    rating: 4.8,
    reviewsCount: 360,
    deliveryTime: "10 mins"
  }
];

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
  } catch (e) {
    console.warn("Could not save products to localStorage (quota exceeded or blocked)", e);
  }
  if (typeof saveToIndexedDB === "function") {
    saveToIndexedDB("raosee_fresh_products", products);
  }
  if (typeof syncToCloud === "function") {
    syncToCloud();
  }
  if (typeof window !== "undefined") {
    try { window.dispatchEvent(new Event("storage")); } catch (e) {}
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_PRODUCTS, getStoredProducts, saveProducts };
}

