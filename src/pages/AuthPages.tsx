import React, { useState } from 'react';
import { useRouter, Link, useSearchParams } from '../lib/navigation';
import { useAuth } from '../lib/authContext';
import { Storage, useStorageSubscription } from '../lib/storage';
import { sendWelcomeAccountEmail, sendOtpVerificationEmail, markOtpVerifiedInSupabase, EmailLog } from '../lib/emailService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, Mail, CheckCircle, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import { validateForm, loginSchema, registerSchema, forgotPasswordSchema, otpSchema } from '../lib/validationSchemas';
import { OtpVerification } from '../components/auth/OtpVerification';
import { isAustralianLocation } from '../lib/countryUtils';
import { SEED_CITIES } from '../data/seedData';

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateLoginField = (field: string, val: string) => {
    switch (field) {
      case 'email': {
        const trimmed = val.trim();
        if (!trimmed) return 'Email is required';
        if (!trimmed.includes('@')) return "Email must include '@' symbol (e.g. name@example.com)";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return 'Please enter a valid email address';
        return '';
      }
      case 'password': {
        if (!val) return 'Password is required';
        if (val.length < 6) return `Password must be at least 6 characters (currently ${val.length}/6)`;
        return '';
      }
      default:
        return '';
    }
  };

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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                setEmail(val);
                setError('');
                const err = validateLoginField('email', val);
                setFieldErrors((prev) => ({ ...prev, email: err }));
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
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.email}</span>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  setError('');
                  const err = validateLoginField('password', val);
                  setFieldErrors((prev) => ({ ...prev, password: err }));
                }}
                placeholder="••••••••"
                className={`w-full text-xs p-3 pr-10 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                  fieldErrors.password
                    ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                    : 'border-[#e3e2e1] focus:border-[#003527]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#665d55] hover:text-[#1a1c1c] transition-colors p-1"
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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

  // Registration Form State
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lahore');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<'CUSTOMER' | 'SELLER'>('CUSTOMER');

  // OTP Verification State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const cities = Storage.getCities();
  const combinedCities = (() => {
    const existingNames = new Set(cities.map((c) => c.name.toLowerCase()));
    const list = [...cities];
    for (const seed of SEED_CITIES) {
      if (!existingNames.has(seed.name.toLowerCase())) {
        list.push(seed);
        existingNames.add(seed.name.toLowerCase());
      }
    }
    return list;
  })();

  const pakistaniCities = combinedCities.filter(
    (c) => !isAustralianLocation(c.name) && !isAustralianLocation(c.province)
  );
  const australianCities = combinedCities.filter(
    (c) => isAustralianLocation(c.name) || isAustralianLocation(c.province)
  );

  const validateRegisterField = (field: string, val: string, currentPassword = password) => {
    switch (field) {
      case 'name': {
        const trimmed = val.trim();
        if (!trimmed) return 'Full name is required';
        if (trimmed.length < 2) return 'Name must be at least 2 characters';
        return '';
      }
      case 'email': {
        const trimmed = val.trim();
        if (!trimmed) return 'Email is required';
        if (!trimmed.includes('@')) return "Email must include '@' symbol (e.g. name@example.com)";
        const parts = trimmed.split('@');
        if (!parts[1] || !parts[1].includes('.')) return "Email must include a valid domain after '@' (e.g. name@domain.com)";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return 'Please enter a valid email address (e.g. name@example.com)';
        return '';
      }
      case 'businessName': {
        const trimmed = val.trim();
        if (accountType === 'SELLER') {
          if (!trimmed) return 'Business / Brand name is required for Sellers';
          if (trimmed.length < 3) return 'Business name must be at least 3 characters';
        }
        return '';
      }
      case 'phone': {
        const digits = val.replace(/\D/g, '');
        if (!val.trim()) return 'WhatsApp / Phone number is required';
        if (digits.length < 10) return `Phone number must be at least 10 digits (currently ${digits.length}/10)`;
        return '';
      }
      case 'password': {
        if (!val) return 'Password is required';
        if (val.length < 8) return `Password must be at least 8 characters (currently ${val.length}/8)`;
        if (!/[A-Z]/.test(val)) return 'Add at least 1 capital letter (A-Z)';
        if (!/[a-z]/.test(val)) return 'Add at least 1 small letter (a-z)';
        if (!/[^A-Za-z0-9]/.test(val)) return 'Add at least 1 special character (!@#$%^&*)';
        return '';
      }
      case 'confirmPassword': {
        if (!val) return 'Please repeat your password';
        if (val !== currentPassword) return 'Passwords do not match with the password above';
        return '';
      }
      default:
        return '';
    }
  };

  const handleInitiateRegister = async (e: React.FormEvent) => {
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
      // Generate secure 4-digit OTP
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setOtpError('');

      // Dispatch real email via EmailJS
      const dispatchResult = await sendOtpVerificationEmail({
        toEmail: normalizedEmail,
        recipientName: name.trim(),
        otp: code,
      });

      if (!dispatchResult.success) {
        setOtpError(`⚠️ Email delivery failed: ${dispatchResult.error || 'EmailJS Template ID not found'}. Check your .env file.`);
      }

      // Transition to OTP verification step
      setStep('OTP');
    } catch (err: any) {
      setError(err?.message || 'Unable to dispatch verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (enteredOtp: string) => {
    setOtpError('');

    // Yup schema validation on 4-digit OTP
    const { isValid, errors } = await validateForm(otpSchema, { otp: enteredOtp });
    if (!isValid) {
      setOtpError(errors.otp || 'Please enter a valid 4-digit numeric code.');
      return;
    }

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setOtpError('Incorrect 4-digit verification code. Please check your email inbox.');
      return;
    }

    setOtpLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const createdUser = await register(
        name.trim(),
        normalizedEmail,
        password,
        accountType,
        city,
        accountType === 'SELLER' ? businessName.trim() : undefined
      );

      if (phone && createdUser) {
        createdUser.phone = phone;
        Storage.saveUser(createdUser);
      }

      if (createdUser) {
        sendWelcomeAccountEmail(createdUser);
      }

      // Mark OTP as verified in real database
      await markOtpVerifiedInSupabase(normalizedEmail, enteredOtp);

      confetti({ particleCount: 90, spread: 70 });
      if (accountType === 'SELLER') {
        router.push('/seller/dashboard');
      } else {
        router.push('/customer/dashboard/bookings');
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Unable to create your account right now.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpError('');
    const res = await sendOtpVerificationEmail({
      toEmail: email.trim().toLowerCase(),
      recipientName: name.trim(),
      otp: code,
    });
    if (!res.success) {
      setOtpError(`⚠️ Resend failed: ${res.error || 'EmailJS Template ID not found'}. Check your .env file.`);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-[#e3e2e1] shadow-md space-y-6">
        {step === 'OTP' ? (
          <OtpVerification
            email={email}
            recipientName={name}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            onChangeEmail={() => setStep('FORM')}
            loading={otpLoading}
            error={otpError}
          />
        ) : (
          <>
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
                className={`py-2 text-xs font-bold rounded-xl transition-colors ${
                  accountType === 'CUSTOMER'
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
                className={`py-2 text-xs font-bold rounded-xl transition-colors ${
                  accountType === 'SELLER'
                    ? 'bg-[#003527] text-white shadow-xs'
                    : 'text-[#665d55] hover:text-[#1a1c1c]'
                }`}
              >
                I want to Sell
              </button>
            </div>

            <form onSubmit={handleInitiateRegister} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    const err = validateRegisterField('name', val);
                    setFieldErrors((prev) => ({ ...prev, name: err }));
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
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    const err = validateRegisterField('email', val);
                    setFieldErrors((prev) => ({ ...prev, email: err }));
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
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {accountType === 'SELLER' && (
                <div>
                  <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    Business / Brand Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBusinessName(val);
                      const err = validateRegisterField('businessName', val);
                      setFieldErrors((prev) => ({ ...prev, businessName: err }));
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
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.businessName}</span>
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  City (Pakistan & Australia)
                </label>
                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: '' }));
                  }}
                  className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none font-medium transition-colors ${
                    fieldErrors.city
                      ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                      : 'border-[#e3e2e1] focus:border-[#003527]'
                  }`}
                >
                  <optgroup label="🇵🇰 Pakistan">
                    {pakistaniCities.map((cityOption) => (
                      <option key={cityOption.id} value={cityOption.name}>
                        {cityOption.name} ({cityOption.province})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🇦🇺 Australia">
                    {australianCities.map((cityOption) => (
                      <option key={cityOption.id} value={cityOption.name}>
                        {cityOption.name} ({cityOption.province})
                      </option>
                    ))}
                  </optgroup>
                </select>
                {fieldErrors.city && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.city}</span>
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
                    const val = e.target.value;
                    setPhone(val);
                    const err = validateRegisterField('phone', val);
                    setFieldErrors((prev) => ({ ...prev, phone: err }));
                  }}
                  placeholder="0300 1234567 or +61 400 123 456"
                  className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                    fieldErrors.phone
                      ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                      : 'border-[#e3e2e1] focus:border-[#003527]'
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.phone}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPassword(val);
                      setError('');
                      const err = validateRegisterField('password', val);
                      setFieldErrors((prev) => {
                        const updated: Record<string, string> = { ...prev, password: err };
                        if (confirmPassword) {
                          updated.confirmPassword = validateRegisterField('confirmPassword', confirmPassword, val);
                        }
                        return updated;
                      });
                    }}
                    placeholder="Min 8 chars (e.g. Secret@123)"
                    className={`w-full text-xs p-3 pr-10 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                      fieldErrors.password
                        ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                        : 'border-[#e3e2e1] focus:border-[#003527]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#665d55] hover:text-[#1a1c1c] transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}

                {/* Real-time Password Security Criteria Checklist */}
                <div className="mt-2 p-2.5 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl space-y-1">
                  <p className="text-[10px] font-bold text-[#665d55] uppercase tracking-wider">
                    Password Requirements:
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span
                      className={`flex items-center gap-1 ${
                        password.length >= 8 ? 'text-emerald-700 font-bold' : 'text-[#665d55]'
                      }`}
                    >
                      <span>{password.length >= 8 ? '✓' : '○'}</span>
                      <span>8+ characters</span>
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        /[A-Z]/.test(password) ? 'text-emerald-700 font-bold' : 'text-[#665d55]'
                      }`}
                    >
                      <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                      <span>1 Capital letter (A-Z)</span>
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        /[a-z]/.test(password) ? 'text-emerald-700 font-bold' : 'text-[#665d55]'
                      }`}
                    >
                      <span>{/[a-z]/.test(password) ? '✓' : '○'}</span>
                      <span>1 Small letter (a-z)</span>
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        /[^A-Za-z0-9]/.test(password) ? 'text-emerald-700 font-bold' : 'text-[#665d55]'
                      }`}
                    >
                      <span>{/[^A-Za-z0-9]/.test(password) ? '✓' : '○'}</span>
                      <span>1 Special character (!@#$)</span>
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfirmPassword(val);
                      setError('');
                      const err = validateRegisterField('confirmPassword', val, password);
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: err }));
                    }}
                    placeholder="Repeat password"
                    className={`w-full text-xs p-3 pr-10 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                      fieldErrors.confirmPassword
                        ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                        : 'border-[#e3e2e1] focus:border-[#003527]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#665d55] hover:text-[#1a1c1c] transition-colors p-1"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.confirmPassword}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>
                  {loading
                    ? 'Sending 4-Digit OTP...'
                    : `Send 4-Digit OTP & Register`}
                </span>
                <ArrowRight className="w-4 h-4 text-[#ffe088]" />
              </button>
            </form>

            <div className="text-center text-xs text-[#665d55]">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-bold text-[#003527] hover:underline">
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS'>('EMAIL');
  const [email, setEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Real-time field validation
  const validateResetField = (field: string, val: string, curPassword = newPassword) => {
    switch (field) {
      case 'email': {
        const trimmed = val.trim();
        if (!trimmed) return 'Email is required';
        if (!trimmed.includes('@')) return "Email must include '@' symbol (e.g. name@example.com)";
        const parts = trimmed.split('@');
        if (!parts[1] || !parts[1].includes('.')) return "Email must include a valid domain (e.g. .com, .pk)";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return 'Please enter a valid email address';
        return '';
      }
      case 'newPassword': {
        if (!val) return 'Password is required';
        if (val.length < 8) return `Password must be at least 8 characters (currently ${val.length}/8)`;
        if (!/[A-Z]/.test(val)) return 'Add at least 1 capital letter (A-Z)';
        if (!/[a-z]/.test(val)) return 'Add at least 1 small letter (a-z)';
        if (!/[^A-Za-z0-9]/.test(val)) return 'Add at least 1 special character (!@#$%^&*)';
        return '';
      }
      case 'confirmNewPassword': {
        if (!val) return 'Please repeat your password';
        if (val !== curPassword) return 'Passwords do not match with the new password above';
        return '';
      }
      default:
        return '';
    }
  };

  // Step 1: Send OTP to User's Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const err = validateResetField('email', normalizedEmail);
    if (err) {
      setFieldErrors({ email: err });
      return;
    }

    // Verify user exists in registered accounts
    const users = Storage.getUsers();
    const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!existingUser) {
      setError('No registered account found with this email address. Please check your email or sign up.');
      return;
    }

    setLoading(true);
    const resolvedName = existingUser.name || normalizedEmail.split('@')[0];
    setRecipientName(resolvedName);

    try {
      // Generate secure 4-digit OTP
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setOtpError('');

      // Dispatch real email via EmailJS (template_991y4lf)
      const res = await sendOtpVerificationEmail({
        toEmail: normalizedEmail,
        recipientName: resolvedName,
        otp: code,
      });

      if (!res.success) {
        setOtpError(`⚠️ Email delivery warning: ${res.error || 'Check EmailJS configuration in .env'}`);
      }

      setStep('OTP');
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 4-Digit OTP
  const handleVerifyOtp = async (enteredOtp: string) => {
    setOtpError('');

    const { isValid, errors } = await validateForm(otpSchema, { otp: enteredOtp });
    if (!isValid) {
      setOtpError(errors.otp || 'Please enter a valid 4-digit numeric code.');
      return;
    }

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setOtpError('Incorrect 4-digit verification code. Please check your email inbox.');
      return;
    }

    setOtpLoading(true);
    try {
      await markOtpVerifiedInSupabase(email.trim().toLowerCase(), enteredOtp);
      setFieldErrors({});
      setError('');
      setStep('NEW_PASSWORD');
    } catch (e) {
      console.warn('Supabase OTP verify note:', e);
      setStep('NEW_PASSWORD');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpError('');
    await sendOtpVerificationEmail({
      toEmail: email.trim().toLowerCase(),
      recipientName,
      otp: code,
    });
  };

  // Step 3: Save New Password & Confirm Password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pwErr = validateResetField('newPassword', newPassword);
    const cpwErr = validateResetField('confirmNewPassword', confirmNewPassword, newPassword);
    if (pwErr || cpwErr) {
      const errs: Record<string, string> = {};
      if (pwErr) errs.newPassword = pwErr;
      if (cpwErr) errs.confirmNewPassword = cpwErr;
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const users = Storage.getUsers();
      const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
      if (userIndex >= 0) {
        users[userIndex].password = newPassword;
        Storage.saveUser(users[userIndex]);
      }

      // If Supabase Auth is enabled, update password in Supabase database
      if (isSupabaseConfigured) {
        try {
          await supabase.rpc('reset_user_password', {
            user_email: normalizedEmail,
            new_password: newPassword,
          });
          await supabase.auth.updateUser({ password: newPassword });
        } catch (e) {
          console.warn('Supabase auth password update notice:', e);
        }
      }

      confetti({ particleCount: 90, spread: 70 });
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-[#e3e2e1] shadow-md space-y-6">
        {/* Step 1: Request Email */}
        {step === 'EMAIL' && (
          <form onSubmit={handleSendOtp} className="space-y-4 text-left" noValidate>
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
                Account Recovery
              </span>
              <h1 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                Reset Password
              </h1>
              <p className="text-xs text-[#665d55]">
                Enter your registered email to receive a 4-digit verification code.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  setError('');
                  const err = validateResetField('email', val);
                  setFieldErrors((prev) => ({ ...prev, email: err }));
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
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-full bg-[#003527] text-white font-bold text-xs shadow-md hover:bg-[#064e3b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending 4-Digit OTP...' : 'Send 4-Digit Verification Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <Link href="/auth/login" className="text-xs font-bold text-[#003527] hover:underline">
                ← Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: 4-Digit OTP Verification */}
        {step === 'OTP' && (
          <div className="space-y-4">
            <div className="text-center space-y-1 mb-2">
              <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
                Step 2 of 3
              </span>
              <h1 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                Verify Your Email
              </h1>
              <p className="text-xs text-[#665d55]">
                Enter the 4-digit code sent to authorize password reset.
              </p>
            </div>

            <OtpVerification
              email={email}
              recipientName={recipientName}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onChangeEmail={() => setStep('EMAIL')}
              loading={otpLoading}
              error={otpError}
            />
          </div>
        )}

        {/* Step 3: Set New Password & Confirm Password */}
        {step === 'NEW_PASSWORD' && (
          <form onSubmit={handleSaveNewPassword} className="space-y-4 text-left" noValidate>
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
                Step 3 of 3
              </span>
              <h1 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                Set New Password
              </h1>
              <p className="text-xs text-[#665d55]">
                Choose a strong new password for <strong>{email}</strong>.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* New Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewPassword(val);
                    setError('');
                    const err = validateResetField('newPassword', val);
                    setFieldErrors((prev) => {
                      const updated: Record<string, string> = { ...prev, newPassword: err };
                      if (confirmNewPassword) {
                        updated.confirmNewPassword = validateResetField('confirmNewPassword', confirmNewPassword, val);
                      }
                      return updated;
                    });
                  }}
                  placeholder="Min 8 chars (e.g. Secret@123)"
                  className={`w-full text-xs p-3 pr-10 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                    fieldErrors.newPassword
                      ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                      : 'border-[#e3e2e1] focus:border-[#003527]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#665d55] hover:text-[#1a1c1c] transition-colors p-1"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.newPassword}</span>
                </p>
              )}

              {/* Real-time Password Security Criteria Checklist */}
              <div className="mt-2 p-2.5 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-[#665d55] uppercase tracking-wider">
                  Password Requirements:
                </p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span
                    className={`flex items-center gap-1 ${
                      newPassword.length >= 8 ? 'text-emerald-700 font-bold' : 'text-[#665d55]'
                    }`}
                  >
                    <span>{newPassword.length >= 8 ? '✓' : '○'}</span>
                    <span>8+ characters</span>
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      /[A-Z]/.test(newPassword) ? 'text-emerald-700 font-bold' : 'text-[#665d55]'
                    }`}
                  >
                    <span>{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span>
                    <span>1 Capital letter (A-Z)</span>
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      /[a-z]/.test(newPassword) ? 'text-emerald-700 font-bold' : 'text-[#665d55]'
                    }`}
                  >
                    <span>{/[a-z]/.test(newPassword) ? '✓' : '○'}</span>
                    <span>1 Small letter (a-z)</span>
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      /[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-700 font-bold' : 'text-[#665d55]'
                    }`}
                  >
                    <span>{/[^A-Za-z0-9]/.test(newPassword) ? '✓' : '○'}</span>
                    <span>1 Special character (!@#$)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfirmNewPassword(val);
                    setError('');
                    const err = validateResetField('confirmNewPassword', val, newPassword);
                    setFieldErrors((prev) => ({ ...prev, confirmNewPassword: err }));
                  }}
                  placeholder="Repeat new password"
                  className={`w-full text-xs p-3 pr-10 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                    fieldErrors.confirmNewPassword
                      ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                      : 'border-[#e3e2e1] focus:border-[#003527]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#665d55] hover:text-[#1a1c1c] transition-colors p-1"
                  title={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmNewPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.confirmNewPassword}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-full bg-[#003527] text-white font-bold text-xs shadow-md hover:bg-[#064e3b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Updating Password...' : 'Save New Password & Finish'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 4: Success Screen */}
        {step === 'SUCCESS' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#b0f0d6] text-[#003527] mx-auto flex items-center justify-center text-2xl font-black shadow-inner">
              ✓
            </div>
            <h2 className="text-xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              Password Reset Successful!
            </h2>
            <p className="text-xs text-[#665d55] max-w-xs mx-auto">
              Your password has been successfully updated. You can now sign in to your HomeBiz account with your new credentials.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="w-full py-3.5 px-4 rounded-full bg-[#003527] text-white font-bold text-xs shadow-md hover:bg-[#064e3b] transition-colors flex items-center justify-center gap-2"
              >
                <span>Sign In to Your Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
