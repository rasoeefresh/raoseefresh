# 🤖 Rasoee Fresh Supermarket - Android Native App

This directory contains the complete native Android project for **Rasoee Fresh Supermarket**, built with Kotlin, Gradle, and modern Android architecture.

---

## 🌟 Features Included

1. **Hardware-Accelerated WebView**: 60fps smooth scrolling with DOM storage, cache optimization, and instant grocery browsing.
2. **WhatsApp Native Intent Redirection**: Intercepts `wa.me`, `whatsapp://`, and opens the customer's native WhatsApp or WhatsApp Business app directly to send orders.
3. **Direct UPI Intent (0% Fee)**: Automatically triggers installed UPI apps (Google Pay, PhonePe, Paytm, BHIM) with one tap.
4. **Camera & Photo List Upload**: Enables taking a live camera picture or selecting a photo from gallery when customers send handwritten grocery lists.
5. **Native Android Hardware Back Button**: Clean back stack navigation (`canGoBack()` handling).
6. **Pull to Refresh**: Smooth `SwipeRefreshLayout` pulling to refresh rates and stock.

---

## 🛠️ How to Open & Build APK in Android Studio

1. **Download & Open Android Studio**:
   - Launch [Android Studio](https://developer.android.com/studio).
   - Select **Open an existing Android Studio Project**.
   - Browse to:
     `C:\Users\Admin\.gemini\antigravity\scratch\Rasoee-fresh-supermarket\mobile-android`
2. **Wait for Gradle Sync**:
   - Android Studio will automatically download necessary dependencies and configure the project.
3. **Test on Phone or Emulator**:
   - Connect your Android phone with USB Debugging enabled, or start an Android Virtual Device (AVD).
   - Click the green **Run (▶)** button.
4. **Generate Release APK / AAB for Google Play Store**:
   - Go to menu: **Build > Generate Signed Bundle / APK...**
   - Select **Android App Bundle (.aab)** for Google Play Store, or **APK (.apk)** for direct installation.
   - Follow the prompt to create a keystore key and click **Finish**.
   - Your production-ready `.apk` / `.aab` is generated!

---

## 🌐 Pointing to Your Live Website

In `app/src/main/java/com/RasoeeFresh/supermarket/MainActivity.kt`:
```kotlin
// Change this line to your production domain:
val targetUrl = "https://your-domain.com"
```
Or bundle your assets inside `app/src/main/assets/www/` for 100% offline standalone operation.
