'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { customerAPI, whatsappAPI } from '@/lib/api';
import { Search, Users, Phone, MapPin, Calendar, MessageCircle, Package, X, ChevronRight } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (search) params.search = search;
      const { data } = await customerAPI.list(params);
      setCustomers(data.customers);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const viewCustomer = async (id: string) => {
    setDetailLoading(true);
    try {
      const { data } = await customerAPI.get(id);
      setSelectedCustomer(data);
    } catch {
      toast.error('Failed to load customer details');
    } finally {
      setDetailLoading(false);
    }
  };

  const sendReminder = async (customerId: string) => {
    setSendingReminder(customerId);
    try {
      await whatsappAPI.sendReminder(customerId);
      toast.success('Monthly reminder sent!');
    } catch {
      toast.error('Failed to send reminder');
    } finally {
      setSendingReminder(null);
    }
  };

  const getStatusBadge = (c: any) => {
    if (c.totalOrders >= 5) return { label: 'Regular', color: 'bg-green-50 text-green-600' };
    if (c.totalOrders >= 2) return { label: 'Returning', color: 'bg-blue-50 text-blue-600' };
    return { label: 'New', color: 'bg-gray-100 text-gray-500' };
  };

  return (
    <div className="pb-safe">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-grocgo-600" />
          Customers
        </h1>
        {customers.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">{customers.length} customers</p>
        )}
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadCustomers()}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-grocgo-500 focus:border-grocgo-500"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setTimeout(loadCustomers, 0); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-6 w-14 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-medium text-gray-700">No customers yet</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Try a different search' : 'Customers will appear after their first order'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="sm:hidden space-y-2">
            {customers.map((c) => {
              const status = getStatusBadge(c);
              return (
                <button
                  key={c.id}
                  onClick={() => viewCustomer(c.id)}
                  className="w-full text-left bg-white rounded-xl border border-gray-100 p-4 active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-grocgo-400 to-grocgo-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {c.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {c.phone}
                        </span>
                        {c.totalOrders > 0 && (
                          <span>{c.totalOrders} order{c.totalOrders !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Phone</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Orders</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Last Order</th>
                  <th className="text-right p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => {
                  const status = getStatusBadge(c);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-grocgo-400 to-grocgo-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">{c.name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium">{c.name}</p>
                            {c.address && <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{c.phone}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>{status.label}</span>
                      </td>
                      <td className="p-4 font-semibold">{c.totalOrders || 0}</td>
                      <td className="p-4 text-gray-500 text-xs">
                        {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => viewCustomer(c.id)}
                          className="text-grocgo-600 hover:text-grocgo-700 text-sm hover:bg-grocgo-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => sendReminder(c.id)}
                          disabled={sendingReminder === c.id}
                          className="text-blue-500 hover:text-blue-700 text-sm hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {sendingReminder === c.id ? '...' : 'Remind'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Customer Detail Modal — bottom sheet on mobile */}
      {(selectedCustomer || detailLoading) && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !detailLoading && setSelectedCustomer(null)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
            <div className="bg-white sm:rounded-2xl rounded-t-2xl max-h-[88vh] sm:max-h-[85vh] w-full sm:max-w-lg overflow-hidden flex flex-col animate-slide-up">
              {/* Drag handle (mobile) */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {detailLoading ? (
                <div className="p-6 space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-3 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mx-auto" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" />
                    <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto" />
                  </div>
                </div>
              ) : selectedCustomer && (
                <>
                  {/* Header */}
                  <div className="px-5 pt-2 sm:pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-grocgo-400 to-grocgo-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {selectedCustomer.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">{selectedCustomer.name}</h2>
                          <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCustomer(null)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all text-gray-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {/* Info rows */}
                    <div className="space-y-3">
                      {selectedCustomer.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider">Address</p>
                            <p className="text-sm font-medium">{selectedCustomer.address}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">                          <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wider">Total Orders</p>
                          <p className="text-sm font-semibold">{selectedCustomer.totalOrders}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">                          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wider">Customer Since</p>
                          <p className="text-sm font-medium">
                            {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2">
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium active:scale-[0.97] transition-all"
                      >
                        <Phone className="w-4 h-4" /> Call
                      </a>
                      <button
                        onClick={() => sendReminder(selectedCustomer.id)}
                        disabled={sendingReminder === selectedCustomer.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-600 rounded-xl text-sm font-medium active:scale-[0.97] transition-all disabled:opacity-50"
                      >
                        {sendingReminder === selectedCustomer.id ? (
                          <span className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                        ) : <MessageCircle className="w-4 h-4" />} Remind
                      </button>
                    </div>

                    {/* Recent orders */}
                    {selectedCustomer.orders?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3">Recent Orders</h3>
                        <div className="space-y-2">
                          {selectedCustomer.orders.map((order: any) => (
                            <div key={order.id} className="bg-gray-50 rounded-xl p-3.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                                    order.status === 'COLLECTED' ? 'bg-green-400' :
                                    order.status === 'READY' ? 'bg-yellow-400' :
                                    order.status === 'PREPARING' ? 'bg-blue-400' :
                                    'bg-gray-300'
                                  }`} />
                                  <p className="font-semibold text-sm">{order.orderNumber}</p>
                                </div>
                                <p className="font-bold text-sm">₹{order.totalAmount?.toFixed(0) || '0'}</p>
                              </div>
                              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  order.status === 'COLLECTED' ? 'bg-green-100 text-green-600' :
                                  order.status === 'READY' ? 'bg-yellow-100 text-yellow-700' :
                                  order.status === 'PREPARING' ? 'bg-blue-100 text-blue-600' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
