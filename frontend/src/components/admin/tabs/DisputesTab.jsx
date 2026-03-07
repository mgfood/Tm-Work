import React, { useState, useEffect } from 'react';
import {
    Scale, Loader2
} from 'lucide-react';
import adminService from '../../../api/adminService';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';

const DisputesTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [jobs, setJobs] = useState([]);
    const [escrows, setEscrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [jobsData, escrowData] = await Promise.all([
                adminService.getAllJobs(),
                adminService.getAllEscrows().catch(() => ({ results: [] }))
            ]);
            setJobs(Array.isArray(jobsData.results) ? jobsData.results : (Array.isArray(jobsData) ? jobsData : []));
            setEscrows(Array.isArray(escrowData.results) ? escrowData.results : (Array.isArray(escrowData) ? escrowData : []));
        } catch (err) {
            console.error('Failed to fetch dispute data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleForceRelease = async (id) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('admin.actions.confirm_force_release'),
            variant: 'warning'
        });
        if (!isConfirmed) return;

        const reason = await confirm({
            type: 'prompt',
            title: t('admin.actions.reason_title'),
            message: t('admin.actions.reason_desc'),
            inputPlaceholder: t('admin.actions.reason_placeholder'),
            confirmText: t('admin.actions.release_funds'),
            variant: 'success'
        });
        if (!reason) return;
        try {
            setActionLoading(true);
            await adminService.forceReleaseEscrow(id, reason);
            showToast(t('admin.actions.escrow_released'), 'success');
            await fetchData();
        } catch (err) {
            showToast(err.response?.data?.error || t('admin.actions.error_force_release'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleForceRefund = async (id) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('admin.actions.confirm_force_refund'),
            variant: 'warning'
        });
        if (!isConfirmed) return;

        const reason = await confirm({
            type: 'prompt',
            title: t('admin.actions.reason_title'),
            message: t('admin.actions.reason_desc'),
            inputPlaceholder: t('admin.actions.reason_placeholder'),
            confirmText: t('admin.actions.refund_funds'),
            variant: 'danger'
        });
        if (!reason) return;
        try {
            setActionLoading(true);
            await adminService.forceRefundEscrow(id, reason);
            showToast(t('admin.actions.escrow_refunded'), 'success');
            await fetchData();
        } catch (err) {
            showToast(err.response?.data?.error || t('admin.actions.error_force_refund'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
    );

    const disputeJobs = jobs.filter(j => j.status === 'DISPUTE');

    return (
        <div data-testid="disputes-tab" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {disputeJobs.length === 0 ? (
                <div data-testid="disputes-empty" className="premium-card p-20 text-center text-slate-400">
                    <Scale size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold">{t('admin.disputes.empty')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {disputeJobs.map(job => {
                        const escrow = escrows.find(e => e.job === job.id);
                        return (
                            <div key={job.id} className="premium-card p-8 border-l-4 border-l-red-500">
                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase">{t('admin.disputes.title')}</span>
                                            <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                                        </div>
                                        <p className="text-slate-500 mb-6 text-sm">{t('admin.jobs_table.id')}: {job.id} | {t('admin.jobs_table.budget')}: {job.budget} TMT</p>

                                        <div className="grid grid-cols-2 gap-8 py-6 border-t border-slate-100">
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('admin.jobs_table.client')}</div>
                                                <div className="font-bold text-slate-700">{job.client_email}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('admin.jobs_table.freelancer')}</div>
                                                <div className="font-bold text-slate-700">{job.freelancer_email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex flex-col gap-3 min-w-[240px]">
                                        <button
                                            onClick={() => escrow && handleForceRelease(escrow.id)}
                                            disabled={actionLoading}
                                            className="w-full py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            {actionLoading ? t('common.loading') : t('admin.disputes.btn_release')}
                                        </button>
                                        <button
                                            onClick={() => escrow && handleForceRefund(escrow.id)}
                                            disabled={actionLoading}
                                            className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            {actionLoading ? t('common.loading') : t('admin.disputes.btn_refund')}
                                        </button>
                                        <button className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">
                                            {t('admin.disputes.btn_split')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DisputesTab;
