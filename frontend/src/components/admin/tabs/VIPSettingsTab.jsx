import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import {
    DollarSign, Award, Plus, Loader2, Save, X, Trash2, Eye, EyeOff,
    Zap, ShieldCheck, Star, Crown
} from 'lucide-react';
import apiClient from '../../../api/client';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';

const PLAN_ICONS = {
    'Award': Award,
    'Zap': Zap,
    'ShieldCheck': ShieldCheck,
    'Star': Star,
    'Crown': Crown
};

const PlanIcon = ({ name, size = 28, className = "" }) => {
    const Icon = PLAN_ICONS[name] || Award;
    return <Icon size={size} className={className} />;
};

const VIPSettingsTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [vipPlans, setVipPlans] = useState([]);
    const [globalSettings, setGlobalSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planFormData, setPlanFormData] = useState({
        name: '',
        months: 1,
        price_per_month: '',
        discount_percentage: 0,
        badge_icon: 'Award',
        badge_color: '#f59e0b'
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [plansRes, settingsRes] = await Promise.all([
                apiClient.get('/vip/plans/?all=true').catch(() => ({ data: { results: [] } })),
                apiClient.get('/vip/settings/').catch(() => ({ data: {} }))
            ]);
            setVipPlans(plansRes.data?.results || plansRes.data || []);
            setGlobalSettings(settingsRes.data);
        } catch (err) {
            console.error('Failed to fetch VIP data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setEditingPlan(null);
        setPlanFormData({
            name: '',
            months: 1,
            price_per_month: '',
            discount_percentage: 0,
            badge_icon: 'Award',
            badge_color: '#f59e0b'
        });
    };

    const handleSavePlan = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            if (editingPlan) {
                await apiClient.put(`/vip/plans/${editingPlan.id}/`, planFormData);
                showToast(t('admin.actions.plan_updated'), 'success');
            } else {
                await apiClient.post('/vip/plans/', planFormData);
                showToast(t('admin.actions.plan_created'), 'success');
            }
            resetForm();
            await fetchData();
        } catch (err) {
            showToast(err.response?.data?.error || t('admin.actions.error_save_plan'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTogglePlanActive = async (planId) => {
        try {
            setActionLoading(true);
            const response = await apiClient.post(`/vip/plans/${planId}/toggle-active/`);
            showToast(response.data.is_active ? t('admin.actions.plan_activated') : t('admin.actions.plan_hidden'), 'success');
            await fetchData();
        } catch (err) {
            showToast(err.response?.data?.error || t('admin.actions.error_toggle_plan'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeletePlan = async (planId) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('admin.actions.confirm_delete_plan'),
            variant: 'danger'
        });
        if (!isConfirmed) return;
        try {
            setActionLoading(true);
            await apiClient.delete(`/vip/plans/${planId}/`);
            showToast(t('admin.actions.plan_deleted'), 'success');
            await fetchData();
            if (editingPlan?.id === planId) resetForm();
        } catch (err) {
            showToast(err.response?.data?.error || t('admin.actions.error_delete_plan'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
    );

    return (
        <div data-testid="vip-settings-tab" className="space-y-12 animate-in fade-in duration-500">
            {/* Commission Settings */}
            <div className="premium-card p-10 bg-white shadow-xl shadow-slate-200/50">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900 border-b pb-4">
                    <DollarSign className="text-green-500" /> {t('admin.vip_mgmt.commissions_title')}
                </h3>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    try {
                        setActionLoading(true);
                        await apiClient.put('/vip/settings/1/', {
                            regular_commission: formData.get('regular'),
                            vip_commission: formData.get('vip')
                        });
                        showToast(t('common.saved'), 'success');
                        await fetchData();
                    } catch (err) { showToast(t('common.error_saving'), 'error'); } finally { setActionLoading(false); }
                }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase text-slate-400 tracking-widest">{t('admin.vip_mgmt.regular_comm')}</label>
                        <div className="relative">
                            <input name="regular" type="number" step="0.01" defaultValue={globalSettings?.regular_commission} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold text-lg transition-all text-slate-900" />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase text-slate-400 tracking-widest">{t('admin.vip_mgmt.vip_comm')}</label>
                        <div className="relative">
                            <input name="vip" type="number" step="0.01" defaultValue={globalSettings?.vip_commission} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold text-lg transition-all text-slate-900" />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <button disabled={actionLoading} className="btn-primary px-12 py-5 flex items-center gap-2 shadow-lg shadow-primary-500/20">
                            {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {t('admin.vip_mgmt.btn_save_comm')}
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* VIP Plans List */}
                <div className="premium-card p-10 bg-white shadow-xl shadow-slate-200/50 h-full">
                    <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900 border-b pb-4">
                        <Award className="text-amber-500" /> {t('admin.vip_mgmt.plans_title')}
                    </h3>
                    <div className="space-y-4">
                        {vipPlans.map(plan => (
                            <div key={plan.id} className={`p-6 rounded-3xl border transition-all flex items-center justify-between group ${editingPlan?.id === plan.id ? 'border-primary-500 bg-primary-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: plan.badge_color }}>
                                        <PlanIcon name={plan.badge_icon} size={28} />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 text-lg">{plan.name}</div>
                                        <div className="text-sm text-slate-500 font-bold">
                                            {plan.months} {t('common.months')} | <span className="text-primary-600">{plan.price_per_month} TMT</span>/{t('common.mo')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => {
                                            setEditingPlan(plan);
                                            setPlanFormData({
                                                name: plan.name,
                                                months: plan.months,
                                                price_per_month: plan.price_per_month,
                                                discount_percentage: plan.discount_percentage,
                                                badge_icon: plan.badge_icon,
                                                badge_color: plan.badge_color
                                            });
                                        }}
                                        className="p-3 bg-white text-slate-400 hover:text-primary-600 rounded-xl shadow-sm border border-slate-100 transition-all font-bold flex items-center gap-2"
                                        title={t('common.edit')}
                                    >
                                        <Plus size={18} className="rotate-45" /> {t('common.btn_edit')}
                                    </button>
                                    <button
                                        onClick={() => handleTogglePlanActive(plan.id)}
                                        className={`p-3 bg-white rounded-xl shadow-sm border border-slate-100 transition-all ${plan.is_active ? 'text-slate-400 hover:text-amber-500' : 'text-green-500 hover:bg-green-50'}`}
                                        title={plan.is_active ? t('common.hide') : t('common.show')}
                                    >
                                        {plan.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleDeletePlan(plan.id)}
                                        className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-xl shadow-sm border border-slate-100 transition-all"
                                        title={t('common.delete')}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {vipPlans.length === 0 && (
                            <div className="text-center py-10 text-slate-400 font-bold italic">{t('admin.vip_mgmt.no_plans')}</div>
                        )}
                    </div>
                </div>

                {/* Plan Creation/Edit Form (Persistent on page) */}
                <div className="premium-card p-10 bg-white text-slate-900 shadow-2xl border border-slate-100 sticky top-8">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                        <h3 className="text-2xl font-black flex items-center gap-3">
                            {editingPlan ? (
                                <><Save className="text-primary-600" /> {t('admin.vip_mgmt.edit_plan_title')}</>
                            ) : (
                                <><Plus className="text-primary-600" /> {t('admin.vip_mgmt.create_plan_title')}</>
                            )}
                        </h3>
                        {editingPlan && (
                            <button onClick={resetForm} className="text-slate-400 hover:text-red-500 transition-all flex items-center gap-1 font-black text-xs uppercase tracking-widest">
                                <X size={16} /> {t('common.cancel')}
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSavePlan} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('admin.vip_mgmt.plan_name')}</label>
                            <input required value={planFormData.name} onChange={e => setPlanFormData({ ...planFormData, name: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-slate-400" placeholder="e.g. Premium Plus" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('admin.vip_mgmt.months')}</label>
                                <input type="number" required value={planFormData.months} onChange={e => setPlanFormData({ ...planFormData, months: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('admin.vip_mgmt.price')} (TMT)</label>
                                <input type="number" step="0.01" required value={planFormData.price_per_month} onChange={e => setPlanFormData({ ...planFormData, price_per_month: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('admin.vip_mgmt.discount')} (%)</label>
                                <input type="number" required value={planFormData.discount_percentage} onChange={e => setPlanFormData({ ...planFormData, discount_percentage: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('admin.plan_modal.color_label')}</label>
                                <div className="flex gap-3 items-center h-[66px]">
                                    <input
                                        type="color"
                                        value={planFormData.badge_color}
                                        onChange={e => setPlanFormData({ ...planFormData, badge_color: e.target.value })}
                                        className="w-16 h-full bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer p-2"
                                    />
                                    <div className="flex-grow font-mono text-xs text-slate-400 uppercase font-bold">{planFormData.badge_color}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('admin.plan_modal.icon_label')}</label>
                            <div className="grid grid-cols-5 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-3xl">
                                {Object.keys(PLAN_ICONS).map(iconName => (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setPlanFormData({ ...planFormData, badge_icon: iconName })}
                                        className={`aspect-square rounded-2xl flex items-center justify-center transition-all ${planFormData.badge_icon === iconName ? 'bg-primary-600 text-white scale-110 shadow-lg shadow-primary-600/20' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                                    >
                                        <PlanIcon name={iconName} size={20} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="submit" disabled={actionLoading} className="flex-grow btn-primary py-5 bg-primary-600 hover:bg-primary-500 shadow-xl shadow-primary-600/30 text-lg">
                                {actionLoading ? <Loader2 className="animate-spin mx-auto" /> : (editingPlan ? t('common.save') : t('admin.vip_mgmt.btn_create_plan'))}
                            </button>
                            {editingPlan && (
                                <button type="button" onClick={resetForm} className="px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-200 transition-all flex items-center justify-center">
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VIPSettingsTab;
