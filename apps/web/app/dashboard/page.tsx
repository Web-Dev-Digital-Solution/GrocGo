'use client';

import { useEffect, useState } from 'react';
import { dashboardAPI } from '@/lib/api';
import Link from 'next/link';
import { 
  ShoppingCart, Clock, ChefHat, CheckCircle2, 
  Users, IndianRupee, Package, QrCode, MessageCircle, 
  Settings, TrendingUp, ArrowRight
} from 'lucide-react';

interface DashboardStats {
  orders: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byStatus: { new: number; preparing: number; ready: number; collected: number; cancelled: number };
  };
  customers: { total: number; newThisMonth: number };
  products: { total: number };
  revenue: { total: number; thisMonth: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        dashboardAPI.stats(),
        dashboardAPI.recentOrders(10),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Today's Orders", value: stats.orders.today, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600', href: '/dashboard/orders' },
    { label: 'Pending', value: stats.orders.byStatus.new, icon: Clock, color: 'bg-amber-50 text-amber-600', href: '/dashboard/orders?status=NEW' },
    { label: 'Preparing', value: stats.orders.byStatus.preparing, icon: ChefHat, color: 'bg-orange-50 text-orange-600', href: '/dashboard/orders?status=PREPARING' },
    { label: 'Ready', value: stats.orders.byStatus.ready, icon: CheckCircle2, color: 'bg-green-50 text-green-600', href: '/dashboard/orders?status=READY_FOR_PICKUP' },
    { label: 'Customers', value: stats.customers.total, icon: Users, color: 'bg-purple-50 text-purple-600', href: '/dashboard/customers' },
    { label: 'Revenue (Month)', value: `₹${stats.revenue.thisMonth.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-emerald-50 text-emerald-600', href: '/dashboard/invoices' },
  ];

  const statusMap: Record<string, { bg: string; label: string }> = {
    NEW: { bg: 'bg-amber-100 text-amber-700', label: 'New' },
    PREPARING: { bg: 'bg-orange-100 text-orange-700', label: 'Preparing' },
    READY_FOR_PICKUP: { bg: 'bg-green-100 text-green-700', label: 'Ready' },
    COLLECTED: { bg: 'bg-blue-100 text-blue-700', label: 'Done' },
    CANCELLED: { bg: 'bg-red-100 text-red-700', label: 'Cancelled' },
  };

  const quickActions = [
    { label: 'Products', href: '/dashboard/products', icon: Package, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
    { label: 'QR Code', href: '/dashboard/qr', icon: QrCode, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
    { label: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageCircle, color: 'bg-green-50 text-green-600 hover:bg-green-100' },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings, color: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Here&apos;s your store at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}
              className={`bg-white rounded-2xl border border-gray-100 p-3 text-center transition-all active:scale-[0.97] ${action.color}`}>
              <Icon className="w-5 h-5 mx-auto mb-1.5" />
              <p className="text-[11px] font-medium">{action.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-gray-400" />
            Recent Orders
          </h2>
          <Link href="/dashboard/orders" className="text-xs text-grocgo-600 font-semibold flex items-center gap-1 hover:text-grocgo-700 transition-colors">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-sm">No orders yet</p>
            <p className="text-xs text-gray-400 mt-1">Share your QR code to start</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => {
              const st = statusMap[order.status] || statusMap.NEW;
              return (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    order.status === 'NEW' ? 'bg-amber-400' :
                    order.status === 'PREPARING' ? 'bg-orange-400' :
                    order.status === 'READY_FOR_PICKUP' ? 'bg-green-400' :
                    order.status === 'COLLECTED' ? 'bg-blue-400' : 'bg-gray-300'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{order.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {order.customer?.name} · {order.items?.map((i: any) => i.productName).slice(0, 2).join(', ')}
                      {(order.items?.length || 0) > 2 && ` +${order.items.length - 2}`}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm tabular-nums">₹{order.totalAmount.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
