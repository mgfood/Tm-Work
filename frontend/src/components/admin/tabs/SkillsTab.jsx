import React, { useState, useEffect } from 'react';
import {
    Loader2, AlertTriangle
} from 'lucide-react';
import adminService from '../../../api/adminService';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import SkillEditModal from '../SkillEditModal';

const SkillsTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isSkillEditModalOpen, setIsSkillEditModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);

    const fetchSkills = async () => {
        try {
            setLoading(true);
            const data = await adminService.getSkills();
            setSkills(data.results || data || []);
        } catch (err) {
            showToast(t('admin.load_error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    const handleCreateSkill = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const name_ru = formData.get('name_ru');
        const name_tk = formData.get('name_tk');
        const slug = name.toLowerCase().replace(/\s+/g, '-');

        try {
            setActionLoading(true);
            await adminService.createSkill({ name, name_ru, name_tk, slug });
            showToast(t('admin.actions.skill_created'), 'success');
            await fetchSkills();
            e.target.reset();
        } catch (err) {
            showToast(t('admin.actions.error_create_skill'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSkill = async (id) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('admin.actions.confirm_delete_skill'),
            variant: 'danger'
        });
        if (!isConfirmed) return;
        try {
            setActionLoading(true);
            await adminService.deleteSkill(id);
            setSkills(prev => prev.filter(s => s.id !== id));
            showToast(t('admin.actions.skill_deleted'), 'success');
        } catch (err) {
            showToast(t('admin.actions.error_delete_skill'), 'error');
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
        <div data-testid="skills-tab" className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in">
            <div className="md:col-span-2 space-y-6">
                <div className="premium-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table data-testid="skills-table" className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Название (Core)</th>
                                    <th className="px-6 py-4">Название (RU)</th>
                                    <th className="px-6 py-4">Ady (TK)</th>
                                    <th className="px-6 py-4 text-right">{t('admin.user_table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {skills.map(skill => (
                                    <tr key={skill.id} data-testid={`skill-row-${skill.id}`} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-6 font-bold text-slate-700">{skill.name}</td>
                                        <td className="px-6 py-6 text-slate-500">{skill.name_ru || <span className="text-slate-300 italic text-xs">не указано</span>}</td>
                                        <td className="px-6 py-6 text-slate-500">{skill.name_tk || <span className="text-slate-300 italic text-xs">görkezilmedi</span>}</td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => { setEditingSkill(skill); setIsSkillEditModalOpen(true); }}
                                                    className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                                                >
                                                    {t('common.btn_edit')}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSkill(skill.id)}
                                                    className="text-red-500 hover:text-red-700 font-medium text-sm"
                                                >
                                                    {t('admin.categories_mgmt.btn_delete')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="premium-card p-6 h-fit sticky top-6">
                <h3 className="font-bold text-lg mb-1">{t('admin.skills_mgmt_add.title')}</h3>
                <p className="text-xs text-slate-400 mb-4">Название (Core) — основное, технческое. RU/TK — опциональные переводы.</p>
                <form onSubmit={handleCreateSkill} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Название (Core)</label>
                        <input name="name" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder={t('admin.skills_mgmt_add.placeholder')} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Название (RU)</label>
                            <input name="name_ru" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="Русское название..." />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Ady (TK)</label>
                            <input name="name_tk" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="Türkmen ady..." />
                        </div>
                    </div>
                    <button disabled={actionLoading} className="w-full btn-primary py-3">{actionLoading ? t('common.loading') : t('admin.skills_mgmt_add.btn')}</button>
                </form>
            </div>

            <SkillEditModal
                isOpen={isSkillEditModalOpen}
                onClose={() => setIsSkillEditModalOpen(false)}
                skill={editingSkill}
                onSuccess={() => {
                    setIsSkillEditModalOpen(false);
                    fetchSkills();
                }}
            />
        </div>
    );
};

export default SkillsTab;
