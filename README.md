# Krishna Agrovet — Cattle Feed & Dairy Nutrition E-Commerce Platform

A complete, production-ready full-stack e-commerce storefront and admin operations dashboard tailored for rural Indian cattle feed distribution and dairy farming communities.

Built with **React + Vite + TypeScript**, **Tailwind CSS**, **Firebase (Cloud Firestore + Firebase Auth + Firestore Rules)**, and **WhatsApp Click-to-Chat Checkout API**.

---

## 🌟 Key Highlights & Architecture

- **High-Impact Agricultural Branding:** Built with forest green (`#1b4332`), fresh leaf green (`#52b788`), warm cream, and subtle earthy accents.
- **Mobile-First & Rural-Friendly:** Optimized for dairy farmers, Gaushala caretakers, and cooperative booth owners on mobile phones.
- **Atomic Stock Reservation via Firestore Transactions:** Orders are executed using Cloud Firestore atomic transactions (`runTransaction`), reading and decrementing product stock counts atomically to prevent race conditions and overselling.
- **Idempotency Protection:** Prevents accidental double orders even if a farmer taps "Place Order" multiple times on a slow 3G/4G network.
- **WhatsApp Direct Checkout Flow:** Order data is persisted in Firestore first, generating an immutable snapshot and unique order number (`KAV-YYYYMMDD-XXXX`). Then, WhatsApp opens with a structured, prefilled order message for the owner.
- **Automatic Stock Restoration on Cancellation:** When an administrator cancels an order, inventory is safely restored in Firestore and an audit record is logged in `inventory_movements` (with double-cancellation prevention).
- **Interactive Dual-Mode Engine:** Runs in interactive local demo mode out-of-the-box with preloaded cattle feed products. As soon as Firebase credentials are added to `.env`, it automatically switches to live Cloud Firestore and Firebase Auth.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) |
| **Icons & UI** | Lucide React |
| **Routing** | React Router v7 (`react-router-dom`) |
| **Database & Auth** | Google Firebase (Cloud Firestore & Firebase Authentication) |
| **Security Rules** | Cloud Firestore Security Rules (`firestore.rules`) |
| **Order Communication** | WhatsApp Click-to-Chat API (`wa.me`) |
| **Deployment** | Vercel or Firebase Hosting (`firebase.json` included) |

---

## 📁 Repository Structure

```
├── .env.example                                      # Environment variables template (Firebase keys)
├── firebase.json                                     # Firebase Hosting & Firestore deploy configuration
├── firestore.indexes.json                            # Cloud Firestore composite indexes
├── firestore.rules                                   # Cloud Firestore security rules with admin verification
├── index.html                                        # HTML shell with Google Fonts & SEO tags
├── package.json                                      # Node dependencies & scripts
├── public/
│   └── favicon.svg                                   # Agricultural brand favicon
├── src/
│   ├── App.tsx                                       # Application routing & layout
│   ├── index.css                                     # Base CSS, typography, print styles
│   ├── main.tsx                                      # React entry point with Providers
│   ├── types/
│   │   └── index.ts                                  # TypeScript domain types (Product, Order, etc.)
│   ├── lib/
│   │   ├── mockData.ts                               # Realistic Indian cattle feed catalog
│   │   ├── mockStore.ts                              # Reactive local storage engine with atomic transaction simulation
│   │   ├── firebase.ts                               # Firebase modular SDK, Firestore transactions & dataService layer
│   │   └── whatsapp.ts                               # WhatsApp message builder & wa.me URL generator
│   ├── context/
│   │   ├── AuthContext.tsx                           # Firebase Auth state & admin role check
│   │   ├── CartContext.tsx                           # Shopping cart, bag weight tally & free delivery logic
│   │   └── StoreSettingsContext.tsx                  # Business settings, phone numbers & notice banner
│   ├── components/
│   │   ├── common/                                   # Header, Footer, DemoModeBanner, ErrorBoundary
│   │   ├── home/                                     # Hero, TrustFeatures, DeliveryCoverage
│   │   ├── products/                                 # ProductCard, ProductGrid, ProductDetailModal
│   │   └── cart/                                     # CartDrawer
│   └── pages/
│       ├── HomePage.tsx                              # Customer catalog & landing
│       ├── CartPage.tsx                              # Dedicated cart view
│       ├── CheckoutPage.tsx                          # Farm address & order submission
│       ├── OrderConfirmationPage.tsx                 # WhatsApp dispatch action & printable receipt
│       ├── TrackOrderPage.tsx                        # Customer order tracking
│       ├── NotFoundPage.tsx                          # 404 handler
│       └── admin/
│           ├── AdminLoginPage.tsx                    # Secure admin login (Firebase Auth)
│           ├── AdminLayout.tsx                       # Admin navigation & sidebar
│           ├── AdminDashboardPage.tsx                # KPI overview & revenue metrics
│           ├── AdminProductsPage.tsx                 # Product catalog CRUD & active toggle
│           ├── AdminInventoryPage.tsx                # Stock balance & audit movement trail
│           ├── AdminOrdersPage.tsx                   # Order status manager & printable dispatch slips
│           └── AdminSettingsPage.tsx                 # Business info, WhatsApp, and delivery fees
└── vercel.json                                       # Vercel deployment SPA rewrite configuration
```

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+ (tested on npm 11)

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note on Demo Mode:** The application runs out of the box with realistic cattle feed data (Krishna Gold, Kapila, Amul Dan, Bypass Mix, Calcium Gel, Sarson Khal) and full order-to-WhatsApp capabilities even without setting up Firebase initially.

