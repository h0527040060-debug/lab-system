import { REPAIR_STATUSES } from '../constants/statuses';
import { isPartLowStock } from './inventory';

export const getNotifications = (state) => {
  const notifications = [];
  const now = Date.now();
  const stuckDays = state.settings.alert_stuck_repair_days || 7;

  // 1. תיקונים תקועים
  state.repairs.forEach(r => {
    const completed = [REPAIR_STATUSES.GREEN_COMPLETE, REPAIR_STATUSES.RED_CANCELLED].includes(r.status);
    if (completed) return;
    const daysSince = (now - new Date(r.date_intake)) / (1000 * 60 * 60 * 24);
    if (daysSince > stuckDays) {
      notifications.push({
        id: `stuck-${r.id}`,
        type: 'stuck_repair',
        severity: 'high',
        title: `תיקון תקוע ${Math.floor(daysSince)} ימים`,
        message: `${r.id} - נתקע במצב "${r.status}"`,
        link: 'repairs',
        icon: '🚨',
      });
    }
  });

  // 2. חוסרים במלאי
  const lowStockParts = state.parts.filter(p => isPartLowStock(p, state.stockBatches));
  if (lowStockParts.length > 0) {
    notifications.push({
      id: 'low-stock',
      type: 'low_stock',
      severity: 'medium',
      title: `${lowStockParts.length} חלקים במלאי נמוך`,
      message: 'יש להזמין מספקים',
      link: 'orders',
      icon: '📦',
    });
  }

  // 3. ערעורי אחריות פתוחים
  const pendingAppeals = state.repairs.filter(r => r.status === REPAIR_STATUSES.YELLOW_APPEAL);
  if (pendingAppeals.length > 0) {
    notifications.push({
      id: 'pending-appeals',
      type: 'appeals',
      severity: 'medium',
      title: `${pendingAppeals.length} ערעורי אחריות פתוחים`,
      message: 'ממתינים להחלטה',
      link: 'appeals',
      icon: '⚠️',
    });
  }

  // 4. הזמנות פתוחות שלא הגיעו יותר מ-14 ימים
  state.purchaseOrders
    .filter(o => o.status === 'pending')
    .forEach(o => {
      const daysSince = (now - new Date(o.order_date)) / (1000 * 60 * 60 * 24);
      if (daysSince > 14) {
        notifications.push({
          id: `late-order-${o.id}`,
          type: 'late_order',
          severity: 'medium',
          title: `הזמנה מתאחרת`,
          message: `${o.id} מ-${o.supplier_name} - ${Math.floor(daysSince)} ימים`,
          link: 'orders',
          icon: '⏳',
        });
      }
    });

  // 5. קריאות ממתינות לתמחור
  const pendingPricing = state.repairs.filter(r => r.status === REPAIR_STATUSES.YELLOW_DIAGNOSIS);
  if (pendingPricing.length > 0) {
    notifications.push({
      id: 'pending-pricing',
      type: 'pricing',
      severity: 'low',
      title: `${pendingPricing.length} קריאות ממתינות לתמחור`,
      message: 'קריאות שאובחנו במעבדה',
      link: 'approval',
      icon: '💰',
    });
  }

  return notifications;
};
