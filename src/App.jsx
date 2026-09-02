import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, RefreshCw, CheckCircle, Clock,
  ShoppingBag, X, Package,
  CreditCard, Loader2, Calendar, Filter,
  Eye, Edit3, Trash2, Minus, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Boxes, BarChart3
} from 'lucide-react';

// --- CONFIGURATION ---
const WEB_APP_URL = import.meta.env.WEB_APP_URL || "https://script.google.com/macros/s/AKfycbwMnkVt1PmTg6qflVOOJx-ZMINXSyo2l_BYcqlMCOeJBN4w-Hc7gteWH-Ls0rdnxLz0/exec";

// --- INITIAL MOCK DATA FOR LOCAL SANDBOX & FALLBACK ---
const INITIAL_MOCK_BALES = [
  {
    "Bale ID": "BALE-2026-001",
    "Date Added": "2026-08-15T00:00:00.000Z",
    "Bale Name": "Bale #1 — Silk & Lace Evening Gowns",
    "Bought Price": 12000,
    "Initial Stock": 40,
    "Status": "Active",
    "Notes": "Curated French and Italian silk maxi dresses",
    "Supplier": "French & Italian Silks"
  },
  {
    "Bale ID": "BALE-2026-002",
    "Date Added": "2026-08-20T00:00:00.000Z",
    "Bale Name": "Bale #2 — Summer Floral Sundresses",
    "Bought Price": 8500,
    "Initial Stock": 35,
    "Status": "Active",
    "Notes": "Lightweight cotton & linen casual collection",
    "Supplier": "Cotton & Linen Co."
  },
  {
    "Bale ID": "BALE-2026-003",
    "Date Added": "2026-08-25T00:00:00.000Z",
    "Bale Name": "Bale #3 — Vintage Velvet & Wool",
    "Bought Price": 15000,
    "Initial Stock": 30,
    "Status": "Active",
    "Notes": "Premium autumn outerwear & velvet evening pieces",
    "Supplier": "Tokyo Vintage Atelier"
  }
];

const INITIAL_MOCK_ORDERS = [
  {
    "Order ID": "AR-20260902-5408",
    "Timestamp": "2026-09-02T08:34:00.000Z",
    "Customer Name": "Angel Marquez",
    "Fulfillment Type": "Pick Up",
    "Shipping Address": "Store Pickup",
    "Size / Variant": "1x S",
    "Quantity": 1,
    "Total Amount": 300,
    "Status": "Pending",
    "Completed At": "",
    "Bale": "Bale #1 — Silk & Lace Evening Gowns"
  },
  {
    "Order ID": "AR-20260902-4578",
    "Timestamp": "2026-09-02T08:34:00.000Z",
    "Customer Name": "Camille Borinaga",
    "Fulfillment Type": "Pick Up",
    "Shipping Address": "Store Pickup",
    "Size / Variant": "1x S",
    "Quantity": 1,
    "Total Amount": 100,
    "Status": "Completed",
    "Completed At": "2026-09-02T09:00:00.000Z",
    "Bale": "Bale #1 — Silk & Lace Evening Gowns"
  },
  {
    "Order ID": "AR-20260902-2210",
    "Timestamp": "2026-09-02T08:33:00.000Z",
    "Customer Name": "Honey Alvarado",
    "Fulfillment Type": "Pick Up",
    "Shipping Address": "Store Pickup",
    "Size / Variant": "1x S",
    "Quantity": 1,
    "Total Amount": 120,
    "Status": "Pending",
    "Completed At": "",
    "Bale": "Bale #2 — Summer Floral Sundresses"
  },
  {
    "Order ID": "AR-20260902-9994",
    "Timestamp": "2026-09-02T08:33:00.000Z",
    "Customer Name": "Somette braga",
    "Fulfillment Type": "Pick Up",
    "Shipping Address": "Store Pickup",
    "Size / Variant": "1x S",
    "Quantity": 1,
    "Total Amount": 100,
    "Status": "Completed",
    "Completed At": "2026-09-02T09:15:00.000Z",
    "Bale": "Bale #2 — Summer Floral Sundresses"
  },
  {
    "Order ID": "AR-20260902-2062",
    "Timestamp": "2026-09-02T08:32:00.000Z",
    "Customer Name": "Lovely German",
    "Fulfillment Type": "Pick Up",
    "Shipping Address": "Store Pickup",
    "Size / Variant": "1x S",
    "Quantity": 1,
    "Total Amount": 79,
    "Status": "Completed",
    "Completed At": "2026-09-02T09:30:00.000Z",
    "Bale": "Bale #1 — Silk & Lace Evening Gowns"
  },
  {
    "Order ID": "AR-20260902-1773",
    "Timestamp": "2026-09-02T00:05:00.000Z",
    "Customer Name": "Lia mae",
    "Fulfillment Type": "Pick Up",
    "Shipping Address": "Store Pickup",
    "Size / Variant": "1x S",
    "Quantity": 1,
    "Total Amount": 79,
    "Status": "Pending",
    "Completed At": "",
    "Bale": "Bale #3 — Vintage Velvet & Wool"
  },
  {
    "Order ID": "AR-20260830-4921",
    "Timestamp": "2026-08-30T08:21:00.000Z",
    "Customer Name": "Elena Gilbert",
    "Fulfillment Type": "Shipping",
    "Shipping Address": "via J&T Express",
    "Size / Variant": "1x M, 1x L",
    "Quantity": 2,
    "Total Amount": 9000,
    "Status": "Completed",
    "Completed At": "2026-08-30T10:00:00.000Z",
    "Bale": "Bale #1 — Silk & Lace Evening Gowns"
  },
  {
    "Order ID": "AR-20260829-1234",
    "Timestamp": "2026-08-29T14:10:00.000Z",
    "Customer Name": "Caroline Forbes",
    "Fulfillment Type": "Pick Up",
    "Shipping Address": "Store Pickup",
    "Size / Variant": "1x S",
    "Quantity": 1,
    "Total Amount": 4500,
    "Status": "Completed",
    "Completed At": "2026-08-30T10:00:00.000Z",
    "Bale": "Bale #1 — Silk & Lace Evening Gowns"
  },
  {
    "Order ID": "AR-20260828-5678",
    "Timestamp": "2026-08-28T11:45:00.000Z",
    "Customer Name": "Bonnie Bennett",
    "Fulfillment Type": "Shipping",
    "Shipping Address": "via Flash Express",
    "Size / Variant": "2x M",
    "Quantity": 2,
    "Total Amount": 5200,
    "Status": "Completed",
    "Completed At": "2026-08-29T09:30:00.000Z",
    "Bale": "Bale #2 — Summer Floral Sundresses"
  },
  {
    "Order ID": "AR-20260827-9012",
    "Timestamp": "2026-08-27T16:20:00.000Z",
    "Customer Name": "Katherine Pierce",
    "Fulfillment Type": "Pick Up",
    "Shipping Address": "Store Pickup",
    "Size / Variant": "1x XS, 1x S",
    "Quantity": 2,
    "Total Amount": 4800,
    "Status": "Pending",
    "Completed At": "",
    "Bale": "Bale #2 — Summer Floral Sundresses"
  }
];

// Helper: Normalize order objects
function normalizeOrder(order) {
  if (!order) return null;

  const customerName = order["Customer Name"] || order["customerName"] || order["Customer"] || order["customer"] || "";
  let fulfillmentType = order["Fulfillment Type"] || order["fulfillmentType"] || order["Fulfillment"] || order["fulfillment"] || "Pick Up";
  if (fulfillmentType.toLowerCase().includes("ship")) {
    fulfillmentType = "Shipping";
  } else if (fulfillmentType.toLowerCase().includes("pick")) {
    fulfillmentType = "Pick Up";
  }

  const shippingAddress = order["Shipping Address"] || order["shippingAddress"] || order["Shipping Addres"] || order["shippingAddres"] || order["Address"] || "";
  const sizeVariant = order["Size / Variant"] || order["sizeVariant"] || order["Items Breakdown"] || order["itemsBreakdown"] || order["Size"] || order["size"] || "";
  const bale = order["Bale"] || order["bale"] || order["Bale Name"] || order["baleName"] || "";

  const rawQty = order["Quantity"] ?? order["quantity"] ?? order["Total Quantity"] ?? order["totalQuantity"] ?? 1;
  const qty = parseInt(String(rawQty).replace(/[^0-9]/g, ''), 10) || 1;

  const rawAmount = order["Total Amount"] ?? order["totalAmount"] ?? order["Amount"] ?? order["amount"] ?? 0;
  const amount = typeof rawAmount === 'number'
    ? rawAmount
    : parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, '')) || 0;

  let rawStatus = (order["Status"] || order["status"] || "Pending").toString().trim();
  let status = "Pending";
  if (rawStatus.toLowerCase() === "done" || rawStatus.toLowerCase() === "completed") {
    status = "Completed";
  } else if (rawStatus.toLowerCase() === "cancelled" || rawStatus.toLowerCase() === "canceled") {
    status = "Cancelled";
  }

  return {
    "Order ID": (order["Order ID"] || order["orderId"] || "").toString().trim(),
    "Timestamp": order["Timestamp"] || order["timestamp"] ? String(order["Timestamp"] || order["timestamp"]) : new Date().toISOString(),
    "Customer Name": customerName.toString().trim(),
    "Fulfillment Type": fulfillmentType,
    "Shipping Address": shippingAddress.toString().trim(),
    "Size / Variant": sizeVariant.toString().trim(),
    "Quantity": qty,
    "Total Amount": amount,
    "Status": status,
    "Completed At": (order["Completed At"] || order["completedAt"] || "").toString().trim(),
    "Bale": bale.toString().trim()
  };
}

