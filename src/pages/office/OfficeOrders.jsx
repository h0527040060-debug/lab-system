import { useState } from 'react';
import { useAppContext as useApp } from '../../store/AppContext';
import { formatMoney, formatDate } from '../../utils/formatters';
import { generatePurchaseOrderId } from '../../utils/idGenerators';
import { groupShortagesBySupplier } from '../../utils/inventory';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ShoppingCart, AlertTriangle, Send, Package, CheckCircle2, HelpCircle } from 'lucide-react';

const OPEN_STATUSES = new Set(['red_intake', 'yellow_diagnosis', 'yellow_appeal', 'yellow_waiting_approval', 'yellow_ready_to_work', 'in_work', 'pending_release_docs', 'pending_payment']);

function getInquiriesBySupplier(repairs) {
  const map = {};
  repairs.forEach(repair => {
    if (!OPEN_STATUSES.has(repair.status)) return;
    (repair.inquiry_parts || []).forEach(ip => {
      (ip.supplier_ids || []).forEach(sid => {
        if (!map[sid]) map[sid] = [];
        map[sid].push({ repairId: repair.id, ...ip });
      });
    });
  });
  return map;
}

export default function OfficeOrders() {
  const { state, dispatch } = useApp();
  const [createOrderFromSupplier, setCreateOrderFromSupplier] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [receivingOrder, setReceivingOrder] = useState(null);

  const shortagesBySupplier = groupShortagesBySupplier(state.parts, state.stockBatches);
  const inquiriesBySupplier = getInquiriesBySupplier(state.repairs);
  const pendingOrders = state.purchaseOrders.filter(o => o.status === 'pending');
  const receivedOrders = state.purchaseOrders.filter(o => o.status === 'received').slice(-5);

  const handleCreateOrder = (supplierName, items) => {
    const orderId = generatePurchaseOrderId(state.purchaseOrders.map(o => o.id));
    const orderItems = items.map(({ part, recommendedQty, supplier }) => ({
      part_id: part.id,
      part_name: part.name,
      quantity: recommendedQty,
      unit_cost: supplier.price,
      total_cost: supplier.price * recommendedQty,
    }));
    const total = orderItems.reduce((sum, i) => sum + i.total_cost, 0);

    dispatch({
      type: 'ADD_PURCHASE_ORDER',
      payload: {
        id: orderId,
        supplier_name: supplierName,
        order_date: new Date().toISOString(),
        expected_delivery: null,
        received_date: null,
        status: 'pending',
        items: orderItems,
        total,
        notes: '',
      }
    });
    setCreateOrderFromSupplier(null);
  };

  const handleReceiveOrder = (order) => {
    let batchIdCounter = state.stockBatches.length;
    order.items.forEach(item => {
      batchIdCounter++;
      const batchId = `BATCH-${String(batchIdCounter).padStart(4, '0')}`;
      dispatch({
        type: 'ADD_STOCK_BATCH',
        payload: {
          id: batchId,
          part_id: item.part_id,
          received_date: new Date().toISOString(),
          quantity: item.quantity,
          quantity_remaining: item.quantity,
          supplier_name: order.supplier_name,
          unit_cost: item.unit_cost,
          purchase_order_id: order.id,
        }
      });
    });

    dispatch({
      type: 'UPDATE_PURCHASE_ORDER',
      payload: {
        id: order.id,
        status: 'received',
        received_date: new Date().toISOString(),
      }
    });

    setReceivingOrder(null);
  };

  return (
    <div>
      <PageHeader
        title="הזמנות מספקים"
        subtitle={`${Object.keys(shortagesBySupplier).length} ספקים עם חוסרים, ${pendingOrders.length} הזמנות פתוחות`}
      />

      {/* חוסרים מקובצים לפי ספק */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="text-orange-500" size={20} />
          חוסרים במלאי - מקובצים לפי ספק
        </h2>

        {Object.keys(shortagesBySupplier).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm">
            <EmptyState
              icon={CheckCircle2}
              title="אין חוסרים כעת"
              description="כל החלקים במלאי מספיק"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(shortagesBySupplier).map(([supplierName, { supplier, items }]) => {
              const totalCost = items.reduce((sum, i) => sum + (i.recommendedQty * i.supplier.price), 0);
              return (
                <div key={supplierName} className="bg-white rounded-xl shadow-sm border-r-4 border-orange-400">
                  <div className="p-4 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900">{supplierName}</h3>
                      <p className="text-xs text-slate-500">{items.length} חלקים חסרים</p>
                    </div>
                    <button
                      onClick={() => setCreateOrderFromSupplier({ supplierName, items, supplier })}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1"
                    >
                      <Send size={14} />
                      צור הזמנה ({formatMoney(totalCost)})
                    </button>
                  </div>

                  <table className="w-full text-sm border-t border-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-right p-2 text-xs">חלק</th>
                        <th className="text-center p-2 text-xs">מלאי נוכחי</th>
                        <th className="text-center p-2 text-xs">מינימום</th>
                        <th className="text-center p-2 text-xs">להזמין</th>
                        <th className="text-right p-2 text-xs">סה"כ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(({ part, currentStock, recommendedQty }) => (
                        <tr key={part.id} className="border-t">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {part.images?.[0] && (
                                <img src={part.images[0]} alt="" className="w-8 h-8 object-cover rounded shrink-0" />
                              )}
                              <div>
                                <p className="font-semibold text-xs">{part.name}</p>
                                <p className="text-xs text-slate-500">{part.manufacturer_sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 text-center text-red-600 font-bold">{currentStock}</td>
                          <td className="p-2 text-center text-slate-600">{part.min_stock}</td>
                          <td className="p-2 text-center font-bold text-orange-600">{recommendedQty}</td>
                          <td className="p-2 font-semibold">{formatMoney(recommendedQty * supplier.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* חלקים לבירור לפי ספק */}
      {Object.keys(inquiriesBySupplier).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <HelpCircle className="text-amber-500" size={20} />
            חלקים לבירור - מקובצים לפי ספק
          </h2>
          <div className="space-y-3">
            {Object.entries(inquiriesBySupplier).map(([supplierId, items]) => {
              const supplier = state.suppliers.find(s => s.id === Number(supplierId));
              if (!supplier) return null;
              return (
                <div key={supplierId} className="bg-white rounded-xl shadow-sm border-r-4 border-amber-400">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">{supplier.name}</h3>
                    <p className="text-xs text-slate-500">{items.length} חלקים לבירור</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {items.map(item => (
                      <div key={item.id} className="p-3 flex gap-3 items-start bg-amber-50/40">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                          <p className="text-xs text-slate-500 mt-0.5">תיקון: {item.repairId}</p>
                        </div>
                        {item.images?.length > 0 && (
                          <div className="flex gap-1 shrink-0">
                            {item.images.map((src, i) => (
                              <img key={i} src={src} alt="" className="w-12 h-12 object-cover rounded border border-amber-200" />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* הזמנות פתוחות */}
      {pendingOrders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <ShoppingCart size={20} />
            הזמנות פתוחות ({pendingOrders.length})
          </h2>
          <div className="space-y-2">
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-blue-600">{order.id}</span>
                    <span className="text-sm font-semibold">{order.supplier_name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {order.items.length} פריטים • הוזמן ב-{formatDate(order.order_date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold">{formatMoney(order.total)}</p>
                  <button
                    onClick={() => setViewingOrder(order)}
                    className="text-sm text-slate-600 hover:text-slate-800 px-3 py-1"
                  >
                    פרטים
                  </button>
                  <button
                    onClick={() => setReceivingOrder(order)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1"
                  >
                    <Package size={14} />
                    קיבלתי
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* הזמנות שהתקבלו - 5 אחרונות */}
      {receivedOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-600 mb-3">הזמנות שהתקבלו לאחרונה</h2>
          <div className="space-y-2">
            {[...receivedOrders].reverse().map(order => (
              <div key={order.id} className="bg-slate-50 rounded-lg p-3 flex justify-between items-center text-sm">
                <div>
                  <span className="font-mono font-bold text-slate-600">{order.id}</span>
                  <span className="text-slate-600 mr-2">• {order.supplier_name}</span>
                  <span className="text-xs text-slate-500 mr-2">התקבל {formatDate(order.received_date)}</span>
                </div>
                <span className="font-semibold">{formatMoney(order.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {createOrderFromSupplier && (
        <CreateOrderModal
          supplierName={createOrderFromSupplier.supplierName}
          items={createOrderFromSupplier.items}
          onConfirm={() => handleCreateOrder(createOrderFromSupplier.supplierName, createOrderFromSupplier.items)}
          onClose={() => setCreateOrderFromSupplier(null)}
        />
      )}

      {viewingOrder && (
        <OrderDetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
      )}

      <ConfirmDialog
        open={!!receivingOrder}
        title="קבלת הזמנה"
        message={`בקבלת ההזמנה ${receivingOrder?.id} יווצרו אצוות מלאי חדשות. האם לאשר?`}
        confirmLabel="קיבלתי - עדכן מלאי"
        onConfirm={() => handleReceiveOrder(receivingOrder)}
        onCancel={() => setReceivingOrder(null)}
      />
    </div>
  );
}

function CreateOrderModal({ supplierName, items, onConfirm, onClose }) {
  const totalCost = items.reduce((sum, i) => sum + (i.recommendedQty * i.supplier.price), 0);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`יצירת הזמנה - ${supplierName}`}
      subtitle={`${items.length} פריטים • ${formatMoney(totalCost)}`}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg">ביטול</button>
          <button onClick={onConfirm} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold">
            צור הזמנה
          </button>
        </div>
      }
    >
      <div className="space-y-2">
        {items.map(({ part, recommendedQty, supplier }) => (
          <div key={part.id} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{part.name}</p>
              <p className="text-xs text-slate-500">{recommendedQty} × {formatMoney(supplier.price)}</p>
            </div>
            <p className="font-bold">{formatMoney(recommendedQty * supplier.price)}</p>
          </div>
        ))}
        <div className="bg-orange-50 rounded-lg p-3 flex justify-between font-bold text-orange-900">
          <span>סה"כ הזמנה:</span>
          <span className="text-lg">{formatMoney(totalCost)}</span>
        </div>
      </div>
    </Modal>
  );
}

function OrderDetailsModal({ order, onClose }) {
  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`הזמנה ${order.id}`}
      subtitle={`${order.supplier_name} • ${formatDate(order.order_date)}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="bg-slate-50 rounded-lg p-3 flex justify-between">
            <div>
              <p className="font-semibold text-sm">{item.part_name}</p>
              <p className="text-xs text-slate-500">{item.quantity} × {formatMoney(item.unit_cost)}</p>
            </div>
            <p className="font-bold">{formatMoney(item.total_cost)}</p>
          </div>
        ))}
        <div className="bg-blue-50 rounded-lg p-3 flex justify-between font-bold text-blue-900">
          <span>סה"כ:</span>
          <span className="text-lg">{formatMoney(order.total)}</span>
        </div>
      </div>
    </Modal>
  );
}
