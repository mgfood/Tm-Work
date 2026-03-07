import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../context/ConfirmContext';
import adminService from '../../api/adminService';

const JobEditModal = ({ isOpen, job, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        deadline: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (job) {
            setFormData({
                title: job.title || '',
                description: job.description || '',
                budget: job.budget || '',
                deadline: job.deadline ? job.deadline.split('T')[0] : ''
            });
        }
    }, [job]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await adminService.updateJob(job.id, formData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || t('admin.job_edit.update_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleForceStatus = async (newStatus) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('admin.job_edit.confirm_status', { status: newStatus }),
            variant: 'warning'
        });

        if (!isConfirmed) return;

        setLoading(true);
        setError('');

        try {
            const reason = await confirm({
                type: 'prompt',
                title: t('admin.job_edit.reason_prompt'),
                message: t('admin.job_edit.reason_desc'),
                inputPlaceholder: t('admin.job_edit.reason_placeholder'),
                confirmText: t('common.save'),
                variant: 'info'
            });

            if (!reason) {
                setLoading(false);
                return;
            }

            await adminService.forceJobStatus(job.id, newStatus, reason);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || t('admin.job_edit.update_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('admin.job_edit.confirm_delete'),
            variant: 'danger'
        });

        if (!isConfirmed) return;

        setLoading(true);
        setError('');

        try {
            await adminService.deleteJob(job.id);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || t('admin.job_edit.update_error'));
        } finally {
            setLoading(false);
        }
    };

    const statuses = ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'DISPUTE', 'CANCELLED'];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[40px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto premium-card">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{t('admin.job_edit.title')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.job_edit.label_title')}</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.job_edit.label_description')}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">{t('admin.job_edit.label_budget')}</label>
                            <input
                                type="number"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('admin.job_edit.label_deadline')}</label>
                            <input
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Status Management */}
                    <div className="border-t pt-6">
                        <h3 className="font-semibold mb-3">{t('admin.job_edit.status_mgmt')}</h3>
                        <p className="text-sm text-gray-600 mb-3">{t('admin.job_edit.current_status')} <span className="font-semibold">{job?.status}</span></p>
                        <div className="flex flex-wrap gap-2">
                            {statuses.map(status => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleForceStatus(status)}
                                    className={`px-4 py-2 rounded-xl text-sm transition-colors ${job?.status === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                    disabled={loading}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-6 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {t('admin.job_edit.btn_delete')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-2xl border border-gray-300 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? t('common.saving') : t('common.save_changes')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobEditModal;