// Helper: Normalize bale objects
function normalizeBale(bale) {
  if (!bale) return null;

  const rawPrice = bale["Bought Price"] ?? bale["boughtPrice"] ?? bale["Cost"] ?? bale["price"] ?? 0;
  const boughtPrice = typeof rawPrice === 'number'
    ? rawPrice
    : parseFloat(String(rawPrice).replace(/[^0-9.-]+/g, '')) || 0;

  const rawStock = bale["Initial Stock"] ?? bale["initialStock"] ?? bale["Stock"] ?? bale["Quantity"] ?? 0;
  const initialStock = parseInt(String(rawStock).replace(/[^0-9]/g, ''), 10) || 0;

  return {
    "Bale ID": (bale["Bale ID"] || bale["baleId"] || `BALE-${Date.now()}`).toString().trim(),
    "Date Added": bale["Date Added"] || bale["dateAdded"] || new Date().toISOString(),
    "Bale Name": (bale["Bale Name"] || bale["baleName"] || "Unnamed Bale").toString().trim(),
    "Bought Price": boughtPrice,
    "Initial Stock": initialStock,
    "Status": (bale["Status"] || bale["status"] || "Active").toString().trim(),
    "Notes": (bale["Notes"] || bale["notes"] || "").toString().trim(),
    "Supplier": (bale["Supplier"] || bale["supplier"] || "General Supplier").toString().trim()
  };
}

// Helper: Calculate monthly KPIs
function calculateMetrics(orders) {
  const validOrders = (orders || []).filter(o => o && o["Order ID"]);

  let totalSold = 0;
  let totalSales = 0;
  let ordersCompleted = 0;
  let ordersPending = 0;
  let pickupCount = 0;
  let shippedCount = 0;

  validOrders.forEach(order => {
    const qty = parseInt(order["Quantity"] || 0, 10);
    const amount = parseFloat(order["Total Amount"] || 0);
    const status = order["Status"];
    const fulfillment = order["Fulfillment Type"];

    if (status === "Completed") {
      ordersCompleted++;
      totalSold += qty;
      totalSales += amount;
    } else if (status === "Pending") {
      ordersPending++;
    }

    if (fulfillment === "Pick Up") pickupCount++;
    else shippedCount++;
  });

  return {
    totalSold,
    totalSales,
    ordersCompleted,
    ordersPending,
    avgOrderValue: (ordersCompleted > 0) ? (totalSales / ordersCompleted) : 0,
    pickupCount,
    shippedCount,
    totalOrders: validOrders.length
  };
}

// Helper: Calculate per-bale unit economics & stock metrics
function calculateBaleMetrics(bales, orders) {
  const validOrders = (orders || []).filter(o => o && o["Order ID"]);

  return (bales || []).map(bale => {
    const baleName = bale["Bale Name"] || "";
    const baleId = bale["Bale ID"] || "";
    const initialStock = parseInt(bale["Initial Stock"] || 0, 10);
    const boughtPrice = parseFloat(bale["Bought Price"] || 0);

    const matchingOrders = validOrders.filter(o => {
      const orderBale = (o["Bale"] || "").trim();
      return orderBale && (orderBale === baleName || orderBale === baleId);
    });

    let totalAllocatedQty = 0;
    let realizedSoldQty = 0;
    let realizedSales = 0;
    let completedOrdersCount = 0;
    let pendingOrdersCount = 0;

    matchingOrders.forEach(order => {
      const qty = parseInt(order["Quantity"] || 1, 10);
      const amount = parseFloat(order["Total Amount"] || 0);
      totalAllocatedQty += qty;

      if (order["Status"] === "Completed") {
        realizedSoldQty += qty;
        realizedSales += amount;
        completedOrdersCount++;
      } else if (order["Status"] === "Pending") {
        pendingOrdersCount++;
      }
    });

    const remainingStock = Math.max(0, initialStock - totalAllocatedQty);
    const netProfit = realizedSales - boughtPrice;
    const isProfitable = netProfit >= 0;
    const roi = boughtPrice > 0 ? ((realizedSales - boughtPrice) / boughtPrice) * 100 : 0;
    const recoveryPct = boughtPrice > 0 ? (realizedSales / boughtPrice) * 100 : (realizedSales > 0 ? 100 : 0);
    const sellThroughPct = initialStock > 0 ? Math.min(100, Math.round((totalAllocatedQty / initialStock) * 100)) : 0;

    return {
      ...bale,
      ordersCount: matchingOrders.length,
      completedOrdersCount,
      pendingOrdersCount,
      totalAllocatedQty,
      realizedSoldQty,
      remainingStock,
      realizedSales,
      netProfit,
      isProfitable,
      roi,
      recoveryPct,
      sellThroughPct
    };
  });
}

