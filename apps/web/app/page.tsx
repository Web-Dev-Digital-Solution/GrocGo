'use client';

import Link from 'next/link';
import { 
  ScanLine, ClipboardList, Zap, MessageCircle, 
  CalendarClock, FileText, Store, ShoppingCart, 
  CheckCircle2, ArrowRight, ChevronDown, Receipt,
  Users, BarChart3, QrCode, Bell, BellRing, Smartphone,
  Check, Package
} from 'lucide-react';
import GrocGoLogo from '@/components/Logo';

const features = [
  { icon: ScanLine, title: 'QR Code Ordering', description: 'Scan a QR code at the store and create your grocery list in minutes.', color: 'bg-blue-50 text-blue-600' },
  { icon: ClipboardList, title: 'Multiple List Options', description: 'Type, paste, upload a photo, or browse products — however you prefer.', color: 'bg-purple-50 text-purple-600' },
  { icon: Zap, title: 'No More Waiting', description: 'Submit your order digitally while the store prepares your groceries.', color: 'bg-amber-50 text-amber-600' },
  { icon: MessageCircle, title: 'WhatsApp Alerts', description: 'Get notified when your order is ready for pickup.', color: 'bg-green-50 text-green-600' },
  { icon: CalendarClock, title: 'Monthly Reminders', description: 'Never forget your monthly groceries with automated reminders.', color: 'bg-cyan-50 text-cyan-600' },
  { icon: FileText, title: 'Digital Invoices', description: 'Receive instant invoices — printable, downloadable, shareable.', color: 'bg-rose-50 text-rose-600' },
];

const steps = [
  { num: '1', title: 'Scan QR', desc: 'Scan the GrocGo QR at the store', icon: QrCode },
  { num: '2', title: 'Create List', desc: 'Browse, type, or upload your list', icon: ClipboardList },
  { num: '3', title: 'Store Prepares', desc: 'Employees collect your groceries', icon: ShoppingCart },
  { num: '4', title: 'Get Notified', desc: 'WhatsApp when ready for pickup', icon: Bell },
  { num: '5', title: 'Pick Up', desc: 'Collect groceries and go!', icon: CheckCircle2 },
];