---

## 🔥 Firebase Production Setup Guide

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Name your project (e.g., `krishna-agrovet`).
3. You can enable or disable Google Analytics based on your preference, then click **Create project**.

### Step 2: Register a Web App
1. In your Firebase Project Overview, click the **Web icon** (`</>`) to add a web application.
2. Give it an App nickname (e.g., `krishna-agrovet-web`).
3. Click **Register app**.
4. Firebase will display your `firebaseConfig` object containing:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Step 3: Enable Firebase Authentication
1. In the Firebase Console left menu, navigate to **Build** -> **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Enable **Email/Password** (keep "Email link" disabled) and click **Save**.

### Step 4: Enable Cloud Firestore
1. In the left menu, navigate to **Build** -> **Firestore Database**.
2. Click **Create database**.
3. Choose your database location (select a region close to India, e.g., `asia-south1` Mumbai).
4. Start in **Production mode** and click **Create**.

### Step 5: Deploy Firestore Security Rules
You can deploy rules using the Firebase CLI or directly in the Firebase Console:
- **Option A (Firebase Console):**
  1. In Firestore Database, go to the **Rules** tab.
  2. Replace the contents with the rules from `firestore.rules` in this repository.
  3. Click **Publish**.
- **Option B (Firebase CLI):**
  ```bash
  npx firebase-tools deploy --only firestore:rules
  ```

### Step 6: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your Firebase config values:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=krishna-agrovet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=krishna-agrovet
VITE_FIREBASE_STORAGE_BUCKET=krishna-agrovet.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...

VITE_STORE_NAME="Krishna Agrovet"
VITE_OWNER_WHATSAPP="919470847471"
VITE_OWNER_PHONE="+91 94708 47471"
VITE_DELIVERY_AREAS="Alwar, Bharatpur, Behror, Kotputli, Rewari & Surrounding Villages"
```

### Step 7: Create the Owner Admin Account
1. In Firebase Console, go to **Authentication** -> **Users** -> **Add user**.
2. Enter the owner's email (e.g., `owner@krishnaagrovet.com`) and a secure password.
3. Copy the **User UID** of the newly created user.
4. Go to **Firestore Database** -> **Start collection**:
   - Collection ID: `admins`
   - Document ID: Paste the **User UID**
   - Fields:
     - `role`: string -> `admin`
     - `email`: string -> `owner@krishnaagrovet.com`
     - `name`: string -> `Store Owner`
5. The owner can now sign in at `/admin/login` using this email and password!

---

## 📱 WhatsApp Integration Details

- **Owner Phone Format:** Must be digits only with the international country code (`91` for India). For example, mobile `9876543210` becomes `919876543210`.
- **Order Flow:**
  1. Customer fills out village, full address, landmark, PIN code, and phone number.
  2. The frontend triggers the Firestore transaction `placeOrderAtomic`, validating stock in real-time, decrementing bags, and saving the order.
  3. The customer is redirected to `/order-confirmation/:orderNumber`.
  4. The customer taps **Open WhatsApp & Send Order**.
  5. WhatsApp opens with a formatted order breakdown.
  6. The customer taps **Send** in WhatsApp.

---

## 🌾 Replacing Demo Data with Real Business Products

1. Sign in to the **Admin Dashboard** (`/admin`).
2. Go to **Products** (`/admin/products`).
3. You can:
   - Edit existing products to adjust names, weights (25kg/50kg), bag prices (₹), and stock counts.
   - Deactivate products not stocked in your godown.
   - Click **Add New Feed Product** to add your father's direct-mill cattle feeds, khal varieties, or calcium bottles.
4. Go to **Store Settings** (`/admin/settings`) to update:
   - Store Name and Tagline
   - Owner WhatsApp Number
   - Helpline Phone Number
   - Covered Delivery Villages and Tehsils
   - Free delivery threshold (default 5 bags) and delivery charges per bag

---

## ☁️ Deployment

### Deploying to Vercel
1. Push your repository to GitHub or GitLab.
2. Sign in to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
3. Select your repository.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Under **Environment Variables**, add:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_STORE_NAME`
   - `VITE_OWNER_WHATSAPP`
   - `VITE_OWNER_PHONE`
   - `VITE_DELIVERY_AREAS`
7. Click **Deploy**. Vercel will build and deploy the application with SPA rewrites (`vercel.json`).

### Deploying to Firebase Hosting (Alternative)
```bash
# 1. Log in to Firebase CLI
npx firebase-tools login

# 2. Build the project
npm run build

# 3. Deploy hosting and firestore rules
npx firebase-tools deploy
```

---

## 🧪 Build & Test Verification

Run the production build:
```bash
npm run build
```
Verify the output:
```
dist/index.html                   1.85 kB
dist/assets/index-DjJaYo_W.css   60.75 kB
dist/assets/index-CBnvt4rX.js   850.21 kB
✓ built in 1.38s
```
Preview the production build locally:
```bash
npm run preview
```

---

## 📄 License & Ownership
Created for Krishna Agrovet. Proprietary and confidential for direct family business operations.
