'use client';

import { useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { storeAPI, qrAPI } from '@/lib/api';
import {
  ArrowLeft, Download, Printer, QrCode, Camera,
  ScanLine, ShoppingCart, CheckCircle, Palette, Eye, LayoutTemplate, Smartphone,
  Play, Pause
} from 'lucide-react';

// ─── Theme Definitions ───────────────────────────────────────────
type ThemeId = 'green' | 'blue' | 'orange';

interface Theme {
  id: ThemeId;
  label: string;
  preview: string;
  headerGradient: string;
  qrBorder: string;
  qrShadow: string;
  qrCorner: string;
  scanBtn: string;
  scanBtnShadow: string;
  scanDot: string;
  stepBg: string;
  stepArrow: string;
  instrBg: string;
  base: string;
  logoHighlight: string;
}

const themes: Record<ThemeId, Theme> = {
  green: {
    id: 'green', label: 'Green',
    preview: 'linear-gradient(135deg, #22c55e, #15803d)',
    headerGradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #15803d 70%, #166534 100%)',
    qrBorder: '#16a34a', qrShadow: '0 8px 24px rgba(22,163,74,0.15)', qrCorner: '#15803d',
    scanBtn: 'linear-gradient(135deg, #22c55e, #16a34a)', scanBtnShadow: '0 6px 20px rgba(22,163,74,0.3)',
    scanDot: '#16a34a', stepBg: '#16a34a', stepArrow: '#16a34a',
    instrBg: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
    base: 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)', logoHighlight: '#bbf7d0',
  },
  blue: {
    id: 'blue', label: 'Blue',
    preview: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    headerGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 40%, #1d4ed8 70%, #1e3a8a 100%)',
    qrBorder: '#2563eb', qrShadow: '0 8px 24px rgba(37,99,235,0.15)', qrCorner: '#1d4ed8',
    scanBtn: 'linear-gradient(135deg, #3b82f6, #2563eb)', scanBtnShadow: '0 6px 20px rgba(37,99,235,0.3)',
    scanDot: '#2563eb', stepBg: '#2563eb', stepArrow: '#2563eb',
    instrBg: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    base: 'linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8)', logoHighlight: '#bfdbfe',
  },
  orange: {
    id: 'orange', label: 'Orange',
    preview: 'linear-gradient(135deg, #f97316, #c2410c)',
    headerGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 40%, #c2410c 70%, #9a3412 100%)',
    qrBorder: '#ea580c', qrShadow: '0 8px 24px rgba(234,88,12,0.15)', qrCorner: '#c2410c',
    scanBtn: 'linear-gradient(135deg, #f97316, #ea580c)', scanBtnShadow: '0 6px 20px rgba(234,88,12,0.3)',
    scanDot: '#ea580c', stepBg: '#ea580c', stepArrow: '#ea580c',
    instrBg: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
    base: 'linear-gradient(135deg, #f97316, #ea580c, #c2410c)', logoHighlight: '#fed7aa',
  },
};

