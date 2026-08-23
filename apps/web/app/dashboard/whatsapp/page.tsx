'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { whatsappAPI, orderAPI, customerAPI } from '@/lib/api';
import { MessageCircle, Send, Clock, CheckCircle2, RefreshCw, Inbox, ArrowRight, ArrowLeft } from 'lucide-react';

export default function WhatsAppPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'logs'>('send');

  useEffect(() => {
    loadLogs();
    loadOrders();
    loadCustomers();
  }, []);

  const loadLogs = async () => {
    try {
      const { data } = await whatsappAPI.getLogs();
      setLogs(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const { data } = await orderAPI.list({ status: 'NEW', limit: 50 });
      setOrders(data.orders);
    } catch {}
  };

  const loadCustomers = async () => {
    try {
      const { data } = await customerAPI.list({ limit: 50 });
      setCustomers(data.customers);
    } catch {}
  };

  const sendConfirmation = async () => {
    if (!selectedOrder) return;
    setSending(true);
    try {
      await whatsappAPI.sendConfirmation(selectedOrder);
      toast.success('Order confirmation sent!');
      setSelectedOrder('');
      loadLogs();
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  const sendReminder = async () => {
    if (!selectedCustomer) return;
    setSending(true);
    try {
      await whatsappAPI.sendReminder(selectedCustomer);
      toast.success('Monthly reminder sent!');
      setSelectedCustomer('');
      loadLogs();
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-600';
      case 'delivered': return 'bg-blue-100 text-blue-600';
      case 'read': return 'bg-purple-100 text-purple-600';
      case 'failed': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'outbound' ? '→' : '←';
  };

  const notificationTypes = [
    { title: 'Order Confirmation', desc: 'Sent when order is placed', color: 'bg-green-50 text-green-600' },
    { title: 'Ready for Pickup', desc: 'Auto-sent when marked ready', color: 'bg-orange-50 text-orange-600' },
    { title: 'Monthly Reminder', desc: 'Recurring grocery reminder', color: 'bg-blue-50 text-blue-600' },
  ];

  return (
    <div className="pb-safe">
      <h1 className="text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-green-600" />
        WhatsApp Integration
      </h1>

      {/* Tab switcher — mobile */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5 sm:hidden">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'send' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Send className="w-3.5 h-3.5 inline mr-1" /> Send
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
            activeTab === 'logs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Inbox className="w-3.5 h-3.5 inline mr-1" /> Logs
          {logs.length > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 bg-green-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Desktop tabs */}
      <div className="hidden sm:flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('send')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'send' ? 'bg-grocgo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Send className="w-4 h-4 inline mr-1" /> Send Messages
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'logs' ? 'bg-grocgo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Inbox className="w-4 h-4 inline mr-1" /> Message Logs ({logs.length})
        </button>
      </div>

      {activeTab === 'send' && (
        <div className="space-y-4">
          {/* Send Order Confirmation */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Order Confirmation
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Notify customer that their order is confirmed</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="relative">
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-grocgo-500"
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                >
                  <option value="">Select an order...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.customer?.name || 'Customer'}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <button
                onClick={sendConfirmation}
                disabled={!selectedOrder || sending}
                className="w-full bg-green-500 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-green-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Confirmation
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Send Monthly Reminder */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Monthly Reminder
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Remind customers to reorder their monthly groceries</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="relative">
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <button
                onClick={sendReminder}
                disabled={!selectedCustomer || sending}
                className="w-full bg-blue-500 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Send Reminder
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Notification types */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Supported Notifications
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {notificationTypes.map((t) => (
                <div key={t.title} className={`${t.color} rounded-xl p-4`}>
                  <CheckCircle2 className="w-5 h-5 mb-2" />
                  <p className="font-semibold text-sm">{t.title}</p>
                  <p className="text-xs opacity-75 mt-0.5">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16 shrink-0" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (                  <div className="text-center py-16">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Inbox className="w-7 h-7 text-gray-300" />
              </div>
              <p className="font-medium text-gray-700">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">Messages will appear here after you send them</p>
            </div>
          ) : (
            <>
              {/* Log count header */}
              <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">{logs.length} message{logs.length !== 1 ? 's' : ''}</span>
                <div className="flex gap-2">
                  {['sent', 'failed'].map((s) => {
                    const count = logs.filter(l => l.status === s).length;
                    if (count === 0) return null;
                    return (
                      <span key={s} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(s)}`}>
                        {count} {s}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="px-5 py-3.5 flex items-start gap-3 active:bg-gray-50 transition-colors">
                    {/* Direction icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      log.direction === 'outbound' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {getDirectionIcon(log.direction)}
                    </div>

                    {/* Message content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-2">{log.messageBody}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-gray-400 font-mono">{log.toFrom}</span>
                        {log.orderId && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">Order</span>
                        )}
                      </div>
                    </div>

                    {/* Status + time */}
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {' '}
                        {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
