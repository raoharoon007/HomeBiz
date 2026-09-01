import React, { useState, useEffect } from 'react';
import { Storage } from '../lib/storage';
import { useAuth } from '../lib/authContext';
import { PricingPlan, SellerSubscription } from '../types';
import { Edit, Save, X, Plus, Users, DollarSign, TrendingUp } from 'lucide-react';

export function AdminPricingManager() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [subscriptions, setSubscriptions] = useState<SellerSubscription[]>([]);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [editedPlan, setEditedPlan] = useState<Partial<PricingPlan>>({});
    const [activeTab, setActiveTab] = useState<'plans' | 'subscribers' | 'revenue'>('plans');

    useEffect(() => {
        if (user?.role !== 'ADMIN') {
            return;
        }
        const fetchedPlans = Storage.getPricingPlans();
        const fetchedSubs = Storage.getSubscriptions();
        setPlans(fetchedPlans);
        setSubscriptions(fetchedSubs);
    }, [user]);

    const handleEditPlan = (plan: PricingPlan) => {
        setEditingPlanId(plan.id);
        setEditedPlan({ ...plan });
    };

    const handleSavePlan = () => {
        if (editingPlanId && editedPlan.priceMonthly !== undefined && editedPlan.priceYearly !== undefined) {
            Storage.updatePricingPlan(editingPlanId, {
                priceMonthly: editedPlan.priceMonthly,
                priceYearly: editedPlan.priceYearly,
                active: editedPlan.active,
            });
            setPlans(Storage.getPricingPlans());
            setEditingPlanId(null);
            alert('✅ Pricing plan updated successfully!');
        }
    };

    const handleCancel = () => {
        setEditingPlanId(null);
        setEditedPlan({});
    };

    const totalRevenue = subscriptions
        .filter((s) => s.paymentStatus === 'PAID')
        .reduce((sum, s) => sum + s.priceAtPurchase, 0);

    const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE');

    if (user?.role !== 'ADMIN') {
        return (
            <div className="max-w-md mx-auto my-16 text-center bg-white rounded-3xl p-8 border border-[#e3e2e1] space-y-4 shadow-sm">
                <h2 className="text-xl font-bold text-[#1a1c1c]">Admin Access Required</h2>
                <p className="text-xs text-[#665d55]">You need admin privileges to access the pricing manager.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                    Pricing Management
                </h1>
                <p className="text-sm text-[#665d55]">
                    Manage subscription plans, pricing, and view subscriber analytics
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-[#b0f0d6]/20 rounded-2xl border border-[#95d3ba]/40">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-[#003527] uppercase tracking-wider">
                                Total Subscribers
                            </p>
                            <p className="text-2xl font-black text-[#003527] mt-1">{activeSubscriptions.length}</p>
                        </div>
                        <Users className="w-8 h-8 text-[#003527] opacity-30" />
                    </div>
                </div>

                <div className="p-6 bg-[#FFF1E7] rounded-2xl border border-[#ffe088]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-[#735c00] uppercase tracking-wider">
                                Monthly Revenue
                            </p>
                            <p className="text-2xl font-black text-[#735c00] mt-1">PKR {totalRevenue.toLocaleString()}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-[#735c00] opacity-30" />
                    </div>
                </div>

                <div className="p-6 bg-[#faf9f8] rounded-2xl border border-[#e3e2e1]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-[#665d55] uppercase tracking-wider">
                                Active Plans
                            </p>
                            <p className="text-2xl font-black text-[#1a1c1c] mt-1">{plans.filter((p) => p.active).length}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-[#665d55] opacity-30" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#e3e2e1]">
                {[
                    { id: 'plans' as const, label: 'Pricing Plans' },
                    { id: 'subscribers' as const, label: 'Subscribers' },
                    { id: 'revenue' as const, label: 'Revenue Analytics' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === tab.id
                                ? 'text-[#003527] border-[#003527]'
                                : 'text-[#665d55] border-transparent hover:text-[#1a1c1c]'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'plans' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className="bg-white rounded-3xl overflow-hidden border-2 border-[#e3e2e1] shadow-lg hover:shadow-xl transition-all"
                            >
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans'] capitalize">
                                                {plan.name}
                                            </h3>
                                            <p className="text-xs text-[#665d55] mt-1">{plan.description}</p>
                                        </div>
                                        {plan.active ? (
                                            <span className="text-[10px] bg-[#b0f0d6] text-[#003527] px-2 py-0.5 rounded-full font-bold">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="text-[10px] bg-[#f4f3f2] text-[#665d55] px-2 py-0.5 rounded-full font-bold">
                                                Inactive
                                            </span>
                                        )}
                                    </div>

                                    {editingPlanId === plan.id ? (
                                        <div className="space-y-3 bg-[#faf9f8] p-4 rounded-2xl">
                                            <div>
                                                <label className="block text-xs font-bold text-[#1a1c1c] mb-1">Monthly Price (PKR)</label>
                                                <input
                                                    type="number"
                                                    value={editedPlan.priceMonthly || 0}
                                                    onChange={(e) => setEditedPlan({ ...editedPlan, priceMonthly: Number(e.target.value) })}
                                                    className="w-full px-3 py-2 bg-white border border-[#e3e2e1] rounded-lg text-xs focus:border-[#003527] outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-[#1a1c1c] mb-1">Yearly Price (PKR)</label>
                                                <input
                                                    type="number"
                                                    value={editedPlan.priceYearly || 0}
                                                    onChange={(e) => setEditedPlan({ ...editedPlan, priceYearly: Number(e.target.value) })}
                                                    className="w-full px-3 py-2 bg-white border border-[#e3e2e1] rounded-lg text-xs focus:border-[#003527] outline-none"
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={handleSavePlan}
                                                    className="flex-1 px-3 py-2 bg-[#003527] text-white rounded-lg text-xs font-bold hover:bg-[#064e3b] transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Save className="w-3 h-3" /> Save
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="flex-1 px-3 py-2 bg-[#f4f3f2] text-[#665d55] rounded-lg text-xs font-bold hover:bg-[#e3e2e1] transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <X className="w-3 h-3" /> Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="text-xs text-[#665d55]">Monthly Price</p>
                                                <p className="text-2xl font-black text-[#003527]">
                                                    {plan.priceMonthly === 0 ? 'Free' : `PKR ${plan.priceMonthly.toLocaleString()}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#665d55]">Yearly Price</p>
                                                <p className="text-xl font-black text-[#735c00]">
                                                    PKR {plan.priceYearly.toLocaleString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleEditPlan(plan)}
                                                className="w-full mt-4 px-4 py-2 bg-[#003527] text-white rounded-lg text-xs font-bold hover:bg-[#064e3b] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <Edit className="w-3 h-3" /> Edit Pricing
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'subscribers' && (
                <div className="bg-white rounded-3xl border border-[#e3e2e1] shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-[#f4f3f2] border-b border-[#e3e2e1]">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
                                        Vendor ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
                                        Plan
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
                                        Renewal Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
                                        Price
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.map((sub, idx) => (
                                    <tr key={sub.id} className={`border-b border-[#e3e2e1] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#faf9f8]'}`}>
                                        <td className="px-6 py-4 text-xs font-mono text-[#665d55]">{sub.vendorId.slice(0, 8)}...</td>
                                        <td className="px-6 py-4 text-xs font-bold text-[#1a1c1c] capitalize">{sub.plan}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${sub.status === 'ACTIVE'
                                                        ? 'bg-[#b0f0d6] text-[#003527]'
                                                        : 'bg-[#f4f3f2] text-[#665d55]'
                                                    }`}
                                            >
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-[#665d55]">
                                            {new Date(sub.renewalDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-[#003527]">
                                            PKR {sub.priceAtPurchase.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'revenue' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-[#e3e2e1] shadow-xs space-y-4">
                        <h3 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">Revenue Summary</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-[#b0f0d6]/20 rounded-2xl border border-[#95d3ba]/40">
                                <p className="text-[10px] font-bold text-[#003527] uppercase tracking-wider">Total Revenue (Paid)</p>
                                <p className="text-2xl font-black text-[#003527] mt-2">PKR {totalRevenue.toLocaleString()}</p>
                            </div>

                            <div className="p-4 bg-[#FFF1E7] rounded-2xl border border-[#ffe088]">
                                <p className="text-[10px] font-bold text-[#735c00] uppercase tracking-wider">Average Plan Price</p>
                                <p className="text-2xl font-black text-[#735c00] mt-2">
                                    PKR {activeSubscriptions.length > 0 ? Math.round(totalRevenue / activeSubscriptions.length).toLocaleString() : 0}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[#f4f3f2]">
                            <p className="text-xs text-[#665d55] mb-3">Subscribers by Plan:</p>
                            {['free', 'pro', 'featured'].map((planType) => {
                                const count = subscriptions.filter((s) => s.plan === planType).length;
                                const percentage = activeSubscriptions.length > 0 ? (count / activeSubscriptions.length) * 100 : 0;
                                return (
                                    <div key={planType} className="mb-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-[#1a1c1c] capitalize">{planType} Plan</span>
                                            <span className="text-xs font-bold text-[#665d55]">{count} ({Math.round(percentage)}%)</span>
                                        </div>
                                        <div className="w-full bg-[#f4f3f2] rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${planType === 'featured' ? 'bg-[#cca72f]' : planType === 'pro' ? 'bg-[#003527]' : 'bg-[#95d3ba]'
                                                    }`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPricingManager;
