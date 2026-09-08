import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, RotateCw, AlertCircle, CheckCircle, Edit3 } from 'lucide-react';

interface OtpVerificationProps {
  email: string;
  recipientName: string;
  onVerify: (otp: string) => Promise<void> | void;
  onResend: () => Promise<void> | void;
  onChangeEmail: () => void;
  loading?: boolean;
  error?: string;
}

export function OtpVerification({
  email,
  recipientName,
  onVerify,
  onResend,
  onChangeEmail,
  loading = false,
  error = '',
}: OtpVerificationProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    // Keep only the last character entered and ensure it's a digit
    const cleaned = value.replace(/\D/g, '');
    const char = cleaned.slice(-1);

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // If character entered, advance to next input
    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 4 digits entered, auto-trigger verify
    if (char && index === 3) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 4) {
        onVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block non-numeric keystrokes directly at the keyboard event level
    if (
      !/^[0-9]$/.test(e.key) &&
      !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous input and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pasteData) return;

    const newDigits = ['', '', '', ''];
    for (let i = 0; i < 4 && i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setDigits(newDigits);

    const targetFocusIndex = Math.min(pasteData.length, 3);
    inputRefs.current[targetFocusIndex]?.focus();

    if (newDigits.every((d) => d !== '')) {
      onVerify(newDigits.join(''));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length === 4) {
      onVerify(fullCode);
    }
  };

  const handleResendClick = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await onResend();
      setCountdown(60);
      setResendSuccess(true);
      setDigits(['', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setResendSuccess(false), 4000);
    } finally {
      setResending(false);
    }
  };

  const isComplete = digits.every((d) => d.length === 1);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-[#b0f0d6]/40 text-[#003527] mx-auto flex items-center justify-center font-bold text-xl border border-[#95d3ba]/40 shadow-xs">
          <Mail className="w-6 h-6 text-[#003527]" />
        </div>
        <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider block">
          Email Security Verification
        </span>
        <h2 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
          Enter 4-Digit OTP Code
        </h2>
        <p className="text-xs text-[#665d55] max-w-sm mx-auto leading-relaxed">
          Assalam-o-Alaikum <strong className="text-[#1a1c1c]">{recipientName}</strong>! We have dispatched a 4-digit verification code to:
        </p>
        <div className="inline-flex items-center gap-2 bg-[#faf9f8] px-3 py-1 rounded-full border border-[#e3e2e1] text-xs font-semibold text-[#003527]">
          <span>{email}</span>
          <button
            type="button"
            onClick={onChangeEmail}
            className="text-[#665d55] hover:text-[#1a1c1c] transition-colors"
            title="Edit Email Address"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {resendSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>A fresh 4-digit code has been sent to your email inbox.</span>
        </div>
      )}

      {/* 4-Digit React OTP Input Group */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={`w-14 h-16 sm:w-16 sm:h-18 text-center font-bold text-2xl font-mono rounded-2xl border transition-all outline-none shadow-xs ${
                digit
                  ? 'border-[#003527] bg-[#f0fbf6] text-[#003527] ring-2 ring-[#003527]/10'
                  : 'border-[#e3e2e1] bg-[#faf9f8] text-[#1a1c1c] focus:border-[#003527] focus:bg-white focus:ring-2 focus:ring-[#003527]/20'
              }`}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={!isComplete || loading}
          className="w-full py-3.5 px-4 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>{loading ? 'Verifying OTP Code...' : 'Verify OTP & Complete Registration'}</span>
          <ArrowRight className="w-4 h-4 text-[#ffe088]" />
        </button>
      </form>

      {/* Resend and Navigation Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#665d55] pt-2 border-t border-[#f4f3f2]">
        <div>
          {countdown > 0 ? (
            <span>
              Resend code in <strong className="text-[#003527]">{countdown}s</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendClick}
              disabled={resending}
              className="font-bold text-[#003527] hover:underline flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>{resending ? 'Sending...' : 'Resend 4-Digit Code'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onChangeEmail}
          className="text-[#665d55] hover:text-[#1a1c1c] font-semibold underline-offset-2 hover:underline"
        >
          Edit Registration Details
        </button>
      </div>
    </div>
  );
}
