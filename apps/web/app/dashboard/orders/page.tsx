'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { orderAPI, whatsappAPI } from '@/lib/api';
import { 
  Search, ShoppingCart, Clock, CheckCircle2, Package, 
  XCircle, ArrowRight, Edit3, X, Trash2
} from 'lucide-react';

const STATUS_FILTERS = [
  { value: 'all', label: 'All', icon: ShoppingCart },
  { value: 'NEW', label: 'New', icon: Clock, color: 'bg-amber-100 text-amber-700' },
  { value: 'PREPARING', label: 'Preparing', icon: Package, color: 'bg-orange-100 text-orange-700' },
  { value: 'READY_FOR_PICKUP', label: 'Ready', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  { value: 'COLLECTED', label: 'Collected', icon: Package, color: 'bg-blue-100 text-blue-700' },
  { value: 'CANCELLED', label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-700' },
];

const STATUS_BADGE: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-700',
  PREPARING: 'bg-orange-100 text-orange-700',
  READY_FOR_PICKUP: 'bg-green-100 text-green-700',
  COLLECTED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  NEW: 'New', PREPARING: 'Preparing', READY_FOR_PICKUP: 'Ready', COLLECTED: 'Collected', CANCELLED: 'Cancelled',
};

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 4, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadOrders(); }, [status, pagination.page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (status !== 'all') params.status = status;
      if (search) params.search = search;
      const { data } = await orderAPI.list(params);
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      toast.success(`Order marked as ${STATUS_LABEL[newStatus] || newStatus}`);
      if (newStatus === 'READY_FOR_PICKUP') {
        try {
          await whatsappAPI.sendReadyNotification(orderId);
          toast.success('WhatsApp notification sent!');
        } catch {
          toast.error('WhatsApp failed');
        }
      }
      loadOrders();
    } catch {
      toast.error('Failed to update');
    } finally {
      setUpdatingId('');
    }
  };

  const openEditModal = (order: any) => {
    setEditingOrder(order);
    setEditItems(order.items.map((item: any) => ({
      ...item,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })));
  };

  const updateEditItem = (index: number, field: string, value: any) => {
    const updated = [...editItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditItems(updated);
  };

  const removeEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const saveOrderEdit = async () => {
    if (!editingOrder || editItems.length === 0) return;
    setSaving(true);
    try {
      // Strip extra DB fields — only send what the API schema expects
      const cleanedItems = editItems.map((item: any) => ({
        productName: item.productName,
        quantity: Math.max(0, Number(item.quantity) || 0),
        unit: item.unit || 'piece',
        unitPrice: Math.max(0, Number(item.unitPrice) || 0),
        ...(item.productId ? { productId: item.productId } : {}),
      }));
      await orderAPI.updateItems(editingOrder.id, { items: cleanedItems });
      toast.success('Order updated!');
      setEditingOrder(null);
      loadOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    try {
      await orderAPI.delete(orderId);
      toast.success('Order deleted');
      loadOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete order');
    }
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    loadOrders();
  };

  const getNextAction = (orderStatus: string) => {
    switch (orderStatus) {
      case 'NEW': return { label: 'Prepare', status: 'PREPARING', color: 'bg-orange-500 text-white' };
      case 'PREPARING': return { label: 'Ready', status: 'READY_FOR_PICKUP', color: 'bg-green-500 text-white' };
      case 'READY_FOR_PICKUP': return { label: 'Collected', status: 'COLLECTED', color: 'bg-blue-500 text-white' };
      default: return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-grocgo-600" />
            Orders
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{pagination.total} total</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto hide-scrollbar pb-1 no-select">
        {STATUS_FILTERS.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap press-effect ${
                status === f.value ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {f.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders, names, phones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
          />
        </div>
        <button onClick={handleSearch} className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium press-effect">
          Go
        </button>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-medium text-gray-900 mb-1">No orders found</p>
          <p className="text-sm text-gray-400">
            {search ? 'Try a different search' : 'Share your QR code to start receiving orders'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const action = getNextAction(order.status);
            const isUpdating = updatingId === order.id;
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/dashboard/orders/${order.id}`} className="font-bold text-sm hover:underline">
                        {order.orderNumber}
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[order.status]}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.customer?.name} · {order.customer?.phone}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-bold tabular-nums">₹{order.totalAmount.toFixed(2)}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {order.items?.slice(0, 4).map((item: any, idx: number) => (
                    <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-medium">
                      {item.productName} ×{item.quantity}
                    </span>
                  ))}
                  {(order.items?.length || 0) > 4 && (
                    <span className="text-[11px] text-gray-400 self-center ml-1">
                      +{order.items.length - 4} more
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {action && (
                    <button
                      onClick={() => handleStatusChange(order.id, action.status)}
                      disabled={isUpdating}
                      className={`${action.color} px-3 py-1.5 rounded-lg text-xs font-semibold press-effect disabled:opacity-50 flex items-center gap-1`}
                    >
                      {isUpdating ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>{action.label}</>
                      )}
                    </button>
                  )}

                  {['NEW', 'PREPARING'].includes(order.status) && (
                    <button
                      onClick={() => openEditModal(order)}
                      className="text-blue-500 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-medium press-effect flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  )}

                  {['NEW', 'PREPARING'].includes(order.status) && (
                    <button
                      onClick={() => {
                        if (confirm('Cancel this order?')) handleStatusChange(order.id, 'CANCELLED');
                      }}
                      className="border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-xs font-medium press-effect"
                    >
                      Cancel
                    </button>
                  )}

                  {['NEW', 'CANCELLED'].includes(order.status) && (
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg text-xs font-medium press-effect"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="ml-auto text-gray-400 hover:text-gray-600 text-xs font-medium press-effect flex items-center gap-1"
                  >
                    Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium press-effect disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-400 tabular-nums px-2">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium press-effect disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setEditingOrder(null)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
            <div className="bg-white sm:rounded-2xl rounded-t-2xl max-h-[85vh] sm:max-h-[80vh] w-full sm:max-w-lg overflow-hidden flex flex-col animate-slide-up">
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="px-5 pt-2 sm:pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-lg font-bold">Edit Order {editingOrder.orderNumber}</h2>
                <button onClick={() => setEditingOrder(null)} disabled={saving} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {editItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">Qty</label>
                          <input type="number" min="0.01" step="0.01" value={item.quantity}
                            onChange={(e) => updateEditItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-grocgo-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">Price (₹)</label>
                          <input type="number" min="0" step="0.01" value={item.unitPrice}
                            onChange={(e) => updateEditItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-grocgo-500 outline-none" />
                        </div>
                        <div className="text-right">
                          <label className="text-[10px] text-gray-400 uppercase">Total</label>
                          <p className="text-xs font-semibold">₹{(item.quantity * item.unitPrice).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeEditItem(idx)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {editItems.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">No items</p>
                )}
              </div>
              <div className="px-5 py-4 border-t border-gray-100 bg-white">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-500">New Total</span>
                  <span className="font-bold">₹{editItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setEditingOrder(null)} disabled={saving}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={saveOrderEdit} disabled={saving || editItems.length === 0}
                    className="flex-1 py-3 bg-grocgo-600 text-white rounded-xl text-sm font-semibold hover:bg-grocgo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
