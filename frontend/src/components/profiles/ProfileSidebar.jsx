import React from 'react';
import { User, Camera, Trash2, Settings, LogOut, Plus, CheckCircle2 } from 'lucide-react';
import { useConfirm } from '../../context/ConfirmContext';

const ProfileSidebar = ({
    user,
    profile,
    isEditing,
    setIsEditing,
    handleAvatarChange,
    handleDeleteAvatar,
    handleRoleSwitch,
    currentRole,
    switchRole,
    logout,
    t
}) => {
    const { confirm } = useConfirm();
    return (
        <div className="lg:col-span-1 space-y-6">
            <div className="premium-card p-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-blue-500"></div>

                <div className="relative mx-auto w-32 h-32 mb-6 group">
                    <div className="w-full h-full rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100">
                        {profile?.avatar ? (
                            <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <User size={64} />
                            </div>
                        )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 p-2.5 bg-primary-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-primary-700 transition-all scale-90 group-hover:scale-100">
                        <Camera size={20} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>

                    {profile?.avatar && (
                        <button
                            onClick={handleDeleteAvatar}
                            className="absolute -top-2 -right-2 p-2 bg-red-50 text-red-500 rounded-xl shadow-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            title={t('profile.avatar_delete_hint')}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                <h2 className="text-2xl font-black text-slate-900 mb-1">{user?.first_name} {user?.last_name}</h2>
                <p className="text-slate-500 font-medium mb-6">{profile?.profession || t('profile.role_freelancer')}</p>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`w-full py-3.5 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isEditing ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}`}
                    >
                        <Settings size={18} /> {isEditing ? t('common.cancel') : t('profile.settings_title')}
                    </button>
                    <button
                        onClick={() => logout()}
                        className="w-full py-3.5 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 transition-all"
                    >
                        <LogOut size={18} /> {t('nav.logout')}
                    </button>
                </div>
            </div>

            <div className="premium-card p-6 space-y-4">
                <div className="flex items-center gap-3 text-slate-900 font-black mb-2 uppercase text-xs tracking-widest">
                    <Plus size={16} className="text-primary-500" /> {t('profile.roles_title')}
                </div>
                <div className="space-y-3">
                    {['CLIENT', 'FREELANCER'].map(role => {
                        const hasRole = user?.roles?.some(r => r.name === role);
                        const isActive = currentRole === role;

                        return (
                            <div key={role} className="relative group">
                                <button
                                    onClick={() => {
                                        if (hasRole) {
                                            if (!isActive) switchRole(role);
                                        } else {
                                            handleRoleSwitch(role);
                                        }
                                    }}
                                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${isActive
                                        ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                                        : hasRole
                                            ? 'border-slate-100 bg-white hover:border-primary-200 hover:shadow-sm'
                                            : 'border-slate-50 bg-slate-50 opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold ${isActive ? 'text-primary-700' : hasRole ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {role === 'CLIENT' ? t('common.client') : t('common.freelancer')}
                                        </span>
                                        {isActive && <span className="text-[10px] uppercase font-black bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">Active</span>}
                                    </div>
                                    {hasRole && <CheckCircle2 size={18} className={isActive ? "text-primary-500" : "text-green-500"} />}
                                    {!hasRole && <Plus size={18} className="text-slate-400" />}
                                </button>

                                {hasRole && (
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const isConfirmed = await confirm({
                                                title: t('common.confirm_action'),
                                                message: t('common.confirm_action'),
                                                variant: 'danger'
                                            });
                                            if (isConfirmed) {
                                                handleRoleSwitch(role);
                                            }
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white text-slate-400 hover:text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                        title={t('common.delete')}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                <p className="text-[10px] text-slate-400 text-center font-medium italic mt-2">
                    {t('profile.role_switch_hint')}
                </p>
            </div>
        </div>
    );
};

export default ProfileSidebar;
