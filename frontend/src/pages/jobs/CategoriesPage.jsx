import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, HelpCircle, Briefcase, ChevronRight, Users } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import jobsService from '../../api/jobsService';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/v1\/?$/, '');

const CategoriesPage = () => {
    const { t, i18n } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await jobsService.getCategories();
                const arr = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
                setCategories(arr);
            } catch (err) {
                console.error('Failed to load categories:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const getCategoryName = (cat) => {
        const lang = i18n.language;
        if (lang === 'tk' && cat.name_tk) return cat.name_tk;
        if (lang === 'ru' && cat.name_ru) return cat.name_ru;
        return cat.name;
    };

    const filtered = categories.filter(cat =>
        getCategoryName(cat).toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-16">
            {/* Page Header */}
            <div className="mb-12">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-4">
                    <Link to="/" className="hover:text-primary-600 transition-colors">{t('home.welcome_guest')?.split(' ')[0] || 'Главная'}</Link>
                    <ChevronRight size={14} />
                    <span className="text-slate-700">{t('home.categories.title')}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                    {t('home.categories.title')}
                </h1>
                <p className="text-slate-500 text-lg max-w-xl">
                    {t('home.categories.subtitle')}
                </p>
            </div>

            {/* Search */}
            <div className="relative mb-10 max-w-lg">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={t('common.search') || 'Поиск категории...'}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-300 font-medium transition-all"
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="premium-card p-6 h-40 animate-pulse bg-slate-100 rounded-3xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 text-slate-400">
                    <HelpCircle size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">
                        {query ? 'Категория не найдена' : 'Категории пока не добавлены'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filtered.map(cat => {
                        const IconComp = (cat.icon && LucideIcons[cat.icon]) ? LucideIcons[cat.icon] : Briefcase;
                        return (
                            <Link
                                key={cat.id}
                                to={`/jobs?category=${cat.id}`}
                                className="premium-card group p-6 flex flex-col gap-4 hover:bg-primary-50 hover:border-primary-200 transition-all hover:scale-[1.02]"
                            >
                                {/* Icon */}
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all overflow-hidden shrink-0">
                                    {cat.custom_icon ? (
                                        <img
                                            src={cat.custom_icon.startsWith('http') ? cat.custom_icon : `${API_BASE}${cat.custom_icon}`}
                                            className="w-full h-full object-cover"
                                            alt=""
                                        />
                                    ) : (
                                        <IconComp size={24} />
                                    )}
                                </div>

                                {/* Name */}
                                <div className="font-bold text-lg text-slate-900 leading-snug group-hover:text-primary-700 transition-colors">
                                    {getCategoryName(cat)}
                                </div>

                                {/* Stats */}
                                <div className="flex flex-col gap-1 mt-auto">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        <Users size={12} />
                                        {cat.specialists_count} {t('home.categories.executors')}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-black text-primary-600">
                                        <Briefcase size={12} />
                                        {cat.jobs_count} {t('home.stats.jobs')}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CategoriesPage;
