import React, { useState } from 'react';
import { X, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { SellerSubscription } from '../../types';

type CheckoutPaymentMethod = 'jazz_cash' | 'easypaisa' | 'card';

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
    onSuccess: (result: PaymentResult) => void;
    onCancel: () => void;
}

export function PaymentGateway({
    planName,
    amount,
    planSlug,
    billingPeriod = 'monthly',
    onSuccess,
    onCancel,
}: PaymentGatewayProps) {
    const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'method' | 'details' | 'confirmation'>('method');

    // JazzCash Details
    const [jazzNumber, setJazzNumber] = useState('');
    const [jazzPin, setJazzPin] = useState('');

    // Easypaisa Details
    const [easypaisaNumber, setEasypaisaNumber] = useState('');
    const [easypaisaPin, setEasypaisaPin] = useState('');

    // Card Details
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');

    const mapPaymentMethod = (method: CheckoutPaymentMethod): SellerSubscription['paymentMethod'] => {
        if (method === 'jazz_cash') return 'JAZZ_CASH';
        if (method === 'easypaisa') return 'EASYPAISA';
        return 'CARD';
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

    const validatePakistaniPhone = (phone: string): boolean => /^03[0-9]{9}$/.test(phone.replace(/\s/g, ''));

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
            if (!cardName.trim()) { setValidationError('Please enter cardholder name.'); return false; }
            if (!luhnCheck(cardNumber)) { setValidationError('Invalid card number. Please check and try again.'); return false; }
            if (!validateExpiry(expiryDate)) { setValidationError('Invalid or expired card expiry date.'); return false; }
            if (cvv.length < 3) { setValidationError('CVV must be 3 or 4 digits.'); return false; }
        }
        if (paymentMethod === 'jazz_cash') {
            if (!validatePakistaniPhone(jazzNumber)) { setValidationError('Enter a valid JazzCash number (e.g. 03001234567).'); return false; }
            if (!jazzPin.trim()) { setValidationError('Please enter the transaction reference number.'); return false; }
        }
        if (paymentMethod === 'easypaisa') {
            if (!validatePakistaniPhone(easypaisaNumber)) { setValidationError('Enter a valid Easypaisa number (e.g. 03201234567).'); return false; }
            if (!easypaisaPin.trim()) { setValidationError('Please enter the transaction reference number.'); return false; }
        }
        return true;
    };

    const getProviderReference = (method: CheckoutPaymentMethod) => {
        if (method === 'jazz_cash') return jazzPin.trim();
        if (method === 'easypaisa') return easypaisaPin.trim();
        const cardLastFour = cardNumber.replace(/\D/g, '').slice(-4);
        return `CARD-${cardLastFour || '0000'}-${Date.now()}`;
    };

    const handlePaymentSubmit = async () => {
        if (!paymentMethod) return;
        if (!validateDetails()) return;

        setLoading(true);
        const paidAt = new Date().toISOString();
        const providerReference = getProviderReference(paymentMethod);
        // Generate Pakistan-style transaction ID
        const txnId = `TXN-PK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const result: PaymentResult = {
            paymentMethod: mapPaymentMethod(paymentMethod),
            transactionId: txnId,
            providerReference,
            amount,
            planSlug,
            paidAt,
        };

        // Simulate 2s processing delay (replace with real Stripe/Safepay API call)
        setTimeout(() => {
            setLoading(false);
            setStep('confirmation');

            setTimeout(() => {
                onSuccess(result);
            }, 2000);
        }, 2000);
    };

    if (step === 'confirmation') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-[#b0f0d6] text-[#003527] mx-auto flex items-center justify-center text-2xl">
                        ✓
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">Payment Successful!</h2>
                        <p className="text-xs text-[#665d55] mt-2">
                            You've successfully upgraded to the <strong>{planName}</strong> plan.
                        </p>
                    </div>
                    <div className="bg-[#b0f0d6]/20 rounded-2xl p-4 border border-[#95d3ba]/40">
                        <p className="text-[10px] font-bold text-[#003527] uppercase tracking-wider">Payment Confirmed</p>
                        <p className="text-xl font-black text-[#003527] mt-1">PKR {amount.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-[#665d55]">Redirecting to your dashboard...</p>
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
                        <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">Upgrade to {planName}</h2>
                        <p className="text-xs text-[#665d55] mt-1">Secure payment processing</p>
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
                        <div className="bg-[#faf9f8] p-4 rounded-2xl border border-[#e3e2e1] mb-6">
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#e3e2e1]">
                                <span className="text-xs text-[#665d55]">Plan: {planName}</span>
                                <span className="text-sm font-bold text-[#1a1c1c]">
                                    {billingPeriod === 'yearly' ? '1 Year' : '1 Month'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#665d55] uppercase tracking-wider">Total Amount</span>
                                <span className="text-2xl font-black text-[#003527]">PKR {amount.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">Select Payment Method</p>

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
                                    <p className="text-xs font-bold text-[#1a1c1c]">🎵 JazzCash</p>
                                    <p className="text-xs text-[#665d55] mt-1">
                                        Send money from your JazzCash account (Fast & Secure)
                                    </p>
                                    <p className="text-[10px] text-[#95d3ba] font-semibold mt-1">Code: *141#</p>
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
                                    <p className="text-xs font-bold text-[#1a1c1c]">💳 Easypaisa</p>
                                    <p className="text-xs text-[#665d55] mt-1">
                                        Send money from your Easypaisa account (Instant Transfer)
                                    </p>
                                    <p className="text-[10px] text-[#95d3ba] font-semibold mt-1">Phone: 323 (Telenor only)</p>
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
                                    <p className="text-xs font-bold text-[#1a1c1c]">💳 Debit/Credit Card</p>
                                    <p className="text-xs text-[#665d55] mt-1">
                                        Visa, Mastercard, or any bank-issued card (International & Local)
                                    </p>
                                    <p className="text-[10px] text-[#95d3ba] font-semibold mt-1">PCI DSS Compliant</p>
                                </div>
                            </label>
                        </div>

                        <button
                            onClick={() => paymentMethod && setStep('details')}
                            disabled={!paymentMethod}
                            className="w-full mt-6 px-4 py-3 rounded-full bg-[#003527] text-white font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#064e3b] transition-colors cursor-pointer"
                        >
                            Continue to Payment
                        </button>
                    </div>
                )}

                {step === 'details' && (
                    <div className="space-y-4">
                        {/* Back Button */}
                        <button
                            onClick={() => setStep('method')}
                            className="text-xs font-bold text-[#003527] hover:text-[#064e3b] transition-colors mb-4 cursor-pointer"
                        >
                            ← Back to Payment Methods
                        </button>

                        {paymentMethod === 'jazz_cash' && (
                            <div className="space-y-4">
                                <div className="bg-[#b0f0d6]/10 p-4 rounded-2xl border border-[#95d3ba]/40">
                                    <p className="text-xs text-[#003527] font-semibold">
                                        📱 <strong>JazzCash Instructions:</strong>
                                    </p>
                                    <ol className="text-xs text-[#665d55] mt-2 space-y-1 list-decimal list-inside">
                                        <li>Dial *141# from your Jazz line</li>
                                        <li>Select "Send Money"</li>
                                        <li>Enter recipient number: <strong>03001234567</strong></li>
                                        <li>Enter amount: <strong>PKR {amount}</strong></li>
                                        <li>Confirm and enter your PIN</li>
                                    </ol>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
                                        Your JazzCash Number
                                    </label>
                                    <input
                                        type="text"
                                        value={jazzNumber}
                                        onChange={(e) => setJazzNumber(e.target.value)}
                                        placeholder="03001234567"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
                                        Transaction Reference
                                    </label>
                                    <input
                                        type="text"
                                        value={jazzPin}
                                        onChange={(e) => setJazzPin(e.target.value)}
                                        placeholder="Enter reference/confirmation number"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'easypaisa' && (
                            <div className="space-y-4">
                                <div className="bg-[#b0f0d6]/10 p-4 rounded-2xl border border-[#95d3ba]/40">
                                    <p className="text-xs text-[#003527] font-semibold">
                                        📱 <strong>Easypaisa Instructions (Telenor):</strong>
                                    </p>
                                    <ol className="text-xs text-[#665d55] mt-2 space-y-1 list-decimal list-inside">
                                        <li>Go to Easypaisa app or dial 323</li>
                                        <li>Select "Send Money"</li>
                                        <li>Enter recipient: <strong>03201234567</strong></li>
                                        <li>Amount: <strong>PKR {amount}</strong></li>
                                        <li>Complete transaction</li>
                                    </ol>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
                                        Your Easypaisa Number
                                    </label>
                                    <input
                                        type="text"
                                        value={easypaisaNumber}
                                        onChange={(e) => setEasypaisaNumber(e.target.value)}
                                        placeholder="03201234567"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
                                        Transaction Reference
                                    </label>
                                    <input
                                        type="text"
                                        value={easypaisaPin}
                                        onChange={(e) => setEasypaisaPin(e.target.value)}
                                        placeholder="Enter reference number"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'card' && (
                            <div className="space-y-4">
                                <div className="bg-[#FFF1E7] p-4 rounded-2xl border border-[#ffe088] flex items-start gap-2">
                                    <Lock className="w-4 h-4 text-[#735c00] flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-[#735c00]">
                                        Your card details are encrypted and secure. We do not store card information.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
                                        Cardholder Name
                                    </label>
                                    <input
                                        type="text"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl text-xs focus:border-[#003527] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
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
                                        <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
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
                                        <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
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
                                <p className="text-xs text-red-600">{validationError}</p>
                            </div>
                        )}
                        <button
                            onClick={handlePaymentSubmit}
                            disabled={loading}
                            className="w-full mt-4 px-4 py-3 rounded-full bg-[#003527] text-white font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#064e3b] transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                            {loading ? 'Processing...' : <><Lock className="w-4 h-4" /> Complete Payment</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PaymentGateway;
