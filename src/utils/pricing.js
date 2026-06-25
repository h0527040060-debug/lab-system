export const getPartSellingPrice = (part) => {
  if (!part || !part.suppliers || part.suppliers.length === 0) return 0;
  const defaultSupplier = part.suppliers.find(s => s.is_default) || part.suppliers[0];
  const cost = defaultSupplier?.price || 0;
  return cost * (1 + (part.selling_markup_percent || 0) / 100);
};

export const getPartCost = (part) => {
  if (!part || !part.suppliers || part.suppliers.length === 0) return 0;
  const defaultSupplier = part.suppliers.find(s => s.is_default) || part.suppliers[0];
  return defaultSupplier?.price || 0;
};

export const calculateQuoteBreakdown = (repair, state) => {
  const workCodes = repair.diagnosed_work_codes || [];
  const partsList = repair.diagnosed_parts || [];
  const servicesList = repair.diagnosed_services || [];

  const works = workCodes.map(wId => {
    const work = state.workCatalog.find(w => w.id === wId);
    return work ? { id: work.id, name: work.work_name, brand: work.brand, model: work.model, price: work.price } : null;
  }).filter(Boolean);
  const worksTotal = works.reduce((sum, w) => sum + w.price, 0);

  const parts = partsList.map(({ part_id, quantity }) => {
    const part = state.parts.find(p => p.id === part_id);
    if (!part) return null;
    const unitPrice = getPartSellingPrice(part);
    return {
      id: part.id,
      name: part.name,
      manufacturer: part.manufacturer,
      quantity,
      unit_price: unitPrice,
      total: unitPrice * quantity,
    };
  }).filter(Boolean);
  const partsTotal = parts.reduce((sum, p) => sum + p.total, 0);

  const services = servicesList.map(sId => {
    const svc = state.services.find(s => s.id === sId);
    return svc ? { id: svc.id, name: svc.name, price: svc.base_price } : null;
  }).filter(Boolean);
  const servicesTotal = services.reduce((sum, s) => sum + s.price, 0);

  const grandTotal = worksTotal + partsTotal + servicesTotal;

  return { works, worksTotal, parts, partsTotal, services, servicesTotal, grandTotal };
};

// חישוב חשבון סופי — משתמש ב-invoice_items אם קיים, אחרת fallback ל-calculateQuoteBreakdown
export const calculateInvoiceBreakdown = (repair, state) => {
  if (!repair.invoice_items) return calculateQuoteBreakdown(repair, state);
  const { works = [], parts = [], services = [] } = repair.invoice_items;
  const worksTotal = works.reduce((s, w) => s + (w.price || 0), 0);
  const partsWithTotal = parts.map(p => ({ ...p, total: (p.unit_price || 0) * (p.quantity || 1) }));
  const partsTotal = partsWithTotal.reduce((s, p) => s + p.total, 0);
  const servicesTotal = services.reduce((s, sv) => s + (sv.price || 0), 0);
  return {
    works,
    worksTotal,
    parts: partsWithTotal,
    partsTotal,
    services,
    servicesTotal,
    grandTotal: worksTotal + partsTotal + servicesTotal,
  };
};
