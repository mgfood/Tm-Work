import React, { useState } from 'react';
import {
    Briefcase, Clock, MapPin, Star as StarIcon,
    ImageIcon, Send, Archive, MessageSquare, Loader2
} from 'lucide-react';

import { useProfileData } from '../../hooks/useProfileData';
import ProfileSidebar from '../../components/profiles/ProfileSidebar';
import ProfileEditForm from '../../components/profiles/ProfileEditForm';

// Tab Components
import PortfolioTab from '../../components/profiles/tabs/PortfolioTab';
import ActiveJobsTab from '../../components/profiles/tabs/ActiveJobsTab';
import DraftsTab from '../../components/profiles/tabs/DraftsTab';
import SentProposalsTab from '../../components/profiles/tabs/SentProposalsTab';
import ReceivedProposalsTab from '../../components/profiles/tabs/ReceivedProposalsTab';

const MyProfilePage = () => {
    const {
        user, logout, profile, portfolioItems, activeJobs, draftJobs,
        myProposals, receivedProposals, isLoading, isSaving,
        formData, setFormData, allSkills, portfolioFormData, setPortfolioFormData,
        isPortfolioModalOpen, setIsPortfolioModalOpen, editingPortfolioId, setEditingPortfolioId,
        handleAvatarChange, handleDeleteAvatar, handleProfileUpdate, handleRoleSwitch,
        handlePortfolioSubmit, handleDeletePortfolioItem, handlePublishDraft, handleDeleteJob,
        handleProposalAction, handleAcceptProposal, handleDeleteAccount, allCategories,
        currentRole, switchRole, t, i18n
    } = useProfileData();

    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('portfolio');

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
    );

    const tabs = [
        { id: 'portfolio', label: t('profile.portfolio'), icon: ImageIcon },
        { id: 'active_jobs', label: t('profile.my_jobs'), icon: Briefcase },
        { id: 'drafts', label: t('profile.drafts'), icon: Archive },
        { id: 'sent_proposals', label: t('profile.my_proposals'), icon: Send },
        { id: 'received_proposals', label: t('profile.received_proposals'), icon: MessageSquare }
    ];

    const stats = [
        { icon: Briefcase, color: 'primary', value: profile?.completed_works_count || 0, label: t('profile.stats.completedWorks') },
        { icon: StarIcon, color: 'orange', value: profile?.freelancer_rating || '0.0', label: t('profile.reviewsCount') },
        { icon: Clock, color: 'green', value: profile?.hourly_rate || 0, label: `${t('profile.stats.rate')} (TMT)` },
        { icon: MapPin, color: 'blue', value: profile?.location || t('profile.defaultLocation'), label: t('profile.location_label') }
    ];

    return (
        <div className="max-w-7xl mx-auto px-6 py-12" data-testid="profile">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <ProfileSidebar
                    user={user}
                    profile={profile}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    handleAvatarChange={handleAvatarChange}
                    handleDeleteAvatar={handleDeleteAvatar}
                    handleRoleSwitch={handleRoleSwitch}
                    currentRole={currentRole}
                    switchRole={switchRole}
                    logout={logout}
                    t={t}
                />

                <div className="lg:col-span-3">
                    {isEditing ? (
                        <ProfileEditForm
                            formData={formData}
                            setFormData={setFormData}
                            allSkills={allSkills}
                            allCategories={allCategories}
                            handleDeleteAccount={handleDeleteAccount}
                            handleProfileUpdate={async (e) => {
                                const success = await handleProfileUpdate(e);
                                if (success) setIsEditing(false);
                            }}
                            setIsEditing={setIsEditing}
                            isSaving={isSaving}
                            t={t}
                        />
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-700">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {stats.map((stat, idx) => (
                                    <div key={idx} className="premium-card p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300">
                                        <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl mb-3`}>
                                            <stat.icon size={24} />
                                        </div>
                                        <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Bio Section */}
                            <div className="premium-card p-8 bg-white border border-slate-100">
                                <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                                    <StarIcon className="text-primary-600" size={16} /> {t('profile.bio_label')}
                                </h3>
                                <div className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap" data-testid="bio">
                                    {profile?.bio || t('talentList.noBio')}
                                </div>
                            </div>

                            {/* Tabs & Content */}
                            <div className="premium-card overflow-hidden">
                                <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-hide">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-8 py-6 text-sm font-black whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'border-primary-600 text-primary-600 bg-primary-50/10' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <tab.icon size={16} /> {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-10">
                                    {activeTab === 'portfolio' && (
                                        <PortfolioTab
                                            portfolioItems={portfolioItems}
                                            portfolioFormData={portfolioFormData}
                                            setPortfolioFormData={setPortfolioFormData}
                                            isPortfolioModalOpen={isPortfolioModalOpen}
                                            setIsPortfolioModalOpen={setIsPortfolioModalOpen}
                                            editingPortfolioId={editingPortfolioId}
                                            setEditingPortfolioId={setEditingPortfolioId}
                                            handlePortfolioSubmit={handlePortfolioSubmit}
                                            handleDeletePortfolioItem={handleDeletePortfolioItem}
                                            isSaving={isSaving}
                                            t={t}
                                        />
                                    )}
                                    {activeTab === 'active_jobs' && (
                                        <ActiveJobsTab
                                            activeJobs={activeJobs}
                                            handleDeleteJob={handleDeleteJob}
                                            t={t}
                                        />
                                    )}
                                    {activeTab === 'drafts' && (
                                        <DraftsTab
                                            draftJobs={draftJobs}
                                            handlePublishDraft={handlePublishDraft}
                                            handleDeleteJob={handleDeleteJob}
                                            t={t}
                                            i18n={i18n}
                                        />
                                    )}
                                    {activeTab === 'sent_proposals' && (
                                        <SentProposalsTab
                                            myProposals={myProposals}
                                            handleProposalAction={handleProposalAction}
                                            t={t}
                                        />
                                    )}
                                    {activeTab === 'received_proposals' && (
                                        <ReceivedProposalsTab
                                            receivedProposals={receivedProposals}
                                            handleAcceptProposal={handleAcceptProposal}
                                            handleProposalAction={handleProposalAction}
                                            user={user}
                                            t={t}
                                        />
                                    )}
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
