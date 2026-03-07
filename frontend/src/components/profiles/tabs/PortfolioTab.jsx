import React, { useState } from 'react';
import { Plus, ImageIcon, Edit3, Trash2, ExternalLink, X, Save, Loader2, Camera } from 'lucide-react';

const PortfolioTab = ({
    portfolioItems,
    portfolioFormData,
    setPortfolioFormData,
    isPortfolioModalOpen,
    setIsPortfolioModalOpen,
    editingPortfolioId,
    setEditingPortfolioId,
    handlePortfolioSubmit,
    handleDeletePortfolioItem,
    isSaving,
    t
}) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">{t('profile.portfolio_title')}</h3>
                <button
                    onClick={() => {
                        setEditingPortfolioId(null);
                        setPortfolioFormData({ title: '', description: '', url: '', image: null });
                        setIsPortfolioModalOpen(true);
                    }}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                >
                    <Plus size={14} /> {t('profile.add_work')}
                </button>
            </div>

            {portfolioItems.length === 0 ? (
                <div className="premium-card p-12 text-center text-slate-400 italic">
                    {t('profile.no_portfolio')}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {portfolioItems.map(item => (
                        <div key={item.id} className="group premium-card p-4 hover:shadow-xl transition-all border border-slate-50 relative">
                            <div className="aspect-video bg-slate-100 rounded-xl mb-4 overflow-hidden relative">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => {
                                            setEditingPortfolioId(item.id);
                                            setPortfolioFormData({
                                                title: item.title,
                                                description: item.description,
                                                url: item.url || '',
                                                image: null
                                            });
                                            setIsPortfolioModalOpen(true);
                                        }}
                                        className="p-2 bg-white text-slate-600 rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-xl"
                                        title={t('common.edit')}
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePortfolioItem(item.id)}
                                        className="p-2 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-xl"
                                        title={t('profile.delete_work')}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    {item.url && (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-xl"
                                            title={t('common.view')}
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <h4 className="font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors uppercase text-xs tracking-wider">{item.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Portfolio Modal */}
            {isPortfolioModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="premium-card w-full max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-900">{editingPortfolioId ? t('profile.edit_work') : t('profile.add_work')}</h3>
                            <button onClick={() => setIsPortfolioModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={24} /></button>
                        </div>

                        <form onSubmit={handlePortfolioSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">{t('profile.work_title')}</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 outline-none font-medium transition-all"
                                    value={portfolioFormData.title}
                                    onChange={(e) => setPortfolioFormData({ ...portfolioFormData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">{t('profile.work_desc')}</label>
                                <textarea
                                    rows="4"
                                    required
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 outline-none font-medium transition-all resize-none"
                                    value={portfolioFormData.description}
                                    onChange={(e) => setPortfolioFormData({ ...portfolioFormData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">{t('profile.work_url')} (Optional)</label>
                                <input
                                    type="url"
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 outline-none font-medium transition-all"
                                    value={portfolioFormData.url}
                                    onChange={(e) => setPortfolioFormData({ ...portfolioFormData, url: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">{t('profile.work_image')}</label>
                                <div className="relative aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                                    {portfolioFormData.image ? (
                                        <img src={URL.createObjectURL(portfolioFormData.image)} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon size={48} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-xs text-slate-400 font-bold">{t('profile.click_to_upload')}</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => setPortfolioFormData({ ...portfolioFormData, image: e.target.files[0] })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-grow btn-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {t('common.save')}</>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPortfolioModalOpen(false)}
                                    className="px-8 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioTab;
