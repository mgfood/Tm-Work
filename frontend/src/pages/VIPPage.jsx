import React, { useState, useEffect } from 'react';
import { Check, ShieldCheck, Award, Zap, Star, TrendingUp, DollarSign, Wallet, Crown } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import vipService from '../api/vipService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const VIPPage = () => {
    const { t } = useTranslation();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [globalSettings, setGlobalSettings] = useState(null);
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansData, settingsData] = await Promise.all([
                    vipService.getPlans(),
                    vipService.getSettings()
                ]);
                setPlans(plansData.results || plansData);
                setGlobalSettings(settingsData);
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const initiatePurchase = (plan) => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.is_vip) {
            showToast(t('vip.already_active'), 'info');
            return;
        }

        if (user.balance < plan.total_price) {
            showToast(t('vip.insufficient_funds', { amount: Math.round(plan.total_price - user.balance) }), 'error');
            return;
        }

        setSelectedPlan(plan);
        setShowConfirmModal(true);
    };

    const confirmPurchase = async () => {
        if (!selectedPlan) return;

        try {
            setShowConfirmModal(false);
            setBuying(selectedPlan.id);
            await vipService.buyPlan(selectedPlan.id);
            await refreshUser();
            showToast(t('vip.success_message'), 'success');
            navigate('/dashboard');
        } catch (err) {
            showToast(err.response?.data?.error || t('vip.error_purchase'), 'error');
        } finally {
            setBuying(null);
            setSelectedPlan(null);
        }
    };

    if (loading) return <div className="flex-grow flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

    const regularComm = globalSettings?.regular_commission || 10;
    const vipComm = globalSettings?.vip_commission || 5;

    const getDurationText = (months) => {
        if (months === 1) return t('vip.plan_duration_one', { count: months });
        if (months > 1 && months < 5) return t('vip.plan_duration_few', { count: months });
        return t('vip.plan_duration_many', { count: months });
    };

    return (
        <div className="flex-grow bg-white">
            {/* Hero Section */}
            <section className="relative py-20 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-primary-400 font-bold text-sm mb-6 border border-white/5">
                        <Award size={16} /> {t('vip.hero_badge')}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
                        <Trans i18nKey="vip.hero_title">
                            Подключите <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-amber-400">Премиум</span> возможности
                        </Trans>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">{t('vip.hero_subtitle')}</p>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 group hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <TrendingUp size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{t('vip.benefit_comm_title', { vip: vipComm, regular: regularComm })}</h3>
                        <p className="text-slate-600">{t('vip.benefit_comm_desc')}</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 group hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Star size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{t('vip.benefit_search_title')}</h3>
                        <p className="text-slate-600">{t('vip.benefit_search_desc')}</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 group hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Zap size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{t('vip.benefit_badge_title')}</h3>
                        <p className="text-slate-600">{t('vip.benefit_badge_desc')}</p>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black mb-4">{t('vip.plans_title')}</h2>
                        <p className="text-slate-500">{t('vip.plans_subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map(plan => {
                            const Icon = {
                                'Zap': Zap,
                                'ShieldCheck': ShieldCheck,
                                'Award': Award,
                                'Star': Star,
                                'Crown': Crown
                            }[plan.badge_icon] || Award;
                            return (
                                <div key={plan.id} className={`p-10 rounded-[40px] bg-white border-2 flex flex-col relative ${plan.discount_percentage > 0 ? 'border-primary-500 shadow-2xl' : 'border-slate-100'}`}>
                                    {plan.discount_percentage > 0 && (
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest shadow-lg">
                                            {t('vip.plan_benefit', { percentage: plan.discount_percentage })}
                                        </div>
                                    )}
                                    <div className="mb-8">
                                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6" style={{ backgroundColor: `${plan.badge_color}20`, color: plan.badge_color }}>
                                            <Icon size={32} />
                                        </div>
                                        <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                                        <p className="text-slate-500 text-sm">{getDurationText(plan.months)}</p>
                                    </div>

                                    <div className="mb-10 flex items-baseline gap-2">
                                        <span className="text-5xl font-black tracking-tight">{Math.round(plan.total_price / plan.months)}</span>
                                        <span className="text-slate-400 font-bold uppercase text-xs">{t('vip.per_month')}</span>
                                    </div>

                                    <div className="space-y-4 mb-10 flex-grow">
                                        <div className="flex items-center gap-3 text-slate-700 font-medium">
                                            <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check size={14} /></div>
                                            {t('vip.feature_comm', { vip: vipComm, regular: regularComm })}
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-700 font-medium">
                                            <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check size={14} /></div>
                                            {t('vip.feature_priority')}
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-700 font-medium">
                                            <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check size={14} /></div>
                                            {t('vip.feature_badge', { name: plan.name })}
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-700 font-medium">
                                            <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check size={14} /></div>
                                            {t('vip.feature_access')}
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-50">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-slate-400 text-sm font-bold">{t('vip.total_amount')}</span>
                                            <span className="text-xl font-black text-slate-900">{plan.total_price} TMT</span>
                                        </div>
                                        <button
                                            onClick={() => initiatePurchase(plan)}
                                            disabled={buying === plan.id || user?.is_vip}
                                            className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl ${user?.is_vip
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                                : plan.discount_percentage > 0
                                                    ? 'bg-primary-600 text-white shadow-primary-200 hover:bg-primary-700'
                                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                                }`}
                                        >
                                            {buying === plan.id ? t('vip.btn_activating') : (user?.is_vip ? t('vip.btn_active') : t('vip.btn_activate'))}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Wallet Info */}
            {user && (
                <div className="fixed bottom-10 right-10 z-20">
                    <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase text-slate-400">{t('vip.your_balance')}</div>
                            <div className="text-lg font-black text-slate-900">{user.balance} TMT</div>
                        </div>
                        <button onClick={() => navigate('/wallet')} className="ml-2 w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center hover:bg-primary-200 transition-all">
                            <DollarSign size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && selectedPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                <Crown size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">{t('vip.modal_confirm_title')}</h3>
                            <p className="text-slate-600 mb-8 leading-relaxed">
                                <Trans i18nKey="vip.modal_confirm_text" values={{ name: selectedPlan.name, months: selectedPlan.months, price: selectedPlan.total_price }}>
                                    Активировать план <span className="font-black text-primary-600">{{name}}</span> на <span className="font-bold">{{months}} мес.</span> за <span className="font-black">{{price}} TMT</span>?
                                </Trans>
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmPurchase}
                                    className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-200"
                                >
                                    {t('vip.modal_btn_confirm')}
                                </button>
                                <button
                                    onClick={() => { setShowConfirmModal(false); setSelectedPlan(null); }}
                                    className="w-full py-5 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all"
                                >
                                    {t('vip.modal_btn_cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VIPPage;