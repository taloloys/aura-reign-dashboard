const SHEET_ORDERS = 'Orders';
const SHEET_BALES = 'Bales';

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ordersSheet = ss.getSheetByName(SHEET_ORDERS);
  let balesSheet = ss.getSheetByName(SHEET_BALES);

  // Auto-create sheets if missing
  if (!ordersSheet) {
    ordersSheet = ss.insertSheet(SHEET_ORDERS);
    ordersSheet.appendRow([
      "Order ID", "Timestamp", "Customer Name", "Fulfillment Type", 
      "Shipping Address", "Size / Variant", "Quantity", 
      "Total Amount", "Status", "Completed At", "Bale"
    ]);
  }

  if (!balesSheet) {
    balesSheet = ss.insertSheet(SHEET_BALES);
    balesSheet.appendRow([
      "Bale ID", "Date Added", "Bale Name", "Bought Price", 
      "Initial Stock", "Status", "Notes"
    ]);
  }

  // --- 1. FETCH BALES ---
  const balesData = balesSheet.getDataRange().getValues();
  const bales = [];
  if (balesData.length > 1) {
    const baleHeaders = balesData[0].map(h => (h ? h.toString().trim() : ''));
    for (let i = 1; i < balesData.length; i++) {
      const row = balesData[i];
      const baleId = row[0] ? row[0].toString().trim() : "";
      if (!baleId) continue;

      const rowObj = {};
      baleHeaders.forEach((h, idx) => {
        if (h) rowObj[h] = row[idx];
      });

      const getVal = (...names) => {
        for (const n of names) {
          for (const k of Object.keys(rowObj)) {
            if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === n.toLowerCase().replace(/[^a-z0-9]/g, '')) {
              return rowObj[k];
            }
          }
        }
        return "";
      };

      const baleName = getVal('Bale Name', 'Name', 'Bale') || row[2] || "";
      const rawBoughtPrice = getVal('Bought Price', 'BoughtPrice', 'Cost', 'Price') || row[3] || 0;
      const rawInitialStock = getVal('Initial Stock', 'InitialStock', 'Stock', 'Quantity') || row[4] || 0;
      const status = getVal('Status') || row[5] || "Active";
      const notes = getVal('Notes', 'Description') || row[6] || "";

      const boughtPrice = typeof rawBoughtPrice === 'number' 
        ? rawBoughtPrice 
        : parseFloat(String(rawBoughtPrice).replace(/[^0-9.-]+/g, '')) || 0;
      const initialStock = parseInt(String(rawInitialStock).replace(/[^0-9]/g, ''), 10) || 0;

      const dateAdded = row[1] 
        ? (row[1] instanceof Date ? row[1].toISOString() : String(row[1]))
        : new Date().toISOString();

      bales.push({
        "Bale ID": baleId,
        "Date Added": dateAdded,
        "Bale Name": baleName.toString().trim(),
        "Bought Price": boughtPrice,
        "Initial Stock": initialStock,
        "Status": status.toString().trim(),
        "Notes": notes.toString().trim()
      });
    }
  }

  // --- 2. FETCH ORDERS ---
  const ordersData = ordersSheet.getDataRange().getValues();
  const orders = [];
  let totalSold = 0;
  let totalSales = 0;
  let ordersDone = 0;
  let ordersPending = 0;
  let pickupCount = 0;
  let shippedCount = 0;

  if (ordersData.length > 1) {
    const headers = ordersData[0].map(h => (h ? h.toString().trim() : ''));

    for (let i = 1; i < ordersData.length; i++) {
      const row = ordersData[i];
      const orderId = row[0] ? row[0].toString().trim() : "";
      if (!orderId) continue;

      const rowObj = {};
      headers.forEach((h, idx) => {
        if (h) rowObj[h] = row[idx];
      });

      const getVal = (...names) => {
        for (const n of names) {
          for (const k of Object.keys(rowObj)) {
            if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === n.toLowerCase().replace(/[^a-z0-9]/g, '')) {
              return rowObj[k];
            }
          }
        }
        return "";
      };

      const customerName = getVal('Customer Name', 'Customer', 'Name') || row[2] || "";
      const fulfillmentType = getVal('Fulfillment Type', 'Fulfillment', 'Type') || row[3] || "Pick Up";
      const shippingAddress = getVal('Shipping Address', 'Shipping Addres', 'Address') || row[4] || "";
      const sizeVariant = getVal('Size / Variant', 'Size/Variant', 'Size', 'Variant', 'Items Breakdown') || row[5] || "";
      const rawQty = getVal('Quantity', 'Total Quantity', 'Qty') || row[6] || 0;
      const rawAmount = getVal('Total Amount', 'Amount', 'Total') || row[7] || 0;
      const status = getVal('Status') || row[8] || "Pending";
      const rawCompletedAt = getVal('Completed At', 'Completed') || row[9] || "";
      const bale = getVal('Bale', 'Bale ID', 'Bale Name', 'Assigned Bale') || row[10] || "";

      const qty = parseInt(String(rawQty).replace(/[^0-9]/g, ''), 10) || 1;
      const amount = typeof rawAmount === 'number' 
        ? rawAmount 
        : parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, '')) || 0;

      const timestamp = row[1] 
        ? (row[1] instanceof Date ? row[1].toISOString() : String(row[1]))
        : new Date().toISOString();

      const completedAt = rawCompletedAt 
        ? (rawCompletedAt instanceof Date ? rawCompletedAt.toISOString() : String(rawCompletedAt))
        : "";

      if (status === 'Done') {
        ordersDone++;
        totalSold += qty;
        totalSales += amount;
      } else {
        ordersPending++;
      }
      
      if (fulfillmentType === 'Pick Up') {
        pickupCount++;
      } else if (fulfillmentType === 'Shipped') {
        shippedCount++;
      }

      orders.push({
        "Order ID": orderId,
        "Timestamp": timestamp,
        "Customer Name": customerName.toString().trim(),
        "Fulfillment Type": fulfillmentType.toString().trim(),
        "Shipping Address": shippingAddress.toString().trim(),
        "Size / Variant": sizeVariant.toString().trim(),
        "Quantity": qty,
        "Total Amount": amount,
        "Status": status.toString().trim(),
        "Completed At": completedAt,
        "Bale": bale.toString().trim()
      });
    }
  }
  
  // Sort orders newest first
  orders.reverse();

  const metrics = {
    totalSold: totalSold,
    totalSales: totalSales,
    ordersDone: ordersDone,
    ordersPending: ordersPending,
    avgOrderValue: (ordersDone > 0) ? (totalSales / ordersDone) : 0,
    pickupCount: pickupCount,
    shippedCount: shippedCount
  };

  return ContentService.createTextOutput(JSON.stringify({ metrics, orders, bales }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let ordersSheet = ss.getSheetByName(SHEET_ORDERS);
    let balesSheet = ss.getSheetByName(SHEET_BALES);

    if (!ordersSheet) {
      ordersSheet = ss.insertSheet(SHEET_ORDERS);
      ordersSheet.appendRow([
        "Order ID", "Timestamp", "Customer Name", "Fulfillment Type", 
        "Shipping Address", "Size / Variant", "Quantity", 
        "Total Amount", "Status", "Completed At", "Bale"
      ]);
    }

    if (!balesSheet) {
      balesSheet = ss.insertSheet(SHEET_BALES);
      balesSheet.appendRow([
        "Bale ID", "Date Added", "Bale Name", "Bought Price", 
        "Initial Stock", "Status", "Notes"
      ]);
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    // --- ORDER ACTIONS ---
    if (action === "addOrder") {
      const date = new Date();
      const dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyyMMdd");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderId = payload.orderId || `AR-${dateString}-${randomSuffix}`;
      const timestamp = payload.timestamp || date.toISOString();

      const customerName = payload.customerName || payload["Customer Name"] || "";
      const fulfillmentType = payload.fulfillmentType || payload["Fulfillment Type"] || "Pick Up";
      const shippingAddress = payload.shippingAddress || payload["Shipping Address"] || "";
      const sizeVariant = payload.itemsBreakdown || payload.sizeVariant || payload["Size / Variant"] || payload["Items Breakdown"] || "";
      const totalQuantity = parseInt(payload.totalQuantity || payload.quantity || payload["Quantity"] || payload["Total Quantity"] || 1, 10) || 1;
      const rawAmount = payload.totalAmount || payload["Total Amount"] || payload.amount || payload["Amount"] || 0;
      const totalAmount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, '')) || 0;
      const bale = payload.bale || payload["Bale"] || "";
      
      const newRow = [
        orderId,                                          // Col A: Order ID
        timestamp,                                        // Col B: Timestamp
        customerName,                                     // Col C: Customer Name
        fulfillmentType,                                  // Col D: Fulfillment Type
        shippingAddress,                                  // Col E: Shipping Address
        sizeVariant,                                      // Col F: Size / Variant
        totalQuantity,                                    // Col G: Quantity
        totalAmount,                                      // Col H: Total Amount
        "Pending",                                        // Col I: Status
        "",                                               // Col J: Completed At
        bale                                              // Col K: Bale
      ];
      
      const targetRow = getFirstEmptyRow(ordersSheet);
      ordersSheet.getRange(targetRow, 1, 1, newRow.length).setValues([newRow]);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, orderId: orderId }))
        .setMimeType(ContentService.MimeType.JSON);
        
    } else if (action === "toggleStatus") {
      const orderId = payload.orderId;
      const data = ordersSheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString().trim() === orderId) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex !== -1) {
        const currentStatus = data[rowIndex - 1][8]; // Status is Col I (index 8)
        const newStatus = (currentStatus === "Pending") ? "Done" : "Pending";
        ordersSheet.getRange(rowIndex, 9).setValue(newStatus);
        
        if (newStatus === "Done") {
          ordersSheet.getRange(rowIndex, 10).setValue(new Date().toISOString());
        } else {
          ordersSheet.getRange(rowIndex, 10).setValue("");
        }
        
        return ContentService.createTextOutput(JSON.stringify({ success: true, newStatus: newStatus }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        throw new Error("Order not found");
      }
    } else if (action === "updateOrder") {
      const orderId = payload.orderId;
      const data = ordersSheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString().trim() === orderId) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex !== -1) {
        const customerName = payload.customerName ?? payload["Customer Name"];
        const fulfillmentType = payload.fulfillmentType ?? payload["Fulfillment Type"];
        const shippingAddress = payload.shippingAddress ?? payload["Shipping Address"];
        const sizeVariant = payload.itemsBreakdown ?? payload.sizeVariant ?? payload["Size / Variant"] ?? payload["Items Breakdown"];
        const quantity = payload.totalQuantity ?? payload.quantity ?? payload["Quantity"] ?? payload["Total Quantity"];
        const rawAmount = payload.totalAmount ?? payload["Total Amount"] ?? payload.amount ?? payload["Amount"];
        const status = payload.status ?? payload["Status"];
        const bale = payload.bale ?? payload["Bale"];

        if (customerName !== undefined) ordersSheet.getRange(rowIndex, 3).setValue(customerName);
        if (fulfillmentType !== undefined) ordersSheet.getRange(rowIndex, 4).setValue(fulfillmentType);
        if (shippingAddress !== undefined) ordersSheet.getRange(rowIndex, 5).setValue(shippingAddress);
        if (sizeVariant !== undefined) ordersSheet.getRange(rowIndex, 6).setValue(sizeVariant);
        if (quantity !== undefined) ordersSheet.getRange(rowIndex, 7).setValue(parseInt(String(quantity).replace(/[^0-9]/g, ''), 10) || 1);
        if (rawAmount !== undefined) {
          const totalAmount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, '')) || 0;
          ordersSheet.getRange(rowIndex, 8).setValue(totalAmount);
        }
        if (status !== undefined) {
          ordersSheet.getRange(rowIndex, 9).setValue(status);
          if (status === "Done") {
            ordersSheet.getRange(rowIndex, 10).setValue(new Date().toISOString());
          }
        }
        if (bale !== undefined) ordersSheet.getRange(rowIndex, 11).setValue(bale);
        
        return ContentService.createTextOutput(JSON.stringify({ success: true, orderId: orderId }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        throw new Error("Order not found");
      }

    // --- BALE ACTIONS ---
    } else if (action === "addBale") {
      const date = new Date();
      const dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyyMMdd");
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const baleId = payload.baleId || `BALE-${dateString}-${randomSuffix}`;
      const dateAdded = payload.dateAdded || date.toISOString();
      const baleName = payload.baleName || payload["Bale Name"] || `Bale #${randomSuffix}`;
      const rawPrice = payload.boughtPrice || payload["Bought Price"] || 0;
      const boughtPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.-]+/g, '')) || 0;
      const rawStock = payload.initialStock || payload["Initial Stock"] || 0;
      const initialStock = parseInt(String(rawStock).replace(/[^0-9]/g, ''), 10) || 0;
      const status = payload.status || "Active";
      const notes = payload.notes || "";

      const newRow = [baleId, dateAdded, baleName, boughtPrice, initialStock, status, notes];
      const targetRow = getFirstEmptyRow(balesSheet);
      balesSheet.getRange(targetRow, 1, 1, newRow.length).setValues([newRow]);

      return ContentService.createTextOutput(JSON.stringify({ success: true, baleId: baleId }))
        .setMimeType(ContentService.MimeType.JSON);

    } else if (action === "updateBale") {
      const baleId = payload.baleId;
      const data = balesSheet.getDataRange().getValues();
      let rowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString().trim() === baleId) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex !== -1) {
        const baleName = payload.baleName ?? payload["Bale Name"];
        const rawPrice = payload.boughtPrice ?? payload["Bought Price"];
        const rawStock = payload.initialStock ?? payload["Initial Stock"];
        const status = payload.status ?? payload["Status"];
        const notes = payload.notes ?? payload["Notes"];

        if (baleName !== undefined) balesSheet.getRange(rowIndex, 3).setValue(baleName);
        if (rawPrice !== undefined) {
          const boughtPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.-]+/g, '')) || 0;
          balesSheet.getRange(rowIndex, 4).setValue(boughtPrice);
        }
        if (rawStock !== undefined) {
          const initialStock = parseInt(String(rawStock).replace(/[^0-9]/g, ''), 10) || 0;
          balesSheet.getRange(rowIndex, 5).setValue(initialStock);
        }
        if (status !== undefined) balesSheet.getRange(rowIndex, 6).setValue(status);
        if (notes !== undefined) balesSheet.getRange(rowIndex, 7).setValue(notes);

        return ContentService.createTextOutput(JSON.stringify({ success: true, baleId: baleId }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        throw new Error("Bale not found");
      }

    } else if (action === "deleteBale") {
      const baleId = payload.baleId;
      const data = balesSheet.getDataRange().getValues();
      let rowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString().trim() === baleId) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex !== -1) {
        balesSheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({ success: true, deleted: baleId }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        throw new Error("Bale not found");
      }

    } else {
      throw new Error("Invalid action");
    }

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Helper: Finds the first row where Column A is empty
function getFirstEmptyRow(sheet) {
  const columnA = sheet.getRange("A:A").getValues();
  for (let i = 1; i < columnA.length; i++) {
    const val = columnA[i][0];
    if (!val || val.toString().trim() === "") {
      return i + 1;
    }
  }
  return columnA.length + 1;
}

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let ordersSheet = ss.getSheetByName(SHEET_ORDERS);
  if (!ordersSheet) {
    ordersSheet = ss.insertSheet(SHEET_ORDERS);
  }
  if (ordersSheet.getLastRow() === 0) {
    ordersSheet.appendRow([
      "Order ID", "Timestamp", "Customer Name", "Fulfillment Type", 
      "Shipping Address", "Size / Variant", "Quantity", 
      "Total Amount", "Status", "Completed At", "Bale"
    ]);
  }

  let balesSheet = ss.getSheetByName(SHEET_BALES);
  if (!balesSheet) {
    balesSheet = ss.insertSheet(SHEET_BALES);
  }
  if (balesSheet.getLastRow() === 0) {
    balesSheet.appendRow([
      "Bale ID", "Date Added", "Bale Name", "Bought Price", 
      "Initial Stock", "Status", "Notes"
    ]);
  }
}