// Helper: Parse items breakdown e.g. "1x S"
function parseItemsBreakdown(breakdownStr) {
  if (!breakdownStr) return [{ size: "Small (S)", qty: 1 }];
  try {
    const items = breakdownStr.split(',').map(item => {
      const trimmed = item.trim();
      const parts = trimmed.split('x');
      if (parts.length === 2) {
        const qty = parseInt(parts[0].trim(), 10) || 1;
        const rawSize = parts[1].trim();
        let size = rawSize;
        if (rawSize === 'XS' || rawSize === 'Extra Small (XS)') size = 'Extra Small (XS)';
        else if (rawSize === 'S' || rawSize === 'Small (S)') size = 'Small (S)';
        else if (rawSize === 'M' || rawSize === 'Medium (M)') size = 'Medium (M)';
        else if (rawSize === 'L' || rawSize === 'Large (L)') size = 'Large (L)';
        else if (rawSize === 'XL' || rawSize === 'Extra Large (XL)') size = 'Extra Large (XL)';
        return { size, qty };
      }
      return { size: trimmed, qty: 1 };
    }).filter(Boolean);
    return items.length > 0 ? items : [{ size: "Small (S)", qty: 1 }];
  } catch {
    return [{ size: "Small (S)", qty: 1 }];
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "bales"
  const [data, setData] = useState({ metrics: null, orders: [], bales: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Tab 1: Separated Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("All");
  const [baleFilter, setBaleFilter] = useState("All");

  // Tab 2: Advanced Bale Filters & Sorting
  const [baleStatusFilter, setBaleStatusFilter] = useState("All");
  const [baleSupplierFilter, setBaleSupplierFilter] = useState("All");
  const [baleSortOption, setBaleSortOption] = useState("default");

  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [timePeriod, setTimePeriod] = useState("This Month");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, fulfillmentFilter, baleFilter]);

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isNewBaleModalOpen, setIsNewBaleModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingBale, setEditingBale] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    setRefreshing(true);

    try {
      if (!WEB_APP_URL || WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
        throw new Error("No Web App URL configured");
      }

      const response = await fetch(WEB_APP_URL);
      const result = await response.json();

      const rawOrders = Array.isArray(result.orders) ? result.orders : [];
      const rawBales = Array.isArray(result.bales) ? result.bales : [];

      const normalizedOrders = rawOrders.map(normalizeOrder).filter(o => o && o["Order ID"]);
      const normalizedBales = rawBales.map(normalizeBale).filter(b => b && b["Bale ID"]);

      // Strictly use live data from database — NEVER fall back to sample mock bales
      setData({
        metrics: calculateMetrics(normalizedOrders),
        orders: normalizedOrders,
        bales: normalizedBales
      });
    } catch (error) {
      console.error("Error fetching live data:", error);
      showToast("Could not sync with Google Sheets. Check connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle order status
  const handleToggleStatus = async (orderId, currentStatus) => {
    const newStatus = currentStatus === "Pending" ? "Completed" : "Pending";

    const updatedOrders = data.orders.map(order =>
      order["Order ID"] === orderId
        ? {
          ...order,
          Status: newStatus,
          "Completed At": newStatus === "Completed" ? new Date().toISOString() : ""
        }
        : order
    );

    setData(prev => ({
      ...prev,
      orders: updatedOrders,
      metrics: calculateMetrics(updatedOrders)
    }));

    showToast(`Order ${orderId} marked as ${newStatus}`);

    try {
      await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'toggleStatus', orderId }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling status:", error);
      showToast("Error updating order status in Google Sheets");
    }
  };

  // Order save/update
  const handleSaveOrder = async (orderData, isEditing) => {
    if (isEditing) {
      const normalizedUpdated = normalizeOrder(orderData);
      const updatedOrders = data.orders.map(order =>
        order["Order ID"] === normalizedUpdated["Order ID"] ? normalizedUpdated : order
      );

      setData(prev => ({
        ...prev,
        metrics: calculateMetrics(updatedOrders),
        orders: updatedOrders
      }));

      if (viewingOrder && viewingOrder["Order ID"] === normalizedUpdated["Order ID"]) {
        setViewingOrder(normalizedUpdated);
      }

      showToast(`Order ${normalizedUpdated["Order ID"]} updated successfully`);

      try {
        await fetch(WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'updateOrder',
            orderId: normalizedUpdated["Order ID"],
            customerName: normalizedUpdated["Customer Name"],
            fulfillmentType: normalizedUpdated["Fulfillment Type"],
            shippingAddress: normalizedUpdated["Shipping Address"],
            sizeVariant: normalizedUpdated["Size / Variant"],
            itemsBreakdown: normalizedUpdated["Size / Variant"],
            quantity: normalizedUpdated["Quantity"],
            totalQuantity: normalizedUpdated["Quantity"],
            totalAmount: normalizedUpdated["Total Amount"],
            status: normalizedUpdated["Status"],
            bale: normalizedUpdated["Bale"]
          }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        fetchData();
      } catch (error) {
        console.error("Error updating order:", error);
        showToast("Error updating order in Google Sheets");
      }
    } else {
      const newOrder = normalizeOrder({
        "Order ID": `AR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        "Timestamp": new Date().toISOString(),
        "Status": "Pending",
        "Completed At": "",
        ...orderData
      });

      const updatedOrders = [newOrder, ...data.orders];

      setData(prev => ({
        ...prev,
        metrics: calculateMetrics(updatedOrders),
        orders: updatedOrders
      }));

      showToast(`New Order ${newOrder["Order ID"]} created successfully`);

      try {
        await fetch(WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'addOrder',
            orderId: newOrder["Order ID"],
            customerName: newOrder["Customer Name"],
            fulfillmentType: newOrder["Fulfillment Type"],
            shippingAddress: newOrder["Shipping Address"],
            sizeVariant: newOrder["Size / Variant"],
            itemsBreakdown: newOrder["Size / Variant"],
            quantity: newOrder["Quantity"],
            totalQuantity: newOrder["Quantity"],
            totalAmount: newOrder["Total Amount"],
            status: newOrder["Status"],
            bale: newOrder["Bale"]
          }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        fetchData();
      } catch (error) {
        console.error("Error creating order:", error);
        showToast("Error creating order in Google Sheets");
      }
    }
  };

  // Bale Handlers
  const handleSaveBale = async (baleData, isEditing) => {
    if (isEditing) {
      const normalizedUpdated = normalizeBale(baleData);
      const updatedBales = data.bales.map(b =>
        b["Bale ID"] === normalizedUpdated["Bale ID"] ? normalizedUpdated : b
      );

      setData(prev => ({
        ...prev,
        bales: updatedBales
      }));

      showToast(`Bale "${normalizedUpdated["Bale Name"]}" updated`);

      try {
        await fetch(WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'updateBale',
            baleId: normalizedUpdated["Bale ID"],
            baleName: normalizedUpdated["Bale Name"],
            boughtPrice: normalizedUpdated["Bought Price"],
            initialStock: normalizedUpdated["Initial Stock"],
            status: normalizedUpdated["Status"],
            notes: normalizedUpdated["Notes"]
          }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        fetchData();
      } catch (error) {
        console.error("Error updating bale:", error);
        showToast("Error updating bale in Google Sheets");
      }
    } else {
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const newBale = normalizeBale({
        "Bale ID": `BALE-${dateStr}-${randomSuffix}`,
        "Date Added": date.toISOString(),
        "Status": "Active",
        ...baleData
      });

      const updatedBales = [newBale, ...data.bales];

      setData(prev => ({
        ...prev,
        bales: updatedBales
      }));

      showToast(`Bale "${newBale["Bale Name"]}" created`);

      try {
        await fetch(WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'addBale',
            baleId: newBale["Bale ID"],
            baleName: newBale["Bale Name"],
            boughtPrice: newBale["Bought Price"],
            initialStock: newBale["Initial Stock"],
            status: newBale["Status"],
            notes: newBale["Notes"],
            dateAdded: newBale["Date Added"]
          }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        fetchData();
      } catch (error) {
        console.error("Error creating bale:", error);
        showToast("Error creating bale in Google Sheets");
      }
    }
  };

  const handleDeleteBale = async (baleId, baleName) => {
    if (!window.confirm(`Are you sure you want to delete "${baleName}"?`)) return;

    const updatedBales = data.bales.filter(b => b["Bale ID"] !== baleId);
    setData(prev => ({
      ...prev,
      bales: updatedBales
    }));

    showToast(`Bale "${baleName}" removed`);

    try {
      await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'deleteBale', baleId }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting bale:", error);
      showToast("Error deleting bale in Google Sheets");
    }
  };

  // Bale Analytics
  const baleAnalytics = useMemo(() => {
    return calculateBaleMetrics(data.bales, data.orders);
  }, [data.bales, data.orders]);

  // Overall Bale Summary Stats for top maroon banner (Exact match to Image 1)
  const overallBaleSummary = useMemo(() => {
    let totalInvested = 0;
    let totalRevenue = 0;
    let totalPiecesInitial = 0;
    let totalPiecesAllocated = 0;
    let totalPiecesSold = 0;

    baleAnalytics.forEach(b => {
      totalInvested += b["Bought Price"] || 0;
      totalRevenue += b.realizedSales || 0;
      totalPiecesInitial += b["Initial Stock"] || 0;
      totalPiecesAllocated += b.totalAllocatedQty || 0;
      totalPiecesSold += b.realizedSoldQty || 0;
    });

    const netProfit = totalRevenue - totalInvested;
    const isProfitable = netProfit >= 0;
    const overallRoi = totalInvested > 0 ? ((totalRevenue - totalInvested) / totalInvested) * 100 : 0;
    const totalRemaining = Math.max(0, totalPiecesInitial - totalPiecesAllocated);

    return {
      totalInvested,
      totalRevenue,
      netProfit,
      isProfitable,
      overallRoi,
      totalPiecesInitial,
      totalPiecesAllocated,
      totalPiecesSold,
      totalRemaining
    };
  }, [baleAnalytics]);

  // Advanced Filtered and Sorted Bales (for Tab 2)
  const filteredBales = useMemo(() => {
    let list = [...baleAnalytics];

    // Status Filter
    if (baleStatusFilter !== "All") {
      if (baleStatusFilter === "Active") list = list.filter(b => b.remainingStock > 0);
      else if (baleStatusFilter === "Depleted") list = list.filter(b => b.remainingStock <= 5 && b.remainingStock > 0);
      else if (baleStatusFilter === "Sold Out") list = list.filter(b => b.remainingStock === 0);
    }

    // Supplier Filter
    if (baleSupplierFilter !== "All") {
      list = list.filter(b => (b["Supplier"] || b["Notes"] || "").toLowerCase().includes(baleSupplierFilter.toLowerCase()));
    }

    // Sorting
    if (baleSortOption === "recouped") {
      list.sort((a, b) => b.recoveryPct - a.recoveryPct);
    } else if (baleSortOption === "profit_desc") {
      list.sort((a, b) => b.netProfit - a.netProfit);
    } else if (baleSortOption === "profit_asc") {
      list.sort((a, b) => a.netProfit - b.netProfit);
    } else if (baleSortOption === "stock_desc") {
      list.sort((a, b) => b.remainingStock - a.remainingStock);
    }

    return list;
  }, [baleAnalytics, baleStatusFilter, baleSupplierFilter, baleSortOption]);

  // Filter orders for Tab 1
  const filteredOrders = useMemo(() => {
    return (data.orders || []).filter(order => {
      const orderId = (order["Order ID"] || "").toString().trim();
      if (!orderId) return false;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        (order["Customer Name"] || "").toLowerCase().includes(searchLower) ||
        orderId.toLowerCase().includes(searchLower) ||
        (order["Size / Variant"] || "").toLowerCase().includes(searchLower) ||
        (order["Shipping Address"] || "").toLowerCase().includes(searchLower) ||
        (order["Bale"] || "").toLowerCase().includes(searchLower);

      let matchesStatus = true;
      if (statusFilter === "Pending") matchesStatus = order["Status"] === "Pending";
      else if (statusFilter === "Completed") matchesStatus = order["Status"] === "Completed";
      else if (statusFilter === "Cancelled") matchesStatus = order["Status"] === "Cancelled";

      let matchesFulfillment = true;
      if (fulfillmentFilter === "Pick Up") matchesFulfillment = order["Fulfillment Type"] === "Pick Up";
      else if (fulfillmentFilter === "Shipping") matchesFulfillment = order["Fulfillment Type"] === "Shipping";

      let matchesBale = true;
      if (baleFilter !== "All") {
        if (baleFilter === "Unassigned") {
          matchesBale = !order["Bale"] || order["Bale"].trim() === "";
        } else {
          matchesBale = order["Bale"] === baleFilter;
        }
      }

      return matchesSearch && matchesStatus && matchesFulfillment && matchesBale;
    });
  }, [data.orders, searchQuery, statusFilter, fulfillmentFilter, baleFilter]);

  // Dynamic metrics for the top cards:
  // When baleFilter is 'All', displays the overall metrics across all bales this month.
  // When a specific bale is selected, dynamically computes total sales, units sold, and fulfillment for that bale.
  const displayedMetrics = useMemo(() => {
    if (baleFilter === "All") {
      return data.metrics || calculateMetrics(data.orders);
    }
    const matchingOrders = (data.orders || []).filter(order => {
      const orderBale = (order["Bale"] || "").trim();
      if (baleFilter === "Unassigned") {
        return !orderBale;
      }
      return orderBale === baleFilter;
    });
    return calculateMetrics(matchingOrders);
  }, [baleFilter, data.metrics, data.orders]);

  // Dynamically extract unique suppliers from registered bales
  const availableSuppliers = useMemo(() => {
    const suppliers = new Set();
    (data.bales || []).forEach(b => {
      const sup = (b["Supplier"] || "").trim();
      if (sup) suppliers.add(sup);
    });
    return Array.from(suppliers);
  }, [data.bales]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  return (
    <div className="min-h-screen bg-cream-300 font-sans text-wine-900 flex flex-col justify-between">
      <div className="w-full max-w-[1340px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* Modern Luxury Header Banner */}
        <header className="bg-wine-900 text-cream-100 py-3.5 px-5 sm:px-6 rounded-t-xl shadow-md border-b border-wine-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/aura-logo.png"
              alt="Aura Reign Logo"
              className="w-10 h-10 rounded-full object-cover border border-gold-500/60 shadow-xs shrink-0"
            />
            <div>
              <h1 className="text-xl sm:text-2xl tracking-widest font-serif font-bold text-gold-300 uppercase">
                AURA REIGN
              </h1>
              <p className="text-cream-300 text-[10px] sm:text-xs tracking-widest uppercase opacity-85 mt-0.5">
                PREMIUM DRESSES &bull; BOUTIQUE &amp; BALE MANAGEMENT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsNewBaleModalOpen(true)}
              className="bg-wine-700 hover:bg-wine-600 text-cream-100 font-bold py-2 px-3.5 rounded-lg border border-gold-500/40 shadow-xs transition-all flex items-center gap-1.5 text-xs"
            >
              <Package size={15} className="text-gold-300" />
              <span>+ Add Bale</span>
            </button>

            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              className="bg-gold-500 hover:bg-gold-300 text-wine-900 font-bold py-2 px-4 rounded-lg shadow-xs transition-all flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>+ New Order</span>
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-wine-900/95 border-b border-gold-500/30 px-4 sm:px-6 flex items-center gap-2 pt-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2.5 px-4 font-serif text-sm sm:text-base font-bold tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${activeTab === "overview"
              ? "border-gold-300 text-gold-300"
              : "border-transparent text-cream-300/70 hover:text-cream-100"
              }`}
          >
            <BarChart3 size={16} />
            <span>Monthly Overview &amp; Orders</span>
          </button>

          <button
            onClick={() => setActiveTab("bales")}
            className={`py-2.5 px-4 font-serif text-sm sm:text-base font-bold tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${activeTab === "bales"
              ? "border-gold-300 text-gold-300"
              : "border-transparent text-cream-300/70 hover:text-cream-100"
              }`}
          >
            <Boxes size={16} />
            <span>Bale Inventory &amp; Profit / Loss</span>
            <span className="bg-gold-500/20 text-gold-300 text-[10px] px-2 py-0.5 rounded-full font-sans font-bold">
              {data.bales.length}
            </span>
          </button>
        </nav>

        {/* Dashboard Main Container */}
        <main className="bg-white rounded-b-xl shadow-lg border border-cream-500/50 p-4 sm:p-6 lg:p-7">

          {loading && !data.metrics ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3">
              <Loader2 className="animate-spin text-gold-700 h-10 w-10" />
              <p className="text-sm font-medium text-wine-900/60">Loading boutique analytics...</p>
            </div>
          ) : (
            <>
              {/* --- TAB 1: MONTHLY OVERVIEW & ORDERS --- */}
              {activeTab === "overview" && (
                <div className="space-y-6">

                  {/* Filter Toolbar */}
                  <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-900/40" size={15} />
                      <input
                        type="text"
                        placeholder="Search Orders, Customers, Sizes, Products..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-cream-500 bg-white focus:outline-none focus:border-wine-700 focus:ring-1 focus:ring-wine-700 transition-all text-xs text-wine-900 placeholder:text-wine-900/40 shadow-xs"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-900/40 hover:text-wine-900"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      {/* Status Filter Group */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-wine-900/70 text-xs">Status:</span>
                        <div className="inline-flex rounded-lg p-0.5 bg-cream-300 border border-cream-500/60">
                          {['All', 'Pending', 'Completed', 'Cancelled'].map(st => (
                            <button
                              key={st}
                              onClick={() => setStatusFilter(st)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${statusFilter === st
                                ? 'bg-wine-900 text-cream-100 shadow-xs font-bold'
                                : 'text-wine-900/80 hover:text-wine-900 hover:bg-cream-100'
                                }`}
                            >
                              [{st}]
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fulfillment Filter Group */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-wine-900/70 text-xs">Fulfillment:</span>
                        <div className="inline-flex rounded-lg p-0.5 bg-cream-300 border border-cream-500/60">
                          {['All', 'Pick Up', 'Shipping'].map(ful => (
                            <button
                              key={ful}
                              onClick={() => setFulfillmentFilter(ful)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${fulfillmentFilter === ful
                                ? 'bg-wine-900 text-cream-100 shadow-xs font-bold'
                                : 'text-wine-900/80 hover:text-wine-900 hover:bg-cream-100'
                                }`}
                            >
                              [{ful}]
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Active Bale Filter Tag if selected */}
                      {baleFilter !== "All" && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gold-500/20 border border-gold-500/50 text-wine-900 text-xs font-bold shadow-2xs">
                          <Boxes size={13} className="text-gold-700 shrink-0" />
                          <span className="truncate max-w-[170px]">{baleFilter}</span>
                          <button
                            onClick={() => setBaleFilter("All")}
                            className="hover:text-red-700 p-0.5 rounded-full hover:bg-gold-500/30 transition-colors ml-0.5 cursor-pointer"
                            title="Reset to All Bales"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}

                      {/* Refresh Button */}
                      <button
                        onClick={fetchData}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-cream-500 bg-white text-wine-900 hover:bg-cream-300 transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                        title="Refresh Data"
                      >
                        <RefreshCw size={13} className={refreshing ? "animate-spin text-gold-700" : ""} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Refined Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-cream-300/30 rounded-xl p-4 sm:p-5 border border-cream-500/70 flex flex-col justify-between shadow-xs">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-wine-900/70 uppercase tracking-widest">TOTAL UNITS SOLD</p>
                        <div className="text-wine-900/40">
                          <Package size={17} strokeWidth={1.75} />
                        </div>
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-sans font-bold text-wine-900 tracking-tight my-1">
                        {displayedMetrics?.totalSold ?? 0}
                      </h2>
                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-cream-500/40 text-[11px] gap-1.5">
                        <span className="font-bold text-wine-900/80 uppercase tracking-wider shrink-0 text-[10px]">
                          {baleFilter === "All" ? "THIS MONTH" : "BALE"}
                        </span>
                        <div className="relative flex items-center min-w-0">
                          <select
                            value={baleFilter}
                            onChange={(e) => setBaleFilter(e.target.value)}
                            className="bg-cream-100/90 hover:bg-cream-100 border border-cream-500 rounded-md pl-2 pr-6 py-0.5 text-[11px] font-semibold text-wine-900 outline-none focus:border-wine-900 shadow-2xs cursor-pointer max-w-[155px] truncate transition-colors appearance-none"
                            title="Filter metrics and orders by registered bale"
                          >
                            <option value="All">All Bales (This Month)</option>
                            {data.bales.map(b => (
                              <option key={b["Bale ID"]} value={b["Bale Name"]}>
                                {b["Bale Name"]}
                              </option>
                            ))}
                            {data.orders.some(o => !o["Bale"] || o["Bale"].trim() === "") && (
                              <option value="Unassigned">Unassigned Orders</option>
                            )}
                          </select>
                          <ChevronDown size={12} className="absolute right-1.5 text-wine-900/70 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-cream-300/30 rounded-xl p-4 sm:p-5 border border-cream-500/70 flex flex-col justify-between shadow-xs relative overflow-hidden">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-wine-900/70 uppercase tracking-widest">TOTAL SALES</p>
                        <div className="text-wine-900/40">
                          <CreditCard size={17} strokeWidth={1.75} />
                        </div>
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-sans font-bold text-wine-900 tracking-tight my-1">
                        ₱{(displayedMetrics?.totalSales ?? 0).toLocaleString()}
                      </h2>
                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-cream-500/40 text-[11px]">
                        <span className="font-bold text-wine-900/80 uppercase tracking-wider text-[10px]">
                          {baleFilter === "All" ? "THIS MONTH" : "BALE"}
                        </span>
                        <span className="font-bold text-wine-900/70 uppercase tracking-wider text-[10px] truncate max-w-[170px]" title={baleFilter === "All" ? "All Bales (This Month)" : baleFilter}>
                          {baleFilter === "All" ? "ALL BALES" : baleFilter}
                        </span>
                      </div>
                    </div>

                    <div className="bg-cream-300/30 rounded-xl p-4 sm:p-5 border border-cream-500/70 flex flex-col justify-between shadow-xs">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-wine-900/70 uppercase tracking-widest">ORDERS FULFILLED</p>
                        <div className="text-wine-900/40">
                          <CheckCircle size={17} strokeWidth={1.75} />
                        </div>
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-sans font-bold text-wine-900 tracking-tight my-1">
                        {displayedMetrics?.ordersCompleted ?? 0} <span className="text-xl sm:text-2xl text-wine-900/50 font-normal">/ {baleFilter === "All" ? data.orders.length : (displayedMetrics?.totalOrders ?? 0)}</span>
                      </h2>
                      <div className="w-full h-1.5 bg-cream-300 rounded-full overflow-hidden my-1">
                        <div
                          style={{
                            width: `${(baleFilter === "All" ? data.orders.length : (displayedMetrics?.totalOrders ?? 0)) > 0
                              ? ((displayedMetrics?.ordersCompleted ?? 0) / (baleFilter === "All" ? data.orders.length : (displayedMetrics?.totalOrders ?? 1))) * 100
                              : 0}%`
                          }}
                          className="bg-wine-900 h-full rounded-full transition-all duration-500"
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-cream-500/40 text-[11px]">
                        <span className="font-bold text-wine-900/80 uppercase tracking-wider">
                          COMPLETED / TOTAL
                        </span>
                      </div>
                    </div>

                    <div className="bg-amber-50/40 rounded-xl p-4 sm:p-5 border-2 border-amber-400 flex flex-col justify-between shadow-xs relative">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-amber-900 uppercase tracking-widest">PENDING ORDERS</p>
                        <div className="text-amber-600">
                          <Clock size={17} strokeWidth={2} />
                        </div>
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-sans font-bold text-amber-700 tracking-tight my-1">
                        {displayedMetrics?.ordersPending ?? 0}
                      </h2>
                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-amber-300/60 text-[11px]">
                        <span className="font-bold text-amber-900 uppercase tracking-wider">
                          REQUIRES ATTENTION
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Orders Table */}
                  {filteredOrders.length > 0 ? (
                    <div className="flex flex-col justify-between min-h-[360px]">
                      <div className="hidden md:block overflow-x-auto rounded-xl border border-cream-500/70 bg-white shadow-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-cream-500/70 bg-cream-300/50 text-wine-900/70 uppercase text-[10px] tracking-widest font-bold">
                              <th className="py-3 px-4">ORDER ID / DATE</th>
                              <th className="py-3 px-4">CUSTOMER</th>
                              <th className="py-3 px-4">FULFILLMENT</th>
                              <th className="py-3 px-4">ITEMS</th>
                              <th className="py-3 px-4 text-right">TOTAL</th>
                              <th className="py-3 px-4 text-center">STATUS</th>
                              <th className="py-3 px-4 text-center">ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-cream-500/40">
                            {paginatedOrders.map(order => (
                              <OrderTableRow
                                key={order["Order ID"]}
                                order={order}
                                onView={() => setViewingOrder(order)}
                                onEdit={() => setEditingOrder(order)}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="md:hidden space-y-3">
                        {paginatedOrders.map(order => (
                          <MobileOrderCard
                            key={order["Order ID"]}
                            order={order}
                            onView={() => setViewingOrder(order)}
                            onEdit={() => setEditingOrder(order)}
                          />
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-cream-500/50 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
                        <span className="text-wine-900/70 font-medium">
                          Showing <span className="font-bold text-wine-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-wine-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}</span> of <span className="font-bold text-wine-900">{filteredOrders.length}</span> orders
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-2.5 py-1.5 rounded-md border border-cream-500 bg-white text-wine-900 disabled:opacity-40 hover:bg-cream-300 transition-colors flex items-center gap-1 font-semibold"
                          >
                            <ChevronLeft size={14} /> <span>Prev</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-7 h-7 rounded-md font-bold transition-all text-xs flex items-center justify-center ${currentPage === page
                                  ? 'bg-wine-900 text-cream-100 shadow-xs'
                                  : 'bg-white text-wine-900/80 border border-cream-500 hover:bg-cream-300'
                                  }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-2.5 py-1.5 rounded-md border border-cream-500 bg-white text-wine-900 disabled:opacity-40 hover:bg-cream-300 transition-colors flex items-center gap-1 font-semibold"
                          >
                            <span>Next</span> <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[260px] text-center text-wine-900/50 bg-cream-300/20 rounded-xl border border-cream-500/60 p-8 flex flex-col items-center justify-center">
                      <Search size={36} className="mx-auto mb-2 opacity-30" strokeWidth={1.5} />
                      <p className="text-base font-semibold text-wine-900">No matching orders found</p>
                      <p className="text-xs text-wine-900/60 mt-1">Try clearing your search query or switching status/fulfillment filters.</p>
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 2: BALE INVENTORY & PROFIT / LOSS (Exact Match to Image 1 Layout) --- */}
              {activeTab === "bales" && (
                <div className="space-y-6">
                  {/* 1. TOP MAROON HEADER BANNER (Exact Match to Image 1) */}
                  <div className="bg-wine-900 text-cream-100 p-5 sm:p-6 rounded-xl shadow-md border border-gold-500/30">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-wine-700/60">
                      <div>
                        <h2 className="text-base sm:text-lg font-serif font-bold text-gold-300 uppercase tracking-wider">
                          BALE UNIT ECONOMICS &amp; INVENTORY HUB
                        </h2>
                        <p className="text-xs text-cream-300 opacity-80 mt-0.5">
                          Financial returns, bought price break-even tracking, and remaining garment stock
                        </p>
                      </div>

                      <button
                        onClick={() => setIsNewBaleModalOpen(true)}
                        className="bg-cream-100 hover:bg-gold-300 text-wine-900 font-bold py-1.5 px-3.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 text-xs shrink-0"
                      >
                        <Plus size={15} strokeWidth={2.5} />
                        <span>+ Add New Bale</span>
                      </button>
                    </div>

                    {/* 4 KPIs directly in banner */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
                      <div>
                        <span className="text-[10px] text-cream-300/80 font-bold uppercase tracking-widest">TOTAL CAPITAL INVESTED</span>
                        <p className="text-xl sm:text-2xl font-bold font-sans text-cream-100 mt-0.5">
                          ₱{overallBaleSummary.totalInvested.toLocaleString()}
                        </p>
                        <span className="text-[10px] text-cream-300/70">Across {data.bales.length} registered bales</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-cream-300/80 font-bold uppercase tracking-widest">REALIZED REVENUE</span>
                        <p className="text-xl sm:text-2xl font-bold font-sans text-emerald-300 mt-0.5">
                          ₱{overallBaleSummary.totalRevenue.toLocaleString()}
                        </p>
                        <span className="text-[10px] text-cream-300/70">From fulfilled ('Done') orders</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-cream-300/80 font-bold uppercase tracking-widest">OVERALL NET PROFIT / LOSS</span>
                        <p className={`text-xl sm:text-2xl font-bold font-sans mt-0.5 ${overallBaleSummary.isProfitable ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {overallBaleSummary.netProfit >= 0 ? `+₱${overallBaleSummary.netProfit.toLocaleString()}` : `-₱${Math.abs(overallBaleSummary.netProfit).toLocaleString()}`}
                        </p>
                        <span className={`text-[10px] font-bold ${overallBaleSummary.isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {overallBaleSummary.overallRoi >= 0 ? `+${overallBaleSummary.overallRoi.toFixed(1)}% ROI` : `${overallBaleSummary.overallRoi.toFixed(1)}% ROI`}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-cream-300/80 font-bold uppercase tracking-widest">TOTAL STOCK REMAINING</span>
                        <p className="text-xl sm:text-2xl font-bold font-sans text-gold-300 mt-0.5">
                          {overallBaleSummary.totalRemaining} <span className="text-xs font-normal text-cream-300">/ {overallBaleSummary.totalPiecesInitial} pcs</span>
                        </p>
                        <span className="text-[10px] text-cream-300/70">{overallBaleSummary.totalPiecesSold} pieces sold</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. INDIVIDUAL BALE CARDS / EMPTY STATE */}
                  {data.bales.length === 0 ? (
                    <div className="bg-white rounded-xl border border-dashed border-cream-500/80 p-8 text-center shadow-xs flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-cream-300/60 flex items-center justify-center text-wine-900/60 mb-3 border border-cream-500/60">
                        <Boxes size={22} className="text-wine-900" />
                      </div>
                      <h4 className="font-serif font-bold text-wine-900 text-base">No Bales Registered in Database</h4>
                      <p className="text-xs text-wine-900/60 max-w-md mt-1 mb-4">
                        Your Google Sheets database currently has no bale records. Register your first bale to start tracking purchase costs, remaining stock, and recoup progress.
                      </p>
                      <button
                        onClick={() => setIsNewBaleModalOpen(true)}
                        className="bg-wine-900 hover:bg-wine-800 text-cream-100 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus size={14} /> Register First Bale
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {data.bales.map(bale => (
                        <div
                          key={bale["Bale ID"]}
                          className="bg-white rounded-xl border border-cream-500/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider">{bale["Bale ID"]}</span>
                              <div className="flex items-center gap-1.5 text-wine-900/40">
                                <button
                                  onClick={() => setEditingBale(bale)}
                                  className="hover:text-wine-900 p-0.5 transition-colors"
                                  title="Edit Bale"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteBale(bale["Bale ID"], bale["Bale Name"])}
                                  className="hover:text-red-600 p-0.5 transition-colors"
                                  title="Delete Bale"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <h3 className="font-serif font-bold text-wine-900 text-sm sm:text-base leading-tight">
                              {bale["Bale Name"]}
                            </h3>
                            <p className="text-xs text-wine-900/60 mt-1 line-clamp-2">
                              {bale["Notes"] || "Curated collection"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3. ADVANCED FILTERING & TABLE HEADER (Exact match to Image 1) */}
                  <div className="pt-2">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 mb-3">
                      <h3 className="font-serif font-bold text-wine-900 text-base sm:text-lg">
                        Bale Financial Comparison Table
                      </h3>

                      {/* Dropdown Filters Group */}
                      <div className="flex flex-wrap items-end gap-2.5">
                        {/* Filter by Status */}
                        <div>
                          <label className="text-[10px] font-bold text-wine-900/60 uppercase block mb-0.5">Filter by Status</label>
                          <select
                            value={baleStatusFilter}
                            onChange={(e) => setBaleStatusFilter(e.target.value)}
                            className="bg-white border border-cream-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-wine-900 outline-none focus:border-wine-900 shadow-xs cursor-pointer"
                          >
                            <option value="All">Active, Depleted, Sold Out</option>
                            <option value="Active">Active</option>
                            <option value="Depleted">Depleted</option>
                            <option value="Sold Out">Sold Out</option>
                          </select>
                        </div>

                        {/* Filter by Supplier */}
                        <div>
                          <label className="text-[10px] font-bold text-wine-900/60 uppercase block mb-0.5">Filter by Supplier</label>
                          <select
                            value={baleSupplierFilter}
                            onChange={(e) => setBaleSupplierFilter(e.target.value)}
                            className="bg-white border border-cream-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-wine-900 outline-none focus:border-wine-900 shadow-xs cursor-pointer"
                          >
                            <option value="All">All Suppliers</option>
                            {availableSuppliers.map(sup => (
                              <option key={sup} value={sup}>{sup}</option>
                            ))}
                          </select>
                        </div>

                        {/* Sort Bales */}
                        <div>
                          <label className="text-[10px] font-bold text-wine-900/60 uppercase block mb-0.5">Sort Bales</label>
                          <select
                            value={baleSortOption}
                            onChange={(e) => setBaleSortOption(e.target.value)}
                            className="bg-white border border-cream-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-wine-900 outline-none focus:border-wine-900 shadow-xs cursor-pointer"
                          >
                            <option value="default">Recouped %, Profit High-Low</option>
                            <option value="recouped">Recouped % (High to Low)</option>
                            <option value="profit_desc">Profit (High to Low)</option>
                            <option value="profit_asc">Profit (Low to High)</option>
                            <option value="stock_desc">Stock Remaining</option>
                          </select>
                        </div>

                        <span className="text-xs text-wine-900/50 font-medium pb-1.5">
                          {filteredBales.length} Active Bales
                        </span>
                      </div>
                    </div>

                    {/* 4. INTEGRATED COMPARISON TABLE (Exact match to Image 1 & 3) */}
                    <div className="overflow-x-auto rounded-xl border border-cream-500/70 bg-white shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-cream-500/70 bg-cream-300/50 text-[10px] font-bold text-wine-900/70 uppercase tracking-widest">
                            <th className="py-3 px-4">BALE NAME</th>
                            <th className="py-3 px-4">BOUGHT PRICE (COST)</th>
                            <th className="py-3 px-4">REALIZED SALES</th>
                            <th className="py-3 px-4">NET PROFIT / LOSS</th>
                            <th className="py-3 px-4">STOCK PROGRESS</th>
                            <th className="py-3 px-4">BREAK-EVEN STATUS</th>
                            <th className="py-3 px-4 text-center">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-500/40">
                          {filteredBales.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-wine-900/50 text-xs font-medium bg-cream-300/10">
                                No bale records found. Click "+ Add New Bale" to register your first bale.
                              </td>
                            </tr>
                          ) : (
                            filteredBales.map(b => (
                              <tr key={b["Bale ID"]} className="hover:bg-[#F5EDE1]/60 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-wine-900 text-xs sm:text-sm">{b["Bale Name"]}</div>
                                  <div className="text-[10px] text-wine-900/50 mt-0.5">{b["Bale ID"]}</div>
                                </td>

                                <td className="py-3.5 px-4 font-bold text-wine-900 text-xs sm:text-sm font-sans">
                                  ₱{b["Bought Price"].toLocaleString()}
                                </td>

                                <td className="py-3.5 px-4 font-bold text-emerald-800 text-xs sm:text-sm font-sans">
                                  ₱{b.realizedSales.toLocaleString()}
                                </td>

                                <td className="py-3.5 px-4">
                                  <span className={`font-bold inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans ${b.isProfitable ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                                    }`}>
                                    {b.netProfit >= 0 ? `+₱${b.netProfit.toLocaleString()}` : `-₱${Math.abs(b.netProfit).toLocaleString()}`}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-wine-900 text-xs">
                                    {b.totalAllocatedQty} / {b["Initial Stock"]} pcs ({b.remainingStock} left)
                                  </div>
                                  <div className="w-24 h-1.5 bg-cream-300 rounded-full overflow-hidden mt-1">
                                    <div
                                      style={{ width: `${b.sellThroughPct}%` }}
                                      className="bg-gold-500 h-full rounded-full"
                                    ></div>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${b.recoveryPct >= 100
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : b.recoveryPct > 0
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-cream-300 text-wine-900/70 border border-cream-500'
                                    }`}>
                                    {b.recoveryPct >= 100 ? `PROFITABLE (${Math.round(b.recoveryPct)}%)` : `${Math.round(b.recoveryPct)}% RECOUPED`}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5 text-wine-900/50">
                                    <button
                                      onClick={() => {
                                        setBaleFilter(b["Bale Name"]);
                                        setActiveTab("overview");
                                      }}
                                      className="p-1 rounded hover:text-wine-900 hover:bg-cream-300"
                                      title="View Orders from this Bale"
                                    >
                                      <Eye size={15} />
                                    </button>
                                    <button
                                      onClick={() => setEditingBale(b)}
                                      className="p-1 rounded hover:text-wine-900 hover:bg-cream-300"
                                      title="Edit Bale"
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* --- MODALS --- */}

      {/* 1. New Order Modal */}
      <AnimatePresence>
        {isNewOrderModalOpen && (
          <OrderFormModal
            isOpen={isNewOrderModalOpen}
            bales={baleAnalytics}
            onClose={() => setIsNewOrderModalOpen(false)}
            onSave={(orderData) => handleSaveOrder(orderData, false)}
            onOpenAddBale={() => {
              setIsNewOrderModalOpen(false);
              setIsNewBaleModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* 2. Edit Order Modal */}
      <AnimatePresence>
        {editingOrder && (
          <OrderFormModal
            isOpen={!!editingOrder}
            order={editingOrder}
            bales={baleAnalytics}
            isEditing={true}
            onClose={() => setEditingOrder(null)}
            onSave={(orderData) => handleSaveOrder(orderData, true)}
            onOpenAddBale={() => {
              setEditingOrder(null);
              setIsNewBaleModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* 3. View Details Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <ViewOrderDetailsModal
            order={viewingOrder}
            onClose={() => setViewingOrder(null)}
            onEdit={() => {
              const ord = viewingOrder;
              setViewingOrder(null);
              setEditingOrder(ord);
            }}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </AnimatePresence>

      {/* 4. Add Bale Modal */}
      <AnimatePresence>
        {isNewBaleModalOpen && (
          <BaleFormModal
            isOpen={isNewBaleModalOpen}
            onClose={() => setIsNewBaleModalOpen(false)}
            onSave={(baleData) => handleSaveBale(baleData, false)}
          />
        )}
      </AnimatePresence>

      {/* 5. Edit Bale Modal */}
      <AnimatePresence>
        {editingBale && (
          <BaleFormModal
            isOpen={!!editingBale}
            bale={editingBale}
            isEditing={true}
            onClose={() => setEditingBale(null)}
            onSave={(baleData) => handleSaveBale(baleData, true)}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-4 sm:right-6 bg-wine-900 text-cream-100 px-5 py-3 rounded-xl shadow-2xl border-l-4 border-gold-500 flex items-center gap-3 z-50 text-xs sm:text-sm font-medium"
          >
            <CheckCircle size={18} className="text-gold-300 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponent: OrderTableRow
function OrderTableRow({ order, onView, onEdit }) {
  const breakdownStr = order["Size / Variant"] || order["Items Breakdown"] || "";
  const totalQty = order["Quantity"] || 1;
  const items = breakdownStr.split(',').map(i => i.trim()).filter(Boolean);
  const amount = parseFloat(order["Total Amount"]) || 0;
  const isCompleted = order["Status"] === "Completed";
  const isCancelled = order["Status"] === "Cancelled";

  const dateObj = new Date(order["Timestamp"]);
  const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeFormatted = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <tr
      onClick={onView}
      className="hover:bg-[#F5EDE1]/70 transition-colors text-xs sm:text-sm cursor-pointer group"
    >
      <td className="py-3 px-4 align-middle">
        <div className="font-bold text-wine-900 text-xs sm:text-sm">{order["Order ID"]}</div>
        <div className="text-[11px] text-wine-900/60 mt-0.5">
          {dateFormatted} &bull; {timeFormatted}
        </div>
      </td>

      <td className="py-3 px-4 align-middle">
        <div className="font-bold text-wine-900 text-xs sm:text-sm">
          {order["Customer Name"] || "—"}
        </div>
      </td>

      <td className="py-3 px-4 align-middle">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100/90 text-purple-900 border border-purple-200">
          {order["Fulfillment Type"] || "PICK UP"}
        </span>
        <div className="text-[11px] text-wine-900/60 mt-0.5 truncate max-w-[130px]">
          {order["Shipping Address"] || "Store Pickup"}
        </div>
      </td>

      <td className="py-3 px-4 align-middle">
        <div className="font-medium text-wine-900 text-xs">
          {items.length > 0 ? (
            items.map((item, idx) => (
              <span key={idx} className="mr-1.5 text-wine-900/90 font-semibold">
                Size: {item.replace(/^[0-9]+x\s*/, '')} | Qty: {item.match(/^[0-9]+/)?.[0] || 1}
              </span>
            ))
          ) : (
            <span className="text-wine-900/60 font-semibold">Size: S | Qty: {totalQty}</span>
          )}
        </div>
        {order["Bale"] && (
          <div className="text-[10px] text-wine-900/50 mt-0.5 font-medium truncate max-w-[140px]">
            {order["Bale"]}
          </div>
        )}
      </td>

      <td className="py-3 px-4 align-middle text-right">
        <div className="font-sans font-bold text-wine-900 text-xs sm:text-sm">
          ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </td>

      <td className="py-3 px-4 align-middle text-center">
        <span
          className={`inline-flex px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isCompleted
            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
            : isCancelled
              ? "bg-rose-100 text-rose-800 border-rose-200"
              : "bg-amber-100 text-amber-800 border-amber-300"
            }`}
        >
          {order["Status"]}
        </span>
      </td>

      <td className="py-3 px-4 align-middle text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center items-center gap-1 text-wine-900/50">
          <button
            onClick={onView}
            className="hover:text-wine-900 hover:bg-cream-300 p-1.5 rounded transition-colors"
            title="View Details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={onEdit}
            className="hover:text-wine-900 hover:bg-cream-300 p-1.5 rounded transition-colors"
            title="Edit Order"
          >
            <Edit3 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Subcomponent: MobileOrderCard
function MobileOrderCard({ order, onView, onEdit }) {
  const isCompleted = order["Status"] === "Completed";
  const isCancelled = order["Status"] === "Cancelled";
  const amount = parseFloat(order["Total Amount"]) || 0;

  return (
    <div
      onClick={onView}
      className="bg-white rounded-xl shadow-xs border border-cream-500/70 p-4 cursor-pointer hover:bg-cream-300/30 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-wine-900 text-sm">{order["Order ID"]}</div>
          <div className="text-[10px] text-wine-900/50 mt-0.5">
            {new Date(order["Timestamp"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isCompleted
            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
            : isCancelled
              ? "bg-rose-100 text-rose-800 border-rose-200"
              : "bg-amber-100 text-amber-800 border-amber-300"
            }`}
        >
          {order["Status"]}
        </span>
      </div>

      <div className="flex justify-between items-center text-xs mt-3 pt-2.5 border-t border-cream-500/40">
        <div>
          <p className="font-bold text-wine-900">{order["Customer Name"] || "—"}</p>
          <p className="text-[11px] text-wine-900/60 mt-0.5">{order["Fulfillment Type"] || "Pick Up"}</p>
        </div>

        <div className="text-right">
          <p className="font-sans font-bold text-wine-900 text-sm">
            ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-wine-900/50">{order["Quantity"] || 1} item</p>
        </div>
      </div>
    </div>
  );
}

// Modal: ViewOrderDetailsModal
function ViewOrderDetailsModal({ order, onClose, onEdit, onToggleStatus }) {
  const amount = parseFloat(order["Total Amount"]) || 0;
  const breakdownStr = order["Size / Variant"] || order["Items Breakdown"] || "";
  const items = breakdownStr.split(',').map(i => i.trim()).filter(Boolean);
  const isCompleted = order["Status"] === "Completed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-wine-900/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-cream-100 rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-cream-500 flex flex-col max-h-[90vh]"
      >
        <div className="bg-wine-900 px-6 py-4 flex justify-between items-center text-cream-100">
          <div>
            <h2 className="text-lg font-serif font-bold text-gold-300 uppercase tracking-wider">Order Details</h2>
            <p className="text-xs text-cream-300 opacity-80">{order["Order ID"]}</p>
          </div>
          <button onClick={onClose} className="text-cream-300 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-cream-500">
            <div>
              <p className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider">Order Status</p>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mt-0.5 ${isCompleted
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
                }`}>
                {order["Status"]}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider">Date Placed</p>
              <p className="text-xs font-semibold text-wine-900 mt-0.5">
                {new Date(order["Timestamp"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-cream-500">
              <p className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider mb-1">Customer</p>
              <p className="font-bold text-wine-900 text-base">{order["Customer Name"] || "—"}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-cream-500">
              <p className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider mb-1">Fulfillment</p>
              <p className="font-bold text-wine-900">{order["Fulfillment Type"] || "Pick Up"}</p>
              <p className="text-xs text-wine-900/70 mt-0.5">{order["Shipping Address"] || "In-store pickup"}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-cream-500 space-y-2">
            <div className="flex justify-between items-center border-b border-cream-500/50 pb-2">
              <span className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider">Items Breakdown</span>
              <span className="text-xs font-bold text-wine-900">{order["Quantity"] || 1} Total Units</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-medium text-wine-900">
                    <span>{item}</span>
                    <span className="text-wine-900/50">Verified</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-wine-900/50">Size: S | Qty: {order["Quantity"] || 1}</p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-wine-900/5 rounded-xl border border-wine-900/10">
            <span className="font-bold text-wine-900 text-sm uppercase tracking-wider">Total Amount</span>
            <span className="text-2xl font-sans font-bold text-wine-900">
              ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-cream-300 p-4 border-t border-cream-500 flex justify-between gap-2">
          <button
            onClick={() => onToggleStatus(order["Order ID"], order["Status"])}
            className="px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-white border border-cream-500 text-wine-900 hover:bg-cream-500 transition-colors"
          >
            {isCompleted ? "Mark as Pending" : "Mark as Completed"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-gold-500 text-wine-900 hover:bg-gold-300 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Edit3 size={14} /> <span>Edit Order</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-wine-900 hover:bg-cream-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Modal: OrderFormModal
function OrderFormModal({ isOpen, order, bales, isEditing, onClose, onSave, onOpenAddBale }) {
  const [customerName, setCustomerName] = useState(order ? (order["Customer Name"] || "") : "");
  const [fulfillmentType, setFulfillmentType] = useState(order ? (order["Fulfillment Type"] || "Pick Up") : "Pick Up");
  const [shippingAddress, setShippingAddress] = useState(order ? (order["Shipping Address"] || "") : "");
  const [totalAmount, setTotalAmount] = useState(order ? (order["Total Amount"] || "") : "");
  const [selectedBale, setSelectedBale] = useState(order ? (order["Bale"] || "") : "");
  const [items, setItems] = useState(() => order ? parseItemsBreakdown(order["Size / Variant"] || order["Items Breakdown"]) : [{ size: "Small (S)", qty: 1 }]);
  const [status, setStatus] = useState(order ? (order["Status"] || "Pending") : "Pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalQuantity = items.reduce((sum, item) => sum + (parseInt(item.qty, 10) || 0), 0);

  const handleAddItem = () => {
    setItems([...items, { size: "Medium (M)", qty: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const updateQty = (index, delta) => {
    const newItems = [...items];
    const currentQty = parseInt(newItems[index].qty, 10) || 0;
    const nextQty = currentQty + delta;
    if (nextQty >= 1) {
      newItems[index].qty = nextQty;
      setItems(newItems);
    }
  };

  const handleSizeChange = (index, value) => {
    const newItems = [...items];
    newItems[index].size = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const itemsBreakdown = items.map(item => {
      const match = item.size.match(/\(([^)]+)\)/);
      const sizeLabel = match ? match[1] : item.size;
      return `${item.qty}x ${sizeLabel}`;
    }).join(', ');

    const payload = {
      ...(order ? { "Order ID": order["Order ID"], Timestamp: order["Timestamp"] } : {}),
      customerName,
      fulfillmentType,
      shippingAddress: fulfillmentType === "Shipping" ? shippingAddress : "",
      sizeVariant: itemsBreakdown,
      itemsBreakdown: itemsBreakdown,
      totalQuantity: totalQuantity,
      quantity: totalQuantity,
      totalAmount: parseFloat(totalAmount) || 0,
      bale: selectedBale,
      status
    };

    await onSave(payload);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-wine-900/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-cream-100 rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-cream-500"
      >
        <div className="bg-wine-900 px-6 py-4 flex justify-between items-center text-cream-100 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-gold-300 uppercase tracking-wider">
              {isEditing ? `Edit Order #${order["Order ID"]}` : "Create New Order"}
            </h2>
            <p className="text-[11px] text-cream-300 opacity-80">Fill in the order details below</p>
          </div>
          <button onClick={onClose} className="hover:text-gold-300 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
            <div className="w-full md:w-1/2 p-5 sm:p-6 md:border-r border-cream-500/60 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm shadow-xs"
                  placeholder="e.g. Angel Marquez"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">Deduct Stock From Bale</label>
                <select
                  value={selectedBale}
                  onChange={e => setSelectedBale(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm shadow-xs font-semibold"
                >
                  <option value="">-- None / Unassigned (General Inventory) --</option>
                  {(bales || []).map(b => (
                    <option key={b["Bale ID"]} value={b["Bale Name"]}>
                      {b["Bale Name"]} ({b.remainingStock !== undefined ? `${b.remainingStock} pcs left` : 'Active'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">Fulfillment Type</label>
                <select
                  value={fulfillmentType}
                  onChange={e => setFulfillmentType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm shadow-xs"
                >
                  <option value="Pick Up">Pick Up</option>
                  <option value="Shipping">Shipping</option>
                </select>
              </div>

              {fulfillmentType === "Shipping" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">Shipping Address / Courier</label>
                  <textarea
                    required
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white resize-none text-xs sm:text-sm shadow-xs"
                    rows="2"
                    placeholder="Courier name or destination address..."
                  ></textarea>
                </div>
              )}

              {isEditing && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">Order Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm shadow-xs"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 p-5 sm:p-6 bg-cream-300/30 space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60">Items &amp; Sizes</label>
                  <span className="text-xs font-bold text-wine-900 bg-gold-100 px-2 py-0.5 rounded-full">
                    Total Qty: {totalQuantity}
                  </span>
                </div>

                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-cream-500 shadow-xs">
                      <select
                        value={item.size}
                        onChange={(e) => handleSizeChange(idx, e.target.value)}
                        className="flex-1 px-2 py-1 rounded outline-none bg-transparent text-xs font-semibold text-wine-900"
                      >
                        <option value="Extra Small (XS)">Extra Small (XS)</option>
                        <option value="Small (S)">Small (S)</option>
                        <option value="Medium (M)">Medium (M)</option>
                        <option value="Large (L)">Large (L)</option>
                        <option value="Extra Large (XL)">Extra Large (XL)</option>
                        <option value="Custom">Custom</option>
                      </select>

                      <div className="flex items-center border border-cream-500 rounded bg-cream-100">
                        <button
                          type="button"
                          onClick={() => updateQty(idx, -1)}
                          className="w-6 h-6 flex items-center justify-center text-wine-900 hover:bg-cream-300 rounded-l transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <div className="w-6 text-center text-xs font-bold text-wine-900">{item.qty}</div>
                        <button
                          type="button"
                          onClick={() => updateQty(idx, 1)}
                          className="w-6 h-6 flex items-center justify-center text-wine-900 hover:bg-cream-300 rounded-r transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length === 1}
                        className="w-7 h-7 flex items-center justify-center rounded text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="mt-2 text-xs text-gold-700 font-bold hover:text-gold-500 flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Add Another Size
                </button>
              </div>

              <div className="pt-3 border-t border-cream-500/60">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">Total Amount (₱)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-900/50 font-serif font-bold text-sm">₱</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white font-bold text-wine-900 shadow-xs text-base font-sans"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cream-300 px-6 py-3.5 border-t border-cream-500 flex justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-wine-900 hover:bg-cream-500 transition-colors border border-cream-500 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalQuantity < 1}
              className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-wine-900 text-cream-100 hover:bg-wine-700 shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle size={15} /> {isEditing ? "Save Changes" : "Complete Order"}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Modal: BaleFormModal
function BaleFormModal({ isOpen, bale, isEditing, onClose, onSave }) {
  const [baleName, setBaleName] = useState(bale ? (bale["Bale Name"] || "") : "");
  const [boughtPrice, setBoughtPrice] = useState(bale ? (bale["Bought Price"] || "") : "");
  const [initialStock, setInitialStock] = useState(bale ? (bale["Initial Stock"] || "") : "");
  const [status, setStatus] = useState(bale ? (bale["Status"] || "Active") : "Active");
  const [supplier, setSupplier] = useState(bale ? (bale["Supplier"] || "") : "");
  const [notes, setNotes] = useState(bale ? (bale["Notes"] || "") : "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...(bale ? { "Bale ID": bale["Bale ID"], "Date Added": bale["Date Added"] } : {}),
      baleName,
      boughtPrice: parseFloat(boughtPrice) || 0,
      initialStock: parseInt(initialStock, 10) || 0,
      status,
      supplier,
      notes
    };

    await onSave(payload);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-wine-900/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-cream-100 rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-cream-500"
      >
        <div className="bg-wine-900 px-6 py-4 flex justify-between items-center text-cream-100 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-gold-300 uppercase tracking-wider">
              {isEditing ? `Edit Bale: ${bale["Bale Name"]}` : "Register New Bale"}
            </h2>
            <p className="text-[11px] text-cream-300 opacity-80">Enter bale cost, stock count, and notes to track profit/loss</p>
          </div>
          <button onClick={onClose} className="hover:text-gold-300 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">
              Bale Name / Batch Title
            </label>
            <input
              type="text"
              required
              value={baleName}
              onChange={e => setBaleName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm shadow-xs font-semibold"
              placeholder="e.g. Bale #4 — Velvet Evening Dresses"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">
                Bought Price (₱ Cost)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-900/50 font-serif font-bold text-xs">₱</div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={boughtPrice}
                  onChange={e => setBoughtPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm font-bold shadow-xs"
                  placeholder="12000"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">
                Initial Stock (Total Pcs)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={initialStock}
                onChange={e => setInitialStock(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm font-bold shadow-xs"
                placeholder="40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">
                Bale Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm shadow-xs"
              >
                <option value="Active">Active (In Stock)</option>
                <option value="Depleted">Depleted</option>
                <option value="Sold Out">Sold Out</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm shadow-xs"
                placeholder="e.g. Tokyo Vintage"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">
              Supplier / Batch Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white resize-none text-xs sm:text-sm shadow-xs"
              rows="2"
              placeholder="e.g. Curated French and Italian silk maxi dresses..."
            ></textarea>
          </div>

          <div className="pt-3 border-t border-cream-500 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-wine-900 hover:bg-cream-500 transition-colors border border-cream-500 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-wine-900 text-cream-100 hover:bg-wine-700 shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle size={15} /> {isEditing ? "Update Bale" : "Register Bale"}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
