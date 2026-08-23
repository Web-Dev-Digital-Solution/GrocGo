'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import GrocGoLogo from '@/components/Logo';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    storeName: '', storeAddress: '', storeCity: '', storeState: '', storePincode: '', storePhone: '',
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      setAuth(data.user, data.store, data.token);
      toast.success('Store created! Welcome to GrocGo!');
      router.push('/onboarding');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-safe">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center mb-3">
              <GrocGoLogo size={40} showText={true} />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Create Your Store</h1>
            <p className="text-gray-400 text-sm mt-1">Set up in under 2 minutes</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <StepDot num={1} active={step >= 1} label="You" />
            <div className={`w-12 h-0.5 rounded ${step >= 2 ? 'bg-grocgo-500' : 'bg-gray-200'}`} />
            <StepDot num={2} active={step >= 2} label="Store" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            {step === 1 && (
              <>
                <SectionTitle icon="👤" title="Your Information" />

                <Field label="Full Name" required placeholder="Rajesh Sharma" value={form.name} onChange={(v) => update('name', v)} />
                <Field label="Email" required type="email" placeholder="you@store.com" value={form.email} onChange={(v) => update('email', v)} autoComplete="email" />
                <Field label="Password" required type="password" placeholder="Min 6 characters" value={form.password} onChange={(v) => update('password', v)} minLength={6} autoComplete="new-password" />
                <Field label="Phone Number" required type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(v) => update('phone', v)} inputMode="tel" autoComplete="tel" />

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-grocgo-600 text-white py-3.5 rounded-xl font-semibold text-sm press-effect"
                >
                  Next: Store Details →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <SectionTitle icon="🏪" title="Store Information" />

                <Field label="Store Name" required placeholder="Sharma Kirana Store" value={form.storeName} onChange={(v) => update('storeName', v)} />
                <Field label="Store Address" required placeholder="123 Main Road, Near Bus Stand" value={form.storeAddress} onChange={(v) => update('storeAddress', v)} />

                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" required placeholder="Jaipur" value={form.storeCity} onChange={(v) => update('storeCity', v)} />
                  <Field label="State" required placeholder="Rajasthan" value={form.storeState} onChange={(v) => update('storeState', v)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Pincode" required placeholder="302001" value={form.storePincode} onChange={(v) => update('storePincode', v)} inputMode="numeric" />
                  <Field label="Store Phone" required type="tel" placeholder="+91 98765 43210" value={form.storePhone} onChange={(v) => update('storePhone', v)} inputMode="tel" />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl font-semibold text-sm press-effect"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-grocgo-600 text-white py-3.5 rounded-xl font-semibold text-sm press-effect disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Creating...
                      </>
                    ) : (
                      'Create Store →'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="text-center mt-6 text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-grocgo-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Small components ──────────────────────────────────────
function StepDot({ num, active, label }: { num: number; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
        active ? 'bg-grocgo-600 text-white' : 'bg-gray-200 text-gray-400'
      }`}>
        {num}
      </div>
      <span className={`text-xs font-medium hidden sm:inline ${active ? 'text-gray-900' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <h2 className="font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

function Field({
  label, required, type = 'text', placeholder, value, onChange, minLength, autoComplete, inputMode,
}: {
  label: string; required?: boolean; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; minLength?: number; autoComplete?: string; inputMode?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        inputMode={inputMode as any}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-grocgo-500 focus:border-transparent outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
