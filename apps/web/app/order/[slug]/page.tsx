'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { storeAPI, productAPI, publicOrderAPI, ocrAPI } from '@/lib/api';
import { useCartStore } from '@/lib/store';

type ListMode = 'browse' | 'text' | 'photo';
type Step = 'list' | 'review' | 'confirm';

// ─── TYPES ──────────────────────────────────────────────────
interface StoreInfo {
  id: string;
  name: string;
  logo?: string;
  address: string;
  city: string;
  phone: string;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl?: string;
  category?: { id: string; name: string };
}

interface OrderItem {
  productName: string;
  productId?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface OrderResult {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  items: OrderItem[];
  customer: { name: string; phone: string };
  store: { name: string; phone: string; address: string; city: string };
  createdAt: string;
}

// ─── SKELETON COMPONENTS ─────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-4 w-1/3 rounded" />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="bg-white border-b sticky top-0 z-10 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-lg" />
        <div className="space-y-1">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3 w-48 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── STATUS BADGE ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    NEW: { bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700', label: 'New' },
    PREPARING: { bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', label: 'Preparing' },
    READY: { bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', label: 'Ready for Pickup' },
    COLLECTED: { bg: 'bg-gray-100 text-gray-600', text: 'text-gray-600', label: 'Collected' },
    CANCELLED: { bg: 'bg-red-50 text-red-600', text: 'text-red-600', label: 'Cancelled' },
  };
  const c = config[status] || config.NEW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${c.bg}`}>
      {status === 'PREPARING' && <span className="animate-pulse">⏳</span>}
      {status === 'READY' && <span>🔔</span>}
      {status === 'COLLECTED' && <span>✅</span>}
      {c.label}
    </span>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function CustomerOrderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  const {
    items, addItem, removeItem, updateQuantity,
    customerName, customerPhone, customerAddress, notes,
    setCustomerInfo, clearCart, total,
  } = useCartStore();

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Product[]>>({});
  const [search, setSearch] = useState('');
  const [listMode, setListMode] = useState<ListMode>('browse');
  const [step, setStep] = useState<Step>('list');
  const [textInput, setTextInput] = useState('');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [statusLoading, setStatusLoading] = useState(false);

  // ─── LOAD STORE + PRODUCTS ───────────────────────────────
  useEffect(() => { loadData(); }, [slug]);

  const loadData = async () => {
    try {
      // Step 1: Resolve store by slug → get store ID
      const storeRes = await storeAPI.getPublic(slug);
      const storeData = storeRes.data;
      setStore(storeData);

      // Step 2: Fetch products using store UUID (not slug)
      const prodRes = await productAPI.getPublic(storeData.id);
      setProducts(prodRes.data.products || []);
      setGrouped(prodRes.data.grouped || {});

      const cats = Object.keys(prodRes.data.grouped || {});
      if (cats.length > 0) setActiveCategory(cats[0]);
    } catch {
      toast.error('Store not found');
    } finally {
      setLoading(false);
    }
  };

  // ─── POLL ORDER STATUS ──────────────────────────────────
  const pollOrderStatus = useCallback(async (orderNumber: string) => {
    if (!store || !customerPhone) return;
    setStatusLoading(true);
    try {
      const { data } = await publicOrderAPI.status(orderNumber, {
        storeId: store.id,
        phone: customerPhone,
      });
      setOrderStatus(data.status);
    } catch {
      // Silently fail — order may not be findable yet
    } finally {
      setStatusLoading(false);
    }
  }, [store, customerPhone]);

  // Poll every 10s when on confirmation screen
  useEffect(() => {
    if (step !== 'confirm' || !orderResult) return;
    pollOrderStatus(orderResult.orderNumber);
    const interval = setInterval(() => pollOrderStatus(orderResult.orderNumber), 10000);
    return () => clearInterval(interval);
  }, [step, orderResult, pollOrderStatus]);

  // ─── COMPUTED ───────────────────────────────────────────
  const categories = useMemo(() => Object.keys(grouped), [grouped]);

  const displayedProducts = useMemo(() => {
    if (!activeCategory) return [];
    const catProducts = grouped[activeCategory] || [];
    if (!search) return catProducts;
    return catProducts.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [grouped, activeCategory, search]);

  const cartCount = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      if (item.productId) map[item.productId] = (map[item.productId] || 0) + item.quantity;
    });
    return map;
  }, [items]);

  const totalCartCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  // ─── HANDLERS ──────────────────────────────────────────
  const handleAddProduct = (product: Product) => {
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unit: product.unit,
      unitPrice: product.price,
    });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleParseText = async () => {
    if (!textInput.trim() || !store) return;
    setParsing(true);
    try {
      const { data } = await publicOrderAPI.parseList({ text: textInput, storeId: store.id });
      setParsedItems(data.items);
      const matched = data.items.filter((i: any) => i.matched).length;
      toast.success(`Found ${data.totalItems} items (${matched} matched to store products)`);
    } catch {
      toast.error('Failed to parse list');
    } finally {
      setParsing(false);
    }
  };

  const addParsedToCart = () => {
    parsedItems.forEach((item: any) => {
      addItem({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
      });
    });
    setParsedItems([]);
    setTextInput('');
    toast.success('Items added to your list!');
    setStep('review');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.loading('Processing image...', { id: 'ocr' });
    try {
      const { data } = await ocrAPI.upload(file);
      setParsedItems(data.items);
      setListMode('text');
      toast.success(`Detected ${data.totalItems} items from image`, { id: 'ocr' });
    } catch {
      toast.error('Failed to process image', { id: 'ocr' });
    }
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Please enter your name and phone number');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    if (!store) {
      toast.error('Store not loaded');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await publicOrderAPI.create({
        storeId: store.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          productId: undefined,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
        })),
      });
      setOrderResult(data.order);
      setOrderStatus(data.order.status);
      setStep('confirm');
      clearCart();
      toast.success('Order placed successfully!');
    } catch (err: any) {
      const details = err.response?.data?.details;
      const msg = err.response?.data?.error || 'Failed to place order';
      if (details && details.length > 0) {
        toast.error(`${msg}: ${details.map((d: any) => d.message).join(', ')}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewOrder = () => {
    setStep('list');
    setOrderResult(null);
    setOrderStatus('');
    clearCart();
  };

  // ─── LOADING STATE ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderSkeleton />
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-9 w-28 rounded-full" />)}
          </div>
          <div className="skeleton h-11 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <ProductSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  // ─── STORE NOT FOUND ────────────────────────────────────
  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold mb-2">Store Not Found</h2>
          <p className="text-gray-500 text-sm">This store may not exist or is currently inactive.</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-grocgo-600 font-medium text-sm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── ORDER CONFIRMATION ─────────────────────────────────
  if (step === 'confirm' && orderResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-safe">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center safe-bottom">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-grocgo-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
          <p className="text-gray-500 mb-5 text-sm">
            Your grocery list has been submitted to <span className="font-medium text-gray-700">{store.name}</span>
          </p>

          {/* Order Status */}
          <div className="mb-5">
            {orderStatus ? (
              <StatusBadge status={orderStatus} />
            ) : (
              <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Checking status...
              </div>
            )}
          </div>

          {/* Order Details Card */}
          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Order #</span>
              <span className="text-sm font-bold font-mono">{orderResult.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Store</span>
              <span className="text-sm font-medium">{store.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Name</span>
              <span className="text-sm font-medium">{orderResult.customer?.name || customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Phone</span>
              <span className="text-sm font-medium">{orderResult.customer?.phone || customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Items</span>
              <span className="text-sm font-medium">{orderResult.itemCount} items</span>
            </div>

            {/* Order Items */}
            {orderResult.items && orderResult.items.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-gray-400 mb-2">ORDER ITEMS</p>
                <div className="space-y-2">
                  {orderResult.items.map((item: OrderItem, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-6 h-6 bg-grocgo-50 text-grocgo-600 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {item.quantity}
                        </span>
                        <span className="truncate text-gray-700">{item.productName}</span>
                      </div>
                      <span className="font-medium text-gray-900 tabular-nums ml-2">
                        ₹{item.totalPrice.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="border-t pt-3 flex justify-between">
              <span className="text-gray-500 text-sm">Grand Total</span>
              <span className="text-xl font-bold text-grocgo-600 tabular-nums">₹{orderResult.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Store Contact */}
          <div className="mt-5 space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2 justify-center">
              <span>📞</span> <span>{store.phone}</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <span>📍</span> <span>{store.address}, {store.city}</span>
            </div>
          </div>

          {/* WhatsApp Notice */}
          <div className="mt-4 bg-grocgo-50 text-grocgo-700 rounded-xl p-4 text-sm font-medium">
            📱 You&apos;ll receive a WhatsApp notification when your order is ready!
          </div>

          {/* Refresh Status */}
          <button
            onClick={() => pollOrderStatus(orderResult.orderNumber)}
            disabled={statusLoading}
            className="mt-4 text-grocgo-600 text-sm font-medium flex items-center gap-1.5 mx-auto press-effect"
          >
            <svg className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Status
          </button>

          {/* New Order */}
          <button
            onClick={handleNewOrder}
            className="mt-4 w-full bg-grocgo-600 text-white py-3.5 rounded-xl font-semibold press-effect"
          >
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  // ─── REVIEW CART ─────────────────────────────────────────
  if (step === 'review') {
    return (
      <div className="min-h-screen bg-gray-50 pb-safe">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-20 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button onClick={() => setStep('list')} className="tap-target text-grocgo-600 press-effect">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="font-bold text-gray-900">Your List</h1>
              <p className="text-xs text-gray-500">{items.length} items · ₹{total().toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Items */}
          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 border flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-gray-400">₹{item.unitPrice}/{item.unit}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 rounded-full">
                  <button
                    onClick={() => updateQuantity(idx, item.quantity - 1)}
                    className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold text-gray-600 press-effect"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(idx, item.quantity + 1)}
                    className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold text-grocgo-600 press-effect"
                  >
                    +
                  </button>
                </div>
                <div className="w-16 text-right">
                  <p className="font-bold text-sm tabular-nums">₹{(item.unitPrice * item.quantity).toFixed(0)}</p>
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  className="tap-target text-gray-300 hover:text-red-500 press-effect"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-white rounded-xl p-4 mt-4 border flex justify-between items-center">
            <span className="text-gray-500 text-sm">Estimated Total</span>
            <span className="text-xl font-bold text-grocgo-600 tabular-nums">₹{total().toFixed(2)}</span>
          </div>

          {/* Customer Info Form */}
          <div className="bg-white rounded-xl p-5 mt-4 border space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="text-lg">👤</span> Your Information
            </h3>
            <InputField label="Full Name" required placeholder="e.g. Priya Sharma" value={customerName} onChange={(v) => setCustomerInfo({ customerName: v })} />
            <InputField label="Phone Number" required type="tel" placeholder="9876543210" value={customerPhone} onChange={(v) => setCustomerInfo({ customerPhone: v })} />
            <InputField label="Address" placeholder="Your address (optional)" value={customerAddress} onChange={(v) => setCustomerInfo({ customerAddress: v })} />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes (optional)</label>
              <textarea
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none resize-none"
                placeholder="Any special requests..."
                rows={2}
                value={notes}
                onChange={(e) => setCustomerInfo({ notes: e.target.value })}
              />
            </div>
          </div>

          {/* Spacer for bottom bar */}
          <div className="h-24" />
        </div>

        {/* Sticky bottom submit bar */}
        <div className="sticky-bottom-bar px-4 py-3 safe-bottom">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              className="w-full bg-grocgo-600 text-white py-3.5 rounded-xl font-bold text-base press-effect disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Placing Order...
                </>
              ) : (
                <>Place Order · ₹{total().toFixed(2)}</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN ORDERING INTERFACE ──────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* ─── STICKY HEADER ───────────────────────────────── */}
      <div className="bg-white border-b sticky top-0 z-20 safe-top">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-grocgo-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src="/logo.svg" alt="GrocGo" width={28} height={28} draggable={false} />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate">{store.name}</h1>
                <p className="text-[11px] text-gray-400 truncate">{store.address}, {store.city}</p>
              </div>
            </div>
            {totalCartCount > 0 && (
              <button
                onClick={() => setStep('review')}
                className="bg-grocgo-600 text-white pl-3 pr-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 press-effect shadow-sm shadow-grocgo-600/20 no-select"
              >
                <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs">{totalCartCount}</span>
                <span className="tabular-nums">₹{total().toFixed(0)}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── CATEGORY TABS ───────────────────────────────── */}
      <div className="bg-white border-b sticky top-[57px] z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex overflow-x-auto hide-scrollbar px-4 gap-1 py-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setSearch(''); listTopRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all no-select press-effect ${
                  activeCategory === cat
                    ? 'bg-grocgo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MODE SWITCHER ────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pt-4" ref={listTopRef}>
        <div className="flex gap-2 mb-4 hide-scrollbar overflow-x-auto no-select">
          {([
            { mode: 'browse' as ListMode, icon: '🛒', label: 'Browse' },
            { mode: 'text' as ListMode, icon: '✏️', label: 'Type List' },
            { mode: 'photo' as ListMode, icon: '📷', label: 'Photo' },
          ]).map((m) => (
            <button
              key={m.mode}
              onClick={() => setListMode(m.mode)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap press-effect ${
                listMode === m.mode
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── CONTENT AREA ────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-32">

        {/* ─── BROWSE PRODUCTS ─────────────────────────────── */}
        {listMode === 'browse' && (
          <div>
            {/* Search */}
            <div className="relative mb-4">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Product Grid */}
            {displayedProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-400 text-sm">
                  {search ? 'No products match your search' : 'No products in this category'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {displayedProducts.map((product) => {
                  const count = cartCount[product.id] || 0;
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className={`text-left rounded-xl p-3.5 transition-all press-effect ${
                        count > 0
                          ? 'bg-grocgo-50 border-2 border-grocgo-400 shadow-sm'
                          : 'bg-white border border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {product.imageUrl && (
                        <div className="w-full h-16 bg-gray-50 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                          <img src={product.imageUrl} alt="" className="h-14 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-medium text-[13px] leading-tight text-gray-900 line-clamp-2">{product.name}</p>
                        {count > 0 && (
                          <span className="flex-shrink-0 bg-grocgo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {count}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <div>
                          <span className="text-grocgo-600 font-bold text-sm tabular-nums">₹{product.price}</span>
                          <span className="text-gray-400 text-[11px]">/{product.unit}</span>
                        </div>
                        {count > 0 ? (
                          <span className="text-[10px] text-grocgo-600 font-medium bg-grocgo-100 px-1.5 py-0.5 rounded-full">
                            +1 more
                          </span>
                        ) : (
                          <span className="text-grocgo-600 text-lg leading-none">+</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TEXT LIST ───────────────────────────────────── */}
        {listMode === 'text' && (
          <div>
            <div className="bg-white rounded-xl border p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📝</span>
                <h3 className="font-semibold text-sm">Type or Paste Your List</h3>
              </div>
              <p className="text-gray-400 text-xs mb-3">
                We&apos;ll automatically match items with the store&apos;s products.
              </p>
              <textarea
                ref={textareaRef}
                className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none resize-none"
                placeholder={`Rice – 10 kg\nDal – 2 kg\nSugar – 2 kg\nCooking Oil – 1 litre\nTea – 1 packet`}
                rows={8}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <button
                onClick={handleParseText}
                disabled={parsing || !textInput.trim()}
                className="mt-3 w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold press-effect disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {parsing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Parsing...
                  </>
                ) : (
                  <>🔍 Parse List</>
                )}
              </button>
            </div>

            {/* Parsed Results */}
            {parsedItems.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Parsed Items ({parsedItems.length})</h3>
                  <span className="text-xs text-gray-400">
                    ✅ {parsedItems.filter((i: any) => i.matched).length} matched · ⚠️ {parsedItems.filter((i: any) => !i.matched).length} unmatched
                  </span>
                </div>
                <div className="space-y-1.5">
                  {parsedItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm flex-shrink-0">{item.matched ? '✅' : '⚠️'}</span>
                      <span className="font-medium text-sm flex-1 truncate">{item.productName}</span>
                      <span className="text-xs text-gray-400 whitespace-nowrap tabular-nums">
                        {item.quantity} {item.unit}
                        {item.unitPrice > 0 && <> · ₹{item.unitPrice}</>}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addParsedToCart}
                  className="mt-4 w-full bg-grocgo-600 text-white py-3 rounded-xl text-sm font-semibold press-effect"
                >
                  Add All to List ({parsedItems.length} items) →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── PHOTO UPLOAD ────────────────────────────────── */}
        {listMode === 'photo' && (
          <div>
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 sm:p-12 text-center">
              <div className="text-5xl mb-4">📷</div>
              <h3 className="font-semibold text-base mb-2">Upload Shopping List Photo</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                Take a photo of your handwritten or printed grocery list
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <label className="bg-grocgo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer press-effect inline-flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Photo
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                </label>
                <label className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer press-effect inline-flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload from Gallery
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            {/* Parsed Results (same as text mode) */}
            {parsedItems.length > 0 && (
              <div className="bg-white rounded-xl border p-4 mt-4">
                <h3 className="font-semibold text-sm mb-3">Detected Items ({parsedItems.length})</h3>
                <div className="space-y-1.5">
                  {parsedItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm">{item.matched ? '✅' : '⚠️'}</span>
                      <span className="font-medium text-sm flex-1 truncate">{item.productName}</span>
                      <span className="text-xs text-gray-400 tabular-nums">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addParsedToCart}
                  className="mt-4 w-full bg-grocgo-600 text-white py-3 rounded-xl text-sm font-semibold press-effect"
                >
                  Add All to List ({parsedItems.length} items) →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── STICKY BOTTOM CART BAR ───────────────────────── */}
      {totalCartCount > 0 && step === 'list' && (
        <div className="sticky-bottom-bar px-4 py-3 safe-bottom z-30">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setStep('review')}
              className="w-full bg-grocgo-600 text-white py-3.5 rounded-xl font-bold text-base press-effect shadow-lg shadow-grocgo-600/25 flex items-center justify-between px-5 no-select"
            >
              <div className="flex items-center gap-2">
                <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm">{totalCartCount}</span>
                <span>View List</span>
              </div>
              <span className="tabular-nums">₹{total().toFixed(2)} →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HELPER COMPONENTS ───────────────────────────────────────
function InputField({
  label, required, type = 'text', placeholder, value, onChange,
}: {
  label: string; required?: boolean; type?: string; placeholder?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        required={required}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={type === 'tel' ? 'tel' : type === 'text' ? 'name' : undefined}
        inputMode={type === 'tel' ? 'tel' : undefined}
      />
    </div>
  );
}
