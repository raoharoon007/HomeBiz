import React, { useState } from 'react';
import { useRouter, Link, useSearchParams } from '../lib/navigation';
import { useAuth } from '../lib/authContext';
import { Storage, useStorageSubscription } from '../lib/storage';
import { sendWelcomeAccountEmail, EmailLog } from '../lib/emailService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { validateForm, loginSchema, registerSchema, forgotPasswordSchema } from '../lib/validationSchemas';

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Yup validation
    const { isValid, errors } = await validateForm(loginSchema, {
      email,
      password,
    });

    if (!isValid) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setLoading(true);

    try {
      const success = await login(email.trim(), password);
      if (success) {
        confetti({ particleCount: 50, spread: 60 });
        const redirect = searchParams.get('redirect');
        if (redirect?.startsWith('/') && !redirect.startsWith('//')) {
          router.push(redirect);
          return;
        }

        const active = Storage.getActiveUser();
        if (active?.role === 'SELLER') router.push('/seller/dashboard');
        else if (active?.role === 'ADMIN') router.push('/admin/dashboard');
        else router.push('/customer/dashboard/bookings');
        return;
      }

      setError('Incorrect email or password. Please use your valid HomeBiz account credentials.');
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-[#e3e2e1] shadow-md space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
            Welcome Back
          </span>
          <h1 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
            Sign In to HomeBiz
          </h1>
          <p className="text-xs text-[#665d55]">Manage your orders, quotes, and messages</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
                if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder="name@domain.com"
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                fieldErrors.email
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-[11px] text-[#003527] hover:underline font-semibold">
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
              }}
              placeholder="••••••••"
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                fieldErrors.password
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 text-[#ffe088]" />
          </button>
        </form>

        <div className="text-center text-xs text-[#665d55]">
          Don't have an account?{' '}
          <Link href="/auth/register" className="font-bold text-[#003527] hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  useStorageSubscription();
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lahore');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<'CUSTOMER' | 'SELLER'>('CUSTOMER');
  const cities = Storage.getCities();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Yup validation
    const { isValid, errors } = await validateForm(registerSchema, {
      name,
      email,
      phone,
      password,
      confirmPassword,
      role: accountType,
      city,
      businessName,
    });

    if (!isValid) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const normalizedEmail = email.trim().toLowerCase();
    const existing = Storage.getUsers().find((user) => user.email.toLowerCase() === normalizedEmail);
    if (existing) {
      setError('This email is already registered. Please sign in with your existing account.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const createdUser = await register(name.trim(), normalizedEmail, password, accountType, city, accountType === 'SELLER' ? businessName.trim() : undefined);

      if (phone && createdUser) {
        createdUser.phone = phone;
        Storage.saveUser(createdUser);
      }

      if (createdUser) {
        sendWelcomeAccountEmail(createdUser);
      }

      confetti({ particleCount: 80, spread: 70 });
      if (accountType === 'SELLER') {
        router.push('/seller/dashboard');
      } else {
        router.push('/customer/dashboard/bookings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-[#e3e2e1] shadow-md space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
            Join Our Home Community - Pakistan & Australia
          </span>
          <h1 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
            Create an Account
          </h1>
          <p className="text-xs text-[#665d55]">Start ordering or selling from home</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Account Type Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#faf9f8] rounded-2xl border border-[#e3e2e1]">
          <button
            type="button"
            onClick={() => {
              setAccountType('CUSTOMER');
              setFieldErrors({});
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-colors ${accountType === 'CUSTOMER'
              ? 'bg-[#003527] text-white shadow-xs'
              : 'text-[#665d55] hover:text-[#1a1c1c]'
              }`}
          >
            I want to Order
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountType('SELLER');
              setFieldErrors({});
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-colors ${accountType === 'SELLER'
              ? 'bg-[#003527] text-white shadow-xs'
              : 'text-[#665d55] hover:text-[#1a1c1c]'
              }`}
          >
            I want to Sell
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Fatima Ali"
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                fieldErrors.name
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder="fatima@example.com"
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                fieldErrors.email
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          {accountType === 'SELLER' && (
            <div>
              <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  if (fieldErrors.businessName) setFieldErrors(prev => ({ ...prev, businessName: '' }));
                }}
                placeholder="e.g. Fatima's Cake Studio"
                className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                  fieldErrors.businessName
                    ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                    : 'border-[#e3e2e1] focus:border-[#003527]'
                }`}
              />
              {fieldErrors.businessName && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.businessName}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              City
            </label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (fieldErrors.city) setFieldErrors(prev => ({ ...prev, city: '' }));
              }}
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none font-medium transition-colors ${
                fieldErrors.city
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            >
              {cities.map((cityOption) => (
                <option key={cityOption.id} value={cityOption.name}>
                  {cityOption.name} ({cityOption.province})
                </option>
              ))}
            </select>
            {fieldErrors.city && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.city}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              WhatsApp / Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
              }}
              placeholder="0300 1234567"
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                fieldErrors.phone
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
              }}
              placeholder="••••••••"
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                fieldErrors.password
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
                if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
              placeholder="Repeat password"
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                fieldErrors.confirmPassword
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Creating account...' : `Create ${accountType === 'SELLER' ? 'Seller Account' : 'Customer Account'}`}</span>
            <ArrowRight className="w-4 h-4 text-[#ffe088]" />
          </button>
        </form>

        <div className="text-center text-xs text-[#665d55]">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold text-[#003527] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Yup validation
    const { isValid, errors } = await validateForm(forgotPasswordSchema, { email });
    if (!isValid) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    if (isSupabaseConfigured && email) {
      const siteRedirectUrl = typeof window !== 'undefined' && window.location.origin
        ? `${window.location.origin}/auth/login`
        : 'https://home-biz-jade.vercel.app/auth/login';
      try {
        await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: siteRedirectUrl,
        });
      } catch (err) {
        console.warn('Password reset error:', err);
      }
    }
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-[#e3e2e1] shadow-md space-y-6 text-center">
        {sent ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#b0f0d6] text-[#003527] mx-auto flex items-center justify-center font-bold text-lg">
              ✓
            </div>
            <h2 className="text-lg font-bold text-[#1a1c1c]">Reset Link Dispatched</h2>
            <p className="text-xs text-[#665d55]">
              We have sent password reset instructions to <strong>{email}</strong>.
            </p>
            <Link href="/auth/login" className="inline-block pt-2 text-xs font-bold text-[#003527] hover:underline">
              Return to Login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleForgotPassword}
            className="space-y-4 text-left"
            noValidate
          >
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                Reset Password
              </h1>
              <p className="text-xs text-[#665d55]">Enter your registered email to receive a recovery link.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="name@example.com"
                className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                  fieldErrors.email
                    ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                    : 'border-[#e3e2e1] focus:border-[#003527]'
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-full bg-[#003527] text-white font-bold text-xs shadow-md hover:bg-[#064e3b] disabled:opacity-50"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
