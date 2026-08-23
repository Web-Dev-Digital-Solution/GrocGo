'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';
import { MapPin, ShoppingCart, Package, Phone, Store, ArrowRight } from 'lucide-react';

export default function AdminStoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => { loadStores(); }, []);

  const loadStores = async () => {
    try {
      const { data } = await adminAPI.stores();
      setStores(data.stores);
    } catch {
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const toggleStore = async (id: string) => {
    setToggling(id);
    try {
      await adminAPI.toggleStore(id);
      toast.success('Store updated');
      loadStores();
    } catch {
      toast.error('Failed to update store');
    } finally {
      setToggling(null);
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-purple-100 text-purple-700';
      case 'business': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="pb-safe">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold">All Stores</h1>
        {stores.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">{stores.length} stores</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Store className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-medium text-gray-700">No stores found</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="sm:hidden space-y-2">
            {stores.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-grocgo-400 to-grocgo-600 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">{s.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{s.name}</p>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${getPlanBadge(s.subscription?.plan)}`}>
                        {s.subscription?.plan || 'free'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {s.city || '—'}{s.state ? `, ${s.state}` : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="w-3.5 h-3.5" /> {s._count?.orders || 0} orders
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" /> {s._count?.products || 0} products
                      </span>
                      {s.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {s.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    s.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {s.isActive ? '● Active' : '○ Inactive'}
                  </span>
                  <button
                    onClick={() => toggleStore(s.id)}
                    disabled={toggling === s.id}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold active:scale-[0.97] transition-all disabled:opacity-50 ${
                      s.isActive
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {toggling === s.id ? '...' : s.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Store</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Location</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Plan</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Orders</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Products</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stores.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-grocgo-400 to-grocgo-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">{s.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{s.city || '—'}{s.state ? `, ${s.state}` : ''}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPlanBadge(s.subscription?.plan)}`}>
                        {s.subscription?.plan || 'free'}
                      </span>
                    </td>
                    <td className="p-4 font-semibold">{s._count?.orders || 0}</td>
                    <td className="p-4">{s._count?.products || 0}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleStore(s.id)}
                        disabled={toggling === s.id}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          s.isActive
                            ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                            : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {toggling === s.id ? '...' : s.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
