import { getTotalStock } from './fifo';

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
  const deficit = min - current;
  const reserve = Math.ceil(min / 2);
  return deficit + reserve;
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

export const calculateWeightedAvgCost = (partId, stockBatches) => {
  const batches = stockBatches.filter(b => b.part_id === partId && b.quantity_remaining > 0);
  if (batches.length === 0) return 0;
  const totalQty = batches.reduce((sum, b) => sum + b.quantity_remaining, 0);
  if (totalQty === 0) return 0;
  const weightedSum = batches.reduce((sum, b) => sum + (b.quantity_remaining * b.unit_cost), 0);
  return weightedSum / totalQty;
};
