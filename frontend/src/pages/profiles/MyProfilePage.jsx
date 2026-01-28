import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import profilesService from '../../api/profilesService';
import {
    User, Mail, MapPin, Globe, Phone, Calendar,
    Plus, X, Save, AlertCircle, Camera, Star
} from 'lucide-react';

const MyProfilePage = () => {
    const { user, refreshUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        bio: '',
        location: '',
        phone_number: '',
        birth_date: '',
        skills_ids: []
    });

    const [availableSkills, setAvailableSkills] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [profileData, skillsData] = await Promise.all([
                    profilesService.getMyProfile(),
                    profilesService.getSkills()
                ]);
                setProfile(profileData);
                setAvailableSkills(skillsData.results || skillsData);

                // Init form
                setFormData({
                    bio: profileData.bio || '',
                    location: profileData.location || '',
                    phone_number: profileData.phone_number || '',
                    birth_date: profileData.birth_date || '',
                    skills_ids: profileData.skills?.map(s => s.id) || []
                });
            } catch (err) {
                console.error(err);
                setError('Не удалось загрузить данные профиля');
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSkillToggle = (skillId) => {
        setFormData(prev => ({
            ...prev,
            skills_ids: prev.skills_ids.includes(skillId)
                ? prev.skills_ids.filter(id => id !== skillId)
                : [...prev.skills_ids, skillId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const updatedProfile = await profilesService.updateMyProfile(formData);
            setProfile(updatedProfile);
            setIsEditing(false);
            await refreshUser(); // Update auth context if first/last name change (not here yet)
        } catch (err) {
            setError('Ошибка при сохранении профиля');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="max-w-4xl mx-auto px-6 py-20 animate-pulse">
            <div className="w-32 h-32 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <div className="h-10 w-1/3 bg-slate-100 rounded mx-auto mb-4"></div>
            <div className="h-64 bg-slate-50 rounded-2xl"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Profile Card Sidebar */}
                <div className="lg:col-span-1">
                    <div className="premium-card p-8 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                                {profile?.avatar ? (
                                    <img src={profile.avatar} alt={user?.first_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} className="text-slate-400" />
                                )}
                            </div>
                            <button className="absolute bottom-1 right-1 w-10 h-10 bg-primary-600 text-white rounded-full border-4 border-white flex items-center justify-center hover:bg-primary-700 transition-colors shadow-lg">
                                <Camera size={18} />
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 mb-1">{user?.first_name} {user?.last_name}</h2>
                        <div className="text-slate-500 text-sm mb-6 flex items-center gap-1 justify-center">
                            <Mail size={14} /> {user?.email}
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full mb-8 pt-6 border-t border-slate-100">
                            <div className="text-center">
                                <div className="font-bold text-primary-600 text-xl">{profile?.freelancer_rating || '5.0'}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Фриланс</div>
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-primary-600 text-xl">{profile?.client_rating || '5.0'}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Клиент</div>
                            </div>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full btn-secondary text-sm py-3"
                            >
                                Редактировать профиль
                            </button>
                        )}
                    </div>

                    <div className="premium-card p-8 mt-8">
                        <h3 className="font-bold mb-6 text-slate-900 border-b border-slate-100 pb-4">Навыки</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile?.skills?.length > 0 ? (
                                profile.skills.map(skill => (
                                    <span key={skill.id} className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full">
                                        {skill.name}
                                    </span>
                                ))
                            ) : (
                                <p className="text-slate-400 text-sm">Навыки не указаны</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Form/Info */}
                <div className="lg:col-span-2">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-8 flex items-start gap-3">
                            <AlertCircle size={20} className="shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {isEditing ? (
                        <div className="premium-card p-10">
                            <h3 className="text-2xl font-bold mb-8 text-slate-900">Настройки профиля</h3>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">О себе</label>
                                    <textarea
                                        name="bio"
                                        rows="5"
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
                                        placeholder="Расскажите о своем опыте и навыках..."
                                        value={formData.bio}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Локация</label>
                                        <div className="relative">
                                            <input
                                                name="location"
                                                type="text"
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                                placeholder="Ашхабад"
                                                value={formData.location}
                                                onChange={handleChange}
                                            />
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Номер телефона</label>
                                        <div className="relative">
                                            <input
                                                name="phone_number"
                                                type="tel"
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                                placeholder="+993..."
                                                value={formData.phone_number}
                                                onChange={handleChange}
                                            />
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-4">Выберите навыки</label>
                                    <div className="flex flex-wrap gap-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        {availableSkills.map(skill => (
                                            <button
                                                key={skill.id}
                                                type="button"
                                                onClick={() => handleSkillToggle(skill.id)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${formData.skills_ids.includes(skill.id)
                                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/20'
                                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                    }`}
                                            >
                                                {skill.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="btn-secondary"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {isSaving ? 'Сохранение...' : <><Save size={18} /> Сохранить изменения</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="premium-card p-10">
                                <h3 className="text-xl font-bold mb-6 text-slate-900 uppercase tracking-widest text-xs opacity-50">О себе</h3>
                                <p className="text-slate-600 leading-relaxed text-lg italic">
                                    {profile?.bio || 'Вы еще не заполнили информацию о себе.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="premium-card p-8 flex items-center gap-6">
                                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Локация</div>
                                        <div className="text-lg font-bold text-slate-900">{profile?.location || 'Не указана'}</div>
                                    </div>
                                </div>
                                <div className="premium-card p-8 flex items-center gap-6">
                                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                                        <Globe size={24} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Телефон</div>
                                        <div className="text-lg font-bold text-slate-900">{profile?.phone_number || 'Не указан'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyProfilePage;
