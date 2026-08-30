# Aura Reign Boutique Dashboard — Comprehensive System Documentation & Guide

Welcome to the complete architectural and operational documentation for the **Aura Reign Premium Dresses Boutique Management System**.

---

## 1. System Overview & Purpose

### Purpose
**Aura Reign Dashboard** is a luxury boutique order tracking and business intelligence application tailored for fashion boutiques. It bridges a modern, responsive React web interface with **Google Sheets** as a serverless headless database via **Google Apps Script Web App REST API**.

### Key Capabilities
1. **Real-time Order Management:** Create, view, edit, search, filter, and paginate boutique orders seamlessly.
2. **Dynamic Boutique KPIs:**
   - **Total Units Sold:** Tracks verified units sold from completed (`Done`) orders.
   - **Total Sales:** Real-time revenue summation with dynamic growth/decline percentage trend (`+/- %`).
   - **Orders Fulfilled:** Ratio of completed vs. total orders.
   - **Pending Orders:** Alert card indicating incoming orders that need boutique attention.
   - **Fulfillment Split:** Dynamic visual bar contrasting Pick Up vs. Shipped orders.
3. **Multi-device Experience:** Designed with responsive luxury aesthetics for desktop monitors and expandable accordion cards for mobile smartphones.
4. **Zero-Maintenance Backend:** Hosted free on Google Workspace infrastructure without requiring dedicated database servers (SQL/Mongo).

---

## 2. System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│               Aura Reign React Frontend                │
│    (Vite + React + Tailwind v4 + Framer Motion)       │
└───────────────────────────▲────────────────────────────┘
                            │
            HTTPS REST (GET / POST)
            Content-Type: text/plain
                            │
┌───────────────────────────▼────────────────────────────┐
│          Google Apps Script Web App (Code.gs)          │
│               Serverless REST Endpoint                 │
└───────────────────────────▲────────────────────────────┘
                            │
              Direct Spreadsheet App API
                            │
┌───────────────────────────▼────────────────────────────┐
│              Google Sheet ("Orders" Tab)               │
│                  Headless Database                     │
└────────────────────────────────────────────────────────┘
```

### Database Schema (Google Sheet Columns)

| Column | Header | Type | Description |
| :--- | :--- | :--- | :--- |
| **A** | `Order ID` | String | Auto-generated unique ID (e.g. `AR-20260831-4960`) |
| **B** | `Timestamp` | ISO String | Date & time order was logged |
| **C** | `Customer Name` | String | Customer's full name / Facebook profile note |
| **D** | `Fulfillment Type` | Dropdown | `Pick Up` or `Shipped` |
| **E** | `Shipping Address` | String | Shipping courier (J&T, Flash, LBC) or Store Pickup |
| **F** | `Size / Variant` | String | Item breakdown (e.g. `1x M, 2x L`) |
| **G** | `Quantity` | Integer | Total count of all garments in the order |
| **H** | `Total Amount` | Number / Currency | Total sale price (parsed clean of `₱` symbols) |
| **I** | `Status` | Dropdown | `Pending` or `Done` |
| **J** | `Completed At` | ISO String | Timestamp when marked `Done` (blank if Pending) |

---

## 3. Hosting & Security Best Practices

### A. Frontend Hosting (Recommended Platforms)
You can deploy your Vite + React application on any modern edge hosting service with free SSL:

1. **Vercel (Recommended):**
   - Connect your GitHub repository to [Vercel](https://vercel.com).
   - Build command: `npm run build`
   - Output directory: `dist`
   - Automatically provides a custom domain and global HTTPS.

2. **Netlify:**
   - Drag and drop your `dist/` folder or connect via GitHub.
   - Build command: `npm run build`, publish directory: `dist`.

3. **Cloudflare Pages:**
   - Connect repository, select Vite preset, deploy instantly with unlimited bandwidth.

---

### B. Security Architecture

#### 1. Google Drive & Sheet Permissions
- Keep your Google Sheet **Private** (Restricted to your Google account).
- **Never** share the Google Sheet link publicly.
- The Apps Script Web App runs under your Google account credentials ("Execute as: Me"), which means external users access the script, not your raw Google Drive files.

#### 2. Protecting Environment Variables (`.env`)
Instead of hardcoding your Web App URL in source code:
1. Create a `.env` file in the project root:
   ```env
   VITE_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
