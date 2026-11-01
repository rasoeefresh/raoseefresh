# 🍎 Rasoee Fresh Supermarket - iOS Native App

This directory contains the native iOS Xcode project for **Rasoee Fresh Supermarket**, built with Swift and WebKit.

---

## 🌟 Features Included

1. **High Performance WKWebView**: Native WebKit engine with custom user-agent and hardware-accelerated rendering.
2. **WhatsApp Native Scheme Handling**: Direct integration with `whatsapp://` and `https://wa.me/` URLs to open WhatsApp with pre-filled grocery orders.
3. **UPI Payment URL Routing**: Direct integration with UPI schemes for mobile payments.
4. **Camera & Photo Privacy**: Fully configured `Info.plist` with Apple App Store compliant camera and photo privacy strings.
5. **Interactive Pull to Refresh**: Native iOS `UIRefreshControl` for smooth pull-down reloading.

---

## 🛠️ How to Open & Build in Xcode (Mac)

1. **Open Project**:
   - On a Mac, open Xcode.
   - Open `mobile-ios/RasoeeFresh` or create a new iOS App project and copy the Swift files (`ViewController.swift`, `Info.plist`, `AppDelegate.swift`, `SceneDelegate.swift`).
2. **Configure Signing**:
   - Under **Signing & Capabilities**, select your Apple Developer Team.
   - Set Bundle Identifier: `com.RasoeeFresh.supermarket`.
3. **Run on iPhone or Simulator**:
   - Choose an iPhone device or Simulator (e.g. iPhone 15 Pro) and click **Run (▶)**.
4. **Archive for App Store / TestFlight**:
   - Go to menu: **Product > Archive**.
   - Distribute to **Apple TestFlight** or the **Apple App Store**.

---

## ☁️ Building iOS Without a Mac (Cloud CI/CD)

If you are developing on Windows, you can build iOS `.ipa` packages using cloud services for free:
- **GitHub Actions macOS Runner**: Automatically compile Xcode projects on every git push.
- **Codemagic / Bitrise**: Connect your repository and download compiled `.ipa` files directly.
