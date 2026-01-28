import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    User, MapPin, Star, Mail, Briefcase,
    ArrowLeft, MessageSquare, ShieldCheck
} from 'lucide-react';
import profilesService from '../../api/profilesService';

const TalentProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const data = await profilesService.getProfileByUserId(id);
                setProfile(data);
            } catch (err) {
                setError('Профиль не найден');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return (
        <div className="max-w-4xl mx-auto px-6 py-20 animate-pulse">
            <div className="w-32 h-32 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <div className="h-10 w-1/3 bg-slate-100 rounded mx-auto mb-4"></div>
            <div className="h-64 bg-slate-50 rounded-2xl"></div>
        </div>
    );

    if (error || !profile) return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <div className="premium-card p-12">
                <User size={48} className="mx-auto text-slate-200 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900">Профиль не найден</h2>
                <Link to="/talents" className="btn-primary mt-8 inline-block">К списку специалистов</Link>
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-8 transition-colors font-medium">
                <ArrowLeft size={18} /> Назад
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Sidebar Info */}
                <div className="lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-12 md:border-r-0 lg:border-r">
                    <div className="text-center mb-8">
                        <div className="w-32 h-32 bg-slate-100 rounded-3xl mx-auto mb-6 flex items-center justify-center overflow-hidden shadow-xl border-4 border-white rotate-3 group hover:rotate-0 transition-transform duration-500">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt={profile.user.first_name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={64} className="text-slate-300" />
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">
                            {profile.user.first_name} {profile.user.last_name}
                        </h1>
                        <div className="flex items-center justify-center gap-2 text-slate-500 font-medium mb-6">
                            <MapPin size={16} className="text-primary-500" />
                            {profile.location || 'Туркменистан'}
                        </div>

                        <div className="flex items-center justify-center gap-1 text-orange-500 text-xl font-black bg-orange-50 py-3 rounded-2xl mb-8">
                            <Star size={20} fill="currentColor" />
                            <span>{profile.freelancer_rating || '5.0'}</span>
                            <span className="text-slate-400 text-sm font-normal ml-1">({profile.freelancer_reviews_count || 0} отзывов)</span>
                        </div>

                        <div className="space-y-3">
                            <button className="w-full btn-primary py-4 flex items-center justify-center gap-2">
                                <MessageSquare size={20} /> Написать сообщение
                            </button>
                            <div className="flex items-center justify-center gap-2 text-xs text-green-600 font-bold uppercase tracking-widest pt-4">
                                <ShieldCheck size={16} /> Проверенный специалист
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-12">
                    {/* About Section */}
                    <section>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <div className="w-8 h-px bg-slate-200"></div> О специалисте
                        </h2>
                        <p className="text-xl text-slate-700 leading-relaxed font-medium">
                            {profile.bio || 'Этот специалист еще не заполнил раздел "О себе".'}
                        </p>
                    </section>

                    {/* Skills Section */}
                    <section>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <div className="w-8 h-px bg-slate-200"></div> Профессиональные навыки
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {profile.skills?.length > 0 ? (
                                profile.skills.map(skill => (
                                    <span key={skill.id} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:border-primary-500 hover:text-primary-600 transition-all cursor-default">
                                        {skill.name}
                                    </span>
                                ))
                            ) : (
                                <p className="text-slate-400 italic">Навыки не указаны</p>
                            )}
                        </div>
                    </section>

                    {/* Stats/Experience Summary */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-12">
                        <div className="premium-card p-8 border-l-4 border-l-primary-600">
                            <div className="flex items-center gap-4 text-slate-400 mb-4">
                                <Briefcase size={20} />
                                <span className="text-xs font-bold uppercase tracking-widest">Проектов выполнено</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">12</div>
                        </div>
                        <div className="premium-card p-8 border-l-4 border-l-green-600">
                            <div className="flex items-center gap-4 text-slate-400 mb-4">
                                <Clock size={20} />
                                <span className="text-xs font-bold uppercase tracking-widest">На платформе</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">с 2026г.</div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TalentProfilePage;
