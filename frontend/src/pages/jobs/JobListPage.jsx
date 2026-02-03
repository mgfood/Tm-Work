import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Briefcase, Clock, DollarSign, MapPin, List } from 'lucide-react';
import jobsService from '../../api/jobsService';

const JobListPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        // Fetch categories
        jobsService.getCategories().then(data => {
            setCategories(data.results || data);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                // Only fetch published jobs for the public list
                const data = await jobsService.getJobs({
                    status: 'PUBLISHED',
                    category: selectedCategory
                });
                setJobs(data.results || data);
            } catch (err) {
                setError('Не удалось загрузить список заказов. Попробуйте позже.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [selectedCategory]);

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Поиск работы</h1>
                    <p className="text-slate-500">Найдите идеальный заказ для ваших навыков</p>
                </div>
                <Link to="/jobs/create" className="btn-primary">
                    Разместить заказ
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Filters */}
                <aside className="lg:col-span-1 space-y-8">
                    <div className="premium-card p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Filter size={18} className="text-primary-600" />
                            Фильтры
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 block mb-2">Поиск</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Название или ключевые слова..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                </div>
                            </div>
                            <hr className="border-slate-100" />
                        </div>
                        <hr className="border-slate-100" />
                        <div>
                            <label className="text-sm font-semibold text-slate-700 block mb-2">Категории</label>
                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedCategory ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    Все категории
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Job List */}
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
                    ) : filteredJobs.length === 0 ? (
                        <div className="premium-card p-12 text-center">
                            <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700">Заказы не найдены</h3>
                            <p className="text-slate-500 mt-2">Попробуйте изменить параметры поиска</p>
                        </div>
                    ) : (
                        filteredJobs.map(job => (
                            <Link
                                key={job.id}
                                to={`/jobs/${job.id}`}
                                className="premium-card p-8 flex flex-col md:row justify-between gap-6 hover:translate-x-1 transition-transform"
                            >
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full uppercase tracking-wider">
                                            {job.category?.name || 'Общее'}
                                        </span>
                                        <span className="text-slate-400 text-sm flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(job.created_at).toLocaleDateString('ru-RU')}
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
                                            Бюджет: <span className="text-slate-900 font-bold">{job.budget} TMT</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={16} className="text-primary-400" />
                                            Удаленно
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end">
                                    <span className="btn-secondary py-2 px-4 whitespace-nowrap">Подробнее</span>
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
