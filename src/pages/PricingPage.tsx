import React from 'react';
import { Link } from '../lib/navigation';
import { PricingCards } from '../components/marketplace/PricingCards';
import { useAuth } from '../lib/authContext';
import { Check, X, ArrowRight, Zap } from 'lucide-react';

export function PricingPage() {
    const { user } = useAuth();

    const faqs = [
        {
            question: 'Can I change my plan anytime?',
            answer:
                'Yes! You can upgrade or downgrade your plan at any time from your seller dashboard. Changes take effect immediately.',
        },
        {
            question: 'What payment methods do you accept?',
            answer:
                'We accept JazzCash, Easypaisa, and Debit/Credit Cards (Visa, Mastercard). All payments are secure and encrypted.',
        },
        {
            question: 'Is there a free plan?',
            answer:
                'Yes! Our Free plan includes 5 active listings, basic seller profile, and customer support. Perfect for getting started.',
        },
        {
            question: 'Do you offer refunds?',
            answer:
                'We offer a 7-day money-back guarantee if you upgrade and change your mind. Contact our support team for refunds.',
        },
        {
            question: 'How do renewals work?',
            answer:
                'Plans auto-renew on your renewal date unless you cancel. We send reminders 7 days before renewal. You can manage auto-renewal from your account settings.',
        },
        {
            question: 'Can I get a custom plan?',
            answer:
                'For large businesses or special requirements, contact our sales team at sales@homebiz.pk for custom pricing options.',
        },
    ];

    const comparisonFeatures = [
        { name: 'Active Listings', free: '5', pro: '25', featured: 'Unlimited' },
        { name: 'Seller Profile', free: 'Basic', pro: 'Enhanced', featured: 'Premium' },
        { name: 'Customer Support', free: 'Email', pro: 'Phone + Email', featured: '24/7 Priority' },
        { name: 'Featured Badge', free: false, pro: true, featured: true },
        { name: 'Analytics Dashboard', free: false, pro: true, featured: true },
        { name: 'Promoted Listings', free: '0', pro: '5/month', featured: '20/month' },
        { name: 'Custom Branding', free: false, pro: false, featured: true },
        { name: 'API Access', free: false, pro: false, featured: true },
    ];

    return (
        <div className="space-y-20 pb-20">
            {/* Hero Section */}
            <div className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-12">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#b0f0d6]/20 border border-[#95d3ba]/40">
                        <Zap className="w-3.5 h-3.5 text-[#003527]" />
                        <span className="text-xs font-bold text-[#003527] uppercase tracking-wider">
                            Simple Transparent Pricing
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans'] leading-tight">
                        Seller Plans That Grow With You
                    </h1>

                    <p className="text-sm sm:text-base text-[#665d55] max-w-2xl mx-auto">
                        Choose the perfect plan for your business. Start free, upgrade anytime. All plans include full access to
                        HomeBiz marketplace with no hidden fees.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                        {!user || user.role === 'CUSTOMER' ? (
                            <Link
                                href="/become-a-seller"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#003527] text-white font-bold text-sm hover:bg-[#064e3b] transition-colors cursor-pointer"
                            >
                                Start Selling Now
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Pricing Cards Section */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <PricingCards onSelectPlan={() => { }} showComparison={true} showToggle={true} enableInteraction={true} />
            </div>

            {/* Features Comparison Table */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="text-center space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                        Detailed Feature Comparison
                    </h2>
                    <p className="text-sm text-[#665d55]">See what each plan includes</p>
                </div>

                <div className="overflow-x-auto bg-white rounded-3xl border border-[#e3e2e1] shadow-lg">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#f4f3f2] border-b border-[#e3e2e1]">
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
                                    Features
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
                                    Free
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-[#003527] uppercase tracking-wider">
                                    Pro
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-[#735c00] uppercase tracking-wider">
                                    Featured
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonFeatures.map((feature, idx) => (
                                <tr key={idx} className={`border-b border-[#e3e2e1] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#faf9f8]'}`}>
                                    <td className="px-6 py-4 text-sm font-semibold text-[#1a1c1c]">{feature.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        {typeof feature.free === 'boolean' ? (
                                            feature.free ? (
                                                <Check className="w-4 h-4 text-[#003527] mx-auto" />
                                            ) : (
                                                <X className="w-4 h-4 text-[#d1d0ce] mx-auto" />
                                            )
                                        ) : (
                                            <span className="text-xs font-semibold text-[#665d55]">{feature.free}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {typeof feature.pro === 'boolean' ? (
                                            feature.pro ? (
                                                <Check className="w-4 h-4 text-[#003527] mx-auto" />
                                            ) : (
                                                <X className="w-4 h-4 text-[#d1d0ce] mx-auto" />
                                            )
                                        ) : (
                                            <span className="text-xs font-semibold text-[#003527]">{feature.pro}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {typeof feature.featured === 'boolean' ? (
                                            feature.featured ? (
                                                <Check className="w-4 h-4 text-[#735c00] mx-auto" />
                                            ) : (
                                                <X className="w-4 h-4 text-[#d1d0ce] mx-auto" />
                                            )
                                        ) : (
                                            <span className="text-xs font-semibold text-[#735c00]">{feature.featured}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="text-center space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-sm text-[#665d55]">Everything you need to know about our plans</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <details
                            key={idx}
                            className="group bg-white rounded-2xl border border-[#e3e2e1] p-5 hover:border-[#003527] cursor-pointer transition-colors"
                        >
                            <summary className="flex items-center justify-between font-semibold text-[#1a1c1c] text-sm cursor-pointer">
                                <span>{faq.question}</span>
                                <span className="text-[#665d55] group-open:rotate-180 transition-transform">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                </span>
                            </summary>
                            <p className="text-xs text-[#665d55] mt-3">{faq.answer}</p>
                        </details>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-r from-[#003527] to-[#064e3b] rounded-3xl p-8 sm:p-12 text-center space-y-5">
                    <h2 className="text-2xl sm:text-3xl font-black text-white font-['Plus_Jakarta_Sans']">
                        Ready to Grow Your Business?
                    </h2>

                    <p className="text-sm text-[#b0f0d6] max-w-2xl mx-auto">
                        Join thousands of successful sellers on HomeBiz. Choose your plan and start reaching customers today.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                        {!user || user.role === 'CUSTOMER' ? (
                            <Link
                                href="/become-a-seller"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#cca72f] text-[#1a1c1c] font-bold text-sm hover:bg-[#e6c350] transition-colors cursor-pointer"
                            >
                                Become a Seller
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : user?.role === 'SELLER' ? (
                            <Link
                                href="/seller/dashboard/plan"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#cca72f] text-[#1a1c1c] font-bold text-sm hover:bg-[#e6c350] transition-colors cursor-pointer"
                            >
                                Go to My Plan
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : null}

                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 text-white font-bold text-sm hover:bg-white/30 transition-colors cursor-pointer border border-white/30"
                        >
                            Contact Sales
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PricingPage;
