import { getTotalStock } from './fifo';
import { generatePurchaseOrderId } from './idGenerators';

export const getDefaultSupplier = (part) => {
  if (!part?.suppliers || part.suppliers.length === 0) return null;
  return part.suppliers.find(s => s.is_default) || part.suppliers[0];
};

export const isPartLowStock = (part, stockBatches) => {
  const current = getTotalStock(part.id, stockBatches);
  return current < (part.min_stock || 0);
};

export const getRecommendedOrderQty = (part, stockBatches) => {
  const current = getTotalStock(part.id, stockBatches);
  const min = part.min_stock || 0;
  if (current >= min) return 0;
  return min - current;
};

export const groupShortagesBySupplier = (parts, stockBatches) => {
  const grouped = {};
  parts.forEach(part => {
    if (!isPartLowStock(part, stockBatches)) return;
    const supplier = getDefaultSupplier(part);
    if (!supplier) return;
    const key = supplier.supplier_name;
    if (!grouped[key]) grouped[key] = { supplier, items: [] };
    grouped[key].items.push({
      part,
      currentStock: getTotalStock(part.id, stockBatches),
      recommendedQty: getRecommendedOrderQty(part, stockBatches),
      supplier,
    });
  });
  return grouped;
};

// הוספה ידנית של חלק להזמנת רכש — ללא תלות במלאי מינימום/קיים.
// מצטרף להזמנה פתוחה קיימת לאותו ספק אם יש, אחרת יוצר הזמנה חדשה.
export const addPartToManualOrder = (state, dispatch, part, quantity) => {
  const qty = Math.max(1, parseInt(quantity) || 1);
  const supplier = getDefaultSupplier(part);
  const supplierName = supplier?.supplier_name || part.manufacturer || 'לא צוין ספק';
  const unitCost = supplier?.price || 0;

  const existingOrder = state.purchaseOrders.find(
    o => o.status === 'pending' && o.supplier_name === supplierName
  );

  if (existingOrder) {
    const existingItem = existingOrder.items.find(i => i.part_id === part.id);
    const items = existingItem
      ? existingOrder.items.map(i => i.part_id === part.id
          ? { ...i, quantity: i.quantity + qty, total_cost: (i.quantity + qty) * i.unit_cost }
          : i)
      : [...existingOrder.items, { part_id: part.id, part_name: part.name, quantity: qty, unit_cost: unitCost, total_cost: unitCost * qty }];
    const total = items.reduce((sum, i) => sum + i.total_cost, 0);
    dispatch({ type: 'UPDATE_PURCHASE_ORDER', payload: { id: existingOrder.id, items, total } });
    return existingOrder.id;
  }

  const orderId = generatePurchaseOrderId(state.purchaseOrders.map(o => o.id));
  dispatch({
    type: 'ADD_PURCHASE_ORDER',
    payload: {
      id: orderId,
      supplier_name: supplierName,
      order_date: new Date().toISOString(),
      expected_delivery: null,
      received_date: null,
      status: 'pending',
      items: [{ part_id: part.id, part_name: part.name, quantity: qty, unit_cost: unitCost, total_cost: unitCost * qty }],
      total: unitCost * qty,
      notes: 'נוצר ידנית',
    },
  });
  return orderId;
};

export const calculateWeightedAvgCost = (partId, stockBatches) => {
  const batches = stockBatches.filter(b => b.part_id === partId && b.quantity_remaining > 0);
  if (batches.length === 0) return 0;
  const totalQty = batches.reduce((sum, b) => sum + b.quantity_remaining, 0);
  if (totalQty === 0) return 0;
  const weightedSum = batches.reduce((sum, b) => sum + (b.quantity_remaining * b.unit_cost), 0);
  return weightedSum / totalQty;
};
