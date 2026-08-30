import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, RefreshCw, CheckCircle, Clock,
  MapPin, ShoppingBag, X, TrendingUp, TrendingDown, Package,
  ShoppingBasket, CreditCard, Loader2, Info, Calendar, Filter,
  MoreVertical, Eye, Edit3, Trash2, Minus, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight
} from 'lucide-react';

// --- CONFIGURATION ---
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwMnkVt1PmTg6qflVOOJx-ZMINXSyo2l_BYcqlMCOeJBN4w-Hc7gteWH-Ls0rdnxLz0/exec";

// --- MOCK DATA FOR PREVIEW FALLBACK ---
const INITIAL_MOCK_DATA = {
  orders: [
    {
      "Order ID": "AR-20260830-4921",
      "Timestamp": "2026-08-30T08:21:00.000Z",
      "Customer Name": "Elena Gilbert",
      "Fulfillment Type": "Shipped",
      "Shipping Address": "via J&T Express",
      "Size / Variant": "1x M, 1x L",
      "Quantity": 2,
      "Total Amount": 9000,
      "Status": "Pending",
      "Completed At": ""
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
      "Status": "Done",
      "Completed At": "2026-08-30T10:00:00.000Z"
    }
  ]
};

// Helper: Normalize order objects from any source (handles camelCase and spaced keys)
function normalizeOrder(order) {
  if (!order) return null;

  const customerName = order["Customer Name"] || order["customerName"] || order["Customer"] || order["customer"] || "";
  const fulfillmentType = order["Fulfillment Type"] || order["fulfillmentType"] || order["Fulfillment"] || order["fulfillment"] || "Pick Up";
  const shippingAddress = order["Shipping Address"] || order["shippingAddress"] || order["Shipping Addres"] || order["shippingAddres"] || order["Address"] || "";
  const sizeVariant = order["Size / Variant"] || order["sizeVariant"] || order["Items Breakdown"] || order["itemsBreakdown"] || order["Size"] || order["size"] || "";

  const rawQty = order["Quantity"] ?? order["quantity"] ?? order["Total Quantity"] ?? order["totalQuantity"] ?? 1;
  const qty = parseInt(String(rawQty).replace(/[^0-9]/g, ''), 10) || 1;

  const rawAmount = order["Total Amount"] ?? order["totalAmount"] ?? order["Amount"] ?? order["amount"] ?? 0;
  const amount = typeof rawAmount === 'number'
    ? rawAmount
    : parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, '')) || 0;

  return {
    "Order ID": (order["Order ID"] || order["orderId"] || "").toString().trim(),
    "Timestamp": order["Timestamp"] || order["timestamp"] ? String(order["Timestamp"] || order["timestamp"]) : new Date().toISOString(),
    "Customer Name": customerName.toString().trim(),
    "Fulfillment Type": fulfillmentType.toString().trim(),
    "Shipping Address": shippingAddress.toString().trim(),
    "Size / Variant": sizeVariant.toString().trim(),
    "Quantity": qty,
    "Total Amount": amount,
    "Status": (order["Status"] || order["status"] || "Pending").toString().trim(),
    "Completed At": (order["Completed At"] || order["completedAt"] || "").toString().trim()
  };
}

// Helper: Calculate accurate metrics dynamically from active orders
function calculateMetrics(orders) {
  const validOrders = (orders || []).filter(o => o && o["Order ID"]);

  let totalSold = 0;
  let totalSales = 0;
  let ordersDone = 0;
  let ordersPending = 0;
  let pickupCount = 0;
  let shippedCount = 0;

  validOrders.forEach(order => {
    const qty = parseInt(order["Quantity"] || 0, 10);
    const amount = parseFloat(order["Total Amount"] || 0);
    const status = order["Status"];
    const fulfillment = order["Fulfillment Type"];

    // Only completed / Done orders count towards realized sales & sold units
    if (status === "Done") {
      ordersDone++;
      totalSold += qty;
      totalSales += amount;
    } else {
      ordersPending++;
    }

    if (fulfillment === "Pick Up") pickupCount++;
    else if (fulfillment === "Shipped") shippedCount++;
  });

  return {
    totalSold,
    totalSales,
    ordersDone,
    ordersPending,
    avgOrderValue: (ordersDone > 0) ? (totalSales / ordersDone) : 0,
    pickupCount,
    shippedCount
  };
}

