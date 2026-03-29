import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import adminService from '../../api/adminService';

const SkillEditModal = ({ isOpen, skill, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        name_ru: '',
        name_tk: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (skill) {
            setFormData({
                name: skill.name || '',
                name_ru: skill.name_ru || '',
                name_tk: skill.name_tk || ''
            });
        }
    }, [skill]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await adminService.updateSkill(skill.id, formData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || t('admin.skill_edit.update_error'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[40px] p-8 max-w-md w-full premium-card">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">{t('admin.skill_edit.title')}</h2>
                        <p className="text-xs text-slate-400 mt-1">Название (Core) — основное, техническое. RU/TK — опциональные переводы.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Название (Core)</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Technical name..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Название (RU)</label>
                            <input
                                type="text"
                                value={formData.name_ru}
                                onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Русское название..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Ady (TK)</label>
                            <input
                                type="text"
                                value={formData.name_tk}
                                onChange={(e) => setFormData({ ...formData, name_tk: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Türkmen ady..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
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

export default SkillEditModal;
