const SHEET_NAME = 'Orders';

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      metrics: {
        totalSold: 0,
        totalSales: 0,
        ordersDone: 0,
        ordersPending: 0,
        avgOrderValue: 0,
        pickupCount: 0,
        shippedCount: 0
      },
      orders: []
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data[0].map(h => (h ? h.toString().trim() : ''));
  const orders = [];
  
  let totalSold = 0;
  let totalSales = 0;
  let ordersDone = 0;
  let ordersPending = 0;
  let pickupCount = 0;
  let shippedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const orderId = row[0] ? row[0].toString().trim() : "";
    
    // Ignore empty rows without Order ID
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

    // ONLY COUNT SALES AND UNITS SOLD IF STATUS IS 'Done'
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
      "Completed At": completedAt
    });
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

  return ContentService.createTextOutput(JSON.stringify({ metrics, orders }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error("Sheet not found");
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === "addOrder") {
      // Ensure headers exist if sheet is completely blank
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Order ID", "Timestamp", "Customer Name", "Fulfillment Type", 
          "Shipping Address", "Size / Variant", "Quantity", 
          "Total Amount", "Status", "Completed At"
        ]);
      }

      const date = new Date();
      const dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyyMMdd");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderId = `AR-${dateString}-${randomSuffix}`;
      const timestamp = date.toISOString();

      const customerName = payload.customerName || payload["Customer Name"] || "";
      const fulfillmentType = payload.fulfillmentType || payload["Fulfillment Type"] || "Pick Up";
      const shippingAddress = payload.shippingAddress || payload["Shipping Address"] || "";
      const sizeVariant = payload.itemsBreakdown || payload.sizeVariant || payload["Size / Variant"] || payload["Items Breakdown"] || "";
      const totalQuantity = parseInt(payload.totalQuantity || payload.quantity || payload["Quantity"] || payload["Total Quantity"] || 1, 10) || 1;
      const rawAmount = payload.totalAmount || payload["Total Amount"] || payload.amount || payload["Amount"] || 0;
      const totalAmount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, '')) || 0;
      
      const newRow = [
        orderId,                                          // Col A: Order ID
        timestamp,                                        // Col B: Timestamp
        customerName,                                     // Col C: Customer Name
        fulfillmentType,                                  // Col D: Fulfillment Type
        shippingAddress,                                  // Col E: Shipping Address
        sizeVariant,                                      // Col F: Size / Variant (e.g. "1x M")
        totalQuantity,                                    // Col G: Quantity (Sum of items)
        totalAmount,                                      // Col H: Total Amount
        "Pending",                                        // Col I: Status
        ""                                                // Col J: Completed At
      ];
      
      // SMART ROW INSERTION: Find first empty row in Column A
      const targetRow = getFirstEmptyRow(sheet);
      sheet.getRange(targetRow, 1, 1, newRow.length).setValues([newRow]);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, orderId: orderId }))
        .setMimeType(ContentService.MimeType.JSON);
        
    } else if (action === "toggleStatus") {
      const orderId = payload.orderId;
      const data = sheet.getDataRange().getValues();
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
        sheet.getRange(rowIndex, 9).setValue(newStatus);
        
        if (newStatus === "Done") {
          sheet.getRange(rowIndex, 10).setValue(new Date().toISOString());
        } else {
          sheet.getRange(rowIndex, 10).setValue("");
        }
        
        return ContentService.createTextOutput(JSON.stringify({ success: true, newStatus: newStatus }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        throw new Error("Order not found");
      }
    } else if (action === "updateOrder") {
      const orderId = payload.orderId;
      const data = sheet.getDataRange().getValues();
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

        if (customerName !== undefined) sheet.getRange(rowIndex, 3).setValue(customerName);
        if (fulfillmentType !== undefined) sheet.getRange(rowIndex, 4).setValue(fulfillmentType);
        if (shippingAddress !== undefined) sheet.getRange(rowIndex, 5).setValue(shippingAddress);
        if (sizeVariant !== undefined) sheet.getRange(rowIndex, 6).setValue(sizeVariant);
        if (quantity !== undefined) sheet.getRange(rowIndex, 7).setValue(parseInt(String(quantity).replace(/[^0-9]/g, ''), 10) || 1);
        if (rawAmount !== undefined) {
          const totalAmount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, '')) || 0;
          sheet.getRange(rowIndex, 8).setValue(totalAmount);
        }
        if (status !== undefined) {
          sheet.getRange(rowIndex, 9).setValue(status);
          if (status === "Done") {
            sheet.getRange(rowIndex, 10).setValue(new Date().toISOString());
          }
        }
        
        return ContentService.createTextOutput(JSON.stringify({ success: true, orderId: orderId }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        throw new Error("Order not found");
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

// Helper: Finds the first row where Column A (Order ID) is empty
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
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Order ID", "Timestamp", "Customer Name", "Fulfillment Type", 
      "Shipping Address", "Size / Variant", "Quantity", 
      "Total Amount", "Status", "Completed At"
    ]);
  }
}
