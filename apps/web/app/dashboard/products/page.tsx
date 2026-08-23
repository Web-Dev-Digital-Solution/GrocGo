'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { productAPI } from '@/lib/api';
import { 
  Search, Plus, FolderOpen, Package, Trash2, Edit3, 
  X, Check, AlertCircle, Filter
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [form, setForm] = useState({
    name: '', description: '', price: '', unit: 'piece', customUnit: '', imageUrl: '',
    sku: '', categoryId: '', stockQuantity: '', isAvailable: true, searchAliases: '',
  });
  const [catName, setCatName] = useState('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [selectedCategory, pagination.page]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.page, limit: 9 };
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;
      const { data } = await productAPI.list(params);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await productAPI.getCategories();
      setCategories(data);
    } catch {}
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await productAPI.create({
        ...form,
        price: parseFloat(form.price),
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : undefined,
        categoryId: form.categoryId || undefined,
      });
      toast.success('Product added!');
      setShowAddModal(false);
      resetForm();
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      await productAPI.update(editingProduct.id, {
        ...form,
        price: parseFloat(form.price),
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : undefined,
        categoryId: form.categoryId || undefined,
      });
      toast.success('Product updated!');
      setShowEditModal(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      unit: product.unit || 'piece',
      customUnit: product.customUnit || '',
      imageUrl: product.imageUrl || '',
      sku: product.sku || '',
      categoryId: product.categoryId || '',
      stockQuantity: product.stockQuantity?.toString() || '',
      isAvailable: product.isAvailable ?? true,
      searchAliases: product.searchAliases || '',
    });
    setShowEditModal(true);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await productAPI.createCategory({ name: catName, sortOrder: categories.length + 1 });
      toast.success('Category added!');
      setShowCategoryModal(false);
      setCatName('');
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      loadProducts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} products?`)) return;
    
    setSaving(true);
    let deleted = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        await productAPI.delete(id);
        deleted++;
      } catch {}
    }
    setSelectedIds(new Set());
    toast.success(`Deleted ${deleted} products`);
    loadProducts();
    setSaving(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', unit: 'piece', customUnit: '', imageUrl: '', sku: '', categoryId: '', stockQuantity: '', isAvailable: true, searchAliases: '' });
  };

  const handleSearch = useCallback(() => {
    setPagination(p => ({ ...p, page: 1 }));
    loadProducts();
  }, [search, selectedCategory]);

  return (
    <div className="pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-grocgo-600" />
            Products
          </h1>
          {pagination.total > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">{pagination.total} products</p>
          )}
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={saving}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 active:scale-[0.98] transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Delete ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Action buttons row */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowCategoryModal(true)}
          className="flex-1 sm:flex-none border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          Category
        </button>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex-1 sm:flex-none bg-grocgo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-grocgo-700 active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-xl -mx-4 px-4 pb-3 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none sm:pb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-grocgo-500 focus:border-grocgo-500"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPagination(p => ({ ...p, page: 1 })); setTimeout(loadProducts, 0); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-5 py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => { setSelectedCategory(''); setPagination(p => ({ ...p, page: 1 })); }}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
            !selectedCategory
              ? 'bg-grocgo-600 text-white border-grocgo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          All ({pagination.total})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCategory(cat.id); setPagination(p => ({ ...p, page: 1 })); }}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selectedCategory === cat.id
                ? 'bg-grocgo-600 text-white border-grocgo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {cat.name} ({cat._count?.products || 0})
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-medium text-gray-700">No products found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Try a different search term' : 'Add your first product to get started'}
          </p>
          {!search && (
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="mt-4 bg-grocgo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="sm:hidden space-y-2">
            {/* Select all checkbox */}
            <div className="flex items-center gap-2 px-1">
              <button
                onClick={toggleSelectAll}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  selectedIds.size === products.length
                    ? 'bg-grocgo-600 border-grocgo-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {selectedIds.size === products.length && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className="text-xs text-gray-500">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
              </span>
            </div>

            {products.map((p) => (
              <div key={p.id} className={`bg-white rounded-xl border p-4 transition-all ${
                selectedIds.has(p.id) ? 'border-grocgo-300 bg-grocgo-50/30' : 'border-gray-100'
              }`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleSelect(p.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      selectedIds.has(p.id)
                        ? 'bg-grocgo-600 border-grocgo-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {selectedIds.has(p.id) && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="w-10 h-10 bg-grocgo-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                    ) : null}
                    <Package className={`w-5 h-5 text-grocgo-600 ${p.imageUrl ? 'hidden' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                      {!p.isAvailable && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      {p.category?.name && (
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded">{p.category.name}</span>
                      )}
                      {p.sku && <span>SKU: {p.sku}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-gray-900">₹{p.price}</p>
                    <p className="text-[10px] text-gray-400">/ {p.unit}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.isAvailable
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {p.isAvailable ? (p.stockQuantity != null ? `${p.stockQuantity} in stock` : 'In stock') : 'Unavailable'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="text-blue-500 hover:text-blue-700 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-blue-50 active:scale-[0.97] transition-all flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-red-50 active:scale-[0.97] transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="w-10 p-4">
                    <button
                      onClick={toggleSelectAll}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedIds.size === products.length && products.length > 0
                          ? 'bg-grocgo-600 border-grocgo-600'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {selectedIds.size === products.length && products.length > 0 && <Check className="w-3 h-3 text-white" />}
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Product</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Price</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Unit</th>
                  <th className="text-left p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Stock</th>
                  <th className="text-right p-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className={`transition-colors ${
                    selectedIds.has(p.id) ? 'bg-grocgo-50/50' : 'hover:bg-gray-50/50'
                  }`}>
                    <td className="p-4">
                      <button
                        onClick={() => toggleSelect(p.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedIds.has(p.id)
                            ? 'bg-grocgo-600 border-grocgo-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {selectedIds.has(p.id) && <Check className="w-3 h-3 text-white" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <Package className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {!p.isAvailable && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">N/A</span>
                          )}
                          {p.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {p.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{p.category?.name || '—'}</td>
                    <td className="p-4 font-semibold">₹{p.price}</td>
                    <td className="p-4 text-gray-600">{p.unit}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.isAvailable ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {p.isAvailable ? (p.stockQuantity ?? '∞') : 'Unavailable'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-blue-500 hover:text-blue-700 text-sm hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-500 hover:text-red-700 text-sm hover:bg-red-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 active:scale-[0.97] transition-all"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 active:scale-[0.97] transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <ProductModal
          title="Add Product"
          form={form}
          setForm={setForm}
          categories={categories}
          saving={saving}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddProduct}
          submitLabel="Add Product"
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <ProductModal
          title="Edit Product"
          form={form}
          setForm={setForm}
          categories={categories}
          saving={saving}
          onClose={() => { setShowEditModal(false); setEditingProduct(null); resetForm(); }}
          onSubmit={handleEditProduct}
          submitLabel="Save Changes"
        />
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setShowCategoryModal(false)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
            <div className="bg-white sm:rounded-2xl rounded-t-2xl w-full sm:max-w-sm overflow-hidden animate-slide-up">
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="px-5 pt-2 sm:pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-lg font-bold">Add Category</h2>
                <button onClick={() => setShowCategoryModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddCategory} className="p-5 space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Category name"
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-grocgo-500"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCategoryModal(false)} disabled={saving}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || !catName.trim()}
                    className="flex-1 py-3 bg-grocgo-600 text-white rounded-xl text-sm font-semibold hover:bg-grocgo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PRODUCT MODAL COMPONENT ──────────────────────────────────
function ProductModal({ title, form, setForm, categories, saving, onClose, onSubmit, submitLabel }: {
  title: string;
  form: any;
  setForm: (f: any) => void;
  categories: any[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div className="bg-white sm:rounded-2xl rounded-t-2xl max-h-[92vh] sm:max-h-[90vh] w-full sm:max-w-lg overflow-hidden flex flex-col animate-slide-up">
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
          <div className="px-5 pt-2 sm:pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
            <h2 className="text-lg font-bold">{title}</h2>
            <button onClick={onClose} disabled={saving} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-dashed border-gray-200">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Product" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <Package className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input type="text" placeholder="Paste image URL..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-grocgo-500"
                    value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                  <label className="block">
                    <span className="text-xs text-grocgo-600 font-medium cursor-pointer hover:underline">Upload from device</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setForm({ ...form, imageUrl: reader.result as string });
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
              <input type="text" required placeholder="e.g. Basmati Rice"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-grocgo-500 focus:border-grocgo-500"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹) *</label>
                <input type="number" step="0.01" required placeholder="0.00" inputMode="decimal"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-grocgo-500"
                  value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit *</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-grocgo-500"
                  value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {['piece', 'packet', 'kg', 'g', 'litre', 'ml', 'dozen', 'custom'].map((u) => (
                    <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            {form.unit === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Unit Name</label>
                <input type="text" placeholder="e.g. bundle, bunch"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-grocgo-500"
                  value={form.customUnit} onChange={(e) => setForm({ ...form, customUnit: e.target.value })} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-grocgo-500"
                  value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">No Category</option>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU</label>
                <input type="text" placeholder="Optional"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-grocgo-500"
                  value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity</label>
              <input type="number" placeholder="Leave empty for unlimited" inputMode="numeric"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-grocgo-500"
                value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Aliases</label>
              <input type="text" placeholder="e.g. rice, chawal, basmati"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-grocgo-500"
                value={form.searchAliases} onChange={(e) => setForm({ ...form, searchAliases: e.target.value })} />
              <p className="text-[11px] text-gray-400 mt-1">Comma-separated. Helps customers find this product when typing.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea rows={2} placeholder="Optional description..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-grocgo-500"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <input type="checkbox" id="isAvailable" checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-grocgo-600 focus:ring-grocgo-500" />
              <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">Available for ordering</label>
            </div>
          </form>
          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={saving}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" onClick={onSubmit} disabled={saving || !form.name || !form.price}
                className="flex-1 py-3 bg-grocgo-600 text-white rounded-xl text-sm font-semibold hover:bg-grocgo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : submitLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