// Helper: Parse items breakdown string e.g. "1x M, 2x L" into array of objects
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
  const [data, setData] = useState({ metrics: null, orders: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter]);

  // Modals state
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  };

  const fetchData = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      if (WEB_APP_URL === "YOUR_WEB_APP_URL_HERE" || !WEB_APP_URL) {
        setTimeout(() => {
          const normalized = INITIAL_MOCK_DATA.orders.map(normalizeOrder);
          setData({
            metrics: calculateMetrics(normalized),
            orders: normalized
          });
          setLoading(false);
          setRefreshing(false);
        }, 500);
        return;
      }

      const response = await fetch(WEB_APP_URL);
      const result = await response.json();

      const rawOrders = Array.isArray(result.orders) ? result.orders : [];
      const normalizedOrders = rawOrders.map(normalizeOrder).filter(o => o && o["Order ID"]);

      setData({
        metrics: calculateMetrics(normalizedOrders),
        orders: normalizedOrders
      });
    } catch (error) {
      console.error("Error fetching data from Google Apps Script:", error);
      const normalized = INITIAL_MOCK_DATA.orders.map(normalizeOrder);
      setData({
        metrics: calculateMetrics(normalized),
        orders: normalized
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Status toggle handler (Called from View Order Details Modal)
  const handleToggleStatus = async (orderId, currentStatus) => {
    const newStatus = currentStatus === "Pending" ? "Done" : "Pending";

    setData(prev => {
      const updatedOrders = prev.orders.map(order =>
        order["Order ID"] === orderId
          ? {
            ...order,
            Status: newStatus,
            "Completed At": newStatus === "Done" ? new Date().toISOString() : ""
          }
          : order
      );
      return {
        metrics: calculateMetrics(updatedOrders),
        orders: updatedOrders
      };
    });

    if (viewingOrder && viewingOrder["Order ID"] === orderId) {
      setViewingOrder(prev => ({
        ...prev,
        Status: newStatus,
        "Completed At": newStatus === "Done" ? new Date().toISOString() : ""
      }));
    }

    showToast(`Order ${orderId} marked as ${newStatus}`);

    if (WEB_APP_URL && WEB_APP_URL !== "YOUR_WEB_APP_URL_HERE") {
      try {
        await fetch(WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'toggleStatus', orderId }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        fetchData();
      } catch (error) {
        console.error("Error toggling status:", error);
      }
    }
  };

  // Order save/update handler
  const handleSaveOrder = async (updatedOrderData, isEditing) => {
    if (isEditing) {
      const normalizedUpdated = normalizeOrder(updatedOrderData);
      setData(prev => {
        const updatedOrders = prev.orders.map(order =>
          order["Order ID"] === normalizedUpdated["Order ID"] ? normalizedUpdated : order
        );
        return {
          metrics: calculateMetrics(updatedOrders),
          orders: updatedOrders
        };
      });

      if (viewingOrder && viewingOrder["Order ID"] === normalizedUpdated["Order ID"]) {
        setViewingOrder(normalizedUpdated);
      }

      showToast(`Order ${normalizedUpdated["Order ID"]} updated successfully`);

      if (WEB_APP_URL && WEB_APP_URL !== "YOUR_WEB_APP_URL_HERE") {
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
              status: normalizedUpdated["Status"]
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
          });
          fetchData();
        } catch (error) {
          console.error("Error updating order:", error);
        }
      }
    } else {
      // New Order
      const newOrder = normalizeOrder({
        "Order ID": `AR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        "Timestamp": new Date().toISOString(),
        "Status": "Pending",
        "Completed At": "",
        ...updatedOrderData
      });

      setData(prev => {
        const updatedOrders = [newOrder, ...prev.orders];
        return {
          metrics: calculateMetrics(updatedOrders),
          orders: updatedOrders
        };
      });

      showToast(`New Order ${newOrder["Order ID"]} created successfully`);

      if (WEB_APP_URL && WEB_APP_URL !== "YOUR_WEB_APP_URL_HERE") {
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
              status: newOrder["Status"]
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
          });
          fetchData();
        } catch (error) {
          console.error("Error creating order:", error);
        }
      }
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return (data.orders || []).filter(order => {
      const orderId = (order["Order ID"] || "").toString().trim();
      if (!orderId) return false;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        (order["Customer Name"] || "").toLowerCase().includes(searchLower) ||
        orderId.toLowerCase().includes(searchLower) ||
        (order["Size / Variant"] || "").toLowerCase().includes(searchLower) ||
        (order["Shipping Address"] || "").toLowerCase().includes(searchLower);

      let matchesFilter = true;
      if (filter === "Pending") matchesFilter = order["Status"] === "Pending";
      else if (filter === "Done") matchesFilter = order["Status"] === "Done";
      else if (filter === "Pick Up") matchesFilter = order["Fulfillment Type"] === "Pick Up";
      else if (filter === "Shipped") matchesFilter = order["Fulfillment Type"] === "Shipped";

      return matchesSearch && matchesFilter;
    });
  }, [data.orders, searchQuery, filter]);

  // Paginated slice (10 per page)
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Dynamic Sales Trend (% change calculated from realized sales)
  const salesTrend = useMemo(() => {
    const doneOrders = (data.orders || []).filter(o => o["Status"] === "Done");
    if (doneOrders.length === 0) return { text: "0.0%", isPositive: true };
    if (doneOrders.length === 1) return { text: "+100%", isPositive: true };

    const mid = Math.ceil(doneOrders.length / 2);
    const recentOrders = doneOrders.slice(0, mid);
    const olderOrders = doneOrders.slice(mid);

    const recentTotal = recentOrders.reduce((sum, o) => sum + (parseFloat(o["Total Amount"]) || 0), 0);
    const olderTotal = olderOrders.reduce((sum, o) => sum + (parseFloat(o["Total Amount"]) || 0), 0);

    if (olderTotal === 0) {
      return { text: recentTotal > 0 ? "+100%" : "0.0%", isPositive: recentTotal >= 0 };
    }

    const diff = ((recentTotal - olderTotal) / olderTotal) * 100;
    const isPositive = diff >= 0;
    const text = `${isPositive ? '+' : ''}${diff.toFixed(1)}%`;
    return { text, isPositive };
  }, [data.orders]);

  // Fulfillment split percentages
  const pickupCount = data.metrics?.pickupCount ?? 0;
  const shippedCount = data.metrics?.shippedCount ?? 0;
  const totalFulfillment = (pickupCount + shippedCount) || (data.orders?.length || 1);
  const pickupPct = Math.round((pickupCount / totalFulfillment) * 100);
  const shippedPct = 100 - pickupPct;

  return (
    <div className="min-h-screen bg-cream-300 font-sans text-wine-900 flex flex-col justify-between">
      <div className="w-full max-w-[1340px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* Modern Header Banner */}
        <header className="bg-wine-900 text-cream-100 py-3.5 px-5 sm:px-6 rounded-t-xl shadow-md border-b border-wine-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl tracking-widest font-serif font-bold text-gold-300 uppercase">
                AURA REIGN
              </h1>
              <p className="text-cream-300 text-[10px] sm:text-xs tracking-widest uppercase opacity-85 mt-0.5">
                Premium Dresses &bull; Boutique Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm text-cream-300 font-medium">
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <Calendar size={15} className="text-gold-300" />
            </div>

            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              className="bg-gold-500 hover:bg-gold-300 text-wine-900 font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-md shadow-sm transition-all duration-200 flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Order</span>
            </button>
          </div>
        </header>

        {/* Dashboard Main Container */}
        <main className="bg-cream-100 rounded-b-xl shadow-lg border border-cream-500/50 p-4 sm:p-6 lg:p-8">

          {loading && !data.metrics ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3">
              <Loader2 className="animate-spin text-gold-700 h-10 w-10" />
              <p className="text-sm font-medium text-wine-900/60">Loading boutique dashboard...</p>
            </div>
          ) : (
            <>
              {/* Top KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
                <KPICard
                  title="TOTAL UNITS SOLD"
                  value={data.metrics?.totalSold ?? 0}
                  icon={<ShoppingBag className="text-gold-700" size={20} strokeWidth={1.75} />}
                  subtitle="This month"
                />
                <KPICard
                  title="TOTAL SALES"
                  value={`₱${(data.metrics?.totalSales ?? 0).toLocaleString()}`}
                  icon={<div className="w-5 h-5 rounded-full border border-gold-700 flex items-center justify-center text-gold-700 font-serif font-bold text-xs">₱</div>}
                  subtitle="This month"
                  trend={salesTrend.text}
                  trendPositive={salesTrend.isPositive}
                />
                <KPICard
                  title="ORDERS FULFILLED"
                  value={`${data.metrics?.ordersDone ?? 0} / ${data.orders.length ?? 0}`}
                  icon={<CheckCircle className="text-gold-700" size={20} strokeWidth={1.75} />}
                  subtitle="Completed / Total"
                />
                <KPICard
                  title="PENDING ORDERS"
                  value={data.metrics?.ordersPending ?? 0}
                  icon={<Clock className={(data.metrics?.ordersPending ?? 0) > 0 ? "text-wine-700" : "text-gold-700"} size={20} strokeWidth={1.75} />}
                  subtitle={(data.metrics?.ordersPending ?? 0) > 0 ? "Requires attention" : "All caught up"}
                  alert={(data.metrics?.ordersPending ?? 0) > 0}
                />
              </div>

              {/* Fulfillment Split Progress Visualizer */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-cream-500/60 shadow-sm mb-6 sm:mb-8">
                <div className="flex justify-between items-center mb-2.5">
                  <h3 className="font-semibold text-wine-900 text-xs sm:text-sm">Fulfillment Split</h3>
                  <span className="text-[11px] sm:text-xs font-medium text-wine-900/60">
                    {data.orders.length} Total Order{data.orders.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Visual Bi-Color Progress Bar */}
                <div className="h-2.5 flex rounded-full overflow-hidden shadow-inner bg-cream-300">
                  <div
                    style={{ width: `${pickupPct}%` }}
                    className="bg-gold-500 h-full transition-all duration-700"
                    title={`Pick Up: ${pickupCount} (${pickupPct}%)`}
                  ></div>
                  <div
                    style={{ width: `${shippedPct}%` }}
                    className="bg-wine-900 h-full transition-all duration-700"
                    title={`Shipped: ${shippedCount} (${shippedPct}%)`}
                  ></div>
                </div>

                <div className="flex justify-between items-center mt-2.5 text-xs font-medium text-wine-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold-500 inline-block"></span>
                    <span>Pick Up ({pickupCount})</span>
                    <span className="font-bold text-wine-900/80 ml-1">{pickupPct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-wine-900/80 mr-1">{shippedPct}%</span>
                    <span>Shipped ({shippedCount})</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-wine-900 inline-block"></span>
                  </div>
                </div>
              </div>

              {/* Mobile Primary Action Button */}
              <div className="md:hidden mb-5">
                <button
                  onClick={() => setIsNewOrderModalOpen(true)}
                  className="w-full bg-gold-500 hover:bg-gold-300 text-wine-900 font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span>New Order</span>
                </button>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-900/40" size={16} />
                  <input
                    type="text"
                    placeholder="Search orders, customers, sizes..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-cream-500 bg-white focus:outline-none focus:border-wine-700 focus:ring-1 focus:ring-wine-700 transition-all text-xs sm:text-sm shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-900/40 hover:text-wine-900"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                  {['All', 'Pending', 'Pick Up', 'Shipped', 'Done'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border ${filter === f
                          ? 'bg-wine-900 text-cream-100 border-wine-900 shadow-sm'
                          : 'bg-white text-wine-900/80 border-cream-500 hover:bg-cream-300'
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Refresh Action */}
                <div className="hidden sm:flex items-center gap-2 justify-end">
                  <button
                    onClick={fetchData}
                    className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-cream-500 bg-white text-wine-900 hover:bg-cream-300 transition-colors flex items-center gap-1.5 shadow-sm"
                    title="Refresh Data"
                  >
                    <RefreshCw size={14} className={refreshing ? "animate-spin text-gold-700" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Orders Display (Desktop Table / Mobile Expandable Cards) */}
              {filteredOrders.length > 0 ? (
                <div className="flex flex-col justify-between min-h-[320px]">
                  {/* Desktop Luxury Table */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-cream-500/60 bg-white shadow-sm min-h-[260px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-cream-500 bg-cream-300/40 text-wine-900/60 uppercase text-[10px] tracking-widest font-semibold">
                          <th className="py-3 px-4">Order ID / Date</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Fulfillment</th>
                          <th className="py-3 px-4">Items</th>
                          <th className="py-3 px-4 text-right">Total</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-500/40">
                        <AnimatePresence>
                          {paginatedOrders.map(order => (
                            <OrderTableRow
                              key={order["Order ID"]}
                              order={order}
                              onView={() => setViewingOrder(order)}
                              onEdit={() => setEditingOrder(order)}
                            />
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Responsive Cards */}
                  <div className="md:hidden space-y-3.5 min-h-[260px]">
                    <AnimatePresence>
                      {paginatedOrders.map(order => (
                        <MobileOrderCard
                          key={order["Order ID"]}
                          order={order}
                          onView={() => setViewingOrder(order)}
                          onEdit={() => setEditingOrder(order)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Smooth Pagination Bar */}
                  {totalPages > 1 && (
                    <div className="mt-4 pt-4 border-t border-cream-500/50 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
                      <span className="text-wine-900/60 font-medium">
                        Showing <span className="font-bold text-wine-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-wine-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}</span> of <span className="font-bold text-wine-900">{filteredOrders.length}</span> orders
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-2.5 py-1.5 rounded-md border border-cream-500 bg-white text-wine-900 disabled:opacity-40 disabled:hover:bg-white hover:bg-cream-300 transition-colors flex items-center gap-1 font-semibold"
                        >
                          <ChevronLeft size={14} /> <span>Prev</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-7 h-7 rounded-md font-bold transition-all text-xs flex items-center justify-center ${currentPage === page
                                  ? 'bg-wine-900 text-cream-100 shadow-sm'
                                  : 'bg-white text-wine-900/70 border border-cream-500 hover:bg-cream-300'
                                }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-2.5 py-1.5 rounded-md border border-cream-500 bg-white text-wine-900 disabled:opacity-40 disabled:hover:bg-white hover:bg-cream-300 transition-colors flex items-center gap-1 font-semibold"
                        >
                          <span>Next</span> <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[320px] text-center text-wine-900/50 bg-white rounded-xl border border-cream-500/60 p-6 flex flex-col items-center justify-center">
                  <Search size={36} className="mx-auto mb-2 opacity-30" strokeWidth={1.5} />
                  <p className="text-base font-semibold text-wine-900">No orders found</p>
                  <p className="text-xs text-wine-900/60 mt-1">Try creating a new order or switching the filter tab.</p>
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
            onClose={() => setIsNewOrderModalOpen(false)}
            onSave={(data) => handleSaveOrder(data, false)}
          />
        )}
      </AnimatePresence>

      {/* 2. Edit Order Modal */}
      <AnimatePresence>
        {editingOrder && (
          <OrderFormModal
            isOpen={!!editingOrder}
            order={editingOrder}
            isEditing={true}
            onClose={() => setEditingOrder(null)}
            onSave={(data) => handleSaveOrder(data, true)}
          />
        )}
      </AnimatePresence>

      {/* 3. View Details Enhanced Modal */}
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

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-4 sm:right-6 bg-wine-900 text-cream-100 px-5 py-3 rounded-xl shadow-2xl border-l-4 border-gold-500 flex items-center gap-3 z-50 text-xs sm:text-sm font-medium"
          >
            <CheckCircle size={18} className="text-gold-300 flex-shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function KPICard({ title, value, icon, subtitle, trend, trendPositive, alert }) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-cream-500/60 relative overflow-hidden flex flex-col justify-between">
      {alert && <div className="absolute top-0 left-0 w-1.5 h-full bg-wine-700"></div>}

      <div>
        <div className="flex justify-between items-start mb-1.5">
          <p className="text-[10px] font-bold text-wine-900/50 uppercase tracking-widest">{title}</p>
          <div className="p-1 rounded-md text-gold-700 bg-gold-100/40">
            {icon}
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-wine-900 tracking-tight">{value}</h2>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-cream-500/40 text-[10px] sm:text-[11px]">
        <span className={`font-semibold uppercase tracking-wider ${alert ? 'text-wine-700 font-bold' : 'text-wine-900/50'}`}>
          {subtitle}
        </span>
        {trend && (
          <span className={`font-bold flex items-center gap-0.5 ${trendPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            {trendPositive ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

// Desktop Table Row (Static Status Badge - Click Actions to Change)
function OrderTableRow({ order, onView, onEdit }) {
  const breakdownStr = order["Size / Variant"] || order["Items Breakdown"] || "";
  const totalQty = order["Quantity"] || 1;
  const items = breakdownStr.split(',').map(i => {
    const parts = i.trim().split('x');
    if (parts.length === 2) return `${parts[1].trim()} × ${parts[0].trim()}`;
    return i.trim();
  }).filter(Boolean);

  const amount = parseFloat(order["Total Amount"]) || 0;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="hover:bg-cream-300/30 transition-colors text-xs sm:text-sm group"
    >
      <td className="py-3.5 px-4 align-top">
        <div className="font-bold text-wine-900">{order["Order ID"]}</div>
        <div className="text-[11px] text-wine-900/50 mt-0.5">
          {new Date(order["Timestamp"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &bull; {new Date(order["Timestamp"]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </td>

      <td className="py-3.5 px-4 align-top">
        <div className="font-bold text-wine-900 text-sm">
          {order["Customer Name"] || "—"}
        </div>
      </td>

      <td className="py-3.5 px-4 align-top">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order["Fulfillment Type"] === 'Pick Up'
            ? 'bg-purple-100 text-purple-900 border border-purple-200'
            : 'bg-blue-100 text-blue-900 border border-blue-200'
          }`}>
          {order["Fulfillment Type"] || "Pick Up"}
        </span>
        <div className="text-[11px] text-wine-900/60 mt-1 truncate max-w-[150px]" title={order["Shipping Address"]}>
          {order["Shipping Address"] || "Store Pickup"}
        </div>
      </td>

      <td className="py-3.5 px-4 align-top">
        <div className="flex flex-wrap gap-1 mb-1">
          {items.length > 0 ? (
            items.map((item, idx) => (
              <span key={idx} className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-blue-100">
                {item}
              </span>
            ))
          ) : (
            <span className="text-wine-900/40 text-[11px]">—</span>
          )}
        </div>
        <div className="text-[10px] text-wine-900/50 font-medium">
          {totalQty} item{totalQty > 1 ? 's' : ''}
        </div>
      </td>

      <td className="py-3.5 px-4 align-top text-right">
        <div className="font-sans font-bold text-wine-900 text-sm">
          ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </td>

      <td className="py-3.5 px-4 align-top text-center">
        <span
          className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${order["Status"] === "Done"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-orange-100 text-orange-800 border border-orange-200"
            }`}
        >
          {order["Status"] || "Pending"}
        </span>
      </td>

      <td className="py-3.5 px-4 align-top text-center">
        <div className="flex justify-center items-center gap-1.5 text-wine-900/60">
          <button
            onClick={onView}
            className="hover:text-wine-900 hover:bg-cream-300/80 p-1.5 rounded transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={onEdit}
            className="hover:text-wine-900 hover:bg-cream-300/80 p-1.5 rounded transition-colors"
            title="Edit Order"
          >
            <Edit3 size={16} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// Mobile Expandable Card (Static Status Badge - Click Actions to Change)
function MobileOrderCard({ order, onView, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const breakdownStr = order["Size / Variant"] || order["Items Breakdown"] || "";
  const totalQty = order["Quantity"] || 1;
  const items = breakdownStr.split(',').map(i => {
    const parts = i.trim().split('x');
    if (parts.length === 2) return `${parts[1].trim()} × ${parts[0].trim()}`;
    return i.trim();
  }).filter(Boolean);

  const amount = parseFloat(order["Total Amount"]) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-cream-500/60 overflow-hidden"
    >
      {/* Card Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-cream-300/20 transition-colors"
      >
        <div>
          <div className="font-bold text-wine-900 text-sm tracking-tight">{order["Order ID"]}</div>
          <div className="text-[10px] text-wine-900/50 mt-0.5">
            {new Date(order["Timestamp"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &bull; {new Date(order["Timestamp"]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${order["Status"] === "Done"
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-orange-100 text-orange-800 border-orange-200"
              }`}
          >
            {order["Status"] || "Pending"}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="text-wine-900/40 flex items-center justify-center"
          >
            <ChevronDown size={16} />
          </motion.div>
        </div>
      </div>

      {/* Card Body with Smooth Accordion Animation */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="mobile-card-details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-1 border-t border-cream-500/40 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-wine-900/50">Customer</p>
                  <p className="font-bold text-wine-900 text-sm">{order["Customer Name"] || "—"}</p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-wine-900/50">Fulfillment</p>
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-0.5 ${order["Fulfillment Type"] === 'Pick Up'
                      ? 'bg-purple-100 text-purple-900 border border-purple-200'
                      : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}>
                    {order["Fulfillment Type"] || "Pick Up"}
                  </span>
                  <p className="text-[11px] text-wine-900/60 mt-0.5 truncate">{order["Shipping Address"] || "Store Pickup"}</p>
                </div>
              </div>

              <div className="border-t border-cream-500/30 pt-2 flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-wine-900/50 mb-1">Items</p>
                  <div className="flex flex-wrap gap-1">
                    {items.length > 0 ? (
                      items.map((item, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-blue-100">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-wine-900/40">—</span>
                    )}
                  </div>
                  <p className="text-[10px] text-wine-900/50 mt-1">{totalQty} item{totalQty > 1 ? 's' : ''}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-wine-900/50">Total</p>
                  <p className="font-sans font-bold text-wine-900 text-base">₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={onView}
                  className="flex-1 py-1.5 px-3 text-xs font-semibold border border-cream-500 rounded-lg text-wine-900 bg-white hover:bg-cream-300 transition-colors flex justify-center items-center gap-1.5 shadow-sm"
                >
                  <Eye size={13} /> <span>View Details</span>
                </button>
                <button
                  onClick={onEdit}
                  className="flex-1 py-1.5 px-3 text-xs font-semibold border border-cream-500 rounded-lg text-wine-900 bg-white hover:bg-cream-300 transition-colors flex justify-center items-center gap-1.5 shadow-sm"
                >
                  <Edit3 size={13} /> <span>Edit Order</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Modal: View Order Details (With Status Toggle and Edit Action)
function ViewOrderDetailsModal({ order, onClose, onEdit, onToggleStatus }) {
  const amount = parseFloat(order["Total Amount"]) || 0;
  const breakdownStr = order["Size / Variant"] || order["Items Breakdown"] || "";
  const items = breakdownStr.split(',').map(i => i.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-wine-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-cream-100 rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-cream-500 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-wine-900 px-6 py-4 flex justify-between items-center text-cream-100">
          <div>
            <h2 className="text-lg font-serif font-bold text-gold-300 uppercase tracking-wider">Order Details</h2>
            <p className="text-xs text-cream-300 opacity-80">{order["Order ID"]}</p>
          </div>
          <button onClick={onClose} className="text-cream-300 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status & Date Bar */}
          <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-cream-500">
            <div>
              <p className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider">Order Status</p>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mt-0.5 ${order["Status"] === "Done"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-orange-100 text-orange-800"
                }`}>
                {order["Status"] || "Pending"}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider">Date Placed</p>
              <p className="text-xs font-semibold text-wine-900 mt-0.5">
                {new Date(order["Timestamp"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Customer & Fulfillment Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-cream-500">
              <p className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider mb-1">Customer</p>
              <p className="font-bold text-wine-900 text-base">{order["Customer Name"] || "—"}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-cream-500">
              <p className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider mb-1">Fulfillment</p>
              <p className="font-bold text-wine-900">{order["Fulfillment Type"] || "Pick Up"}</p>
              <p className="text-xs text-wine-900/70 mt-0.5 break-words">{order["Shipping Address"] || "In-store pickup"}</p>
            </div>
          </div>

          {/* Items Breakdown */}
          <div className="bg-white p-4 rounded-xl border border-cream-500 space-y-2">
            <div className="flex justify-between items-center border-b border-cream-500/50 pb-2">
              <span className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider">Items & Sizes</span>
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
                <p className="text-xs text-wine-900/50">No items specified</p>
              )}
            </div>
          </div>

          {/* Total Summary */}
          <div className="flex justify-between items-center p-4 bg-wine-900/5 rounded-xl border border-wine-900/10">
            <span className="font-bold text-wine-900 text-sm uppercase tracking-wider">Total Amount</span>
            <span className="text-2xl font-sans font-bold text-wine-900">
              ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {order["Completed At"] && (
            <p className="text-[11px] text-wine-900/50 text-center italic">
              Completed on {new Date(order["Completed At"]).toLocaleString()}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-cream-300 p-4 border-t border-cream-500 flex justify-between gap-2">
          <button
            onClick={() => onToggleStatus(order["Order ID"], order["Status"])}
            className="px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-white border border-cream-500 text-wine-900 hover:bg-cream-500 transition-colors"
          >
            {order["Status"] === "Done" ? "Mark as Pending" : "Mark as Done"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-gold-500 text-wine-900 hover:bg-gold-300 transition-colors flex items-center gap-1.5 shadow-sm"
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

// Modal: Create & Edit Form
function OrderFormModal({ isOpen, order, isEditing, onClose, onSave }) {
  const [customerName, setCustomerName] = useState(order ? (order["Customer Name"] || "") : "");
  const [fulfillmentType, setFulfillmentType] = useState(order ? (order["Fulfillment Type"] || "Pick Up") : "Pick Up");
  const [shippingAddress, setShippingAddress] = useState(order ? (order["Shipping Address"] || "") : "");
  const [totalAmount, setTotalAmount] = useState(order ? (order["Total Amount"] || "") : "");
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
      shippingAddress: fulfillmentType === "Shipped" ? shippingAddress : "",
      sizeVariant: itemsBreakdown,
      itemsBreakdown: itemsBreakdown,
      totalQuantity: totalQuantity,
      quantity: totalQuantity,
      totalAmount: parseFloat(totalAmount) || 0,
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
        className="absolute inset-0 bg-wine-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-cream-100 rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-cream-500"
      >
        {/* Modal Top Header */}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">

            {/* Left Column: Customer & Fulfillment */}
            <div className="w-full md:w-1/2 p-5 sm:p-6 md:border-r border-cream-500/60 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm shadow-sm"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">Fulfillment Type</label>
                <select
                  value={fulfillmentType}
                  onChange={e => setFulfillmentType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm shadow-sm"
                >
                  <option value="Pick Up">Pick Up</option>
                  <option value="Shipped">Shipped</option>
                </select>
              </div>

              {fulfillmentType === "Shipped" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">Shipping Address / Courier</label>
                  <textarea
                    required
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white resize-none text-xs sm:text-sm shadow-sm"
                    rows="2"
                    placeholder="Courier name or full address..."
                  ></textarea>
                </div>
              )}

              {isEditing && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60 mb-1">Order Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white text-xs sm:text-sm shadow-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              )}
            </div>

            {/* Right Column: Items & Pricing */}
            <div className="w-full md:w-1/2 p-5 sm:p-6 bg-cream-300/30 space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-wine-900/60">Items & Sizes</label>
                  <span className="text-xs font-bold text-wine-900 bg-gold-100 px-2 py-0.5 rounded-full">
                    Total Qty: {totalQuantity}
                  </span>
                </div>

                {/* Dynamic Item Rows with - / + controls */}
                <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-cream-500 shadow-sm"
                    >
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

                      {/* Plus/Minus Controls */}
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
                  className="mt-2.5 text-xs text-gold-700 font-bold hover:text-gold-500 flex items-center gap-1 transition-colors"
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
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-cream-500 focus:border-wine-900 focus:ring-1 focus:ring-wine-900 outline-none transition-all bg-white font-bold text-wine-900 shadow-sm text-base font-sans"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
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
