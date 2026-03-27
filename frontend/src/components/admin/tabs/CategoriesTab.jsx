import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import {
    Upload, X, Plus, ImageIcon, Monitor, HelpCircle, Loader2, AlertTriangle
} from 'lucide-react';
import adminService from '../../../api/adminService';
import apiClient from '../../../api/client';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import CategoryEditModal from '../CategoryEditModal';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/v1\/?$/, '');

const LUCIDE_ICONS = [
    'Monitor', 'Globe', 'Code', 'PenTool', 'Database', 'Layout', 'Smartphone',
    'Server', 'Cpu', 'Layers', 'HardDrive', 'Terminal', 'Shield', 'Lock',
    'Unlock', 'Settings', 'Cloud', 'Wifi', 'Bluetooth', 'Camera', 'Video',
    'Music', 'Heart', 'MessageCircle', 'Bell', 'Calendar', 'Clock', 'MapPin',
    'Mail', 'Phone', 'ShoppingCart', 'Rocket', 'Zap', 'Home', 'Download',
    'Upload', 'Share2', 'Copy', 'Menu', 'Briefcase', 'Award'
];

const CategoriesTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [selectedLucideIcon, setSelectedLucideIcon] = useState('Monitor');
    const [customIconFile, setCustomIconFile] = useState(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await adminService.getCategories();
            const categoriesArray = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            setCategories(categoriesArray);
        } catch (err) {
            showToast(t('admin.load_error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', e.target.name.value);
        formData.append('name_ru', e.target.name_ru.value);
        formData.append('name_tk', e.target.name_tk.value);

        if (customIconFile) {
            formData.append('custom_icon', customIconFile);
            formData.append('icon', 'Image');
        } else {
            formData.append('icon', selectedLucideIcon || 'Monitor');
        }

        try {
            setActionLoading(true);
            await apiClient.post('/jobs/categories/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast(t('admin.actions.category_created'), 'success');
            e.target.reset();
            setCustomIconFile(null);
            setSelectedLucideIcon('Monitor');
            await fetchCategories();
        } catch (err) {
            showToast(t('admin.actions.error_create_category'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('admin.actions.confirm_delete_category'),
            variant: 'danger'
        });
        if (!isConfirmed) return;
        try {
            setActionLoading(true);
            await adminService.deleteCategory(id);
            setCategories(prev => prev.filter(c => c.id !== id));
            showToast(t('admin.actions.category_deleted'), 'success');
        } catch (err) {
            showToast(t('admin.actions.error_delete_category'), 'error');
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
        <div data-testid="categories-tab" className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in">
            <div className="md:col-span-2 premium-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table data-testid="categories-table" className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">{t('admin.categories_mgmt.name_label')}</th>
                                <th className="px-6 py-4">{'Slug'}</th>
                                <th className="px-6 py-4">{t('admin.categories_mgmt.icon_label')}</th>
                                <th className="px-6 py-4 text-right">{t('admin.user_table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-bold text-slate-900">{cat.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{cat.slug}</td>
                                    <td className="px-6 py-4">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary-600 border border-slate-100 overflow-hidden">
                                            {cat.custom_icon ? (
                                                <img
                                                    src={cat.custom_icon.startsWith('http') ? cat.custom_icon : `${API_BASE}${cat.custom_icon}`}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        const fallback = e.target.closest('div').querySelector('.icon-fallback');
                                                        if (fallback) fallback.style.display = 'block';
                                                    }}
                                                />
                                            ) : null}
                                            <div className="icon-fallback" style={{ display: cat.custom_icon ? 'none' : 'block' }}>
                                                {(() => {
                                                    const IconComp = LucideIcons[cat.icon] || LucideIcons.HelpCircle || LucideIcons.Monitor;
                                                    return <IconComp size={20} />;
                                                })()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => { setEditingCategory(cat); setIsCategoryEditModalOpen(true); }}
                                                className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                                            >
                                                {t('admin.categories_mgmt.btn_edit')}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
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

            <div className="premium-card p-6 h-fit sticky top-6">
                <h3 className="font-bold text-lg mb-4">{t('admin.categories_mgmt.add_title')}</h3>
                <form onSubmit={handleCreateCategory} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t('admin.categories_mgmt.name_label')} (Core)</label>
                        <input data-testid="category-name-input" name="name" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-100 font-bold" placeholder="Technical name..." />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Название (RU)</label>
                            <input name="name_ru" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-100" placeholder="Русское название..." />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Ady (TK)</label>
                            <input name="name_tk" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-100" placeholder="Türkmen ady..." />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-slate-700">{t('admin.categories_mgmt.icon_label')}</label>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => { setIsIconPickerOpen(true); setCustomIconFile(null); }}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${!customIconFile ? 'border-primary-600 bg-primary-50' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                                <div className="text-primary-600">
                                    {(() => {
                                        const IconComp = LucideIcons[selectedLucideIcon] || LucideIcons.Monitor;
                                        return <IconComp size={24} />;
                                    })()}
                                </div>
                                <span className="text-[10px] font-black uppercase">Lucide: {selectedLucideIcon}</span>
                            </button>

                            <div className="relative">
                                <input
                                    type="file"
                                    id="custom-icon-upload"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            setCustomIconFile(e.target.files[0]);
                                            setSelectedLucideIcon('');
                                        }
                                    }}
                                    accept="image/*"
                                />
                                <label
                                    htmlFor="custom-icon-upload"
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer h-full ${customIconFile ? 'border-primary-600 bg-primary-50' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    {customIconFile ? (
                                        <div className="w-6 h-6 rounded-lg overflow-hidden bg-white border border-slate-100">
                                            <img src={URL.createObjectURL(customIconFile)} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : <Upload size={24} className="text-slate-400" />}
                                    <span className="text-[10px] font-black uppercase text-center">{t('admin.categories_mgmt.custom_icon')}</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <button data-testid="create-category-button" disabled={actionLoading} className="w-full btn-primary py-4 rounded-2xl shadow-lg shadow-primary-200">
                        {actionLoading ? t('common.loading') : t('admin.categories_mgmt.btn_create')}
                    </button>
                </form>
            </div>

            {/* Visual Icon Picker Modal */}
            {isIconPickerOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <h2 className="text-2xl font-black italic">{t('admin.categories_mgmt.select_icon_title')}</h2>
                            <button onClick={() => setIsIconPickerOpen(false)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><X size={24} /></button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[60vh] grid grid-cols-5 gap-4 custom-scrollbar">
                            {LUCIDE_ICONS.map(iconName => {
                                const IconComp = LucideIcons[iconName] || LucideIcons.Monitor;
                                return (
                                    <button
                                        key={iconName}
                                        onClick={() => {
                                            setSelectedLucideIcon(iconName);
                                            setIsIconPickerOpen(false);
                                        }}
                                        className="aspect-square rounded-2xl border-2 border-slate-50 hover:border-primary-600 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-2 p-2 group"
                                    >
                                        <IconComp size={28} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                                        <span className="text-[8px] font-bold uppercase truncate w-full text-center text-slate-400 group-hover:text-primary-600">{iconName}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <CategoryEditModal
                isOpen={isCategoryEditModalOpen}
                onClose={() => setIsCategoryEditModalOpen(false)}
                category={editingCategory}
                onSuccess={() => {
                    setIsCategoryEditModalOpen(false);
                    fetchCategories();
                }}
            />
        </div>
    );
};

export default CategoriesTab;
