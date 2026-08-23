'use client';

import { useEffect, useState } from 'react';
import { dashboardAPI } from '@/lib/api';
import Link from 'next/link';
import { 
  Store, CheckCircle2, ShoppingCart, IndianRupee, 
  Users, Package, ArrowRight
} from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await dashboardAPI.adminStats();
      setStats(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3" />
              <div className="h-7 bg-gray-200 rounded w-20 mb-1" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Stores', value: stats?.stores?.total || 0, icon: Store, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { label: 'Active Stores', value: stats?.stores?.active || 0, icon: CheckCircle2, color: 'bg-green-50 text-green-600', border: 'border-green-100' },
    { label: 'Total Orders', value: stats?.orders?.total || 0, icon: ShoppingCart, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
    { label: 'Revenue', value: `₹${(stats?.revenue?.total || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
    { label: 'Customers', value: stats?.customers?.total || 0, icon: Users, color: 'bg-pink-50 text-pink-600', border: 'border-pink-100' },
    { label: 'Products', value: stats?.products?.total || 0, icon: Package, color: 'bg-cyan-50 text-cyan-600', border: 'border-cyan-100' },
  ];

  const quickLinks = [
    { href: '/admin/stores', icon: Store, color: 'bg-blue-50', iconColor: 'text-blue-600', title: 'Manage Stores', desc: 'View, activate/deactivate, manage subscriptions' },
    { href: '/admin/users', icon: Users, color: 'bg-green-50', iconColor: 'text-green-600', title: 'Manage Users', desc: 'View all shopkeepers and admin accounts' },
  ];

  return (
    <div className="pb-safe">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Platform Overview</h1>
        <p className="text-xs text-gray-400 mt-1">Monitor your platform at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`bg-white rounded-2xl border ${card.border} p-4 sm:p-5`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick action cards */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Access</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-2xl border border-gray-100 p-5 active:bg-gray-50 active:scale-[0.98] transition-all group hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${link.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{link.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
