// מחזיר רשימת אצוות זמינות (quantity_remaining > 0) מסודרות לפי FIFO
export const getFifoSortedBatches = (partId, stockBatches) => {
  return stockBatches
    .filter(b => b.part_id === partId && b.quantity_remaining > 0)
    .sort((a, b) => new Date(a.received_date) - new Date(b.received_date));
};

// מחזיר את סך המלאי הזמין של חלק
export const getTotalStock = (partId, stockBatches) => {
  return stockBatches
    .filter(b => b.part_id === partId)
    .reduce((sum, b) => sum + b.quantity_remaining, 0);
};

// מבצע הקצאת FIFO לכמות מסוימת מחלק.
// מחזיר מערך של allocations [{batch_id, part_id, quantity, unit_cost_at_time}]
// אם אין מספיק מלאי - מחזיר { success: false, totalAvailable, allocations: [] }
export const allocateFifo = (partId, requestedQty, stockBatches) => {
  const available = getFifoSortedBatches(partId, stockBatches);
  const totalAvailable = available.reduce((sum, b) => sum + b.quantity_remaining, 0);

  if (totalAvailable < requestedQty) {
    return { success: false, totalAvailable, allocations: [] };
  }

  let remaining = requestedQty;
  const allocations = [];

  for (const batch of available) {
    if (remaining <= 0) break;
    const takeFromBatch = Math.min(remaining, batch.quantity_remaining);
    allocations.push({
      batch_id: batch.id,
      part_id: partId,
      quantity: takeFromBatch,
      unit_cost_at_time: batch.unit_cost,
    });
    remaining -= takeFromBatch;
  }

  return { success: true, totalAvailable, allocations };
};

// מחשב סה"כ עלות פנימית של allocations
export const calculateAllocationCost = (allocations) => {
  return allocations.reduce((sum, a) => sum + (a.quantity * a.unit_cost_at_time), 0);
};
