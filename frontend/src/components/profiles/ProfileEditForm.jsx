import React from 'react';
import { Settings, Save, Loader2, Send, Instagram, Github, Linkedin, Trash2, User } from 'lucide-react';

const ProfileEditForm = ({
    formData,
    setFormData,
    allSkills,
    allCategories,
    handleDeleteAccount,
    handleProfileUpdate,
    setIsEditing,
    isSaving,
    t
}) => {
    return (
        <div className="premium-card p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <Settings className="text-primary-600" /> {t('profile.settings_title')}
            </h3>

            <form onSubmit={handleProfileUpdate} className="space-y-8">
                {/* Names Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">{t('common.first_name')}</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                name="first_name"
                                type="text"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all outline-none font-medium"
                                placeholder={t('common.first_name')}
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">{t('common.last_name')}</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                name="last_name"
                                type="text"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all outline-none font-medium"
                                placeholder={t('common.last_name')}
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">{t('profile.profession_label')}</label>
                        <input
                            name="profession"
                            type="text"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all outline-none font-medium"
                            placeholder={t('profile.profession_placeholder')}
                            value={formData.profession}
                            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">{t('common.category')}</label>
                        <select
                            name="category_id"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all outline-none font-bold"
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        >
                            <option value="">{t('common.select_category')}</option>
                            {allCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">{t('profile.location_label')}</label>
                        <input
                            name="location"
                            type="text"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all outline-none font-medium"
                            placeholder={t('profile.location_placeholder')}
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">{t('profile.phone_label')}</label>
                        <input
                            name="phone_number"
                            type="text"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all outline-none font-medium"
                            placeholder="+993..."
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">{t('profile.stats.rate')} (TMT)</label>
                            <input
                                name="hourly_rate"
                                type="number"
                                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all outline-none font-medium text-center"
                                placeholder="50"
                                value={formData.hourly_rate}
                                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">{t('profile.stats.experience')}</label>
                            <input
                                name="experience_years"
                                type="number"
                                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all outline-none font-medium text-center"
                                placeholder="3"
                                value={formData.experience_years}
                                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">{t('profile.languages')}</label>
                        <input
                            name="languages"
                            type="text"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all outline-none font-medium"
                            placeholder="Turkmen, Russian, English"
                            value={formData.languages}
                            onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">{t('profile.bio_label')}</label>
                    <textarea
                        name="bio"
                        rows="4"
                        className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all outline-none font-medium resize-none"
                        placeholder={t('profile.bio_placeholder')}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    ></textarea>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700 ml-1">{t('profile.select_skills')}</label>
                    <div className="flex flex-wrap gap-2 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        {allSkills.map(skill => (
                            <button
                                key={skill.id}
                                type="button"
                                onClick={() => {
                                    const newSkills = formData.skills_ids.includes(skill.id)
                                        ? formData.skills_ids.filter(id => id !== skill.id)
                                        : [...formData.skills_ids, skill.id];
                                    setFormData({ ...formData, skills_ids: newSkills });
                                }}
                                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${formData.skills_ids.includes(skill.id) ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                            >
                                {skill.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700 ml-1">{t('profile.social_label')}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.keys(formData.social_links).map(platform => (
                            <div key={platform} className="relative group">
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 outline-none font-medium transition-all"
                                    placeholder={platform.charAt(0).toUpperCase() + platform.slice(1)}
                                    value={formData.social_links[platform]}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        social_links: { ...formData.social_links, [platform]: e.target.value }
                                    })}
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                    {platform === 'telegram' && <Send size={20} />}
                                    {platform === 'instagram' && <Instagram size={20} />}
                                    {platform === 'github' && <Github size={20} />}
                                    {platform === 'linkedin' && <Linkedin size={20} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-slate-100">
                    <div className="flex gap-4 flex-grow">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-grow btn-primary py-5 rounded-2xl text-lg flex items-center justify-center gap-3 shadow-2xl shadow-primary-600/30"
                            aria-label={t('common.save_changes')}
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={24} /> {t('common.save_changes')}</>}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-10 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all border border-slate-200"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="px-8 py-5 bg-red-50 text-red-600 font-extrabold rounded-2xl hover:bg-red-100 transition-all border-2 border-red-100 flex items-center justify-center gap-2"
                    >
                        <Trash2 size={20} /> {t('profile.delete_account')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileEditForm;
