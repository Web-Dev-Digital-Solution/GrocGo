'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { invoiceAPI, orderAPI } from '@/lib/api';
import { 
  FileText, Download, Printer, Search, Plus, 
  CreditCard, X, Receipt
} from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('0');
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    try {
      const { data } = await invoiceAPI.list();
      setInvoices(data);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedOrders = async () => {
    try {
      const { data } = await orderAPI.list({ status: 'COLLECTED', limit: 50 });
      setOrders(data.orders.filter((o: any) => !o.invoice));
    } catch {}
  };

  const handleGenerate = async () => {
    if (!selectedOrder) return;
    setGenerating(true);
    try {
      await invoiceAPI.generate(selectedOrder, {
        discount: parseFloat(discount) || 0,
        taxRate: parseFloat(taxRate) || 0,
      });
      toast.success('Invoice generated!');
      setShowModal(false);
      setSelectedOrder('');
      setDiscount('0');
      setTaxRate('0');
      loadInvoices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const printInvoice = async (invoiceId: string) => {
    try {
      const blobUrl = await invoiceAPI.fetchPdfBlob(invoiceId);
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

  const downloadInvoice = async (invoiceId: string) => {
    try {
      await invoiceAPI.downloadPdf(invoiceId, `invoice-${invoiceId}.pdf`);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  const filtered = search
    ? invoices.filter((inv) =>
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : invoices;

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-grocgo-600" />
            Invoices
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{invoices.length} total</p>
        </div>
        <button
          onClick={() => { setShowModal(true); loadCompletedOrders(); }}
          className="bg-grocgo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold press-effect flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Invoice
        </button>
      </div>

      {/* Search */}
      {invoices.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-medium text-gray-900 mb-1">No invoices yet</p>
          <p className="text-sm text-gray-400">
            {search ? 'No invoices match your search' : 'Generate an invoice from a completed order'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: Card Layout */}
          <div className="sm:hidden space-y-3">
            {paginated.map((inv) => (
              <div key={inv.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-400">{inv.customer?.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    inv.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold tabular-nums">₹{inv.total.toFixed(2)}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => downloadInvoice(inv.id)}
                      className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-semibold press-effect flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button
                      onClick={() => printInvoice(inv.id)}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold press-effect flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Invoice #</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Payment</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                  <th className="text-right p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium">{inv.invoiceNumber}</td>
                    <td className="p-4">{inv.customer?.name}</td>
                    <td className="p-4 font-bold tabular-nums">₹{inv.total.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        inv.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => downloadInvoice(inv.id)}
                          className="text-grocgo-600 hover:text-grocgo-700 text-sm font-medium press-effect flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                        <button
                          onClick={() => printInvoice(inv.id)}
                          className="text-gray-500 hover:text-gray-700 text-sm font-medium press-effect flex items-center gap-1 px-2"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 active:scale-[0.97] transition-all"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 active:scale-[0.97] transition-all"
          >
            Next →
          </button>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showModal && (
        <>
          <div className="bottom-sheet-backdrop" onClick={() => setShowModal(false)} />
          <div className="bottom-sheet p-5 pb-8">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-5">Generate Invoice</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Select Order</label>
                <select
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                >
                  <option value="">Choose a completed order...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — ₹{o.totalAmount.toFixed(2)} ({o.customer?.name})
                    </option>
                  ))}
                </select>
                {orders.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">No completed orders without invoices</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Discount (₹)</label>
                  <input type="number" min="0"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
                    value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Tax Rate (%)</label>
                  <input type="number" min="0" max="100"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
                    value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                </div>
              </div>
              {selectedOrder && (
                <div className="bg-gray-50 rounded-xl p-4">
                  {(() => {
                    const order = orders.find((o) => o.id === selectedOrder);
                    if (!order) return null;
                    const sub = order.totalAmount;
                    const disc = parseFloat(discount) || 0;
                    const tax = ((sub - disc) * (parseFloat(taxRate) || 0)) / 100;
                    const tot = sub - disc + tax;
                    return (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="tabular-nums">₹{sub.toFixed(2)}</span></div>
                        {disc > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="tabular-nums">-₹{disc.toFixed(2)}</span></div>}
                        {tax > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="tabular-nums">₹{tax.toFixed(2)}</span></div>}
                        <div className="flex justify-between font-bold pt-1 border-t"><span>Total</span><span className="tabular-nums">₹{tot.toFixed(2)}</span></div>
                      </div>
                    );
                  })()}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold press-effect">
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedOrder || generating}
                  className="flex-1 bg-grocgo-600 text-white py-3 rounded-xl text-sm font-semibold press-effect disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                  ) : (
                    <><FileText className="w-4 h-4" /> Generate Invoice</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
