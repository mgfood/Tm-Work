import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, User, BookOpen, ShieldCheck, Briefcase, Filter, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import profilesService from '../../api/profilesService';
import adminService from '../../api/adminService';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TalentCard from '../../components/profiles/TalentCard';

const TalentListPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [talents, setTalents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    // Filter states
    const [categories, setCategories] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedMinRating, setSelectedMinRating] = useState(0);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState('relevance');

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [catsData, skillsData] = await Promise.all([
                    adminService.getCategories(),
                    adminService.getSkills()
                ]);
                setCategories(catsData.results || catsData || []);
                setAvailableSkills(skillsData.results || skillsData || []);
            } catch (err) {
                console.error('Failed to fetch filters', err);
            }
        };
        fetchFilters();
    }, []);

    // Debouncing for search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const fetchTalents = async () => {
            try {
                setLoading(true);
                const params = {
                    search: debouncedSearch,
                    category: selectedCategory,
                    min_rating: selectedMinRating,
                    skills: selectedSkills.join(','),
                    sort: sortBy
                };
                const data = await profilesService.getProfiles(params);
                setTalents(data.results || data || []);
            } catch (err) {
                console.error('Failed to fetch talents', err);
                setTalents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTalents();
    }, [debouncedSearch, selectedCategory, selectedMinRating, selectedSkills, sortBy]);

    const toggleSkill = (skillId) => {
        setSelectedSkills(prev => 
            prev.includes(skillId) 
                ? prev.filter(id => id !== skillId) 
                : [...prev, skillId]
        );
    };

    return (
        <div className="bg-slate-50/50 min-h-screen">
            {/* Hero Section */}
            <div className="relative bg-slate-900 py-24 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 -left-1/4 w-1/2 h-full bg-primary-600 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-0 -right-1/4 w-1/2 h-full bg-blue-600 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-8 border border-white/10">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-white text-xs font-black uppercase tracking-widest">{talents.length} {t('talentList.activeTalents')}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
                        {t('talentList.title')}
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium">
                        {t('talentList.subtitle')}
                    </p>

                    {/* Glass Search Bar */}
                    <div className="max-w-3xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-blue-600 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white/95 backdrop-blur-xl p-2 rounded-[30px] shadow-2xl flex flex-col md:flex-row gap-2">
                            <div className="flex-grow relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                                <input
                                    type="text"
                                    placeholder={t('talentList.searchPlaceholder')}
                                    className="w-full pl-16 pr-6 py-5 bg-transparent border-none rounded-2xl focus:ring-0 text-xl font-bold text-slate-900"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="bg-primary-600 hover:bg-primary-700 text-white px-12 py-5 rounded-[22px] font-black text-lg transition-all shadow-lg shadow-primary-600/20 active:scale-95">
                                {t('talentList.searchButton')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Filters Sidebar */}
                    <aside className={`lg:w-80 shrink-0 space-y-8 ${isFilterOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden lg:block'}`}>
                        {isFilterOpen && (
                            <div className="flex justify-between items-center mb-8 lg:hidden">
                                <h2 className="text-2xl font-black text-slate-900">{t('common.filters')}</h2>
                                <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-slate-100 rounded-xl"><X /></button>
                            </div>
                        )}

                        <div className="space-y-8">
                            {/* Sort By */}
                            <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">{t('common.sort_by')}</h3>
                                <div className="space-y-2">
                                    {['relevance', 'rating', 'completed_works'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setSortBy(type)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold text-sm transition-all border-2 ${sortBy === type ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-transparent text-slate-600 shadow-sm hover:border-slate-200'}`}
                                        >
                                            {t(`common.sort.${type}`)}
                                            {sortBy === type && <CheckCircle2 size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">{t('common.categories')}</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedCategory('')}
                                        className={`w-full text-left p-4 rounded-2xl font-bold text-sm transition-all border-2 ${selectedCategory === '' ? 'bg-primary-50 border-primary-500 text-primary-700 text-xs' : 'bg-white border-transparent text-slate-600 shadow-sm hover:border-slate-200'}`}
                                    >
                                        {t('common.all_categories')}
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`w-full text-left p-4 rounded-2xl font-bold text-sm transition-all border-2 ${selectedCategory === cat.id ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-transparent text-slate-600 shadow-sm hover:border-slate-200'}`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Min Rating */}
                            <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">{t('common.rating')}</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {[0, 3, 4, 4.5].map(rating => (
                                        <button
                                            key={rating}
                                            onClick={() => setSelectedMinRating(rating)}
                                            className={`p-3 rounded-xl font-bold text-xs transition-all border-2 flex items-center justify-center gap-1 ${selectedMinRating === rating ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-transparent text-slate-600 shadow-sm hover:border-slate-200'}`}
                                        >
                                            <Star size={12} fill={rating > 0 ? "currentColor" : "none"} />
                                            {rating === 0 ? "Все" : `${rating}+`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Skills Tag Cloud */}
                            <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">{t('common.skills')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {availableSkills.slice(0, 15).map(skill => (
                                        <button
                                            key={skill.id}
                                            onClick={() => toggleSkill(skill.id)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${selectedSkills.includes(skill.id) ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 shadow-sm'}`}
                                        >
                                            {skill.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Results Container */}
                    <div className="flex-grow">
                        {/* Results Header */}
                        <div className="flex justify-between items-center mb-8">
                            <div className="text-slate-500 font-bold">
                                {talents.length} {t('talentList.foundCount')}
                            </div>
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="lg:hidden flex items-center gap-2 px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold shadow-sm"
                            >
                                <Filter size={18} /> {t('common.filters')}
                            </button>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[1, 2, 4, 5, 6].map(i => (
                                    <div key={i} className="h-96 bg-white rounded-[40px] shadow-sm animate-pulse"></div>
                                ))}
                            </div>
                        ) : talents.length === 0 ? (
                            <div className="py-24 text-center bg-white rounded-[40px] shadow-sm border-2 border-dashed border-slate-100">
                                <User size={80} className="mx-auto text-slate-100 mb-6" />
                                <h3 className="text-3xl font-black text-slate-900 mb-4">{t('talentList.noTalentsFound')}</h3>
                                <p className="text-slate-400 max-w-sm mx-auto font-medium">{t('talentList.tryChangingSearch')}</p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('');
                                        setSelectedMinRating(0);
                                        setSelectedSkills([]);
                                    }}
                                    className="mt-8 text-primary-600 font-black uppercase tracking-widest text-xs hover:underline"
                                >
                                    {t('common.reset_filters')}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {talents.map(talent => (
                                    <TalentCard key={talent.user.id} talent={talent} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TalentListPage;