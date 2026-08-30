'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { qrAPI, storeAPI } from '@/lib/api';
import GrocGoLogo from '@/components/Logo';
import Link from 'next/link';
import { 
  QrCode, Download, Share2, Copy, Check, DoorOpen, 
  CreditCard, Monitor, CreditCard as Card, FileText,
  Lightbulb, Store, LayoutTemplate
} from 'lucide-react';

export default function QRPage() {
  const [qrData, setQrData] = useState<{ qrCode: string; url: string; slug: string } | null>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadQR(); }, []);

  const loadQR = async () => {
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

  const downloadQR = () => {
    if (!qrData) return;
    const link = document.createElement('a');
    link.href = qrData.qrCode;
    link.download = `grocgo-qr-${qrData.slug}.png`;
    link.click();
    toast.success('QR code downloaded!');
  };

  const shareQR = useCallback(async () => {
    if (!qrData) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${store?.name} — GrocGo`,
          text: `Order groceries from ${store?.name} using GrocGo!`,
          url: qrData.url,
        });
      } catch {}
    } else {
      copyLink();
    }
  }, [qrData, store]);

  const copyLink = useCallback(() => {
    if (!qrData) return;
    navigator.clipboard.writeText(qrData.url).then(() => {
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  }, [qrData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
          <div className="w-48 h-48 bg-gray-200 rounded-2xl mx-auto mb-6" />
          <div className="h-5 bg-gray-200 rounded w-1/3 mx-auto mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto mb-6" />
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const placements = [
    { icon: DoorOpen, text: 'At the store entrance' },
    { icon: CreditCard, text: 'Near the billing counter' },
    { icon: Monitor, text: 'On the store window' },
    { icon: Card, text: 'On printed shopping cards' },
    { icon: FileText, text: 'On customer receipts' },
  ];

  return (
    <div className="pb-safe">
      <h1 className="text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2">
        <QrCode className="w-6 h-6 text-grocgo-600" />
        Store QR Code
      </h1>

      <div className="max-w-lg">
        {qrData ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* QR display */}
            <div className="px-6 pt-8 pb-6 text-center">
              <div className="relative inline-block">
                <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                  <img src={qrData.qrCode} alt="Store QR Code" className="w-48 h-48 sm:w-56 sm:h-56" />
                </div>
                {/* Corner accents */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-grocgo-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-grocgo-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-grocgo-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-grocgo-500 rounded-br-lg" />
              </div>

              <h2 className="text-lg font-bold mt-5 flex items-center justify-center gap-2">
                <Store className="w-5 h-5 text-grocgo-600" />
                {store?.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Customers scan this to start ordering</p>
            </div>

            {/* URL display */}
            <div className="mx-5 mb-5">
              <div className="bg-gray-50 rounded-xl p-3.5 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Ordering URL</p>
                  <p className="text-xs font-mono text-gray-600 truncate">{qrData.url}</p>
                </div>
                <button
                  onClick={copyLink}
                  className="shrink-0 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 active:scale-[0.97] transition-all flex items-center gap-1"
                >
                  {copied ? <><Check className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-5 pb-6 space-y-2.5">
              <Link
                href="/dashboard/qr/standee"
                className="w-full bg-grocgo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-grocgo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <LayoutTemplate className="w-5 h-5" />
                View Standee Design
              </Link>
              <button
                onClick={downloadQR}
                className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download QR Only
              </button>
              <div className="flex gap-2.5">
                <button
                  onClick={shareQR}
                  className="flex-1 bg-green-50 text-green-700 py-3 rounded-xl font-semibold text-sm hover:bg-green-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                  onClick={copyLink}
                  className="flex-1 border border-gray-200 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {copied ? <><Check className="w-4 h-4 text-green-500" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-grocgo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-10 h-10 text-grocgo-600" />
            </div>
            <h2 className="text-lg font-bold mb-2">No QR Code Yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Generate a QR code for your store so customers can scan and start ordering.
            </p>
            <button
              onClick={generateQR}
              disabled={generating}
              className="bg-grocgo-600 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-grocgo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
            >
              {generating ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : (
                <><QrCode className="w-5 h-5" /> Generate QR Code</>
              )}
            </button>
          </div>
        )}

        {/* Placement tips */}
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Where to place your QR code
            </h3>
          </div>
          <div className="p-4 space-y-1">
            {placements.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.text} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{p.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
