'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { storeAPI, qrAPI } from '@/lib/api';
import {
  ArrowLeft, Download, Printer, QrCode, Camera,
  ScanLine, ShoppingCart, CheckCircle
} from 'lucide-react';

export default function StandeePage() {
  const router = useRouter();
  const standeeRef = useRef<HTMLDivElement>(null);
  const [qrData, setQrData] = useState<{ qrCode: string; url: string; slug: string } | null>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const storeRes = await storeAPI.getMe();
      setStore(storeRes.data);
      if (storeRes.data.qrCode) {
        const slug = storeRes.data.slug;
        const frontendUrl = window.location.origin;
        setQrData({
          qrCode: storeRes.data.qrCode,
          url: `${frontendUrl}/order/${slug}`,
          slug,
        });
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const generateQR = async () => {
    setGenerating(true);
    try {
      const { data } = await qrAPI.generate();
      setQrData(data);
      toast.success('QR code generated!');
    } catch {
      toast.error('Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !standeeRef.current) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>GrocGo Standee - ${store?.name || 'Store'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f0f0f0;
          }
          .standee-print {
            width: 480px;
            background: white;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0,0,0,0.15);
            position: relative;
          }
          .standee-header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%);
            padding: 32px 28px 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .standee-header::before {
            content: '';
            position: absolute;
            top: -40px;
            right: -40px;
            width: 120px;
            height: 120px;
            background: rgba(255,255,255,0.08);
            border-radius: 50%;
          }
          .standee-header::after {
            content: '';
            position: absolute;
            bottom: -30px;
            left: -20px;
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.06);
            border-radius: 50%;
          }
          .logo-area {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 8px;
          }
          .logo-icon {
            width: 56px;
            height: 56px;
            background: white;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 900;
            color: #16a34a;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .logo-text {
            font-size: 36px;
            font-weight: 900;
            color: white;
            letter-spacing: -1px;
          }
          .logo-text span { color: #bbf7d0; }
          .store-name {
            font-size: 14px;
            font-weight: 600;
            color: rgba(255,255,255,0.9);
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-top: 6px;
          }
          .qr-section {
            padding: 24px 28px;
            text-align: center;
          }
          .qr-frame {
            display: inline-block;
            padding: 16px;
            background: white;
            border: 3px solid #16a34a;
            border-radius: 20px;
            position: relative;
            box-shadow: 0 8px 24px rgba(22,163,74,0.12);
          }
          .qr-frame img {
            width: 200px;
            height: 200px;
            display: block;
          }
          .qr-corner {
            position: absolute;
            width: 20px;
            height: 20px;
          }
          .qr-corner.tl { top: -3px; left: -3px; border-top: 4px solid #15803d; border-left: 4px solid #15803d; border-radius: 8px 0 0 0; }
          .qr-corner.tr { top: -3px; right: -3px; border-top: 4px solid #15803d; border-right: 4px solid #15803d; border-radius: 0 8px 0 0; }
          .qr-corner.bl { bottom: -3px; left: -3px; border-bottom: 4px solid #15803d; border-left: 4px solid #15803d; border-radius: 0 0 0 8px; }
          .qr-corner.br { bottom: -3px; right: -3px; border-bottom: 4px solid #15803d; border-right: 4px solid #15803d; border-radius: 0 0 8px 0; }
          .scan-section {
            padding: 0 28px 20px;
            text-align: center;
          }
          .scan-title {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg, #16a34a, #15803d);
            color: white;
            padding: 12px 28px;
            border-radius: 16px;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 0.5px;
            box-shadow: 0 6px 20px rgba(22,163,74,0.25);
          }
          .scan-subtitle {
            font-size: 14px;
            color: #6b7280;
            margin-top: 10px;
            font-weight: 500;
            letter-spacing: 1px;
          }
          .scan-subtitle span { color: #16a34a; font-weight: 700; }
          .instructions {
            display: flex;
            justify-content: center;
            gap: 12px;
            padding: 16px 20px;
            margin: 0 20px;
            background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
            border-radius: 16px;
          }
          .step {
            flex: 1;
            text-align: center;
          }
          .step-icon {
            width: 44px;
            height: 44px;
            background: #16a34a;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 8px;
            color: white;
            font-size: 18px;
          }
          .step-text {
            font-size: 10px;
            font-weight: 600;
            color: #374151;
            line-height: 1.3;
          }
          .step-arrow {
            display: flex;
            align-items: center;
            color: #16a34a;
            font-size: 18px;
            font-weight: 700;
            padding-top: 4px;
          }
          .footer {
            text-align: center;
            padding: 16px 28px 24px;
            border-top: 1px solid #f3f4f6;
          }
          .footer-text {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
          }
          .footer-sub {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 2px;
          }
          .base {
            height: 16px;
            background: linear-gradient(135deg, #16a34a, #15803d);
            border-radius: 0 0 32px 32px;
          }
          @media print {
            body { background: white; }
            .standee-print { box-shadow: none; border: 2px solid #e5e7eb; }
          }
        </style>
      </head>
      <body>
        <div class="standee-print">
          <div class="standee-header">
            <div class="logo-area">
              <div class="logo-icon">G</div>
              <div class="logo-text">Groc<span>Go</span></div>
            </div>
            <div class="store-name">${store?.name || '{STORE NAME}'}</div>
          </div>
          <div class="qr-section">
            <div class="qr-frame">
              <div class="qr-corner tl"></div>
              <div class="qr-corner tr"></div>
              <div class="qr-corner bl"></div>
              <div class="qr-corner br"></div>
              <img src="${qrData?.qrCode || ''}" alt="Store QR Code" />
            </div>
          </div>
          <div class="scan-section">
            <div class="scan-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
              Scan to Order
            </div>
            <div class="scan-subtitle">Fast <span>•</span> Easy <span>•</span> Contactless</div>
          </div>
          <div class="instructions">
            <div class="step">
              <div class="step-icon">📷</div>
              <div class="step-text">Open Camera<br/>or QR Scanner</div>
            </div>
            <div class="step-arrow">→</div>
            <div class="step">
              <div class="step-icon">📱</div>
              <div class="step-text">Scan<br/>QR Code</div>
            </div>
            <div class="step-arrow">→</div>
            <div class="step">
              <div class="step-icon">🛒</div>
              <div class="step-text">Start<br/>Ordering</div>
            </div>
          </div>
          <div class="footer">
            <div class="footer-text">Thank You! Happy Shopping! 😊</div>
          </div>
          <div class="base"></div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleDownload = async () => {
    if (!standeeRef.current) return;

    try {
      // Use html2canvas approach - create a canvas from the standee
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(standeeRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      } as any);
      const link = document.createElement('a');
      link.download = `grocgo-standee-${store?.slug || 'store'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Standee downloaded!');
    } catch {
      // Fallback to print
      toast('Using print dialog for download...', { icon: 'ℹ️' });
      handlePrint();
    }
  };

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

  return (
    <div className="pb-safe">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push('/dashboard/qr')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
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
        {/* Standee Preview */}
        <div className="flex-1 flex justify-center">
          <div
            ref={standeeRef}
            className="w-[380px] bg-white rounded-[32px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.12)] relative"
            style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
          >
            {/* Green Header */}
            <div className="bg-gradient-to-br from-grocgo-500 via-grocgo-600 to-emerald-700 px-7 pt-8 pb-5 text-center relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -bottom-8 -left-5 w-24 h-24 bg-white/5 rounded-full" />

              {/* Logo */}
              <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-black text-grocgo-600">G</span>
                </div>
                <span className="text-[40px] font-black text-white tracking-tight" style={{ lineHeight: 1 }}>
                  Groc<span className="text-green-200">Go</span>
                </span>
              </div>

              {/* Store Name */}
              <div className="relative z-10 mt-2">
                <p className="text-sm font-semibold text-white/90 tracking-[4px] uppercase">
                  {store?.name || '{STORE NAME}'}
                </p>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="px-7 py-6 text-center">
              <div className="inline-block p-4 bg-white border-[3px] border-grocgo-500 rounded-[20px] relative shadow-[0_8px_24px_rgba(22,163,74,0.12)]">
                {/* Corner accents */}
                <div className="absolute -top-[3px] -left-[3px] w-5 h-5 border-t-4 border-l-4 border-grocgo-700 rounded-tl-lg" />
                <div className="absolute -top-[3px] -right-[3px] w-5 h-5 border-t-4 border-r-4 border-grocgo-700 rounded-tr-lg" />
                <div className="absolute -bottom-[3px] -left-[3px] w-5 h-5 border-b-4 border-l-4 border-grocgo-700 rounded-bl-lg" />
                <div className="absolute -bottom-[3px] -right-[3px] w-5 h-5 border-b-4 border-r-4 border-grocgo-700 rounded-br-lg" />

                {qrData ? (
                  <img src={qrData.qrCode} alt="Store QR Code" className="w-[200px] h-[200px]" />
                ) : (
                  <div className="w-[200px] h-[200px] bg-gray-50 rounded-xl flex flex-col items-center justify-center gap-3">
                    <QrCode className="w-12 h-12 text-gray-300" />
                    <p className="text-xs text-gray-400">No QR generated yet</p>
                    <button
                      onClick={generateQR}
                      disabled={generating}
                      className="bg-grocgo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-grocgo-700 transition-all disabled:opacity-50"
                    >
                      {generating ? 'Generating...' : 'Generate QR'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Scan to Order */}
            <div className="px-7 pb-4 text-center">
              <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-grocgo-500 to-grocgo-600 text-white px-7 py-3 rounded-2xl shadow-[0_6px_20px_rgba(22,163,74,0.25)]">
                <ScanLine className="w-6 h-6" />
                <span className="text-[22px] font-extrabold tracking-wide">Scan to Order</span>
              </div>
              <p className="text-sm text-gray-500 mt-3 font-medium tracking-wider">
                Fast <span className="text-grocgo-500 font-bold">•</span> Easy <span className="text-grocgo-500 font-bold">•</span> Contactless
              </p>
            </div>

            {/* Instructions */}
            <div className="px-5 pb-5">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl px-5 py-4 flex items-center justify-center gap-3">
                <div className="flex-1 text-center">
                  <div className="w-11 h-11 bg-grocgo-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 leading-tight">Open Camera<br/>or QR Scanner</p>
                </div>
                <div className="text-grocgo-500 font-bold text-lg">→</div>
                <div className="flex-1 text-center">
                  <div className="w-11 h-11 bg-grocgo-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 leading-tight">Scan<br/>QR Code</p>
                </div>
                <div className="text-grocgo-500 font-bold text-lg">→</div>
                <div className="flex-1 text-center">
                  <div className="w-11 h-11 bg-grocgo-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 leading-tight">Start<br/>Ordering</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-gray-100 text-center">
              <p className="text-base font-bold text-gray-800">Thank You! Happy Shopping! 😊</p>
            </div>

            {/* Green Base */}
            <div className="h-4 bg-gradient-to-r from-grocgo-500 via-grocgo-600 to-emerald-600 rounded-b-[32px]" />
          </div>
        </div>

        {/* Controls Panel */}
        <div className="lg:w-72 space-y-4">
          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-semibold text-sm text-gray-900">Download & Print</h3>

            {!qrData && (
              <button
                onClick={generateQR}
                disabled={generating}
                className="w-full bg-grocgo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-grocgo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                ) : (
                  <><QrCode className="w-5 h-5" /> Generate QR Code</>
                )}
              </button>
            )}

            {qrData && (
              <>
                <button
                  onClick={handleDownload}
                  className="w-full bg-grocgo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-grocgo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download as Image
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Standee
                </button>
              </>
            )}
          </div>

          {/* Store Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Store Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-grocgo-500 rounded-full" />
                <span className="font-medium">{store?.name || 'No store'}</span>
              </div>
              {qrData && (
                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                  <CheckCircle className="w-3.5 h-3.5 text-grocgo-500" />
                  <span className="truncate">{qrData.url}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Placement Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-grocgo-500 mt-0.5">•</span>
                Store entrance / door
              </li>
              <li className="flex items-start gap-2">
                <span className="text-grocgo-500 mt-0.5">•</span>
                Billing counter
              </li>
              <li className="flex items-start gap-2">
                <span className="text-grocgo-500 mt-0.5">•</span>
                Store window display
              </li>
              <li className="flex items-start gap-2">
                <span className="text-grocgo-500 mt-0.5">•</span>
                Shopping cart / basket
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
