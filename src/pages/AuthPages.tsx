import React, { useState } from 'react';
import { useRouter, Link } from '../lib/navigation';
import { useAuth } from '../lib/authContext';
import { Storage } from '../lib/storage';
import { sendWelcomeAccountEmail, EmailLog } from '../lib/emailService';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, Mail, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    const success = login(email.trim(), password);
    if (success) {
      confetti({ particleCount: 50, spread: 60 });
      const active = Storage.getActiveUser();
      if (active?.role === 'SELLER') router.push('/seller/dashboard');
      else if (active?.role === 'ADMIN') router.push('/admin/dashboard');
      else router.push('/customer/dashboard/bookings');
      return;
    }

    setError('Incorrect email or password. Please use your valid HomeBiz account credentials.');
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
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="name@domain.com"
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Sign In</span>
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
  const [accountType, setAccountType] = useState<'CUSTOMER' | 'SELLER'>('CUSTOMER');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please enter the same password twice.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = Storage.getUsers().find((user) => user.email.toLowerCase() === normalizedEmail);
    if (existing) {
      setError('This email is already registered. Please sign in with your existing account.');
      return;
    }

    try {
      const createdUser = register(name.trim(), normalizedEmail, password, accountType, city, accountType === 'SELLER' ? businessName.trim() : undefined);

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
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-[#e3e2e1] shadow-md space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
            Join Pakistan's Home Community
          </span>
          <h1 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
            Create an Account
          </h1>
          <p className="text-xs text-[#665d55]">Start ordering or selling from home</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Account Type Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#faf9f8] rounded-2xl border border-[#e3e2e1]">
          <button
            type="button"
            onClick={() => setAccountType('CUSTOMER')}
            className={`py-2 text-xs font-bold rounded-xl transition-colors ${accountType === 'CUSTOMER'
              ? 'bg-[#003527] text-white shadow-xs'
              : 'text-[#665d55] hover:text-[#1a1c1c]'
              }`}
          >
            I want to Order
          </button>
          <button
            type="button"
            onClick={() => setAccountType('SELLER')}
            className={`py-2 text-xs font-bold rounded-xl transition-colors ${accountType === 'SELLER'
              ? 'bg-[#003527] text-white shadow-xs'
              : 'text-[#665d55] hover:text-[#1a1c1c]'
              }`}
          >
            I want to Sell
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fatima Ali"
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="fatima@example.com"
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
          </div>

          {accountType === 'SELLER' && (
            <div>
              <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                Business Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Fatima's Cake Studio"
                className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none font-medium"
            >
              <option value="Lahore">Lahore</option>
              <option value="Karachi">Karachi</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Rawalpindi">Rawalpindi</option>
              <option value="Faisalabad">Faisalabad</option>
              <option value="Multan">Multan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              WhatsApp / Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0300 1234567"
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="••••••••"
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              placeholder="Repeat password"
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Create {accountType === 'SELLER' ? 'Seller Account' : 'Customer Account'}</span>
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
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="space-y-4 text-left"
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
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-full bg-[#003527] text-white font-bold text-xs shadow-md hover:bg-[#064e3b]"
            >
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