const shopkeeperFeatures = [
  'Professional dashboard for all orders',
  'Product catalog with categories & pricing',
  'Customer database with purchase history',
  'One-click WhatsApp notifications',
  'Digital invoice generation & PDF download',
  'Sales reports and business analytics',
  'QR code generated automatically',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── NAV ─────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-18">
            <Link href="/" className="flex items-center gap-2.5">
              <GrocGoLogo size={36} showText={true} />
            </Link>
            <div className="flex items-center gap-3">
              <Link 
                href="/login" 
                className="text-gray-600 hover:text-gray-900 font-medium text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-grocgo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-grocgo-700 active:scale-[0.98] transition-all shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-white to-green-50/60 -z-10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-grocgo-100/40 to-transparent rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-grocgo-50 text-grocgo-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-grocgo-100">
                <Zap className="w-4 h-4" />
                Built for local grocery stores
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-[1.08] tracking-tight">
                Skip the queue.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-grocgo-600 to-emerald-500">
                  Scan, order, pick up.
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-gray-500 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                GrocGo turns your grocery store into a fast, digital pickup machine. Customers scan a QR code, submit their list, and collect prepared groceries — no more waiting in line.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3">
                <Link
                  href="/register"
                  className="w-full sm:w-auto bg-grocgo-600 text-white px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-grocgo-700 active:scale-[0.98] transition-all shadow-lg shadow-grocgo-600/20 flex items-center justify-center gap-2"
                >
                  Start free for your store
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto border border-gray-200 text-gray-700 hover:bg-gray-50 px-7 py-3.5 rounded-xl font-semibold text-sm text-center flex items-center justify-center gap-1 transition-all"
                >
                  See how it works
                </a>
              </div>

              {/* Feature badges */}
              <div className="flex items-center justify-center lg:justify-start gap-5 mt-8">
                {[
                  { icon: Smartphone, text: 'No app install' },
                  { icon: MessageCircle, text: 'WhatsApp updates' },
                  { icon: FileText, text: 'Digital invoices' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <div className="w-4 h-4 rounded-full bg-grocgo-100 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-grocgo-600" />
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Order Card Mockup */}
            <div className="relative hidden lg:block">
              {/* Main order card */}
              <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-6 max-w-sm ml-auto relative z-10">
                {/* Store header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-grocgo-100 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5 text-grocgo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Sharma Kirana Store</p>
                    <p className="text-xs text-gray-400">GrocGo Order #GG482910</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3 mb-5">
                  {[
                    { name: 'Basmati Rice', qty: '10 kg', price: '₹1,200' },
                    { name: 'Toor Dal', qty: '2 kg', price: '₹280' },
                    { name: 'Sunflower Oil', qty: '2 litre', price: '₹280' },
                    { name: 'Tata Tea Gold', qty: '1 packet', price: '₹130' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                      <span className="text-sm text-gray-400 tabular-nums">{item.qty}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="text-xl font-bold text-gray-900 tabular-nums">₹1,890</span>
                </div>
              </div>

              {/* WhatsApp notification popup */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl shadow-gray-200/80 border border-gray-100 px-4 py-3 flex items-center gap-3 z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <BellRing className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Order ready!</p>
                  <p className="text-[10px] text-gray-400">via WhatsApp</p>
                </div>
              </div>

              {/* QR scan popup */}
              <div className="absolute -bottom-3 -left-6 bg-white rounded-2xl shadow-xl shadow-gray-200/80 border border-gray-100 px-4 py-3 flex items-center gap-3 z-20">
                <div className="w-9 h-9 bg-grocgo-100 rounded-xl flex items-center justify-center">
                  <QrCode className="w-4.5 h-4.5 text-grocgo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Scan to order</p>
                  <p className="text-[10px] text-gray-400">No app needed</p>
                </div>
              </div>

              {/* Decorative dots */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80">
                <div className="absolute inset-0 bg-gradient-to-br from-grocgo-200/20 to-emerald-200/20 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="max-w-4xl mx-auto mt-16 sm:mt-20">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-5 grid grid-cols-3 gap-8">
            {[
              { value: '3x', label: 'Faster ordering' },
              { value: '60%', label: 'Less waiting' },
              { value: '100%', label: 'Digital invoices' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 bg-gray-50/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything Your Store Needs
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A complete digital ordering system for local grocery stores.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How GrocGo Works</h2>
            <p className="text-lg text-gray-500">Simple for customers. Efficient for shopkeepers.</p>
          </div>

          {/* Mobile: vertical timeline */}
          <div className="sm:hidden space-y-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-grocgo-100 text-grocgo-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.desc}</p>
                  </div>
                  <span className="text-gray-200 text-2xl font-bold flex-shrink-0">{step.num}</span>
                </div>
              );
            })}
          </div>

          {/* Desktop: horizontal steps */}
          <div className="hidden sm:grid sm:grid-cols-5 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="text-center relative">
                  {idx < steps.length - 1 && (
                    <div className="absolute top-7 left-[60%] w-[80%] h-0.5 bg-grocgo-200" />
                  )}
                  <div className="w-14 h-14 bg-grocgo-100 text-grocgo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FOR SHOPKEEPERS ──────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 bg-gradient-to-br from-grocgo-600 to-grocgo-700 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Store className="w-4 h-4" />
                For Shopkeepers
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Built for Shopkeepers</h2>
              <ul className="space-y-4 text-lg">
                {shopkeeperFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-grocgo-200 mt-0.5 flex-shrink-0" />
                    <span className="text-grocgo-50">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 rounded-3xl p-8 backdrop-blur-sm border border-white/20">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Store className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Start in 5 Minutes</h3>
                <p className="text-grocgo-100 mb-8 leading-relaxed">
                  Sign up, add your products, and start accepting digital orders.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-white text-grocgo-700 px-8 py-4 rounded-xl font-semibold active:scale-[0.98] transition-all w-full justify-center text-base"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <footer className="py-12 px-4 border-t bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <GrocGoLogo size={28} showText={true} />
          </div>
          <p className="text-gray-400 text-sm mb-6">
            © 2026 GrocGo. Digitizing local grocery stores.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <Link href="/login" className="hover:text-gray-900 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-gray-900 transition-colors">Register</Link>
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
