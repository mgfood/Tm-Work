import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import profilesService from '../../api/profilesService';
import jobsService from '../../api/jobsService';
import proposalsService from '../../api/proposalsService';
import {
    User, Mail, MapPin, Globe, Phone, Calendar,
    Plus, X, Save, AlertCircle, Camera, Star,
    Briefcase, Edit3, ExternalLink, Eye, Archive,
    MessageSquare, ArrowLeft, ShieldCheck,
    Send, Instagram, Github, Linkedin, Eye as View,
    Image as ImageIcon, Link as LinkIcon, Trash2, Loader2, Inbox
} from 'lucide-react';

import authService from '../../api/authService';

const MyProfilePage = () => {
    const { user, refreshUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [myJobs, setMyJobs] = useState([]);
    const [myProposals, setMyProposals] = useState([]); // Sent by me
    const [receivedProposals, setReceivedProposals] = useState([]); // Received for my jobs
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('portfolio'); // Changed default to portfolio for testing
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
    const [portfolioFormData, setPortfolioFormData] = useState({
        title: '',
        description: '',
        url: '',
        image: null
    });
    const [editingPortfolioId, setEditingPortfolioId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        profession: '',
        bio: '',
        location: '',
        phone_number: '',
        birth_date: '',
        skills_ids: [],
        hourly_rate: '',
        experience_years: '',
        languages: '',
        social_links: { telegram: '', instagram: '', github: '', linkedin: '' }
    });

    const [availableSkills, setAvailableSkills] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                const [profileData, skillsData] = await Promise.all([
                    profilesService.getMyProfile().catch(e => {
                        console.error('Profile fetch error:', e);
                        throw new Error(e.response?.data?.detail || e.message || 'Ошибка загрузки профиля');
                    }),
                    profilesService.getSkills().catch(e => {
                        console.error('Skills fetch error:', e);
                        return { results: [] }; // Fallback for skills
                    })
                ]);

                setProfile(profileData);
                setAvailableSkills(skillsData?.results || (Array.isArray(skillsData) ? skillsData : []));

                setFormData({
                    profession: profileData.profession || '',
                    bio: profileData.bio || '',
                    location: profileData.location || '',
                    phone_number: profileData.phone_number || '',
                    birth_date: profileData.birth_date || '',
                    skills_ids: profileData.skills?.map(s => s.id) || [],
                    hourly_rate: profileData.hourly_rate || '',
                    experience_years: profileData.experience_years || 0,
                    languages: profileData.languages || '',
                    social_links: {
                        telegram: profileData.social_links?.telegram || '',
                        instagram: profileData.social_links?.instagram || '',
                        github: profileData.social_links?.github || '',
                        linkedin: profileData.social_links?.linkedin || '',
                    }
                });
            } catch (err) {
                console.error('Full fetchData error:', err);
                setError(err.message || 'Не удалось загрузить данные профиля. Убедитесь, что вы авторизованы.');
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                setJobsLoading(true);
                const [jobsData, proposalsData, portfolioData] = await Promise.all([
                    jobsService.getJobs({ client: user.id }),
                    proposalsService.getProposals(),
                    profilesService.getPortfolioItems(user.id)
                ]);

                setMyJobs(jobsData.results || jobsData || []);
                setPortfolioItems(portfolioData.results || portfolioData || []);

                // Separate proposals
                const sent = proposalsData.results?.filter(p => p.freelancer === user.id) || [];
                const received = proposalsData.results?.filter(p => p.freelancer !== user.id) || [];

                setMyProposals(sent);
                setReceivedProposals(received);
            } catch (err) {
                console.error('Failed to fetch user data', err);
            } finally {
                setJobsLoading(false);
            }
        };
        fetchUserData();
    }, [user]);

    const activeJobs = myJobs.filter(j => j.status !== 'DRAFT');
    const draftJobs = myJobs.filter(j => j.status === 'DRAFT');

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

    const handleSocialChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            social_links: { ...prev.social_links, [key]: value }
        }));
    };

    const handleDeleteAvatar = async () => {
        if (!window.confirm('Удалить фото профиля?')) return;
        try {
            setIsSaving(true);
            await profilesService.deleteAvatar();
            setProfile(prev => ({ ...prev, avatar: null }));
            await refreshUser();
        } catch (err) {
            setError('Ошибка при удалении фото');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRoleToggle = async (role) => {
        try {
            setLoading(true);
            await authService.toggleRole(role);
            await refreshUser();
            window.location.reload(); // Reload to refresh permissions and UI
        } catch (err) {
            setError('Ошибка при смене роли');
        } finally {
            setLoading(false);
        }
    };

    const handleProposalAction = async (id, action) => {
        const confirmMsg = action === 'reject' ? 'Отклонить этот отклик?' : 'Отменить ваш отклик?';
        if (!window.confirm(confirmMsg)) return;

        try {
            setJobsLoading(true);
            if (action === 'reject') {
                await proposalsService.rejectProposal(id);
            } else {
                await proposalsService.cancelProposal(id);
            }
            // Refresh data
            const proposalsData = await proposalsService.getProposals();
            const sent = proposalsData.results?.filter(p => p.freelancer === user.id) || [];
            const received = proposalsData.results?.filter(p => p.freelancer !== user.id) || [];
            setMyProposals(sent);
            setReceivedProposals(received);
        } catch (err) {
            alert('Ошибка при выполнении действия');
        } finally {
            setJobsLoading(false);
        }
    };

    const handlePortfolioSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('title', portfolioFormData.title);
            formData.append('description', portfolioFormData.description);
            if (portfolioFormData.url) formData.append('url', portfolioFormData.url);
            if (portfolioFormData.image) formData.append('image', portfolioFormData.image);

            if (editingPortfolioId) {
                await profilesService.updatePortfolioItem(editingPortfolioId, formData);
            } else {
                await profilesService.addPortfolioItem(formData);
            }

            // Refresh portfolio
            const data = await profilesService.getPortfolioItems(user.id);
            setPortfolioItems(data.results || data);
            setIsPortfolioModalOpen(false);
            setEditingPortfolioId(null);
            setPortfolioFormData({ title: '', description: '', url: '', image: null });
        } catch (err) {
            console.error('Portfolio save error:', err);
            alert('Ошибка при сохранении работы');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePortfolioItem = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту работу из портфолио?')) return;
        try {
            await profilesService.deletePortfolioItem(id);
            setPortfolioItems(portfolioItems.filter(item => item.id !== id));
        } catch (err) {
            console.error(err);
            alert('Ошибка при удалении работы');
        }
    };

    const handlePublishDraft = async (jobId) => {
        if (!window.confirm('Опубликовать этот черновик?')) return;
        try {
            await jobsService.publishJob(jobId);
            // Refresh jobs
            // Assuming fetchMyJobs is a function that re-fetches jobs, or we can manually update state
            // For now, let's re-fetch all user data to ensure consistency
            const [jobsData] = await Promise.all([
                jobsService.getJobs({ client: user.id }),
            ]);
            setMyJobs(jobsData.results || jobsData);
            alert('Заказ опубликован!');
        } catch (e) {
            console.error(e);
            alert('Ошибка публикации офера');
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот заказ? Это действие необратимо.')) return;
        try {
            await jobsService.deleteJob(jobId);
            setMyJobs(prev => prev.filter(j => j.id !== jobId));
        } catch (e) {
            console.error(e);
            const msg = e.response?.data?.detail || e.response?.data?.[0] || 'Ошибка удаления заказа';
            alert(`Ошибка: ${msg}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const submissionData = { ...formData };
            if (!submissionData.birth_date) delete submissionData.birth_date;

            const updatedProfile = await profilesService.updateMyProfile(submissionData);
            setProfile(updatedProfile);
            setIsEditing(false);
            await refreshUser();
        } catch (err) {
            console.error('Update failed', err.response?.data);
            setError('Ошибка при сохранении профиля. Проверьте правильность введенных данных.');
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
                                    <img src={profile.avatar.startsWith('http') ? profile.avatar : (profile.avatar.startsWith('/') ? profile.avatar : `/${profile.avatar}`)} alt={user?.first_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} className="text-slate-400" />
                                )}
                            </div>
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;

                                    try {
                                        setIsSaving(true);
                                        const formData = new FormData();
                                        formData.append('avatar', file);
                                        const updatedProfile = await profilesService.updateMyProfile(formData);
                                        setProfile(updatedProfile);
                                        await refreshUser();
                                    } catch (err) {
                                        setError('Ошибка при загрузке фото');
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                            />
                            <div className="absolute -bottom-1 -right-1 flex gap-1">
                                {profile?.avatar && (
                                    <button
                                        onClick={handleDeleteAvatar}
                                        className="w-8 h-8 bg-red-500 text-white rounded-full border-2 border-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                        title="Удалить фото"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                                <label
                                    htmlFor="avatar-upload"
                                    className="w-10 h-10 bg-primary-600 text-white rounded-full border-4 border-white flex items-center justify-center hover:bg-primary-700 transition-colors shadow-lg cursor-pointer"
                                    title="Загрузить новое фото"
                                >
                                    <Camera size={18} />
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-slate-900">{user?.first_name} {user?.last_name}</h2>
                            {profile?.is_verified && (
                                <ShieldCheck size={20} className="text-green-600" title="Проверенный специалист" />
                            )}
                        </div>
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
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Заказчик</div>
                            </div>
                        </div>

                        {!isEditing && (
                            <div className="w-full space-y-3">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full btn-secondary text-sm py-3 flex items-center justify-center gap-2"
                                >
                                    <Edit3 size={16} /> Настройки профиля
                                </button>

                                <div className="pt-4 border-t border-slate-100 w-full">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3">Ваши роли</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRoleToggle('CLIENT')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${user?.roles?.some(r => r.name === 'CLIENT') ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-slate-100 text-slate-400 opacity-50'}`}
                                        >
                                            Заказчик
                                        </button>
                                        <button
                                            onClick={() => handleRoleToggle('FREELANCER')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${user?.roles?.some(r => r.name === 'FREELANCER') ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-400 opacity-50'}`}
                                        >
                                            Фрилансер
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-2 italic font-medium leading-tight">Вы можете переключаться между ролями в любое время</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="premium-card p-8 mt-8">
                        <h3 className="font-bold mb-6 text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                            <Plus size={18} className="text-primary-600" /> Навыки
                        </h3>
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

                {/* Main Content */}
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
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Профессия / Специализация</label>
                                    <input
                                        name="profession"
                                        type="text"
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold"
                                        placeholder="Например: Senior UI/UX Designer"
                                        value={formData.profession}
                                        onChange={handleChange}
                                    />
                                </div>

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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Ставка (TMT/час)</label>
                                        <input
                                            name="hourly_rate"
                                            type="number"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="50"
                                            value={formData.hourly_rate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Опыт (лет)</label>
                                        <input
                                            name="experience_years"
                                            type="number"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="3"
                                            value={formData.experience_years}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <label className="block text-sm font-bold text-slate-700 mb-4">Социальные сети</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                                placeholder="Telegram"
                                                value={formData.social_links.telegram}
                                                onChange={(e) => handleSocialChange('telegram', e.target.value)}
                                            />
                                            <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                                placeholder="Instagram"
                                                value={formData.social_links.instagram}
                                                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                            />
                                            <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                                placeholder="GitHub"
                                                value={formData.social_links.github}
                                                onChange={(e) => handleSocialChange('github', e.target.value)}
                                            />
                                            <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                                placeholder="LinkedIn"
                                                value={formData.social_links.linkedin}
                                                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                                            />
                                            <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-4">Выберите навыки</label>
                                    <div className="flex flex-wrap gap-2 bg-slate-50 p-6 rounded-2xl border border-slate-100 max-h-48 overflow-y-auto">
                                        {availableSkills.map(skill => (
                                            <button
                                                key={skill.id}
                                                type="button"
                                                onClick={() => handleSkillToggle(skill.id)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${formData.skills_ids.includes(skill.id)
                                                    ? 'bg-primary-600 border-primary-600 text-white'
                                                    : 'bg-white border-slate-100 text-slate-400'
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
                                <div className="mb-6">
                                    <div className="text-2xl font-black text-slate-900 mb-2">{profile?.profession || 'Специалист'}</div>
                                    <p className="text-slate-600 leading-relaxed text-lg italic">
                                        {profile?.bio || 'Вы еще не заполнили информацию о себе.'}
                                    </p>
                                </div>
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
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Телефон</div>
                                        <div className="text-lg font-bold text-slate-900">{profile?.phone_number || 'Не указан'}</div>
                                    </div>
                                </div>
                                {profile?.hourly_rate && (
                                    <div className="premium-card p-8 flex items-center gap-6">
                                        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                            <Globe size={24} />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Ставка</div>
                                            <div className="text-lg font-bold text-slate-900">{profile.hourly_rate} TMT/час</div>
                                        </div>
                                    </div>
                                )}
                                <div className="premium-card p-8 flex items-center gap-6">
                                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Работ выполнено</div>
                                        <div className="text-lg font-bold text-slate-900">{profile?.completed_works_count || 0}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Dashboard Sections Tabs */}
                            <div className="pt-8">
                                <div className="flex flex-wrap items-center gap-2 mb-8 p-1 bg-slate-100 rounded-2xl w-fit">
                                    <button
                                        onClick={() => setActiveTab('portfolio')}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'portfolio' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <ImageIcon size={16} /> Портфолио ({portfolioItems.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('active_jobs')}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'active_jobs' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Briefcase size={16} /> Мои работы ({activeJobs.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('drafts')}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'drafts' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Archive size={16} /> Черновики ({draftJobs.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('sent_proposals')}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sent_proposals' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Send size={16} /> Мои отклики ({myProposals.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('received_proposals')}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'received_proposals' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Inbox size={16} /> Входящие отклики ({receivedProposals.length})
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {activeTab === 'portfolio' && (
                                        <div>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold text-slate-800">Ваши работы</h3>
                                                <button
                                                    onClick={() => {
                                                        setEditingPortfolioId(null);
                                                        setPortfolioFormData({ title: '', description: '', url: '', image: null });
                                                        setIsPortfolioModalOpen(true);
                                                    }}
                                                    className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                                                >
                                                    <Plus size={14} /> Добавить работу
                                                </button>
                                            </div>

                                            {portfolioItems.length === 0 ? (
                                                <div className="premium-card p-12 text-center text-slate-400 italic">
                                                    Вы еще не добавили ни одной работы в портфолио.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {portfolioItems.map(item => (
                                                        <div key={item.id} className="premium-card overflow-hidden group">
                                                            <div className="aspect-video relative overflow-hidden bg-slate-100">
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.title}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                />
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
                                                                        className="p-2 bg-white text-slate-900 rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-xl"
                                                                    >
                                                                        <Edit3 size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePortfolioItem(item.id)}
                                                                        className="p-2 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-xl"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="p-4">
                                                                <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                                                                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.description}</p>
                                                                {item.url && (
                                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary-600 font-bold flex items-center gap-1 hover:underline">
                                                                        <LinkIcon size={10} /> Перейти на сайт
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'active_jobs' && (
                                        activeJobs.length === 0 ? (
                                            <div className="premium-card p-12 text-center text-slate-400 italic">У вас пока нет активных работ.</div>
                                        ) : (
                                            activeJobs.map(job => (
                                                <div key={job.id} className="premium-card p-6 flex justify-between items-center group hover:translate-x-1 transition-all">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center font-bold">
                                                            {job.budget}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{job.title}</h4>
                                                            <span className="text-xs text-slate-400 font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link to={`/jobs/${job.id}`} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all" title="Просмотр">
                                                            <Eye size={18} />
                                                        </Link>
                                                        {job.status === 'PUBLISHED' && (
                                                            <button
                                                                onClick={() => handleDeleteJob(job.id)}
                                                                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                                                                title="Удалить"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}

                                    {activeTab === 'drafts' && (
                                        draftJobs.length === 0 ? (
                                            <div className="premium-card p-12 text-center text-slate-400 italic">Раздел черновиков пуст.</div>
                                        ) : (
                                            draftJobs.map(job => (
                                                <div key={job.id} className="premium-card p-6 flex justify-between items-center group hover:translate-x-1 transition-all border-l-4 border-l-amber-400">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                                            <Archive size={24} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{job.title}</h4>
                                                            <span className="text-xs text-slate-400 font-medium">Черновик от {new Date(job.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handlePublishDraft(job.id)}
                                                            className="p-3 bg-slate-50 text-green-600 rounded-xl hover:bg-green-50 transition-all font-bold text-xs flex items-center gap-1"
                                                            title="Опубликовать"
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                        <Link to={`/jobs/${job.id}/edit`} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all" title="Редактировать">
                                                            <Edit3 size={18} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteJob(job.id)}
                                                            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                                                            title="Удалить"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}

                                    {activeTab === 'sent_proposals' && (
                                        myProposals.length === 0 ? (
                                            <div className="premium-card p-12 text-center text-slate-400 italic">Вы еще не оставляли откликов.</div>
                                        ) : (
                                            myProposals.map(proposal => (
                                                <div key={proposal.id} className={`premium-card p-6 flex justify-between items-center group hover:translate-x-1 transition-all border-l-4 ${proposal.status === 'ACCEPTED' ? 'border-l-green-400' :
                                                    proposal.status === 'REJECTED' ? 'border-l-red-400' :
                                                        'border-l-blue-400'
                                                    }`}>
                                                    <div className="flex items-center gap-6">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold ${proposal.status === 'ACCEPTED' ? 'bg-green-50 text-green-600' :
                                                            proposal.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                                                                'bg-blue-50 text-blue-600'
                                                            }`}>
                                                            {proposal.price}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">Отклик на: {proposal.job_title}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${proposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                                                    proposal.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                        'bg-slate-100 text-slate-500'
                                                                    }`}>
                                                                    {proposal.status}
                                                                </span>
                                                                <p className="text-xs text-slate-400 line-clamp-1">{proposal.message}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {proposal.status === 'PENDING' && (
                                                            <button
                                                                onClick={() => handleProposalAction(proposal.id, 'cancel')}
                                                                className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                                title="Отозвать отклик"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        )}
                                                        <Link to={`/jobs/${proposal.job}`} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
                                                            <ExternalLink size={18} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}

                                    {activeTab === 'received_proposals' && (
                                        receivedProposals.length === 0 ? (
                                            <div className="premium-card p-12 text-center text-slate-400 italic">Пока нет входящих предложений.</div>
                                        ) : (
                                            receivedProposals.map(proposal => (
                                                <div key={proposal.id} className={`premium-card p-6 flex flex-col md:row justify-between items-center group hover:shadow-xl transition-all border-l-4 ${proposal.status === 'ACCEPTED' ? 'border-l-green-600' :
                                                    proposal.status === 'REJECTED' ? 'border-l-red-600' :
                                                        'border-l-primary-400'
                                                    }`}>
                                                    <div className="flex items-center gap-6 w-full">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold ${proposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-600' :
                                                            'bg-primary-50 text-primary-600'
                                                            }`}>
                                                            {proposal.price}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">Предложение по: {proposal.job_title}</h4>
                                                            <p className="text-sm text-slate-600 mt-1">От: {proposal.freelancer_email}</p>
                                                            <p className="text-xs text-slate-400 italic mt-2">"{proposal.message}"</p>
                                                            {proposal.status !== 'PENDING' && (
                                                                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${proposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {proposal.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                                                        {proposal.status === 'PENDING' ? (
                                                            <>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (window.confirm('Принять это предложение?')) {
                                                                            try {
                                                                                await proposalsService.acceptProposal(proposal.id);
                                                                                window.location.reload();
                                                                            } catch (e) { alert('Ошибка при принятии предложения'); }
                                                                        }
                                                                    }}
                                                                    className="btn-primary py-2 px-4 text-xs flex items-center gap-1"
                                                                >
                                                                    <ShieldCheck size={14} /> Принять
                                                                </button>
                                                                <button
                                                                    onClick={() => handleProposalAction(proposal.id, 'reject')}
                                                                    className="btn-secondary py-2 px-4 text-xs text-red-500 border-red-100 hover:bg-red-50"
                                                                >
                                                                    Отклонить
                                                                </button>
                                                            </>
                                                        ) : proposal.status === 'ACCEPTED' ? (
                                                            <span className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl flex items-center gap-1">
                                                                <Star size={14} fill="currentColor" /> Исполняется
                                                            </span>
                                                        ) : (
                                                            <span className="px-4 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl">Отклонено</span>
                                                        )}
                                                        <Link to={`/talents/${proposal.freelancer}`} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all">
                                                            <User size={18} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Portfolio Modal */}
            {isPortfolioModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-left">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingPortfolioId ? 'Редактировать работу' : 'Добавить новую работу'}
                            </h2>
                            <button
                                onClick={() => setIsPortfolioModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePortfolioSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-left">Название проекта *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold"
                                    placeholder="Например: Редизайн мобильного приложения"
                                    value={portfolioFormData.title}
                                    onChange={(e) => setPortfolioFormData({ ...portfolioFormData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-left">Описание</label>
                                <textarea
                                    rows="3"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                    placeholder="Опишите, что вы сделали в этом проекте..."
                                    value={portfolioFormData.description}
                                    onChange={(e) => setPortfolioFormData({ ...portfolioFormData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-left">Ссылка на проект (URL)</label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                        placeholder="https://example.com"
                                        value={portfolioFormData.url}
                                        onChange={(e) => setPortfolioFormData({ ...portfolioFormData, url: e.target.value })}
                                    />
                                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-left">Изображение *</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        id="portfolio-image"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => setPortfolioFormData({ ...portfolioFormData, image: e.target.files[0] })}
                                        required={!editingPortfolioId}
                                    />
                                    <label
                                        htmlFor="portfolio-image"
                                        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all group-hover:border-primary-400"
                                    >
                                        <ImageIcon className="text-slate-300 group-hover:text-primary-500 mb-3" size={32} />
                                        <span className="text-sm font-bold text-slate-500 group-hover:text-primary-700">
                                            {portfolioFormData.image ? portfolioFormData.image.name : 'Нажмите, чтобы загрузить фото'}
                                        </span>
                                        {editingPortfolioId && !portfolioFormData.image && (
                                            <span className="text-[10px] text-slate-400 mt-2 italic">Оставьте пустым, если не хотите менять изображение</span>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full btn-primary py-4 flex items-center justify-center gap-2 shadow-xl shadow-primary-600/20"
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <><Save size={20} /> {editingPortfolioId ? 'Обновить' : 'Опубликовать'}</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProfilePage;