2. In [`src/App.jsx`](file:///c:/Dev/aura-reign-dashboard/src/App.jsx):
   ```javascript
   const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL || "https://script.google.com/...";
   ```
3. Add `.env` to your `.gitignore` to prevent exposing your private Web App endpoint in public git repositories.

#### 3. Optional Secret Token Protection (API Key)
If you want to prevent unauthorized users from sending requests to your Google Apps Script:
1. Define a private secret token in `backend/Code.gs`:
   ```javascript
   const SECRET_TOKEN = "AURA_REIGN_SECRET_2026";
   ```
2. Validate incoming requests in `doPost`:
   ```javascript
   if (payload.token !== SECRET_TOKEN) {
     return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized" }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```
3. Pass `token: SECRET_TOKEN` from your frontend payload.

---

## 4. User Tutorial & Operational Guide

### Step 1: Navigating the Dashboard
- **Top KPIs:** 
  - **TOTAL UNITS SOLD:** Sum of all garment items from `Done` orders.
  - **TOTAL SALES:** Gross revenue from `Done` orders with dynamic percentage trend.
  - **ORDERS FULFILLED:** Progress ratio of fulfilled vs. total orders.
  - **PENDING ORDERS:** Count of active orders awaiting dispatch.
- **Fulfillment Split:** Visual progress bar highlighting the split between Pick Up and Shipped orders.

### Step 2: Creating a New Order
1. Click the **+ New Order** button in the header (or the floating button on mobile).
2. Enter the **Customer Name** (e.g. `Elena Gilbert`).
3. Select the **Fulfillment Type**:
   - If **Pick Up**: Courier address is automatically set to Store Pickup.
   - If **Shipped**: Enter the courier name or recipient address (e.g. `via J&T Express`).
4. Configure **Items & Sizes**:
   - Select size from the dropdown (`XS`, `S`, `M`, `L`, `XL`, or `Custom`).
   - Adjust quantities using the **`-`** and **`+`** stepper controls.
   - Click **+ Add Another Size** to add more sizes to the same order.
5. Enter the **Total Amount (₱)** (e.g. `9000`).
6. Click **Complete Order**.
   - The order will instantly appear at the top of your dashboard and sync to your Google Sheet!

### Step 3: Searching & Filtering Orders
- **Search Bar:** Type any Customer Name, Order ID, dress size (e.g. `M`), or courier to filter instantly in real time.
- **Filter Tabs:**
   - **All:** View all active orders.
   - **Pending:** View orders that require fulfillment.
   - **Pick Up:** View orders designated for store pickup.
   - **Shipped:** View orders scheduled for courier delivery.
   - **Done:** View finalized orders.

### Step 4: Viewing Order Details
- Click the **👁️ (Eye)** icon on any order row or mobile card.
- A modal displays the invoice summary:
  - Timestamp of order
  - Customer information
  - Fulfillment & courier breakdown
  - Item breakdown
  - Total sales amount
  - Quick action buttons: **Mark as Done / Pending** and **Edit Order**.

### Step 5: Editing an Order
1. Click the **✏️ (Pencil)** icon in the Actions column or inside the View modal.
2. Update any details (Customer Name, courier address, garment quantities, or status).
3. Click **Save Changes**. The dashboard and Google Sheet update in-place without creating duplicate rows.

### Step 6: Fulfilling an Order (Marking as Done)
1. When an order is completed, open **View Details (👁️)** &rarr; click **Mark as Done** (or change status in Edit modal).
2. The order status updates to **DONE** (emerald badge).
3. The order amount and units sold are immediately counted towards **Total Sales** and **Total Units Sold**.

### Step 7: Mobile Usage
- On mobile screens, orders appear as **compact collapsed cards**.
- Tap any card to smoothly expand details (garments, courier, pricing, actions).
- Tap again to collapse for a clean overview.

---

## 5. Maintenance & Google Sheet Syncing

### Modifying Google Sheet Code
Whenever you make updates to [`backend/Code.gs`](file:///c:/Dev/aura-reign-dashboard/backend/Code.gs):
1. In Google Sheets, go to **Extensions > Apps Script**.
2. Paste the updated code.
3. Click **Save (Ctrl + S)**.
4. Click **Deploy > Manage Deployments**.
5. Click the **Pencil (Edit)** icon on your active deployment.
6. Under **Version**, choose **New Version**.
7. Click **Deploy**.

> [!TIP]
> Always deploy as a **New Version** whenever modifying `Code.gs`. This ensures your deployed Web App executes the latest backend logic immediately!
