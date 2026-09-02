# Aura Reign Boutique Dashboard — Comprehensive System Documentation & Guide

Welcome to the complete architectural and operational documentation for the **Aura Reign Premium Dresses Boutique Management System**.

---

## 1. System Overview & Purpose

### Purpose
**Aura Reign Dashboard** is a luxury boutique order tracking, bale inventory, and business intelligence application tailored for fashion boutiques. It bridges a modern, responsive React web interface with **Google Sheets** as a serverless headless database via **Google Apps Script Web App REST API**.

### Key Capabilities
1. **Real-time Order Management:** Create, view, edit, search, filter, and paginate boutique orders seamlessly.
2. **Per-Bale Inventory & Profit/Loss Unit Economics:**
   - **Bale Management:** Register bales with Bought Price (Cost), Initial Garment Stock, and Notes.
   - **Stock Deduction:** Assign orders to specific bales to deduct real-time garment stock.
   - **Financial Return & ROI:** Live profit/loss calculation (`Realized Sales - Bought Price`), profit margin %, and visual break-even progress bars.
3. **Dynamic Monthly Boutique KPIs:**
   - **Total Units Sold:** Tracks verified units sold from completed (`Done`) orders this month.
   - **Total Sales:** Real-time revenue summation with dynamic growth/decline percentage trend (`+/- %`).
   - **Orders Fulfilled:** Ratio of completed vs. total orders.
   - **Pending Orders:** Alert card indicating incoming orders that need boutique attention.
   - **Fulfillment Split:** Dynamic visual bar contrasting Pick Up vs. Shipped orders.
4. **Local Sandbox Mode:** Isolated offline testing environment that allows you to safely test all bale calculations, stock deductions, and order operations without touching live spreadsheet data.
5. **Multi-device Experience:** Designed with responsive luxury aesthetics for desktop monitors and expandable accordion cards for mobile smartphones.

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
│         Google Sheet ("Orders" & "Bales" Tabs)         │
│                  Headless Database                     │
└────────────────────────────────────────────────────────┘
```

### Database Schema (Google Sheet Columns)

#### Tab 1: `Orders`
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
| **K** | `Bale` | String | Assigned source bale name (e.g. `Bale #1 — Silk & Lace`) |

#### Tab 2: `Bales`
| Column | Header | Type | Description |
| :--- | :--- | :--- | :--- |
| **A** | `Bale ID` | String | Auto-generated unique bale ID (e.g. `BALE-20260815-102`) |
| **B** | `Date Added` | ISO String | Date when bale was registered |
| **C** | `Bale Name` | String | Human-readable title (e.g. `Bale #1 — Silk & Lace`) |
| **D** | `Bought Price` | Number / Currency | Purchase cost of the bale (₱) |
| **E** | `Initial Stock` | Integer | Total initial garment pieces in the bale |
| **F** | `Status` | Dropdown | `Active`, `Sold Out`, or `Archived` |
| **G** | `Notes` | String | Supplier details or fabric notes |

---

## 3. Local Sandbox Testing vs. Live Google Sheets

The dashboard includes a built-in **Data Mode Switcher** located in the top banner:

* **Local Sandbox Mode (Default):** 
  - Runs 100% locally in browser memory (`localStorage`).
  - Perfect for testing bale additions, order placements, stock deductions, and profit/loss math safely.
  - Features a **"Reset Sample Data"** button to restore sample bales and orders anytime.
* **Live Google Sheets Mode:**
  - Connects to your deployed Google Apps Script Web App REST API.
  - Automatically fetches and updates real-time data from your Google Sheet tabs.

---

## 4. User Tutorial & Operational Guide

### Step 1: Managing Bales & Tracking Profit / Loss
1. Click **+ Add Bale** (in header) or switch to the **"Bale Inventory & Profit / Loss"** tab.
2. Enter the **Bale Name**, **Bought Price (₱)** (e.g., `12000`), **Initial Stock** (e.g., `40` pieces), and optional supplier notes.
3. Review the live Bale Card metrics:
   - **Bought Price:** Total capital invested in this batch.
   - **Realized Sales:** Revenue collected from `Done` orders.
   - **Net Profit / Loss & ROI:** Displays green profit badges with `+₱` and `% ROI` once break-even is achieved.
   - **Stock Status:** Live count of remaining vs. sold pieces with a visual progress bar.

### Step 2: Creating an Order with Assigned Bale
1. Click **+ New Order**.
2. Select the **Source Bale** from the dropdown (shows remaining stock next to each bale name).
3. If an item doesn't belong to a bale, select **"None / Unassigned"**.
4. Configure Customer Name, Fulfillment, Dress Sizes, and Total Sale Amount.
5. Click **Complete Order**.
   - The bale's remaining stock immediately decreases.
   - When the order is marked `Done`, sales revenue is attributed directly to the bale's profit calculation.

### Step 3: Filtering by Bale
- In the **Monthly Overview & Orders** tab, select a specific bale from the **Bale Filter** dropdown to view all orders linked to that bale.
- Or click the **Assigned Bale** pill directly on any order row.

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
