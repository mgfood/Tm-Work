import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Briefcase, Clock, DollarSign, MapPin, List, HelpCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import jobsService from '../../api/jobsService';
// 1. Импортируем хук
import { useTranslation } from 'react-i18next';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/v1\/?$/, '');

const JobListPage = () => {
    // 2. Инициализируем t
    const { t, i18n } = useTranslation();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [minBudget, setMinBudget] = useState('');
    const [maxBudget, setMaxBudget] = useState('');
    
    // Debounced states for server-side search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [debouncedMinBudget, setDebouncedMinBudget] = useState('');
    const [debouncedMaxBudget, setDebouncedMaxBudget] = useState('');

    useEffect(() => {
        jobsService.getCategories().then(data => {
            setCategories(data.results || data);
        }).catch(console.error);
    }, []);

    // Debouncing logic
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedMinBudget(minBudget), 500);
        return () => clearTimeout(timer);
    }, [minBudget]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedMaxBudget(maxBudget), 500);
        return () => clearTimeout(timer);
    }, [maxBudget]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const params = {
                    status: 'PUBLISHED',
                    category: selectedCategory,
                    search: debouncedSearch,
                    min_budget: debouncedMinBudget,
                    max_budget: debouncedMaxBudget
                };
                const data = await jobsService.getJobs(params);
                setJobs(data.results || data);
            } catch (err) {
                setError(t('jobs.loadError'));
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [selectedCategory, debouncedSearch, debouncedMinBudget, debouncedMaxBudget, t]);

    const jobsToDisplay = jobs;

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">{t('jobs.searchTitle')}</h1>
                    <p className="text-slate-500">{t('jobs.searchSubtitle')}</p>
                </div>
                <Link to="/jobs/create" className="btn-primary">
                    {t('jobs.postJob')}
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="lg:col-span-1 space-y-8">
                    <div className="premium-card p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Filter size={18} className="text-primary-600" />
                            {t('common.filters')}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 block mb-2">{t('common.search')}</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        data-testid="search-input"
                                        placeholder={t('jobs.searchPlaceholder')}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                </div>
                            </div>
                            <hr className="border-slate-100" />
                            <div>
                                <label className="text-sm font-semibold text-slate-700 block mb-2">{t('jobs.budget')}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        name="min_budget"
                                        data-testid="min-budget"
                                        placeholder={t('common.from')}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500"
                                        value={minBudget}
                                        onChange={(e) => setMinBudget(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        name="max_budget"
                                        data-testid="max-budget"
                                        placeholder={t('common.until')}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500"
                                        value={maxBudget}
                                        onChange={(e) => setMaxBudget(e.target.value)}
                                    />
                                </div>
                            </div>
                            <hr className="border-slate-100" />
                        </div>
                        <hr className="border-slate-100" />
                        <div>
                            <label className="text-sm font-semibold text-slate-700 block mb-2">{t('common.categories')}</label>
                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedCategory ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {t('categories.all')}
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${selectedCategory === cat.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${selectedCategory === cat.id ? 'bg-white/20' : 'bg-slate-100 text-primary-600'}`}>
                                            {cat.custom_icon ? (
                                                <img src={cat.custom_icon.startsWith('http') ? cat.custom_icon : `${API_BASE}${cat.custom_icon}`} alt="" className="w-5 h-5 object-contain" />
                                            ) : (
                                                (() => {
                                                    const IconComp = LucideIcons[cat.icon] || HelpCircle;
                                                    return <IconComp size={16} />;
                                                })()
                                            )}
                                        </div>
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="lg:col-span-3 space-y-6">
                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="premium-card p-8 animate-pulse">
                                    <div className="h-6 w-1/3 bg-slate-100 rounded mb-4"></div>
                                    <div className="h-4 w-full bg-slate-50 rounded mb-2"></div>
                                    <div className="h-4 w-2/3 bg-slate-50 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="premium-card p-12 text-center text-red-500">
                            {error}
                        </div>
                    ) : jobsToDisplay.length === 0 ? (
                        <div className="premium-card p-12 text-center">
                            <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700">{t('jobs.notFound')}</h3>
                            <p className="text-slate-500 mt-2">{t('jobs.tryChangingFilters')}</p>
                        </div>
                    ) : (
                        jobsToDisplay.map(job => (
                            <Link
                                key={job.id}
                                to={`/jobs/${job.id}`}
                                data-testid="job-card"
                                className="premium-card p-8 flex flex-col md:row justify-between gap-6 hover:translate-x-1 transition-transform"
                            >
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full uppercase tracking-wider">
                                            <div className="w-4 h-4 flex items-center justify-center">
                                                {job.category?.custom_icon ? (
                                                    <img src={job.category.custom_icon.startsWith('http') ? job.category.custom_icon : `${API_BASE}${job.category.custom_icon}`} alt="" className="w-full h-full object-contain" />
                                                ) : (
                                                    (() => {
                                                        const IconComp = LucideIcons[job.category?.icon] || HelpCircle;
                                                        return <IconComp size={12} />;
                                                    })()
                                                )}
                                            </div>
                                            {job.category?.name || t('categories.general')}
                                        </div>
                                        <span className="text-slate-400 text-sm flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(job.created_at).toLocaleDateString(i18n.language === 'tk' ? 'tk-TM' : 'ru-RU')}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-primary-600">
                                        {job.title}
                                    </h3>
                                    <p className="text-slate-600 line-clamp-2 leading-relaxed mb-6">
                                        {job.description}
                                    </p>
                                    <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <DollarSign size={16} className="text-green-500" />
                                            {t('jobs.budget')}: <span className="text-slate-900 font-bold">{job.budget} TMT</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={16} className="text-primary-400" />
                                            {t('jobs.remote')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end">
                                    <span className="btn-secondary py-2 px-4 whitespace-nowrap">{t('common.details')}</span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div >
        </div >
    );
};

export default JobListPage;