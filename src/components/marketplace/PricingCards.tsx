import React, { useState, useEffect } from 'react';
import { Check, X, Zap, Crown } from 'lucide-react';
import { Storage } from '../../lib/storage';
import { PricingPlan } from '../../types';
import { useRouter, useSearchParams } from '../../lib/navigation';
import { useAuth } from '../../lib/authContext';
import { PaymentGateway, PaymentResult } from './PaymentGateway';
import { isAustralianLocation, formatCurrency, SupportedCurrency, REGIONAL_PLAN_PRICING } from '../../lib/countryUtils';

interface PricingCardsProps {
    onSelectPlan?: (planId: string) => void;
    showComparison?: boolean;
    showToggle?: boolean;
    enableInteraction?: boolean;
}

export function PricingCards({
    onSelectPlan,
    showComparison = true,
    showToggle = false,
    enableInteraction = true,
}: PricingCardsProps) {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
    const [checkoutPlan, setCheckoutPlan] = useState<{
        id: string;
        name: string;
        slug: PricingPlan['slug'];
        amount: number;
    } | null>(null);
    const [autoOpenedPlanSlug, setAutoOpenedPlanSlug] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const isSellerInAustralia = isAustralianLocation(user?.city);
    const [regionCurrency, setRegionCurrency] = useState<SupportedCurrency>(isSellerInAustralia ? 'AUD' : 'PKR');

    useEffect(() => {
        if (user?.city && isAustralianLocation(user.city)) {
            setRegionCurrency('AUD');
        }
    }, [user?.city]);

    useEffect(() => {
        const pricingPlans = Storage.getPricingPlans();
        setPlans(pricingPlans);
    }, []);

    const allFeatures = [
        'Business Profile',
        'Booking Requests',
        'Customer Requests',
        'Quote Responses',
        'Gallery',
        'Services',
        'Customer Reviews',
        'Analytics',
        'Search Priority',
        'Featured Badge',
        'Homepage Promotion',
        'Priority Support',
    ];

    const featureMatrix: Record<string, Record<string, boolean | string>> = {
        'Business Profile': { free: true, pro: true, featured: true },
        'Booking Requests': { free: true, pro: true, featured: true },
        'Customer Requests': { free: true, pro: true, featured: true },
        'Quote Responses': { free: false, pro: true, featured: true },
        'Gallery': { free: '10 Photos', pro: 'Unlimited', featured: 'Unlimited' },
        'Services': { free: 'Limited', pro: 'Unlimited', featured: 'Unlimited' },
        'Customer Reviews': { free: false, pro: true, featured: true },
        'Analytics': { free: 'Basic', pro: 'Advanced', featured: 'Premium' },
        'Search Priority': { free: false, pro: true, featured: true },
        'Featured Badge': { free: false, pro: true, featured: true },
        'Homepage Promotion': { free: false, pro: false, featured: true },
        'Priority Support': { free: false, pro: false, featured: true },
    };

    const currentPrice = (plan: PricingPlan) => {
        if (plan.slug === 'free') return 0;
        if (regionCurrency === 'AUD') {
            const aud = REGIONAL_PLAN_PRICING.AUD[plan.slug as 'pro' | 'featured'];
            if (aud) {
                return billingPeriod === 'monthly' ? aud.monthly : aud.yearly;
            }
        }
        return billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly;
    };

    useEffect(() => {
        const planSlug = searchParams.get('plan') as PricingPlan['slug'] | null;
        if (!planSlug || autoOpenedPlanSlug === planSlug || !user || user.role !== 'SELLER') return;

        const selectedPlan = plans.find((plan) => plan.slug === planSlug);
        if (!selectedPlan) return;

        const amount = currentPrice(selectedPlan);
        if (amount <= 0) return;

        setCheckoutPlan({
            id: selectedPlan.id,
            name: selectedPlan.name,
            slug: selectedPlan.slug,
            amount,
        });
        setAutoOpenedPlanSlug(planSlug);
    }, [autoOpenedPlanSlug, billingPeriod, plans, searchParams, user]);

    const handleSelectPlan = async (planId: string, planSlug: PricingPlan['slug']) => {
        if (!enableInteraction) return;

        const selectedPlan = plans.find((plan) => plan.id === planId);
        if (!selectedPlan) return;

        if (!user) {
            router.push(`/auth/login?redirect=${encodeURIComponent(`/pricing?plan=${planSlug}`)}`);
            return;
        }

        if (user.role !== 'SELLER' || !user.sellerProfileId) {
            router.push('/become-a-seller');
            return;
        }

        const amount = currentPrice(selectedPlan);
        if (amount > 0) {
            setCheckoutPlan({
                id: selectedPlan.id,
                name: selectedPlan.name,
                slug: selectedPlan.slug,
                amount,
            });
            return;
        }

        setLoadingPlanId(planId);

        setTimeout(() => {
            try {
                Storage.upgradeVendorPlan(user.sellerProfileId, planSlug, {
                    billingPeriod,
                    paymentMethod: 'MANUAL',
                    paymentStatus: 'PAID',
                    priceAtPurchase: 0,
                });

                if (onSelectPlan) {
                    onSelectPlan(planId);
                }

                alert(`✅ Successfully upgraded to ${planSlug.toUpperCase()} plan!`);
                setLoadingPlanId(null);
            } catch (error) {
                console.error('Error selecting plan:', error);
                setLoadingPlanId(null);
            }
        }, 1000);
    };

    const handlePaymentSuccess = (payment: PaymentResult) => {
        if (!checkoutPlan || !user?.sellerProfileId) return;

        setLoadingPlanId(checkoutPlan.id);
        try {
            Storage.upgradeVendorPlan(user.sellerProfileId, checkoutPlan.slug, {
                billingPeriod,
                paymentMethod: payment.paymentMethod,
                paymentStatus: 'PAID',
                priceAtPurchase: checkoutPlan.amount,
                transactionId: payment.transactionId,
                providerReference: payment.providerReference,
            });

            if (onSelectPlan) {
                onSelectPlan(checkoutPlan.id);
            }

            setCheckoutPlan(null);
            router.push('/seller/dashboard/plan');
        } catch (error) {
            console.error('Error completing plan upgrade:', error);
        } finally {
            setLoadingPlanId(null);
        }
    };

    return (
        <div className="w-full space-y-12">
            {/* Currency & Billing Toggles */}
            <div className="flex flex-col items-center justify-center gap-4">
                {/* Region / Currency Selector */}
                <div className="inline-flex items-center gap-1 bg-[#f4f3f2] p-1.5 rounded-full border border-[#e3e2e1] shadow-xs">
                    <button
                        type="button"
                        onClick={() => setRegionCurrency('PKR')}
                        className={`cursor-pointer px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                            regionCurrency === 'PKR' ? 'bg-white text-[#003527] shadow-xs' : 'text-[#665d55] hover:text-[#1a1c1c]'
                        }`}
                    >
                        <span>🇵🇰 Pakistan (PKR)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRegionCurrency('AUD')}
                        className={`cursor-pointer px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                            regionCurrency === 'AUD' ? 'bg-[#0070ba] text-white shadow-xs' : 'text-[#665d55] hover:text-[#1a1c1c]'
                        }`}
                    >
                        <span>🇦🇺 Australia (AUD • PayPal)</span>
                    </button>
                </div>

                {/* Billing Toggle */}
                {showToggle && (
                    <div className="inline-flex items-center gap-3 bg-[#f4f3f2] p-1 rounded-full border border-[#e3e2e1]">
                        <button
                            onClick={() => setBillingPeriod('monthly')}
                            className={`cursor-pointer px-6 py-2 rounded-full text-xs font-bold transition-all ${billingPeriod === 'monthly'
                                    ? 'bg-white text-[#003527] shadow-md'
                                    : 'text-[#665d55] hover:text-[#1a1c1c]'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingPeriod('yearly')}
                            className={`cursor-pointer px-6 py-2 rounded-full text-xs font-bold transition-all ${billingPeriod === 'yearly'
                                    ? 'bg-white text-[#003527] shadow-md'
                                    : 'text-[#665d55] hover:text-[#1a1c1c]'
                                }`}
                        >
                            Yearly <span className="text-[#cca72f]">Save 17%</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative bg-white rounded-3xl overflow-hidden border-2 transition-all duration-300 transform hover:shadow-2xl cursor-default ${plan.highlighted
                                ? 'border-[#cca72f] shadow-2xl ring-2 ring-[#cca72f] ring-opacity-20 md:scale-105 hover:scale-110'
                                : 'border-[#e3e2e1] shadow-lg hover:scale-105'
                            }`}
                    >
                        {plan.badge && (
                            <div className="absolute top-0 right-0 bg-[#cca72f] text-white px-4 py-1 text-xs font-black rounded-bl-2xl">
                                {plan.badge}
                            </div>
                        )}

                        <div className="p-8 space-y-6">
                            {/* Icon & Title */}
                            <div>
                                <div className="mb-3 text-3xl">{plan.icon}</div>
                                <h3 className="text-xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                                    {plan.name}
                                </h3>
                                <p className="text-xs text-[#665d55] mt-1">{plan.description}</p>
                            </div>

                            {/* Price */}
                            <div>
                                {currentPrice(plan) === 0 ? (
                                    <div className="text-3xl font-black text-[#003527] font-['Plus_Jakarta_Sans']">
                                        Free
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-[#003527] font-['Plus_Jakarta_Sans']">
                                                {formatCurrency(currentPrice(plan), regionCurrency)}
                                            </span>
                                            <span className="text-xs text-[#665d55]">
                                                /{billingPeriod === 'monthly' ? 'month' : 'year'}
                                            </span>
                                        </div>
                                        {billingPeriod === 'yearly' && (
                                            <p className="text-xs text-[#cca72f] font-semibold mt-1">
                                                💰 Save {formatCurrency(regionCurrency === 'AUD' ? (plan.slug === 'pro' ? 38 : 78) : (plan.priceMonthly * 12 - plan.priceYearly), regionCurrency)} yearly
                                            </p>
                                        )}
                                        {regionCurrency === 'AUD' && (
                                            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0070ba] text-[10px] font-bold border border-blue-200">
                                                <span>🅿️ Pay with PayPal in AUD</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={() => handleSelectPlan(plan.id, plan.slug)}
                                disabled={loadingPlanId === plan.id || !enableInteraction}
                                className={`w-full py-3 px-4 rounded-full font-black text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 ${enableInteraction ? 'cursor-pointer' : 'cursor-default'
                                    } ${plan.highlighted
                                        ? 'bg-[#003527] text-white hover:bg-[#064e3b] shadow-lg disabled:opacity-70'
                                        : 'bg-[#f4f3f2] text-[#003527] hover:bg-[#e3e2e1] disabled:opacity-70'
                                    }`}
                            >
                                {loadingPlanId === plan.id ? 'Processing...' : plan.cta}
                            </button>

                            {/* Features List */}
                            <div className="border-t border-[#e3e2e1] pt-6 space-y-3">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <Check className="w-4 h-4 text-[#003527] flex-shrink-0 mt-0.5" />
                                        <span className="text-xs text-[#404944] leading-relaxed">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Feature Comparison Table */}
            {showComparison && (
                <div className="mt-12 space-y-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                            Detailed Feature Comparison
                        </h3>
                        <p className="text-xs text-[#665d55] mt-1">
                            Compare all features across our plans
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full bg-white rounded-3xl border border-[#e3e2e1] shadow-lg">
                            <thead>
                                <tr className="bg-[#f4f3f2] border-b border-[#e3e2e1]">
                                    <th className="px-6 py-4 text-left text-xs font-black text-[#1a1c1c] uppercase tracking-wider">
                                        Feature
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-[#1a1c1c] uppercase tracking-wider">
                                        Free
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-[#003527] uppercase tracking-wider bg-[#b0f0d6]/10">
                                        Pro
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-[#cca72f] uppercase tracking-wider">
                                        Featured
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {allFeatures.map((feature, idx) => (
                                    <tr
                                        key={feature}
                                        className={`border-b border-[#e3e2e1] hover:bg-[#faf9f8] transition-colors cursor-default ${idx % 2 === 0 ? 'bg-white' : 'bg-[#faf9f8]'
                                            }`}
                                    >
                                        <td className="px-6 py-4 text-xs font-semibold text-[#1a1c1c]">
                                            {feature}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {typeof featureMatrix[feature]?.free === 'boolean' ? (
                                                featureMatrix[feature]?.free ? (
                                                    <Check className="w-5 h-5 text-[#003527] mx-auto" />
                                                ) : (
                                                    <X className="w-5 h-5 text-[#d4d1ce] mx-auto" />
                                                )
                                            ) : (
                                                <span className="text-xs font-semibold text-[#665d55]">
                                                    {featureMatrix[feature]?.free}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center bg-[#b0f0d6]/10">
                                            {typeof featureMatrix[feature]?.pro === 'boolean' ? (
                                                featureMatrix[feature]?.pro ? (
                                                    <Check className="w-5 h-5 text-[#003527] mx-auto" />
                                                ) : (
                                                    <X className="w-5 h-5 text-[#d4d1ce] mx-auto" />
                                                )
                                            ) : (
                                                <span className="text-xs font-semibold text-[#003527]">
                                                    {featureMatrix[feature]?.pro}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {typeof featureMatrix[feature]?.featured === 'boolean' ? (
                                                featureMatrix[feature]?.featured ? (
                                                    <Check className="w-5 h-5 text-[#cca72f] mx-auto" />
                                                ) : (
                                                    <X className="w-5 h-5 text-[#d4d1ce] mx-auto" />
                                                )
                                            ) : (
                                                <span className="text-xs font-semibold text-[#cca72f]">
                                                    {featureMatrix[feature]?.featured}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* FAQ Section */}
            <div className="mt-12 space-y-4">
                <div className="text-center">
                    <h3 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                        Frequently Asked Questions
                    </h3>
                    <p className="text-xs text-[#665d55] mt-1">
                        Need help choosing the right plan?
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        {
                            q: 'Can I upgrade or downgrade anytime?',
                            a: 'Yes! Upgrade or downgrade your plan anytime from your dashboard. Changes take effect at your next billing cycle.',
                        },
                        {
                            q: 'What payment methods do you accept?',
                            a: 'We accept JazzCash, Easypaisa, Debit Cards, and Bank Transfers. International customers can use Visa/Mastercard.',
                        },
                        {
                            q: 'Is there a contract or commitment?',
                            a: 'No contracts! Pay month-to-month or save 17% with yearly billing. Cancel anytime.',
                        },
                        {
                            q: 'How do I get started?',
                            a: 'Choose your plan, fill in your business details, and you\'ll be live within 24 hours after verification.',
                        },
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-6 rounded-2xl border border-[#e3e2e1] shadow-xs hover:shadow-md hover:border-[#003527] transition-all duration-200 cursor-default"
                        >
                            <p className="text-xs font-black text-[#1a1c1c] mb-2">{item.q}</p>
                            <p className="text-xs text-[#665d55] leading-relaxed">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>

            {checkoutPlan && (
                <PaymentGateway
                    planName={`${checkoutPlan.name} (${regionCurrency === 'AUD' ? 'Australia' : 'Pakistan'})`}
                    amount={checkoutPlan.amount}
                    planSlug={checkoutPlan.slug}
                    currency={regionCurrency}
                    isAustralia={regionCurrency === 'AUD'}
                    billingPeriod={billingPeriod}
                    initialMethod={regionCurrency === 'AUD' ? 'paypal' : 'jazz_cash'}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setCheckoutPlan(null)}
                />
            )}
        </div>
    );
}

export default PricingCards;
