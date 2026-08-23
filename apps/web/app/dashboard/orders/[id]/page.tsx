'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { orderAPI, invoiceAPI, whatsappAPI } from '@/lib/api';
import { 
  ArrowLeft, User, Phone, MapPin, ShoppingCart, FileText,
  Download, Eye, Printer, ChefHat, CheckCircle2, Package, Trash2,
  XCircle, Clock, Edit3, X
} from 'lucide-react';

const STATUS_FLOW = ['NEW', 'PREPARING', 'READY_FOR_PICKUP', 'COLLECTED'];
const STATUS_LABELS: Record<string, string> = {
  NEW: 'New', PREPARING: 'Preparing', READY_FOR_PICKUP: 'Ready', COLLECTED: 'Collected', CANCELLED: 'Cancelled',
};
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  NEW: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  PREPARING: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  READY_FOR_PICKUP: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
  COLLECTED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  useEffect(() => { loadOrder(); }, [params.id]);

  const loadOrder = async () => {
    try {
      const { data } = await orderAPI.get(params.id as string);
      setOrder(data);
    } catch {
      toast.error('Order not found');
      router.push('/dashboard/orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    setUpdating(status);
    try {
      await orderAPI.updateStatus(order.id, status);
      toast.success(`Order marked as ${STATUS_LABELS[status] || status}`);
      if (status === 'READY_FOR_PICKUP') {
        try {
          await whatsappAPI.sendReadyNotification(order.id);
          toast.success('WhatsApp notification sent!');
        } catch {
          toast.error('WhatsApp failed (check provider config)');
        }
      }
      loadOrder();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating('');
    }
  };

  const handleDeleteOrder = async () => {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    try {
      await orderAPI.delete(order.id);
      toast.success('Order deleted');
      router.push('/dashboard/orders');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete order');
    }
  };

  const generateInvoice = async () => {
    setUpdating('invoice');
    try {
      await invoiceAPI.generate(order.id);
      toast.success('Invoice generated!');
      loadOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate invoice');
    } finally {
      setUpdating('');
    }
  };

  const printInvoice = async () => {
    try {
      const blobUrl = await invoiceAPI.fetchPdfBlob(order.invoice.id);
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(blobUrl);
        };
      }
    } catch {
      toast.error('Failed to load PDF for printing');
    }
  };

  const downloadInvoice = async () => {
    try {
      await invoiceAPI.downloadPdf(order.invoice.id, `${order.invoice.invoiceNumber}.pdf`);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-24 rounded-xl" />
      </div>
    );
  }

  if (!order) return null;

  const statusColor = STATUS_COLORS[order.status] || STATUS_COLORS.NEW;
  const statusIdx = STATUS_FLOW.indexOf(order.status);
  const customer = order.customer;
  const items = order.items || [];

  const nextAction = (() => {
    switch (order.status) {
      case 'NEW': return { label: 'Start Preparing', status: 'PREPARING', icon: ChefHat, color: 'bg-orange-500 hover:bg-orange-600' };
      case 'PREPARING': return { label: 'Mark Ready + WhatsApp', status: 'READY_FOR_PICKUP', icon: CheckCircle2, color: 'bg-green-500 hover:bg-green-600' };
      case 'READY_FOR_PICKUP': return { label: 'Mark Collected', status: 'COLLECTED', icon: Package, color: 'bg-blue-500 hover:bg-blue-600' };
      default: return null;
    }
  })();

  return (
    <div className="max-w-2xl pb-safe">
      {/* Back Link */}
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-grocgo-600 text-sm font-medium mb-4 press-effect hover:text-grocgo-700">
        <ArrowLeft className="w-4 h-4" />
        Orders
      </Link>

      {/* Order Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold">{order.orderNumber}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl sm:text-2xl font-bold tabular-nums">₹{order.totalAmount.toFixed(2)}</p>
          <p className="text-xs text-gray-400">{items.length} items</p>
        </div>
      </div>

      {/* Status Timeline */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((s, idx) => {
              const isDone = idx <= statusIdx;
              const isCurrent = idx === statusIdx;
              const sc = STATUS_COLORS[s];
              return (
                <div key={s} className="flex flex-col items-center flex-1 relative">
                  {idx > 0 && (
                    <div className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${
                      idx <= statusIdx ? 'bg-grocgo-400' : 'bg-gray-200'
                    }`} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                    isDone ? `${sc.dot} text-white` : 'bg-gray-100 text-gray-400'
                  } ${isCurrent ? 'ring-2 ring-offset-1 ring-grocgo-400' : ''}`}>
                    {isDone && !isCurrent ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-1.5 font-medium text-center ${
                    isCurrent ? 'text-gray-900' : isDone ? 'text-gray-600' : 'text-gray-300'
                  }`}>
                    {STATUS_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" /> Customer
          </h2>
          {customer?.phone && (
            <a href={`tel:${customer.phone}`}
              className="flex items-center gap-1.5 bg-grocgo-50 text-grocgo-700 px-3 py-1.5 rounded-lg text-xs font-semibold press-effect">
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-16">Name</span>
            <span className="font-medium">{customer?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-16">Phone</span>
            <span className="font-medium">{customer?.phone}</span>
          </div>
          {customer?.address && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-16 flex-shrink-0">Address</span>
              <span className="font-medium">{customer.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Card */}
      <div className="bg-white rounded-xl border border-gray-100 mb-4">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-gray-400" /> Items ({items.length})
          </h2>
          <span className="text-xs text-gray-400 tabular-nums">
            {items.reduce((s: number, i: any) => s + i.quantity, 0)} qty total
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map((item: any) => (
            <div key={item.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                {item.quantity}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.productName}</p>
                <p className="text-[11px] text-gray-400">
                  ₹{item.unitPrice} × {item.quantity} {item.unit}
                </p>
              </div>
              <p className="font-semibold text-sm tabular-nums flex-shrink-0">₹{item.totalPrice.toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 rounded-b-xl">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-bold tabular-nums">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        {order.notes && (
          <div className="px-4 pb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">{order.notes}</div>
          </div>
        )}
        {order.adminNotes && (
          <div className="px-4 pb-4">
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-600">{order.adminNotes}</div>
          </div>
        )}
      </div>

      {/* Invoice Card */}
      {order.invoice && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-semibold text-sm">{order.invoice.invoiceNumber}</p>
                <p className="text-xs text-gray-400">Generated {new Date(order.invoice.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              order.invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {order.invoice.paymentStatus}
            </span>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowInvoicePreview(true)}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium press-effect flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={downloadInvoice}
              className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium press-effect flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={printInvoice}
              className="bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg text-sm font-medium press-effect flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      )}

      {/* Sticky Action Bar */}
      <div className="sticky-bottom-bar px-4 py-3 safe-bottom">
        <div className="max-w-2xl mx-auto space-y-2">
          {nextAction && (
            <button
              onClick={() => updateStatus(nextAction.status)}
              disabled={!!updating}
              className={`w-full text-white py-3.5 rounded-xl font-bold text-sm press-effect flex items-center justify-center gap-2 ${nextAction.color} disabled:opacity-50`}
            >
              {updating === nextAction.status ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
              ) : (
                <>{nextAction.icon && <nextAction.icon className="w-4 h-4" />} {nextAction.label}</>
              )}
            </button>
          )}

          <div className="flex gap-2">
            {order.status === 'COLLECTED' && !order.invoice && (
              <button
                onClick={generateInvoice}
                disabled={!!updating}
                className="flex-1 bg-grocgo-600 text-white py-3 rounded-xl text-sm font-semibold press-effect flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {updating === 'invoice' ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><FileText className="w-4 h-4" /> Generate Invoice</>
                )}
              </button>
            )}

            {order.status !== 'CANCELLED' && order.status !== 'COLLECTED' && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this order?')) {
                    updateStatus('CANCELLED');
                  }
                }}
                disabled={!!updating}
                className="border border-red-200 text-red-500 py-3 px-4 rounded-xl text-sm font-medium press-effect flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" /> Cancel
              </button>
            )}

            {['NEW', 'CANCELLED'].includes(order.status) && (
              <button
                onClick={handleDeleteOrder}
                className="border border-red-200 text-red-500 py-3 px-4 rounded-xl text-sm font-medium press-effect flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}

            {customer?.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="bg-gray-100 text-gray-700 py-3 px-4 rounded-xl text-sm font-medium press-effect flex items-center gap-1.5"
              >
                <Phone className="w-4 h-4" /> Call
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="h-20" />

      {/* Invoice Preview Modal */}
      {showInvoicePreview && order.invoice && (
        <InvoicePreviewModal
          invoice={order.invoice}
          order={order}
          onClose={() => setShowInvoicePreview(false)}
        />
      )}
    </div>
  );
}

function InvoicePreviewModal({ invoice, order, onClose }: {
  invoice: any; order: any; onClose: () => void;
}) {
  const store = invoice.store || {};
  const customer = invoice.customer || order.customer || {};
  const items = order.items || [];
  const subtotal = invoice.subtotal || order.totalAmount;
  const discount = invoice.discount || 0;
  const taxRate = invoice.taxRate || 0;
  const taxAmount = invoice.taxAmount || 0;
  const total = invoice.total || order.totalAmount;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-[3%] bottom-[3%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-[3%] sm:bottom-[3%] sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0">
          <h3 className="font-semibold text-sm">Invoice Preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => invoiceAPI.downloadPdf(invoice.id, `${invoice.invoiceNumber}.pdf`)}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium press-effect flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 tap-target">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-sm mx-auto text-sm">
            {/* ─── Store Header ──────────────────────────── */}
            <div className="text-center mb-5 pb-4 border-b border-gray-200">
              {/* Store logo or initial */}
              {store.logo ? (
                <img src={store.logo} alt="Store Logo" className="w-14 h-14 rounded-xl mx-auto mb-3 object-cover border border-gray-100" />
              ) : (
                <div className="w-14 h-14 bg-grocgo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">{store.name?.charAt(0)?.toUpperCase()}</span>
                </div>
              )}
              <h2 className="text-lg font-bold text-gray-900">{store.name || 'Store'}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{store.address}</p>
              <p className="text-xs text-gray-500">{store.city}, {store.state} {store.pincode}</p>
              <p className="text-xs text-gray-500 mt-1">{store.phone}</p>
            </div>

            {/* ─── Invoice Info Row ──────────────────────── */}
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-[10px] text-grocgo-600 font-semibold uppercase tracking-wider">Invoice</p>
                <p className="font-bold text-gray-900">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Date</p>
                <p className="font-medium text-gray-700">{new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* ─── Bill To ─────────────────────────────── */}
            <div className="mb-4 pb-3 border-b border-gray-100">
              <p className="text-[10px] text-grocgo-600 font-semibold uppercase tracking-wider mb-1">Bill To</p>
              <p className="font-medium text-gray-900">{customer.name}</p>
              <p className="text-xs text-gray-500">{customer.phone}</p>
              {customer.address && <p className="text-xs text-gray-500">{customer.address}</p>}
            </div>

            {/* ─── Items Table ──────────────────────────── */}
            <div className="mb-4">
              <div className="grid grid-cols-[1fr_40px_50px_65px] gap-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
                <span>Item</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
              </div>
              {items.map((item: any) => (
                <div key={item.id} className="grid grid-cols-[1fr_40px_50px_65px] gap-1 py-2 border-b border-gray-50 text-xs">
                  <span className="font-medium text-gray-800 truncate">{item.productName}</span>
                  <span className="text-right tabular-nums text-gray-600">{item.quantity}</span>
                  <span className="text-right tabular-nums text-gray-600">₹{item.unitPrice}</span>
                  <span className="text-right font-semibold tabular-nums text-gray-900">₹{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* ─── Totals ──────────────────────────────── */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="tabular-nums text-gray-700">₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-grocgo-600">
                  <span>Discount</span>
                  <span className="tabular-nums">-₹{discount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax ({taxRate}%)</span>
                  <span className="tabular-nums text-gray-700">₹{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="tabular-nums text-gray-900">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* ─── Payment ─────────────────────────────── */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
              <span className="text-gray-500">Payment: {invoice.paymentMethod || 'Cash'}</span>
              <span className={`font-semibold ${invoice.paymentStatus === 'PAID' ? 'text-grocgo-600' : 'text-amber-600'}`}>
                {invoice.paymentStatus}
              </span>
            </div>

            {/* ─── Footer: GrocGo branding ──────────────── */}
            <div className="mt-5 pt-3 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-500 font-medium">Thank you for shopping with us!</p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <div className="w-4 h-4 bg-grocgo-600 rounded-sm flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">G</span>
                </div>
                <span className="text-[10px] font-bold text-grocgo-600">Powered by GrocGo</span>
              </div>
              <p className="text-[8px] text-gray-400 mt-0.5">groogo.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
