'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { storeAPI, productAPI, qrAPI } from '@/lib/api';

// ─── TYPES ──────────────────────────────────────────────────
type WizardStep = 'welcome' | 'products' | 'categories' | 'settings' | 'qr' | 'launch';

interface QuickProduct {
  name: string;
  price: number;
  unit: string;
  category: string;
  added: boolean;
}

interface CategoryItem {
  name: string;
  sortOrder: number;
}

// ─── PRESETS ────────────────────────────────────────────────
const POPULAR_PRODUCTS: QuickProduct[] = [
  // Staples
  { name: 'Basmati Rice', price: 85, unit: 'kg', category: 'Staples & Grains', added: false },
  { name: 'Toor Dal', price: 120, unit: 'kg', category: 'Pulses & Lentils', added: false },
  { name: 'Sugar', price: 48, unit: 'kg', category: 'Staples & Grains', added: false },
  { name: 'Wheat Atta', price: 45, unit: 'kg', category: 'Staples & Grains', added: false },
  { name: 'Cooking Oil (Fortune)', price: 180, unit: 'litre', category: 'Cooking Essentials', added: false },
  // Dairy
  { name: 'Amul Butter', price: 55, unit: 'packet', category: 'Dairy & Eggs', added: false },
  { name: 'Amul Milk', price: 28, unit: 'litre', category: 'Dairy & Eggs', added: false },
  { name: 'Paneer', price: 80, unit: 'packet', category: 'Dairy & Eggs', added: false },
  // Spices
  { name: 'Turmeric Powder', price: 35, unit: 'packet', category: 'Spices & Masalas', added: false },
  { name: 'Red Chili Powder', price: 40, unit: 'packet', category: 'Spices & Masalas', added: false },
  { name: 'Garam Masala', price: 45, unit: 'packet', category: 'Spices & Masalas', added: false },
  // Tea & Beverages
  { name: 'Tata Tea Gold', price: 130, unit: 'packet', category: 'Snacks & Beverages', added: false },
  { name: 'Nescafe Classic', price: 175, unit: 'packet', category: 'Snacks & Beverages', added: false },
  { name: 'Maggi Noodles', price: 14, unit: 'packet', category: 'Snacks & Beverages', added: false },
  // Snacks
  { name: 'Parle-G Biscuits', price: 10, unit: 'packet', category: 'Snacks & Beverages', added: false },
  { name: 'Lay\'s Chips', price: 20, unit: 'packet', category: 'Snacks & Beverages', added: false },
  // Personal Care
  { name: 'Colgate Toothpaste', price: 65, unit: 'packet', category: 'Personal Care', added: false },
  { name: 'Lifebuoy Soap', price: 38, unit: 'packet', category: 'Personal Care', added: false },
  // Household
  { name: 'Vim Dishwash Liquid', price: 99, unit: 'bottle', category: 'Household', added: false },
  { name: 'Harpic Power Plus', price: 85, unit: 'bottle', category: 'Household', added: false },
];

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { name: 'Staples & Grains', sortOrder: 0 },
  { name: 'Pulses & Lentils', sortOrder: 1 },
  { name: 'Cooking Essentials', sortOrder: 2 },
  { name: 'Spices & Masalas', sortOrder: 3 },
  { name: 'Dairy & Eggs', sortOrder: 4 },
  { name: 'Snacks & Beverages', sortOrder: 5 },
  { name: 'Personal Care', sortOrder: 6 },
  { name: 'Household', sortOrder: 7 },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { user, store, token, loadFromStorage } = useAuthStore();

  const [step, setStep] = useState<WizardStep>('welcome');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Products state
  const [products, setProducts] = useState<QuickProduct[]>(POPULAR_PRODUCTS);
  const [customProducts, setCustomProducts] = useState<{ name: string; price: string; unit: string; category: string }[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('kg');

  // Categories state
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Settings state
  const [storeDescription, setStoreDescription] = useState('');
  const [storeWhatsApp, setStoreWhatsApp] = useState('');
  const [storeBusinessHours, setStoreBusinessHours] = useState('Mon-Sat: 8:00 AM - 9:00 PM');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // QR state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState('');

  // Check auth
  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!loading && (!user || !store)) {
      router.push('/login');
    }
  }, [user, store, loading]);

  useEffect(() => {
    setLoading(false);
  }, []);

  // ─── PRODUCT HANDLERS ───────────────────────────────────
  const toggleProduct = (index: number) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], added: !updated[index].added };
      return updated;
    });
  };

  const addCustomProduct = () => {
    if (!newProductName.trim()) return;
    setCustomProducts((prev) => [
      ...prev,
      { name: newProductName.trim(), price: newProductPrice, unit: newProductUnit, category: 'Other' },
    ]);
    setNewProductName('');
    setNewProductPrice('');
    toast.success('Product added!');
  };

  const removeCustomProduct = (index: number) => {
    setCustomProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── CATEGORY HANDLERS ──────────────────────────────────
  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categories.some((c) => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast.error('Category already exists');
      return;
    }
    setCategories((prev) => [
      ...prev,
      { name: newCategoryName.trim(), sortOrder: prev.length },
    ]);
    setNewCategoryName('');
    toast.success('Category added!');
  };

  const removeCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── LOGO HANDLER ───────────────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setStoreLogo(base64);
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  // ─── SAVE PRODUCTS ──────────────────────────────────────
  const saveProducts = async () => {
    if (!store) return;
    setSaving(true);
    try {
      const selectedProducts = products.filter((p) => p.added);
      const allToCreate = [...selectedProducts, ...customProducts.map((cp) => ({
        name: cp.name,
        price: parseFloat(cp.price) || 0,
        unit: cp.unit,
        category: cp.category,
      }))];

      if (allToCreate.length === 0) {
        toast.error('Add at least one product');
        setSaving(false);
        return;
      }

      // Get categories to map names to IDs
      const { data: catData } = await productAPI.getCategories();
      const catMap: Record<string, string> = {};
      if (Array.isArray(catData)) {
        catData.forEach((c: any) => { catMap[c.name] = c.id; });
      }

      // Create missing categories first
      const existingCatNames = new Set(Object.keys(catMap));
      const neededCats = [...new Set(allToCreate.map((p) => p.category))].filter((c) => !existingCatNames.has(c));

      for (const catName of neededCats) {
        const { data: newCat } = await productAPI.createCategory({ name: catName, sortOrder: Object.keys(catMap).length });
        catMap[newCat.name] = newCat.id;
      }

      // Check existing products to skip duplicates
      const { data: existingProducts } = await productAPI.list({ limit: 200 });
      const existingNames = new Set((existingProducts.products || []).map((p: any) => p.name.toLowerCase()));

      // Create products (skip existing)
      let created = 0;
      for (const p of allToCreate) {
        if (existingNames.has(p.name.toLowerCase())) continue;
        try {
          await productAPI.create({
            name: p.name,
            price: p.price,
            unit: p.unit,
            categoryId: catMap[p.category] || undefined,
            isAvailable: true,
          });
          created++;
        } catch {
          // Skip duplicates
        }
      }

      toast.success(`${created} products added!`);
      setStep('categories');
    } catch (err: any) {
      toast.error('Failed to save products');
    } finally {
      setSaving(false);
    }
  };

  // ─── SAVE CATEGORIES ────────────────────────────────────
  const saveCategories = async () => {
    setStep('settings');
  };

  // ─── SAVE SETTINGS ──────────────────────────────────────
  const saveSettings = async () => {
    if (!store) return;
    setSaving(true);
    try {
      const updateData: any = {};
      if (storeDescription) updateData.description = storeDescription;
      if (storeWhatsApp) updateData.whatsappNumber = storeWhatsApp;
      if (storeBusinessHours) updateData.businessHours = storeBusinessHours;
      if (storeLogo) updateData.logo = storeLogo;

      if (Object.keys(updateData).length > 0) {
        await storeAPI.update(updateData);
      }

      toast.success('Settings saved!');
      setStep('qr');
    } catch (err: any) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // ─── GENERATE QR ────────────────────────────────────────
  const generateQR = async () => {
    setSaving(true);
    try {
      const { data } = await qrAPI.generate();
      setQrCode(data.qrCode);
      setQrUrl(data.url);
      toast.success('QR Code generated!');
    } catch (err: any) {
      toast.error('Failed to generate QR code');
    } finally {
      setSaving(false);
    }
  };

  // ─── STEP INDICATOR ─────────────────────────────────────
  const STEPS: { key: WizardStep; label: string; icon: string }[] = [
    { key: 'welcome', label: 'Welcome', icon: '👋' },
    { key: 'products', label: 'Products', icon: '🛒' },
    { key: 'categories', label: 'Categories', icon: '📂' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
    { key: 'qr', label: 'QR Code', icon: '📱' },
    { key: 'launch', label: 'Launch', icon: '🚀' },
  ];

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  if (loading || !user || !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-grocgo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* ─── PROGRESS BAR ─────────────────────────────────── */}
      <div className="bg-white border-b sticky top-0 z-20 safe-top">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="GrocGo" width={20} height={20} draggable={false} />
              <span className="font-bold text-gray-900 text-sm">Setup</span>
            </div>
            <span className="text-xs text-gray-400">{currentStepIdx + 1} of {STEPS.length}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-grocgo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStepIdx + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                  i < currentStepIdx ? 'bg-grocgo-500 text-white' :
                  i === currentStepIdx ? 'bg-grocgo-600 text-white ring-2 ring-grocgo-200' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {i < currentStepIdx ? '✓' : s.icon}
                </div>
                <span className={`text-[10px] mt-0.5 ${i === currentStepIdx ? 'text-grocgo-600 font-medium' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── STEP CONTENT ─────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ═══ WELCOME ════════════════════════════════════════ */}
        {step === 'welcome' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-grocgo-100 rounded-3xl flex items-center justify-center mx-auto">
              <span className="text-5xl">🎉</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to GrocGo!</h1>
              <p className="text-gray-500 text-sm">
                Your store <span className="font-semibold text-gray-700">{store.name}</span> is ready.
                <br />Let&apos;s set it up in a few quick steps.
              </p>
            </div>

            <div className="bg-white rounded-2xl border p-5 text-left space-y-4">
              <h3 className="font-semibold text-sm text-gray-900">What we&apos;ll set up:</h3>
              {STEPS.slice(1).map((s, i) => (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.label}</p>
                    <p className="text-xs text-gray-400">
                      {s.key === 'products' && 'Add your grocery products with prices'}
                      {s.key === 'categories' && 'Organize products into categories'}
                      {s.key === 'settings' && 'Upload logo, set hours & WhatsApp'}
                      {s.key === 'qr' && 'Generate your store QR code for customers'}
                      {s.key === 'launch' && 'Start accepting orders!'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-grocgo-50 text-grocgo-700 rounded-xl p-4 text-sm font-medium">
              ⏱ Takes about 3-5 minutes
            </div>

            <button
              onClick={() => setStep('products')}
              className="w-full bg-grocgo-600 text-white py-3.5 rounded-xl font-bold text-base press-effect"
            >
              Let&apos;s Get Started →
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 text-sm font-medium hover:text-gray-600"
            >
              Skip for now →
            </button>
          </div>
        )}

        {/* ═══ PRODUCTS ═══════════════════════════════════════ */}
        {step === 'products' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add Your Products</h2>
              <p className="text-gray-400 text-sm mt-1">Tap to select popular items, or add your own below.</p>
            </div>

            {/* Quick-add popular products */}
            <div className="bg-white rounded-2xl border p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span>⚡</span> Popular Items
                <span className="text-xs text-gray-400 font-normal ml-auto">
                  {products.filter((p) => p.added).length} selected
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {products.map((product, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleProduct(idx)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all press-effect ${
                      product.added
                        ? 'bg-grocgo-50 border border-grocgo-300'
                        : 'bg-gray-50 border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      product.added ? 'border-grocgo-500 bg-grocgo-500' : 'border-gray-300'
                    }`}>
                      {product.added && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.category}</p>
                    </div>
                    <span className="text-sm font-bold text-grocgo-600 tabular-nums">₹{product.price}</span>
                    <span className="text-[10px] text-gray-400">/{product.unit}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom product entry */}
            <div className="bg-white rounded-2xl border p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span>➕</span> Add Custom Product
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Product name"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
                    inputMode="decimal"
                  />
                  <select
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="litre">litre</option>
                    <option value="ml">ml</option>
                    <option value="packet">packet</option>
                    <option value="piece">piece</option>
                    <option value="dozen">dozen</option>
                    <option value="bottle">bottle</option>
                  </select>
                  <button
                    onClick={addCustomProduct}
                    disabled={!newProductName.trim()}
                    className="bg-grocgo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold press-effect disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Custom products list */}
              {customProducts.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {customProducts.map((cp, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                      <span className="font-medium text-sm flex-1 truncate">{cp.name}</span>
                      <span className="text-xs text-gray-400">₹{cp.price}/{cp.unit}</span>
                      <button onClick={() => removeCustomProduct(idx)} className="text-gray-300 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Continue */}
            <button
              onClick={saveProducts}
              disabled={saving || (products.filter((p) => p.added).length === 0 && customProducts.length === 0)}
              className="w-full bg-grocgo-600 text-white py-3.5 rounded-xl font-bold text-sm press-effect disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Saving Products...
                </>
              ) : (
                <>Save & Continue →</>
              )}
            </button>

            <button
              onClick={() => setStep('categories')}
              className="w-full text-gray-400 text-sm font-medium py-2"
            >
              Skip — add products later
            </button>
          </div>
        )}

        {/* ═══ CATEGORIES ═════════════════════════════════════ */}
        {step === 'categories' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Organize Categories</h2>
              <p className="text-gray-400 text-sm mt-1">Products are grouped under categories. Customize as needed.</p>
            </div>

            <div className="bg-white rounded-2xl border p-4">
              <h3 className="font-semibold text-sm mb-3">Current Categories</h3>
              <div className="space-y-2">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-xl">
                    <span className="w-6 h-6 bg-grocgo-100 text-grocgo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-900">{cat.name}</span>
                    <button
                      onClick={() => removeCategory(idx)}
                      className="text-gray-300 hover:text-red-500 press-effect"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add category */}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={addCategory}
                  disabled={!newCategoryName.trim()}
                  className="bg-grocgo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold press-effect disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('products')}
                className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl font-semibold text-sm press-effect"
              >
                ← Back
              </button>
              <button
                onClick={saveCategories}
                className="flex-1 bg-grocgo-600 text-white py-3.5 rounded-xl font-bold text-sm press-effect"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ═══ SETTINGS ═══════════════════════════════════════ */}
        {step === 'settings' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Store Settings</h2>
              <p className="text-gray-400 text-sm mt-1">Customize how your store appears to customers.</p>
            </div>

            {/* Logo Upload */}
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span>🖼️</span> Store Logo
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-dashed border-gray-200">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">🏪</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="bg-grocgo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer press-effect inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1.5">Square image, max 2MB</p>
                </div>
              </div>
            </div>

            {/* Store Details */}
            <div className="bg-white rounded-2xl border p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span>📝</span> Store Details
              </h3>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Store Description</label>
                <textarea
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none resize-none"
                  placeholder="Your neighbourhood grocery store since 1995"
                  rows={2}
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Business Hours</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
                  placeholder="Mon-Sat: 8:00 AM - 9:00 PM"
                  value={storeBusinessHours}
                  onChange={(e) => setStoreBusinessHours(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">WhatsApp Number</label>
                <input
                  type="tel"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
                  placeholder="+91 98765 43210"
                  value={storeWhatsApp}
                  onChange={(e) => setStoreWhatsApp(e.target.value)}
                  inputMode="tel"
                />
                <p className="text-xs text-gray-400 mt-1">Used for order notifications to customers</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('categories')}
                className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl font-semibold text-sm press-effect"
              >
                ← Back
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex-1 bg-grocgo-600 text-white py-3.5 rounded-xl font-bold text-sm press-effect disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Saving...
                  </>
                ) : (
                  <>Save & Continue →</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══ QR CODE ════════════════════════════════════════ */}
        {step === 'qr' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Your Store QR Code</h2>
              <p className="text-gray-400 text-sm mt-1">Customers scan this to start ordering.</p>
            </div>

            {!qrCode ? (
              <div className="bg-white rounded-2xl border p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📱</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Generate Your QR Code</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                  This QR code links directly to your store&apos;s ordering page
                </p>
                <button
                  onClick={generateQR}
                  disabled={saving}
                  className="bg-grocgo-600 text-white px-8 py-3.5 rounded-xl font-bold text-sm press-effect disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Generating...
                    </>
                  ) : (
                    <>⚡ Generate QR Code</>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border p-6 text-center">
                <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 inline-block mb-4 shadow-sm">
                  <img src={qrCode} alt="Store QR Code" className="w-48 h-48" />
                </div>
                <p className="text-sm text-gray-500 mb-1">Your ordering link:</p>
                <p className="text-xs font-mono text-grocgo-600 bg-grocgo-50 px-3 py-2 rounded-lg break-all">
                  {qrUrl}
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `${store.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
                      link.href = qrCode;
                      link.click();
                      toast.success('QR code downloaded!');
                    }}
                    className="flex-1 bg-grocgo-600 text-white py-3 rounded-xl text-sm font-semibold press-effect flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: store.name, url: qrUrl });
                      } else {
                        navigator.clipboard.writeText(qrUrl);
                        toast.success('Link copied!');
                      }
                    }}
                    className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold press-effect flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            )}

            {/* Placement tips */}
            <div className="bg-white rounded-2xl border p-4">
              <h3 className="font-semibold text-sm mb-3">📍 Where to place your QR code:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                {[
                  { icon: '🚪', text: 'Store entrance — first thing customers see' },
                  { icon: '💳', text: 'Near billing counter — while they wait' },
                  { icon: '🪟', text: 'On the store window — visible from outside' },
                  { icon: '🧾', text: 'On printed receipts — for repeat orders' },
                  { icon: '📦', text: 'On packaging bags — for next-time orders' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span>{tip.icon}</span>
                    <span>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('settings')}
                className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl font-semibold text-sm press-effect"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('launch')}
                className="flex-1 bg-grocgo-600 text-white py-3.5 rounded-xl font-bold text-sm press-effect"
              >
                {qrCode ? 'Continue →' : 'Skip for Now →'}
              </button>
            </div>
          </div>
        )}

        {/* ═══ LAUNCH ═════════════════════════════════════════ */}
        {step === 'launch' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-grocgo-100 rounded-3xl flex items-center justify-center mx-auto animate-bounce">
              <span className="text-5xl">🚀</span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re All Set!</h1>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                <span className="font-semibold text-gray-700">{store.name}</span> is ready to accept orders.
              </p>
            </div>

            <div className="bg-white rounded-2xl border p-5 text-left space-y-3">
              <h3 className="font-semibold text-sm">Quick checklist:</h3>
              {[
                { icon: '✅', text: 'Account created', done: true },
                { icon: store.logo ? '✅' : '⬜', text: 'Store logo uploaded', done: !!store.logo },
                { icon: '✅', text: 'Products added', done: true },
                { icon: qrCode ? '✅' : '⬜', text: 'QR code generated', done: !!qrCode },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span>{item.icon}</span>
                  <span className={item.done ? 'text-gray-900' : 'text-gray-400'}>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="bg-grocgo-50 text-grocgo-700 rounded-xl p-4 text-sm font-medium">
              💡 Tip: Print your QR code and place it at the store entrance for customers to scan!
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-grocgo-600 text-white py-3.5 rounded-xl font-bold text-base press-effect"
              >
                Go to Dashboard →
              </button>

              {qrUrl && (
                <button
                  onClick={() => router.push(`/order/${store.slug}`)}
                  className="w-full border border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold text-sm press-effect"
                >
                  Preview Customer Ordering Page →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
