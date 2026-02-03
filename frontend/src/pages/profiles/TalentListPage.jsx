import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, User, BookOpen, ShieldCheck, Briefcase } from 'lucide-react';
import profilesService from '../../api/profilesService';
import { Link } from 'react-router-dom';

const TalentListPage = () => {
    const [talents, setTalents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTalents = async () => {
            try {
                setLoading(true);
                const data = await profilesService.getProfiles();
                setTalents(data.results || data);
            } catch (err) {
                console.error('Failed to fetch talents', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTalents();
    }, []);

    const filteredTalents = talents.filter(talent =>
        talent.user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.skills?.some(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Найти таланты</h1>
                <p className="text-slate-500 text-lg">Лучшие специалисты Туркменистана в одном месте</p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-premium border border-slate-100 flex flex-col md:row items-center gap-4 mb-12">
                <div className="relative flex-grow w-full">
                    <input
                        type="text"
                        placeholder="Поиск по имени, навыкам или био..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                </div>
                <button className="btn-primary py-4 px-10 w-full md:w-auto">Найти</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-80 bg-slate-100 rounded-3xl animate-pulse"></div>)
                ) : filteredTalents.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <User size={64} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-2xl font-bold text-slate-700">Специалисты не найдены</h3>
                        <p className="text-slate-500 mt-2">Попробуйте изменить поисковый запрос</p>
                    </div>
                ) : (
                    filteredTalents.map(talent => (
                        <div key={talent.user.id} className="premium-card p-8 flex flex-col items-center text-center group">
                            <Link to={`/talents/${talent.user.id}`} className="relative mb-6 block">
                                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg group-hover:border-primary-500 transition-colors">
                                    {talent.avatar ? (
                                        <img
                                            src={talent.avatar.startsWith('http') ? talent.avatar : (talent.avatar.startsWith('/') ? talent.avatar : `/${talent.avatar}`)}
                                            alt={talent.user.first_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={40} className="text-slate-400" />
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
                            </Link>

                            <Link to={`/talents/${talent.user.id}`} className="block group">
                                <h3 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
                                    {talent.user.first_name} {talent.user.last_name}
                                    {talent.is_verified && (
                                        <ShieldCheck size={20} className="text-green-600" title="Проверенный специалист" />
                                    )}
                                </h3>
                            </Link>

                            <div className="flex items-center gap-1.5 p-2 bg-blue-50 text-blue-600 rounded-xl mb-4">
                                <Briefcase size={16} />
                                <span className="text-xs font-bold leading-none">{talent.completed_works_count || 0} Работ</span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                                <MapPin size={14} className="text-primary-400" />
                                {talent.location || 'Туркменистан'}
                            </div>

                            <div className="flex items-center gap-1 text-orange-500 font-bold mb-6">
                                <Star size={16} fill="currentColor" />
                                <span>{talent.freelancer_rating || '5.0'}</span>
                                <span className="text-slate-400 font-normal text-xs ml-1">({talent.freelancer_reviews_count || 0})</span>
                            </div>

                            <p className="text-slate-600 text-sm line-clamp-3 mb-6 leading-relaxed">
                                {talent.bio || 'Этот специалист пока не добавил описание профиля.'}
                            </p>

                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                {talent.skills?.slice(0, 3).map(skill => (
                                    <span key={skill.id} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                                        {skill.name}
                                    </span>
                                ))}
                                {talent.skills?.length > 3 && (
                                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-xs font-bold rounded-full">
                                        +{talent.skills.length - 3}
                                    </span>
                                )}
                            </div>

                            <Link
                                to={`/talents/${talent.user.id}`}
                                className="w-full btn-secondary py-3 text-sm flex items-center justify-center gap-2"
                            >
                                <BookOpen size={16} /> Посмотреть профиль
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TalentListPage;