// ─── Standee Content (shared between flat + mockup views) ────────
function StandeeContent({
  t, store, qrData, generating, onGenerate,
}: {
  t: Theme;
  store: any;
  qrData: { qrCode: string; url: string; slug: string } | null;
  generating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="px-7 pt-8 pb-5 text-center relative overflow-hidden" style={{ background: t.headerGradient }}>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-5 w-24 h-24 bg-white/5 rounded-full" />
        <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
          <img src="/logo.svg" alt="GrocGo" className="w-14 h-14 drop-shadow-lg" draggable={false} />
          <span className="text-[40px] font-black text-white tracking-tight" style={{ lineHeight: 1 }}>
            Groc<span style={{ color: t.logoHighlight }}>Go</span>
          </span>
        </div>
        <div className="relative z-10 mt-2">
          <p className="text-sm font-semibold text-white/90 tracking-[4px] uppercase">
            {store?.name || '{STORE NAME}'}
          </p>
        </div>
      </div>

      {/* QR Code */}
      <div className="px-7 py-6 flex justify-center">
        <div className="p-4 bg-white rounded-[20px] relative" style={{ border: `3px solid ${t.qrBorder}`, boxShadow: t.qrShadow }}>
          <div className="absolute -top-[3px] -left-[3px] w-5 h-5 border-t-4 border-l-4 rounded-tl-lg" style={{ borderColor: t.qrCorner }} />
          <div className="absolute -top-[3px] -right-[3px] w-5 h-5 border-t-4 border-r-4 rounded-tr-lg" style={{ borderColor: t.qrCorner }} />
          <div className="absolute -bottom-[3px] -left-[3px] w-5 h-5 border-b-4 border-l-4 rounded-bl-lg" style={{ borderColor: t.qrCorner }} />
          <div className="absolute -bottom-[3px] -right-[3px] w-5 h-5 border-b-4 border-r-4 rounded-br-lg" style={{ borderColor: t.qrCorner }} />
          {qrData ? (
            <img src={qrData.qrCode} alt="Store QR Code" className="w-[200px] h-[200px]" />
          ) : (
            <div className="w-[200px] h-[200px] bg-gray-50 rounded-xl flex flex-col items-center justify-center gap-3">
              <QrCode className="w-12 h-12 text-gray-300" />
              <p className="text-xs text-gray-400">No QR generated yet</p>
              <button onClick={onGenerate} disabled={generating}
                className="text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                style={{ background: t.stepBg }}>
                {generating ? 'Generating...' : 'Generate QR'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scan to Order */}
      <div className="px-7 pb-4 flex flex-col items-center">
        <div className="flex items-center gap-2.5 text-white px-7 py-3 rounded-2xl" style={{ background: t.scanBtn, boxShadow: t.scanBtnShadow }}>
          <ScanLine className="w-6 h-6" />
          <span className="text-[22px] font-extrabold tracking-wide">Scan to Order</span>
        </div>
        <p className="text-sm text-gray-500 mt-3 font-medium tracking-wider">
          Fast <span className="font-bold" style={{ color: t.scanDot }}>•</span> Easy <span className="font-bold" style={{ color: t.scanDot }}>•</span> Contactless
        </p>
      </div>

      {/* Instructions */}
      <div className="px-5 pb-5">
        <div className="rounded-2xl px-5 py-4" style={{ background: t.instrBg }}>
          <div className="flex items-center justify-center gap-3">
            {[
              { icon: <Camera className="w-5 h-5" />, label: 'Open Camera\nor QR Scanner' },
              { icon: <QrCode className="w-5 h-5" />, label: 'Scan\nQR Code' },
              { icon: <ShoppingCart className="w-5 h-5" />, label: 'Start\nOrdering' },
            ].map((step, i) => (
              <div key={i} className="contents">
                {i > 0 && <div className="font-bold text-lg" style={{ color: t.stepArrow }}>→</div>}
                <div className="flex-1 text-center">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md text-white" style={{ background: t.stepBg }}>
                    {step.icon}
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 leading-tight whitespace-pre-line">{step.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-7 py-4 border-t border-gray-100 flex justify-center">
        <p className="text-base font-bold text-gray-800">Thank You! Happy Shopping! 😊</p>
      </div>

      {/* Base stripe */}
      <div className="h-4 rounded-b-[32px]" style={{ background: t.base }} />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function StandeePage() {
  const router = useRouter();
  const standeeRef = useRef<HTMLDivElement>(null);
  const [qrData, setQrData] = useState<{ qrCode: string; url: string; slug: string } | null>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState<ThemeId>('green');
  const [viewMode, setViewMode] = useState<'design' | 'mockup' | 'scanning'>('design');
  const [autoplay, setAutoplay] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const t = themes[theme];

  const viewOrder: Array<'design' | 'mockup' | 'scanning'> = ['design', 'mockup', 'scanning'];

  useEffect(() => {
    const savedTheme = localStorage.getItem('grocgo-standee-theme') as ThemeId | null;
    if (savedTheme && themes[savedTheme]) setTheme(savedTheme);
    const savedView = localStorage.getItem('grocgo-standee-view') as 'design' | 'mockup' | 'scanning' | null;
    if (savedView === 'mockup' || savedView === 'scanning') setViewMode(savedView);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storeRes = await storeAPI.getMe();
      setStore(storeRes.data);
      if (storeRes.data.qrCode) {
        const slug = storeRes.data.slug;
        const frontendUrl = window.location.origin;
        setQrData({ qrCode: storeRes.data.qrCode, url: `${frontendUrl}/order/${slug}`, slug });
      }
    } catch {} finally { setLoading(false); }
  };

  const generateQR = async () => {
    setGenerating(true);
    try {
      const { data } = await qrAPI.generate();
      setQrData(data);
      toast.success('QR code generated!');
    } catch { toast.error('Failed to generate QR code'); }
    finally { setGenerating(false); }
  };

  const changeTheme = (id: ThemeId) => {
    setTheme(id);
    localStorage.setItem('grocgo-standee-theme', id);
  };

  const toggleView = (mode: 'design' | 'mockup' | 'scanning') => {
    setViewMode(mode);
    localStorage.setItem('grocgo-standee-view', mode);
  };

  // ─── Carousel Logic ──────────────────────────────────────────────
  const startAutoplay = useCallback(() => {
    setAutoplay(true);
    // Reset progress bar
    if (progressRef.current) {
      progressRef.current.style.transition = 'none';
      progressRef.current.style.width = '0%';
      // Force reflow
      void progressRef.current.offsetWidth;
    }
    // Start progress bar animation
    requestAnimationFrame(() => {
      if (progressRef.current) {
        progressRef.current.style.transition = 'width 4s linear';
        progressRef.current.style.width = '100%';
      }
    });
    intervalRef.current = setInterval(() => {
      setViewMode((prev) => {
        const idx = viewOrder.indexOf(prev);
        const next = viewOrder[(idx + 1) % viewOrder.length];
        return next;
      });
      // Reset and replay progress bar
      if (progressRef.current) {
        progressRef.current.style.transition = 'none';
        progressRef.current.style.width = '0%';
        void progressRef.current.offsetWidth;
        requestAnimationFrame(() => {
          if (progressRef.current) {
            progressRef.current.style.transition = 'width 4s linear';
            progressRef.current.style.width = '100%';
          }
        });
      }
    }, 4000);
  }, []);

  const stopAutoplay = useCallback(() => {
    setAutoplay(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (progressRef.current) {
      progressRef.current.style.transition = 'width 0.3s ease';
      progressRef.current.style.width = '0%';
    }
  }, []);

  const toggleAutoplay = () => {
    if (autoplay) stopAutoplay();
    else startAutoplay();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // ─── Print ───────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !standeeRef.current) return;
    const th = themes[theme];

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>GrocGo Standee - ${store?.name || 'Store'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Inter',-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0}
        .s{width:480px;background:#fff;border-radius:32px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.15)}
        .hd{background:${th.headerGradient};padding:32px 28px 20px;text-align:center;position:relative;overflow:hidden}
        .hd::before{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:rgba(255,255,255,0.08);border-radius:50%}
        .hd::after{content:'';position:absolute;bottom:-30px;left:-20px;width:80px;height:80px;background:rgba(255,255,255,0.06);border-radius:50%}
        .la{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px;position:relative;z-index:1}
        .la img{width:56px;height:56px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.1))}
        .lt{font-size:36px;font-weight:900;color:#fff;letter-spacing:-1px}.lt span{color:${th.logoHighlight}}
        .sn{font-size:14px;font-weight:600;color:rgba(255,255,255,0.9);letter-spacing:3px;text-transform:uppercase;margin-top:6px;position:relative;z-index:1}
        .qs{padding:24px 28px;text-align:center}
        .qf{display:inline-block;padding:16px;background:#fff;border:3px solid ${th.qrBorder};border-radius:20px;position:relative;box-shadow:${th.qrShadow}}
        .qf img{width:200px;height:200px;display:block}
        .qc{position:absolute;width:20px;height:20px}
        .qc.tl{top:-3px;left:-3px;border-top:4px solid ${th.qrCorner};border-left:4px solid ${th.qrCorner};border-radius:8px 0 0 0}
        .qc.tr{top:-3px;right:-3px;border-top:4px solid ${th.qrCorner};border-right:4px solid ${th.qrCorner};border-radius:0 8px 0 0}
        .qc.bl{bottom:-3px;left:-3px;border-bottom:4px solid ${th.qrCorner};border-left:4px solid ${th.qrCorner};border-radius:0 0 0 8px}
        .qc.br{bottom:-3px;right:-3px;border-bottom:4px solid ${th.qrCorner};border-right:4px solid ${th.qrCorner};border-radius:0 0 8px 0}
        .sc{padding:0 28px 20px;text-align:center}
        .sb{display:inline-flex;align-items:center;gap:10px;background:${th.scanBtn};color:#fff;padding:12px 28px;border-radius:16px;font-size:22px;font-weight:800;letter-spacing:0.5px;box-shadow:${th.scanBtnShadow}}
        .ss{font-size:14px;color:#6b7280;margin-top:10px;font-weight:500;letter-spacing:1px}.ss b{color:${th.scanDot};font-weight:700}
        .st{display:flex;justify-content:center;gap:12px;padding:16px 20px;margin:0 20px;background:${th.instrBg};border-radius:16px}
        .si{flex:1;text-align:center}.sii{width:44px;height:44px;background:${th.stepBg};border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;color:#fff;font-size:18px}
        .sit{font-size:10px;font-weight:600;color:#374151;line-height:1.3}.sar{display:flex;align-items:center;color:${th.stepArrow};font-size:18px;font-weight:700;padding-top:4px}
        .ft{text-align:center;padding:16px 28px 24px;border-top:1px solid #f3f4f6}.ftt{font-size:16px;font-weight:700;color:#1f2937}
        .ba{height:16px;background:${th.base};border-radius:0 0 32px 32px}
        @media print{body{background:#fff}.s{box-shadow:none;border:2px solid #e5e7eb}}
      </style></head><body>
      <div class="s"><div class="hd"><div class="la"><img src="/logo.svg" alt="GrocGo" width="56" height="56"/><div class="lt">Groc<span>Go</span></div></div><div class="sn">${store?.name || '{STORE NAME}'}</div></div>
      <div class="qs"><div class="qf"><div class="qc tl"></div><div class="qc tr"></div><div class="qc bl"></div><div class="qc br"></div><img src="${qrData?.qrCode || ''}" alt="QR"/></div></div>
      <div class="sc"><div class="sb"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>Scan to Order</div><div class="ss">Fast <b>•</b> Easy <b>•</b> Contactless</div></div>
      <div class="st"><div class="si"><div class="sii">📷</div><div class="sit">Open Camera<br/>or QR Scanner</div></div><div class="sar">→</div><div class="si"><div class="sii">📱</div><div class="sit">Scan<br/>QR Code</div></div><div class="sar">→</div><div class="si"><div class="sii">🛒</div><div class="sit">Start<br/>Ordering</div></div></div>
      <div class="ft"><div class="ftt">Thank You! Happy Shopping! 😊</div></div><div class="ba"></div></div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  }, [theme, store, qrData]);

  // ─── Download ────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!standeeRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');

      // Clone standee into a fixed-dimension offscreen container
      // so html2canvas captures without flex/overflow distortions
      const source = standeeRef.current;
      const clone = source.cloneNode(true) as HTMLDivElement;

      // Remove interactive buttons from clone
      clone.querySelectorAll('button').forEach((btn) => btn.remove());

      // Measure the actual rendered size
      const rect = source.getBoundingClientRect();
      const w = Math.ceil(rect.width);
      const h = Math.ceil(rect.height);

      // Create fixed-size offscreen wrapper
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `position:fixed;left:-9999px;top:0;width:${w}px;overflow:hidden;background:#fff;z-index:-1;`;
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // Force clone to exact rendered dimensions
      clone.style.width = w + 'px';
      clone.style.height = h + 'px';
      clone.style.borderRadius = '0';
      clone.style.overflow = 'visible';
      clone.style.margin = '0';
      clone.style.boxShadow = 'none';

      const canvas = await html2canvas(wrapper, {
        width: w,
        height: h,
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        removeContainer: true,
      } as any);

      document.body.removeChild(wrapper);

      const link = document.createElement('a');
      link.download = `grocgo-standee-${theme}-${store?.slug || 'store'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Standee downloaded!');
    } catch {
      toast('Using print dialog...', { icon: 'ℹ️' });
      handlePrint();
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
          <div className="w-64 h-96 bg-gray-200 rounded-2xl mx-auto" />
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="pb-safe">
      {/* Scan line animation keyframes */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 30%; opacity: 0.4; }
          50% { top: 65%; opacity: 1; }
        }
      `}</style>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.push('/dashboard/qr')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <QrCode className="w-6 h-6 text-grocgo-600" />
            QR Standee Design
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Print-ready countertop display</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ═══ Standee Preview ═══════════════════════════════════════ */}
        <div className="flex-1 flex justify-center">
          {viewMode === 'design' ? (
            /* ── Flat Design View ── */
            <div
              ref={standeeRef}
              className="w-[380px] shadow-[0_25px_60px_rgba(0,0,0,0.12)] rounded-[32px]"
            >
              <StandeeContent t={t} store={store} qrData={qrData} generating={generating} onGenerate={generateQR} />
            </div>
          ) : viewMode === 'mockup' ? (
            /* ── Countertop Mockup View ── */
            <div className="w-full max-w-[640px]">
              {/* Scene */}
              <div
                className="relative mx-auto"
                style={{ perspective: '1200px', perspectiveOrigin: '50% 40%' }}
              >
                {/* Wall / Background */}
                <div
                  className="w-full rounded-t-3xl overflow-hidden relative"
                  style={{
                    height: 520,
                    background: 'linear-gradient(180deg, #f5f0eb 0%, #ede5db 40%, #e8ddd0 100%)',
                  }}
                >
                  {/* Subtle wall texture — horizontal lines */}
                  <div className="absolute inset-0 opacity-[0.04]"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(0,0,0,0.15) 18px, rgba(0,0,0,0.15) 19px)',
                    }}
                  />
                  {/* Warm light glow from top-left */}
                  <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-30"
                    style={{ background: 'radial-gradient(circle, rgba(255,220,160,0.5), transparent 70%)' }}
                  />
                  {/* Wall outlet (decorative detail) */}
                  <div className="absolute bottom-16 right-12 w-8 h-12 bg-gray-200/60 rounded-md border border-gray-300/40">
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-300/70" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-300/70" />
                  </div>

                  {/* ── Standee on counter ── */}
                  <div
                    className="absolute"
                    style={{
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%) rotateY(-2deg) rotateX(1deg)',
                      transformOrigin: 'bottom center',
                      zIndex: 10,
                    }}
                  >
                    {/* Counter shadow */}
                    <div
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2"
                      style={{
                        width: '85%',
                        height: 18,
                        background: 'radial-gradient(ellipse, rgba(0,0,0,0.18) 0%, transparent 70%)',
                        filter: 'blur(4px)',
                      }}
                    />
                    {/* Standee card */}
                    <div
                      ref={standeeRef}
                      className="w-[260px] rounded-[22px] overflow-hidden"
                      style={{
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    >
                      <StandeeContent t={t} store={store} qrData={qrData} generating={generating} onGenerate={generateQR} />
                    </div>
                  </div>
                </div>

                {/* Counter surface */}
                <div
                  className="w-full h-20 rounded-b-3xl relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, #c9b99a 0%, #b8a787 30%, #a89670 100%)',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* Wood grain lines */}
                  <div className="absolute inset-0 opacity-[0.08]"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.1) 40px, rgba(0,0,0,0.1) 41px)',
                    }}
                  />
                  {/* Counter edge highlight */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />
                  {/* Counter front face */}
                  <div className="absolute bottom-0 left-0 right-0 h-3"
                    style={{ background: 'linear-gradient(180deg, #a89670, #96845e)' }}
                  />
                </div>

                {/* Ambient items on counter */}
                <div className="absolute bottom-[72px] right-8 z-20 opacity-60">
                  {/* Small plant pot */}
                  <div className="relative">
                    <div className="w-6 h-8 bg-amber-700/40 rounded-b-lg mx-auto" />
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-6">
                      <div className="w-3 h-5 bg-green-600/50 rounded-full -rotate-12 absolute left-0 bottom-0" />
                      <div className="w-3 h-6 bg-green-500/50 rounded-full rotate-6 absolute right-0 bottom-0" />
                      <div className="w-2 h-4 bg-green-700/40 rounded-full absolute left-1/2 -translate-x-1/2 bottom-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Caption */}
              <p className="text-center text-xs text-gray-400 mt-4 font-medium">
                Preview — your standee on a countertop
              </p>
            </div>
          ) : (
            /* ── Phone Scanning View ── */
            <div className="w-full max-w-[640px]">
              <div
                className="relative mx-auto"
                style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}
              >
                {/* Scene background — blurred store interior */}
                <div
                  className="w-full rounded-3xl overflow-hidden relative"
                  style={{
                    height: 560,
                    background: 'linear-gradient(160deg, #f8f6f3 0%, #ece7e0 50%, #e2dbd2 100%)',
                  }}
                >
                  {/* Ambient warm light */}
                  <div className="absolute -top-16 right-12 w-64 h-64 rounded-full opacity-25"
                    style={{ background: 'radial-gradient(circle, rgba(255,210,140,0.6), transparent 70%)' }}
                  />

                  {/* ── Background standee (blurred, at distance) ── */}
                  <div
                    className="absolute z-[1]"
                    style={{
                      top: '12%',
                      left: '10%',
                      transform: 'rotateY(8deg) scale(0.7)',
                      transformOrigin: 'bottom center',
                      filter: 'blur(1.5px) brightness(0.92)',
                      opacity: 0.7,
                    }}
                  >
                    <div className="w-[220px] rounded-[18px] overflow-hidden" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                      <StandeeContent t={t} store={store} qrData={qrData} generating={generating} onGenerate={generateQR} />
                    </div>
                  </div>

                  {/* Counter edge at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-14 rounded-b-3xl"
                    style={{
                      background: 'linear-gradient(180deg, #c4b494 0%, #b0a07a 100%)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25)',
                    }}
                  >
                    <div className="absolute inset-0 opacity-[0.06]"
                      style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 36px, rgba(0,0,0,0.12) 36px, rgba(0,0,0,0.12) 37px)' }}
                    />
                    <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />
                  </div>

                  {/* ── Phone in hand (foreground) ── */}
                  <div
                    className="absolute z-20"
                    style={{
                      bottom: 30,
                      right: '8%',
                      transform: 'rotate(-4deg) perspective(800px) rotateY(5deg)',
                      transformOrigin: 'bottom center',
                    }}
                  >
                    {/* Phone shadow on counter */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[85%] h-5 rounded-full"
                      style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.15), transparent 70%)', filter: 'blur(3px)' }}
                    />

                    {/* Hand / fingers */}
                    <div className="absolute -bottom-14 -left-4 z-30">
                      {/* Thumb (left side) */}
                      <div className="absolute -left-3 top-8 w-5 h-16 rounded-full" style={{ background: 'linear-gradient(180deg, #e8c9a8, #d4a97a)', boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.08)' }} />
                      {/* Palm grip */}
                      <div className="w-10 h-20 rounded-b-2xl" style={{ background: 'linear-gradient(180deg, #dbb896, #c9a47a)', boxShadow: '2px 2px 8px rgba(0,0,0,0.1)' }} />
                      {/* Fingers wrapping right side */}
                      <div className="absolute -right-3 top-0 w-5 h-14 rounded-full" style={{ background: 'linear-gradient(180deg, #e0be9a, #cca578)', boxShadow: '-1px 2px 4px rgba(0,0,0,0.08)' }} />
                    </div>

                    {/* Phone body */}
                    <div
                      className="relative w-[200px] h-[380px] rounded-[28px] overflow-hidden"
                      style={{
                        background: '#1a1a1a',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                        border: '2px solid #333',
                      }}
                    >
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-2xl z-10" />

                      {/* Screen */}
                      <div className="absolute inset-[3px] rounded-[24px] overflow-hidden bg-gray-950">
                        {/* Camera viewfinder background */}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #1a1f2e 0%, #111827 50%, #0f172a 100%)' }} />

                        {/* Simulated camera feed — blurred standee thumbnail */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30" style={{ filter: 'blur(6px)' }}>
                          <div className="w-[180px] h-[300px] rounded-xl overflow-hidden">
                            <StandeeContent t={t} store={store} qrData={qrData} generating={generating} onGenerate={generateQR} />
                          </div>
                        </div>

                        {/* Viewfinder corners */}
                        <div className="absolute top-16 left-4 w-10 h-10 border-t-[3px] border-l-[3px] border-white/80 rounded-tl-lg" />
                        <div className="absolute top-16 right-4 w-10 h-10 border-t-[3px] border-r-[3px] border-white/80 rounded-tr-lg" />
                        <div className="absolute bottom-20 left-4 w-10 h-10 border-b-[3px] border-l-[3px] border-white/80 rounded-bl-lg" />
                        <div className="absolute bottom-20 right-4 w-10 h-10 border-b-[3px] border-r-[3px] border-white/80 rounded-br-lg" />

                        {/* Scanning line animation */}
                        <div
                          className="absolute left-4 right-4 h-[2px] z-10"
                          style={{
                            top: '35%',
                            background: 'linear-gradient(90deg, transparent, #22c55e, #4ade80, #22c55e, transparent)',
                            boxShadow: '0 0 12px rgba(34,197,94,0.6), 0 0 30px rgba(34,197,94,0.3)',
                            animation: 'scanLine 2.5s ease-in-out infinite',
                          }}
                        />

                        {/* Top bar — camera UI */}
                        <div className="absolute top-7 left-0 right-0 flex justify-between items-center px-5 z-10">
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-white text-[10px]">✕</span>
                          </div>
                          <span className="text-white/60 text-[10px] font-medium tracking-wider">QR SCANNER</span>
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-white text-[10px]">⚡</span>
                          </div>
                        </div>

                        {/* Detected indicator */}
                        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10">
                          <div className="bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            QR Detected
                          </div>
                        </div>

                        {/* Bottom capture button area */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6 z-10">
                          <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-sm bg-white/10" />
                          </div>
                          <div className="w-14 h-14 rounded-full border-[3px] border-white/80 flex items-center justify-center">
                            <div className="w-11 h-11 rounded-full bg-white/90" />
                          </div>
                          <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
                            <span className="text-white/60 text-sm">⟲</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scan beam effect connecting phone to standee */}
                  <div
                    className="absolute z-[15] pointer-events-none"
                    style={{
                      top: '30%',
                      left: '25%',
                      width: '55%',
                      height: 2,
                      background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.3), rgba(34,197,94,0.15), transparent)',
                      filter: 'blur(1px)',
                      transform: 'rotate(-8deg)',
                      transformOrigin: 'left center',
                    }}
                  />
                </div>
              </div>

              <p className="text-center text-xs text-gray-400 mt-4 font-medium">
                Preview — customer scanning your QR code
              </p>
            </div>
          )}
        </div>

        {/* ═══ Controls Panel ════════════════════════════════════════ */}
        <div className="lg:w-72 space-y-4">

          {/* View Mode Toggle */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Preview Mode</h3>
            <div className="flex gap-2">
              <button
                onClick={() => { toggleView('design'); if (autoplay) stopAutoplay(); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  viewMode === 'design'
                    ? 'bg-grocgo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <LayoutTemplate className="w-4 h-4" />
                Design
              </button>
              <button
                onClick={() => { toggleView('mockup'); if (autoplay) stopAutoplay(); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  viewMode === 'mockup'
                    ? 'bg-grocgo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                Mockup
              </button>
              <button
                onClick={() => toggleView('scanning')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  viewMode === 'scanning'
                    ? 'bg-grocgo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Scan
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                ref={progressRef}
                className="h-full rounded-full"
                style={{ width: '0%', background: 'linear-gradient(90deg, #16a34a, #22c55e)' }}
              />
            </div>

            {/* Dot indicators + play/pause */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {viewOrder.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { toggleView(mode); if (autoplay) stopAutoplay(); }}
                    className="group relative"
                    title={`View: ${mode}`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        viewMode === mode
                          ? 'scale-125 shadow-sm'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      style={viewMode === mode ? { background: t.stepBg } : undefined}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={toggleAutoplay}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  autoplay
                    ? 'bg-grocgo-100 text-grocgo-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {autoplay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {autoplay ? 'Pause' : 'Auto-play'}
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-grocgo-600" />
              Color Theme
            </h3>
            <div className="flex gap-3">
              {(Object.values(themes) as Theme[]).map((th) => (
                <button
                  key={th.id}
                  onClick={() => changeTheme(th.id)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    theme === th.id
                      ? 'border-grocgo-500 bg-grocgo-50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full shadow-inner" style={{ background: th.preview }} />
                  <span className={`text-xs font-semibold ${theme === th.id ? 'text-grocgo-700' : 'text-gray-500'}`}>{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-semibold text-sm text-gray-900">Download & Print</h3>
            {!qrData && (
              <button onClick={generateQR} disabled={generating}
                className="w-full text-white py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: t.stepBg }}>
                {generating
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                  : <><QrCode className="w-5 h-5" /> Generate QR Code</>}
              </button>
            )}
            {qrData && (
              <>
                <button onClick={handleDownload}
                  className="w-full text-white py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{ background: t.stepBg }}>
                  <Download className="w-5 h-5" /> Download as Image
                </button>
                <button onClick={handlePrint}
                  className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" /> Print Standee
                </button>
              </>
            )}
          </div>

          {/* Store Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Store Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full" style={{ background: t.stepBg }} />
                <span className="font-medium">{store?.name || 'No store'}</span>
              </div>
              {qrData && (
                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: t.stepBg }} />
                  <span className="truncate">{qrData.url}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Placement Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {['Store entrance / door', 'Billing counter', 'Store window display', 'Shopping cart / basket'].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: t.stepBg }}>•</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
