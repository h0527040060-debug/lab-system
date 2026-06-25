import { REPAIR_STATUSES } from '../constants/statuses';

// הכנסות לפי חודש (6 חודשים אחרונים)
export const getMonthlyRevenue = (repairs) => {
  const completed = repairs.filter(r => r.status === REPAIR_STATUSES.GREEN_COMPLETE && r.final_price);
  const monthsMap = {};

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' });
    monthsMap[key] = { month: label, revenue: 0, count: 0 };
  }

  completed.forEach(r => {
    const date = new Date(r.payment_at || r.released_at || r.date_intake);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthsMap[key]) {
      monthsMap[key].revenue += r.final_price || 0;
      monthsMap[key].count += 1;
    }
  });

  return Object.values(monthsMap);
};

// חלוקה לפי סטטוס
export const getRepairsByStatus = (repairs) => {
  const counts = {};
  repairs.forEach(r => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
};

// 10 לקוחות מובילים לפי הכנסה
export const getTopCustomers = (repairs, customers, limit = 10) => {
  const revenueByCustomer = {};
  repairs
    .filter(r => r.status === REPAIR_STATUSES.GREEN_COMPLETE && r.final_price)
    .forEach(r => {
      revenueByCustomer[r.customer_id] = (revenueByCustomer[r.customer_id] || 0) + r.final_price;
    });

  return Object.entries(revenueByCustomer)
    .map(([custId, revenue]) => {
      const customer = customers.find(c => c.id === custId);
      return { name: customer?.name || custId, revenue };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

// קודי עבודה הכי רווחיים
export const getTopWorkCodes = (repairs, workCatalog, limit = 5) => {
  const usage = {};
  repairs
    .filter(r => r.status === REPAIR_STATUSES.GREEN_COMPLETE)
    .forEach(r => {
      (r.performed_work_codes || []).forEach(wId => {
        if (!usage[wId]) usage[wId] = { count: 0, totalRevenue: 0 };
        usage[wId].count += 1;
        const work = workCatalog.find(w => w.id === wId);
        if (work) usage[wId].totalRevenue += work.price;
      });
    });

  return Object.entries(usage)
    .map(([wId, data]) => {
      const work = workCatalog.find(w => w.id === wId);
      return {
        name: work?.work_name || wId,
        count: data.count,
        revenue: data.totalRevenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

// סוגי מכשירים לפי כמות תיקונים
export const getRepairsByDeviceType = (repairs, devices) => {
  const counts = {};
  repairs.forEach(r => {
    const device = devices.find(d => d.id === r.device_id);
    if (device?.type) {
      counts[device.type] = (counts[device.type] || 0) + 1;
    }
  });
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
};

// סיכום פיננסי מלא (ללא מע"מ)
export const calculateFinancialSummary = (repairs, generalExpenses, technicians) => {
  const completed = repairs.filter(r => r.status === REPAIR_STATUSES.GREEN_COMPLETE);

  const totalRevenue = completed.reduce((sum, r) => sum + (r.final_price || 0), 0);

  const totalPartsCost = completed.reduce((sum, r) => sum + (r.internal_parts_cost || 0), 0);

  // עלות עבודה לפי הטכנאי של כל תיקון
  const totalLaborCost = completed.reduce((sum, r) => {
    const tech = technicians.find(t => t.id === r.technician_id);
    const hourlyRate = tech?.hourly_cost || 100;
    return sum + ((r.actual_hours || 0) * hourlyRate);
  }, 0);

  const totalGeneralExpenses = generalExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const grossProfit = totalRevenue - totalPartsCost - totalLaborCost;
  const netProfit = grossProfit - totalGeneralExpenses;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

  return {
    totalRevenue,
    totalPartsCost,
    totalLaborCost,
    totalGeneralExpenses,
    grossProfit,
    netProfit,
    grossMargin,
    netMargin,
    completedCount: completed.length,
  };
};
