'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { Store, Calendar, Shield, User } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await adminAPI.users();
      setUsers(data.users);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return { label: 'Admin', color: 'bg-red-50 text-red-600', avatar: 'from-red-400 to-red-600', icon: Shield };
      case 'SHOPKEEPER': return { label: 'Shopkeeper', color: 'bg-blue-50 text-blue-600', avatar: 'from-blue-400 to-blue-600', icon: User };
      default: return { label: role, color: 'bg-gray-100 text-gray-500', avatar: 'from-gray-400 to-gray-600', icon: User };
    }
  };

  return (
    <div className="pb-safe">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold">All Users</h1>
        {users.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">{users.length} users</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <User className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-medium text-gray-700">No users found</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="sm:hidden space-y-2">
            {users.map((u) => {
              const role = getRoleBadge(u.role);
              const RoleIcon = role.icon;
              return (
                <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${role.avatar} flex items-center justify-center shrink-0`}>
                      <span className="text-white font-semibold text-sm">
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{u.name}</p>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${role.color}`}>
                          {role.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Store className="w-3.5 h-3.5" /> {u.store?.name || 'No store'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {u.isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">User</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Store</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => {
                  const role = getRoleBadge(u.role);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${role.avatar} flex items-center justify-center`}>
                            <span className="text-white font-semibold text-xs">{u.name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${role.color}`}>
                          {role.label}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{u.store?.name || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
