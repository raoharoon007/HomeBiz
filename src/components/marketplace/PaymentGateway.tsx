import React, { useState } from 'react';
import { X, Lock, AlertCircle, CheckCircle, ShieldCheck, Copy, Check } from 'lucide-react';
import { SellerSubscription } from '../../types';
import { PLATFORM_PAYMENT_CONFIG } from '../../lib/paymentConfig';

type CheckoutPaymentMethod = 'jazz_cash' | 'easypaisa' | 'bank_transfer' | 'card';

export interface PaymentResult {
    paymentMethod: SellerSubscription['paymentMethod'];
    transactionId: string;
    providerReference: string;
    amount: number;
    planSlug: string;
    paidAt: string;
}

export interface PaymentGatewayProps {
    planName: string;
    amount: number;
    planSlug: string;
    billingPeriod?: 'monthly' | 'yearly';
    initialMethod?: CheckoutPaymentMethod;
    onSuccess: (result: PaymentResult) => void;
    onCancel: () => void;
}

export function PaymentGateway({
    planName,
    amount,
    planSlug,
    billingPeriod = 'monthly',
    initialMethod = 'jazz_cash',
    onSuccess,
    onCancel,
}: PaymentGatewayProps) {
    const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod | null>(initialMethod);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'method' | 'details' | 'confirmation'>('method');
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // JazzCash Details
    const [jazzNumber, setJazzNumber] = useState('');
    const [jazzPin, setJazzPin] = useState('');

    // Easypaisa Details
    const [easypaisaNumber, setEasypaisaNumber] = useState('');
    const [easypaisaPin, setEasypaisaPin] = useState('');

    // Bank Transfer Details
    const [senderBank, setSenderBank] = useState('');
    const [senderAccount, setSenderAccount] = useState('');
    const [bankTxnRef, setBankTxnRef] = useState('');

    // Card Details
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');

    const mapPaymentMethod = (method: CheckoutPaymentMethod): SellerSubscription['paymentMethod'] => {
        if (method === 'jazz_cash') return 'JAZZ_CASH';
        if (method === 'easypaisa') return 'EASYPAISA';
        if (method === 'bank_transfer') return 'BANK_TRANSFER';
        return 'CARD';
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // --- Validation Helpers ---
    const luhnCheck = (num: string): boolean => {
        const digits = num.replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19) return false;
        let sum = 0;
        let alt = false;
        for (let i = digits.length - 1; i >= 0; i--) {
            let n = parseInt(digits[i], 10);
            if (alt) { n *= 2; if (n > 9) n -= 9; }
            sum += n;
            alt = !alt;
        }
        return sum % 10 === 0;
    };

    const validateExpiry = (val: string): boolean => {
        const parts = val.split('/');
        if (parts.length !== 2) return false;
        const m = parseInt(parts[0], 10);
        const y = parseInt('20' + parts[1], 10);
        if (m < 1 || m > 12) return false;
        const now = new Date();
        const expDate = new Date(y, m - 1, 1);
        return expDate >= new Date(now.getFullYear(), now.getMonth(), 1);
    };

    const validatePakistaniPhone = (phone: string): boolean => /^03[0-9]{9}$/.test(phone.replace(/[\s-]/g, ''));

    const formatCardNumber = (val: string): string => {
        const digits = val.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    const formatExpiry = (val: string): string => {
        const digits = val.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
        return digits;
    };

    const [validationError, setValidationError] = useState<string | null>(null);

    const validateDetails = (): boolean => {
        setValidationError(null);
        if (paymentMethod === 'card') {
            if (!cardName.trim()) {
                setValidationError('Please enter cardholder name.');
                return false;
            }
            if (!luhnCheck(cardNumber)) {
                setValidationError('Please enter a valid credit/debit card number.');
                return false;
            }
            if (!validateExpiry(expiryDate)) {
                setValidationError('Please enter a valid expiry date in MM/YY format (must be future date).');
                return false;
            }
            if (!/^\d{3,4}$/.test(cvv)) {
                setValidationError('Please enter a valid 3 or 4 digit CVV.');
                return false;
            }
            return true;
        }

        if (paymentMethod === 'jazz_cash') {
            if (!validatePakistaniPhone(jazzNumber)) {
                setValidationError('Please enter a valid 11-digit JazzCash mobile number (e.g. 0300 1234567).');
                return false;
            }
            if (!jazzPin.trim() || jazzPin.trim().length < 4) {
                setValidationError('Please enter the transaction reference / TID number received via SMS.');
                return false;
            }
            return true;
        }

        if (paymentMethod === 'easypaisa') {
            if (!validatePakistaniPhone(easypaisaNumber)) {
                setValidationError('Please enter a valid 11-digit Easypaisa mobile number (e.g. 0345 1234567).');
                return false;
            }
            if (!easypaisaPin.trim() || easypaisaPin.trim().length < 4) {
                setValidationError('Please enter the transaction reference / TRX ID received via SMS.');
                return false;
            }
            return true;
        }

        if (paymentMethod === 'bank_transfer') {
            if (!senderBank.trim()) {
                setValidationError('Please enter your sending Bank name or Wallet (e.g. Meezan, HBL, Sadapay).');
                return false;
            }
            if (!bankTxnRef.trim() || bankTxnRef.trim().length < 4) {
                setValidationError('Please enter your Bank Transfer Reference / Transaction ID / IBFT receipt number.');
                return false;
            }
            return true;
        }

        return false;
    };

    const handlePaymentSubmit = () => {
        if (!validateDetails()) return;

        setLoading(true);

        const result: PaymentResult = {
            paymentMethod: paymentMethod ? mapPaymentMethod(paymentMethod) : 'CARD',
            transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            providerReference:
                paymentMethod === 'jazz_cash'
                    ? jazzPin
                    : paymentMethod === 'easypaisa'
                    ? easypaisaPin
                    : paymentMethod === 'bank_transfer'
                    ? `${senderBank.trim()} Ref: ${bankTxnRef.trim()}`
                    : `AUTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            amount,
            planSlug,
            paidAt: new Date().toISOString(),
        };

        // Simulate 2s processing delay
        setTimeout(() => {
            setLoading(false);
            setStep('confirmation');

            setTimeout(() => {
                onSuccess(result);
            }, 1800);
        }, 1500);
    };

    if (step === 'confirmation') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-[#b0f0d6] text-[#003527] mx-auto flex items-center justify-center text-2xl">
                        ✓
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">Payment Confirmed!</h2>
                        <p className="text-xs text-[#665d55] mt-2">
                            Transaction received for <strong>{planName}</strong>.
                        </p>
                    </div>
                    <div className="bg-[#b0f0d6]/20 rounded-2xl p-4 border border-[#95d3ba]/40">
                        <p className="text-[10px] font-bold text-[#003527] uppercase tracking-wider">Amount Processed</p>
                        <p className="text-xl font-black text-[#003527] mt-1">PKR {amount.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-[#665d55]">Activating your benefits and redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e3e2e1] max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#f4f3f2] mb-6">
                    <div>
                        <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">{planName}</h2>
                        <p className="text-xs text-[#665d55] mt-0.5 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#003527]" />
                            <span>Secure HomeBiz Platform Payment</span>
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-[#665d55] hover:text-[#1a1c1c] transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {step === 'method' && (
                    <div className="space-y-4">
                        {/* Order Summary */}
                        <div className="bg-[#faf9f8] p-4 rounded-2xl border border-[#e3e2e1] mb-4">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#e3e2e1]">
                                <span className="text-xs text-[#665d55]">Item / Subscription</span>
                                <span className="text-xs font-bold text-[#1a1c1c]">
                                    {billingPeriod === 'yearly' ? '1 Year Plan' : '1 Month Plan'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#665d55] uppercase tracking-wider">Total Amount</span>
                                <span className="text-2xl font-black text-[#003527]">PKR {amount.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">Select Payment Channel</p>

                            {/* JazzCash */}
                            <label className="flex items-start gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all hover:border-[#003527] hover:bg-[#b0f0d6]/5" style={{ borderColor: paymentMethod === 'jazz_cash' ? '#003527' : '#e3e2e1' }}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="jazz_cash"
                                    checked={paymentMethod === 'jazz_cash'}
                                    onChange={() => setPaymentMethod('jazz_cash')}
                                    className="mt-1 cursor-pointer"
                                />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-[#1a1c1c]">🎵 JazzCash (Till / Mobile Account)</p>
                                    <p className="text-xs text-[#665d55] mt-1">
                                        Transfer to HomeBiz official JazzCash Till or Mobile number.
                                    </p>
                                    <p className="text-[10px] text-[#003527] font-semibold mt-1">Instant SMS Verification</p>
                                </div>
                            </label>

                            {/* Easypaisa */}
                            <label className="flex items-start gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all hover:border-[#003527] hover:bg-[#b0f0d6]/5" style={{ borderColor: paymentMethod === 'easypaisa' ? '#003527' : '#e3e2e1' }}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="easypaisa"
                                    checked={paymentMethod === 'easypaisa'}
                                    onChange={() => setPaymentMethod('easypaisa')}
                                    className="mt-1 cursor-pointer"
                                />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-[#1a1c1c]">💳 Easypaisa Wallet</p>
                                    <p className="text-xs text-[#665d55] mt-1">
                                        Send directly from Easypaisa App to HomeBiz verified account.
                                    </p>
                                    <p className="text-[10px] text-[#003527] font-semibold mt-1">Direct Mobile Transfer</p>
                                </div>
                            </label>

                            {/* Bank Transfer (IBFT) */}
                            <label className="flex items-start gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all hover:border-[#003527] hover:bg-[#b0f0d6]/5" style={{ borderColor: paymentMethod === 'bank_transfer' ? '#003527' : '#e3e2e1' }}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="bank_transfer"
                                    checked={paymentMethod === 'bank_transfer'}
                                    onChange={() => setPaymentMethod('bank_transfer')}
                                    className="mt-1 cursor-pointer"
                                />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-[#1a1c1c]">🏛️ Direct Bank Transfer (IBFT)</p>
                                    <p className="text-xs text-[#665d55] mt-1">
                                        Transfer via Meezan Bank, HBL, Bank Alfalah, or any Pakistani Bank / Raast.
                                    </p>
                                    <p className="text-[10px] text-[#003527] font-semibold mt-1">Official Platform Escrow Account</p>
                                </div>
                            </label>

                            {/* Debit/Credit Card */}
                            <label className="flex items-start gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all hover:border-[#003527] hover:bg-[#b0f0d6]/5" style={{ borderColor: paymentMethod === 'card' ? '#003527' : '#e3e2e1' }}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="card"
                                    checked={paymentMethod === 'card'}
                                    onChange={() => setPaymentMethod('card')}
                                    className="mt-1 cursor-pointer"
                                />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-[#1a1c1c]">💳 Debit / Credit Card</p>
                                    <p className="text-xs text-[#665d55] mt-1">
                                        Visa, Mastercard, or PayPak (Pakistan & Australia international cards).
                                    </p>
                                    <p className="text-[10px] text-[#003527] font-semibold mt-1">Encrypted 256-bit SSL</p>
                                </div>
                            </label>
                        </div>

                        <button
                            onClick={() => paymentMethod && setStep('details')}
                            disabled={!paymentMethod}
                            className="w-full mt-6 px-4 py-3.5 rounded-full bg-[#003527] text-white font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#064e3b] transition-colors cursor-pointer"
                        >
                            Continue to Pay PKR {amount.toLocaleString()}
                        </button>
                    </div>
                )}

                {step === 'details' && (
                    <div className="space-y-4">
                        {/* Back Button */}
                        <button
                            onClick={() => setStep('method')}
                            className="text-xs font-bold text-[#003527] hover:text-[#064e3b] transition-colors mb-2 cursor-pointer inline-block"
                        >
                            ← Back to Payment Methods
                        </button>

                        {paymentMethod === 'jazz_cash' && (
                            <div className="space-y-4">
                                <div className="bg-[#b0f0d6]/15 p-4 rounded-2xl border border-[#95d3ba]/50 space-y-2.5">
                                    <div className="flex items-center gap-1.5 text-xs text-[#003527] font-bold">
                                        <ShieldCheck className="w-4 h-4 text-[#003527]" />
                                        <span>Official HomeBiz JazzCash Account</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-[#e3e2e1] space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-[#665d55]">Account Title:</span>
                                            <strong className="text-[#1a1c1c]">{PLATFORM_PAYMENT_CONFIG.jazzCash.title}</strong>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#665d55]">JazzCash Number:</span>
                                            <div className="flex items-center gap-1.5">
                                                <strong className="text-[#003527] font-mono text-sm">{PLATFORM_PAYMENT_CONFIG.jazzCash.number}</strong>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(PLATFORM_PAYMENT_CONFIG.jazzCash.number.replace(/\s/g, ''), 'jazzNumber')}
                                                    className="p-1 hover:bg-stone-100 rounded text-stone-500"
                                                    title="Copy Number"
                                                >
                                                    {copiedField === 'jazzNumber' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#665d55]">Merchant Till ID:</span>
                                            <div className="flex items-center gap-1.5">
                                                <strong className="text-[#735c00] font-mono">{PLATFORM_PAYMENT_CONFIG.jazzCash.tillId}</strong>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(PLATFORM_PAYMENT_CONFIG.jazzCash.tillId, 'jazzTill')}
                                                    className="p-1 hover:bg-stone-100 rounded text-stone-500"
                                                    title="Copy Till ID"
                                                >
                                                    {copiedField === 'jazzTill' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-[#665d55] leading-relaxed">
                                        Dial <strong>*786#</strong> or open the JazzCash App, send <strong>PKR {amount.toLocaleString()}</strong> to the official number/till above, then enter your details below.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1.5">
                                        Your JazzCash Sender Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={jazzNumber}
                                        onChange={(e) => setJazzNumber(e.target.value)}
                                        placeholder="0300 1234567"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1.5">
                                        Transaction Reference (TID / Trx ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={jazzPin}
                                        onChange={(e) => setJazzPin(e.target.value)}
                                        placeholder="e.g. 1948192841 (from JazzCash SMS)"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'easypaisa' && (
                            <div className="space-y-4">
                                <div className="bg-[#b0f0d6]/15 p-4 rounded-2xl border border-[#95d3ba]/50 space-y-2.5">
                                    <div className="flex items-center gap-1.5 text-xs text-[#003527] font-bold">
                                        <ShieldCheck className="w-4 h-4 text-[#003527]" />
                                        <span>Official HomeBiz Easypaisa Account</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-[#e3e2e1] space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-[#665d55]">Account Title:</span>
                                            <strong className="text-[#1a1c1c]">{PLATFORM_PAYMENT_CONFIG.easypaisa.title}</strong>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#665d55]">Easypaisa Number:</span>
                                            <div className="flex items-center gap-1.5">
                                                <strong className="text-[#003527] font-mono text-sm">{PLATFORM_PAYMENT_CONFIG.easypaisa.number}</strong>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(PLATFORM_PAYMENT_CONFIG.easypaisa.number.replace(/\s/g, ''), 'easyNumber')}
                                                    className="p-1 hover:bg-stone-100 rounded text-stone-500"
                                                    title="Copy Number"
                                                >
                                                    {copiedField === 'easyNumber' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-[#665d55] leading-relaxed">
                                        Open the Easypaisa App, transfer <strong>PKR {amount.toLocaleString()}</strong> to the official HomeBiz number above, then enter your details below.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1.5">
                                        Your Easypaisa Sender Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={easypaisaNumber}
                                        onChange={(e) => setEasypaisaNumber(e.target.value)}
                                        placeholder="0345 1234567"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1.5">
                                        Transaction Reference (TRX ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={easypaisaPin}
                                        onChange={(e) => setEasypaisaPin(e.target.value)}
                                        placeholder="e.g. 8493019284 (from Easypaisa SMS/Receipt)"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'bank_transfer' && (
                            <div className="space-y-4">
                                <div className="bg-[#b0f0d6]/15 p-4 rounded-2xl border border-[#95d3ba]/50 space-y-2.5">
                                    <div className="flex items-center gap-1.5 text-xs text-[#003527] font-bold">
                                        <ShieldCheck className="w-4 h-4 text-[#003527]" />
                                        <span>Official HomeBiz Escrow Bank Account</span>
                                    </div>
                                    <div className="bg-white p-3.5 rounded-xl border border-[#e3e2e1] space-y-2 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#665d55]">Bank Name:</span>
                                            <strong className="text-[#1a1c1c]">{PLATFORM_PAYMENT_CONFIG.bank.bankName}</strong>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#665d55]">Account Title:</span>
                                            <strong className="text-[#1a1c1c]">{PLATFORM_PAYMENT_CONFIG.bank.accountTitle}</strong>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#665d55]">Account Number:</span>
                                            <div className="flex items-center gap-1.5">
                                                <strong className="text-[#003527] font-mono text-sm">{PLATFORM_PAYMENT_CONFIG.bank.accountNumber}</strong>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(PLATFORM_PAYMENT_CONFIG.bank.accountNumber, 'bankAcc')}
                                                    className="p-1 hover:bg-stone-100 rounded text-stone-500 cursor-pointer"
                                                    title="Copy Account Number"
                                                >
                                                    {copiedField === 'bankAcc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#665d55]">IBAN:</span>
                                            <div className="flex items-center gap-1.5">
                                                <strong className="text-[#735c00] font-mono text-[11px]">{PLATFORM_PAYMENT_CONFIG.bank.iban}</strong>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(PLATFORM_PAYMENT_CONFIG.bank.iban, 'bankIban')}
                                                    className="p-1 hover:bg-stone-100 rounded text-stone-500 cursor-pointer"
                                                    title="Copy IBAN"
                                                >
                                                    {copiedField === 'bankIban' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-[#665d55] pt-1 border-t border-[#f4f3f2]">
                                            <span>Branch:</span>
                                            <span>{PLATFORM_PAYMENT_CONFIG.bank.branch}</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-[#665d55] leading-relaxed">
                                        Transfer <strong>PKR {amount.toLocaleString()}</strong> via your Bank App / Raast to the Meezan Bank account above, then enter your details below.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1.5">
                                        Your Bank / Wallet Name
                                    </label>
                                    <input
                                        type="text"
                                        value={senderBank}
                                        onChange={(e) => setSenderBank(e.target.value)}
                                        placeholder="e.g. Meezan Bank, HBL, Bank Alfalah, Sadapay, Nayapay"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1.5">
                                        Your Sender Account Title / IBAN (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={senderAccount}
                                        onChange={(e) => setSenderAccount(e.target.value)}
                                        placeholder="e.g. Muhammad Ali"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1.5">
                                        Bank Transfer Reference / Transaction ID (TID)
                                    </label>
                                    <input
                                        type="text"
                                        value={bankTxnRef}
                                        onChange={(e) => setBankTxnRef(e.target.value)}
                                        placeholder="e.g. 2024090401827492 or IBFT Ref from Bank Receipt"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'card' && (
                            <div className="space-y-4">
                                <div className="bg-[#FFF1E7] p-4 rounded-2xl border border-[#ffe088] flex items-start gap-2">
                                    <Lock className="w-4 h-4 text-[#735c00] flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-[#735c00]">
                                        Your card details are encrypted and processed securely. We do not store sensitive card numbers.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1.5">
                                        Cardholder Name
                                    </label>
                                    <input
                                        type="text"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value)}
                                        placeholder="Cardholder Full Name"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1.5">
                                        Card Number
                                    </label>
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        placeholder="4242 4242 4242 4242"
                                        maxLength={19}
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none font-mono"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1.5">
                                            Expiry Date
                                        </label>
                                        <input
                                            type="text"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                                            placeholder="MM/YY"
                                            maxLength={5}
                                            className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1.5">
                                            CVV
                                        </label>
                                        <input
                                            type="password"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value)}
                                            placeholder="123"
                                            maxLength={4}
                                            className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {validationError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-xs text-red-600 font-medium">{validationError}</p>
                            </div>
                        )}

                        <button
                            onClick={handlePaymentSubmit}
                            disabled={loading}
                            className="w-full mt-4 px-4 py-3.5 rounded-full bg-[#003527] text-white font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#064e3b] transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                            {loading ? 'Confirming Payment...' : <><Lock className="w-4 h-4 text-[#ffe088]" /> Confirm PKR {amount.toLocaleString()} Payment</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PaymentGateway;
