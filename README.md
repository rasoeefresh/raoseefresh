# ⚡ Raosee Fresh Supermarket - Mobile Apps (Android & iOS) & Quick Commerce Web

A modern, fast, Blinkit-style quick commerce platform built specifically for **Raosee Fresh Supermarket**, complete with:
1. **👤 Customer Login System** (Phone + OTP verification, saved delivery addresses, profile management)
2. **🛵 Live Order Tracking Feature** (Real-time 5-stage milestones, moving delivery route map, live 10-15 min ETA countdown, assigned rider contact)
3. **🤖 Native Android App** (Android Studio / Kotlin / Gradle project ready for Google Play Store APK/AAB)
4. **🍎 Native iOS App** (Xcode / Swift / WebKit project ready for Apple App Store / TestFlight)
5. **📲 PWA Instant Install App** (1-Tap install on Android & iOS without waiting for App Store approval)
6. **💳 Online Payment Gateways** (Razorpay Cards/UPI/Netbanking + Instant 0% MDR Direct UPI QR + Cash on Delivery)
7. **💬 WhatsApp Supermarket Checkout & Customer Care**
8. **📊 Store Operations & Daily Rates Control Center** ([admin.html](file:///C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/admin.html)) with Customer Directory & Order Status management

---

## 📁 Project Architecture Overview

```
📁 raosee-fresh-supermarket/
├── 📲 index.html                      # PWA Storefront with Login, Cart, Account Drawer & Tracking
├── 👤 login.html                      # Dedicated Customer Login & Registration Page (Phone + OTP)
├── 🛵 track.html                      # Dedicated Live 10-15 Min Order Tracking Screen (Live Map)
├── 🛠️ admin.html                      # Store Operations, Daily Rates & Customer Directory
├── ⚙️ store-config.js                 # Global Store, Rates, Categories, Payment & Demo Data Engine
├── 🛒 products.js                     # Supermarket Catalog Database (Vegetables, Fruits, Dairy, Atta)
│
├── 🤖 mobile-android/                 # Complete Native Android Studio Project
│   ├── app/
│   │   ├── src/main/AndroidManifest.xml
│   │   ├── src/main/java/com/raoseefresh/supermarket/MainActivity.kt
│   │   └── src/main/res/ (layouts, themes, colors, progress bar)
│   ├── build.gradle & settings.gradle
│   └── README.md (Android Studio build guide)
│
├── 🍎 mobile-ios/                     # Complete Native iOS Xcode Project
│   ├── RaoseeFresh/
│   │   ├── ViewController.swift       (WKWebView with WhatsApp & UPI routing)
│   │   ├── Info.plist                 (Camera, Location & WhatsApp URL schemes)
│   │   ├── AppDelegate.swift & SceneDelegate.swift
│   │   └── RaoseeFresh.xcodeproj
│   └── README.md (Xcode build & CI/CD guide)
│
└── ⚡ capacitor.config.json           # Cross-platform Capacitor Bridge
```

---

## 👤 1. Customer Login System

### Features:
- **Phone Number Authentication**: Customers enter their 10-digit mobile number with standard Indian `+91` prefix.
- **4-Digit OTP Verification**: Clean verification UI with auto-focus digit shifting and demo code support (`1234`).
- **Profile & Delivery Address Setup**: New customers specify their Name and Flat/Apartment number, automatically saved to their profile.
- **Two Login Experiences**:
  1. **Dedicated Login Page ([login.html](file:///C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/login.html))**: Clean full-page login with branding and 1-click quick demo accounts.
  2. **In-App Quick Modal in [index.html](file:///C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/index.html)**: Customers can log in without ever leaving the aisle or losing their active cart!
- **"My Account & Orders" Slide Drawer**:
  - Displays customer profile, VIP status, and saved delivery addresses.
  - Lists past order receipts with:
    - **`⚡ Track Live`**: Opens dynamic delivery tracker.
    - **`🧾 Bill Details`**: Displays itemized supermarket tax invoice receipt.
    - **`🔄 Reorder`**: Re-populates the cart with 1 click!

---

## 🛵 2. Live Order Tracking Feature

### Features:
- **Dedicated Tracker ([track.html](file:///C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/track.html)) & In-App Modal**: Accessible via `track.html?orderId=RF-XXXXXX` or from the storefront.
- **5-Stage Visual Delivery Stepper**:
  1. `Order Placed & Confirmed` (with Razorpay / UPI / COD status)
  2. `Packing at Raosee Dark Store` (Cold chain packing & hand-sorted produce)
  3. `Delivery Partner Assigned` (Partner arrived at dispatch bay)
  4. `Out for Delivery` (Rider speeding on electric scooter)
  5. `Delivered at Doorstep` (Handover completed)
- **Animated Route Map Graphic**: Visual dark store to customer home route with a moving delivery scooter `🛵` progress bar.
- **Assigned Delivery Partner Card**:
  - Rider Name (e.g. *Ramesh Kumar*)
  - Vehicle details (*Hero Electric KA-01-EQ-4021*)
  - Rating (*4.9 ⭐, 1,240 deliveries*)
  - Direct `📞 Call Rider` and `💬 WhatsApp Rider` buttons.
- **Live Dynamic Countdown**: Automatic 10-15 minute ETA countdown clock.
- **Cross-Tab Real-Time Sync**: When the Store Manager advances the order status in `admin.html` (e.g. from *Packing* to *Out for Delivery*), the customer's tracking screen **updates instantly in real time** without needing a page refresh!

---

## 🛠️ 3. Admin Operations & Customer Directory ([admin.html](file:///C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/admin.html))

### What the Store Manager can do:
- **Live Order Status Management**: Interactive dropdown on every order row to advance orders (`Confirmed` ➔ `Packing` ➔ `Out for Delivery` ➔ `Delivered`).
- **Rider Assignment**: Assign or update the delivery partner's name.
- **Customer Directory Tab (`👥 Customers`)**:
  - View all registered customers, phone numbers, delivery addresses, and order frequencies.
  - Track lifetime spend (₹) per customer.
  - 1-Click `💬 Chat WhatsApp` button to check in on customer satisfaction.

---

## 💳 4. Payment Gateways Supported

1. **Razorpay Online Gateway**: Cards, UPI (Google Pay, PhonePe, Paytm), NetBanking, and Wallets.
2. **Instant Direct UPI QR (0% MDR / Fee)**: Dynamic QR code with bank reference/UTR tracking.
3. **Cash / UPI on Delivery (COD)**: Payment collected at customer doorstep.

---

## 📱 5. Native Mobile Apps

- **Android Studio Project**: Open [`mobile-android`](file:///C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/mobile-android) in Android Studio to build APK or upload to Google Play.
- **iOS Xcode Project**: Open [`mobile-ios/RaoseeFresh`](file:///C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/mobile-ios/RaoseeFresh) in Xcode on Mac to run on iPhone or submit to TestFlight.
- **Instant PWA Install**: Available directly in mobile browsers via the **"Install App"** smart banner.

---

## 🏢 6. Outlet & Company Settings System ([admin.html#outlet](file:///C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/admin.html#outlet))

A centralized configuration hub for retail outlet branding, legal identification, and Indian retail compliance:

### 1. Logo & Brand Identity
- **Local File Upload**: Select any PNG, JPG, SVG, or WebP file directly from your computer or phone. Automatically converted to persistent Base64 and previewed in real-time.
- **Image URL Support**: Input any CDN or web image URL.
- **Preset Supermarket Badges**: Quick select `⚡` (10 Min Lightning), `🛒` (Supermarket Cart), `🥬` (Organic Greens), or `🍎` (Fresh Fruits).
- **Instant Propagation**: Reflects immediately across the Storefront header, mobile navigation, Login hero banner, Live Order Tracker, and Tax Invoices.

### 2. Company & Outlet Identification
- **Company Legal Entity Name**: (e.g. `Raosee Fresh Retail Private Limited`) printed on official Tax Invoices and regulatory filings.
- **Public Trade Name**: (e.g. `Raosee Fresh Supermarket`) displayed in customer app headers and browser titles.
- **Outlet / Branch Name**: (e.g. `Main Dark Store - HSR Layout Hub #01`) identifying specific distribution centers.
- **Outlet Branch Code**: (e.g. `RF-BLR-01`) used for inventory tagging and order tracking.
- **Brand Tagline**: (e.g. `Farm Fresh Groceries Delivered in 10-15 Mins`).

### 3. Structured Dark Store Physical Address
- Granular inputs: Shop/Unit/Floor No., Building/Complex Name, Street/Cross Road, Area/Locality, City, State, Pincode, and Landmark.
- Live full-string address previewer.
- Automatically used as the **dispatch origin hub** on the customer's Live Route Map and official Tax Invoices.

### 4. Indian Food & Retail Regulatory Compliance
- **FSSAI License Number**: 14-digit Food Safety and Standards Authority of India registration.
- **GSTIN**: 15-digit Goods and Services Tax Identification Number.
- **Custom Tax Invoice Footer Note**: Custom guarantee, return policy, or customer appreciation message printed on every customer bill.

