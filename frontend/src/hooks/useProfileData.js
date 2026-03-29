import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import profilesService from '../api/profilesService';
import proposalsService from '../api/proposalsService';
import jobsService from '../api/jobsService';
import authService from '../api/authService';

import adminService from '../api/adminService';

export const useProfileData = () => {
    const { t, i18n } = useTranslation();
    const { user, logout, refreshUser, currentRole, switchRole } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [profile, setProfile] = useState(null);
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [activeJobs, setActiveJobs] = useState([]);
    const [draftJobs, setDraftJobs] = useState([]);
    const [myProposals, setMyProposals] = useState([]);
    const [receivedProposals, setReceivedProposals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [allSkills, setAllSkills] = useState([]);
    const [allCategories, setAllCategories] = useState([]);

    // Form states
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        profession: '',
        bio: '',
        location: '',
        phone_number: '',
        birth_date: '',
        languages: '',
        hourly_rate: '',
        experience_years: '',
        category_id: '',
        skills_ids: [],
        social_links: {
            telegram: '',
            instagram: '',
            github: '',
            linkedin: ''
        }
    });

    const [portfolioFormData, setPortfolioFormData] = useState({
        title: '',
        description: '',
        url: '',
        image: null
    });
    const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
    const [editingPortfolioId, setEditingPortfolioId] = useState(null);

    const fetchInitialData = useCallback(async (isRefresh = false) => {
        if (!user) return;
        try {
            if (!isRefresh) setIsLoading(true);
            const [profileData, skillsData, portfolioData, jobsData, myProposalsData, receivedProposalsData, categoriesData] = await Promise.all([
                profilesService.getMyProfile(),
                profilesService.getAllSkills().catch(() => ({ results: [] })),
                profilesService.getPortfolioItems(user?.id).catch(() => ({ results: [] })),
                jobsService.getMyJobs(user?.id).catch(() => ({ results: [] })),
                proposalsService.getSentProposals().catch(() => ({ results: [] })),
                proposalsService.getReceivedProposals().catch(() => ({ results: [] })),
                adminService.getCategories().catch(() => ({ results: [] }))
            ]);

            setProfile(profileData);
            setFormData({
                first_name: profileData.first_name || '',
                last_name: profileData.last_name || '',
                profession: profileData.profession || '',
                bio: profileData.bio || '',
                location: profileData.location || '',
                phone_number: profileData.phone_number || '',
                birth_date: profileData.birth_date || '',
                languages: profileData.languages || '',
                hourly_rate: profileData.hourly_rate || '',
                experience_years: profileData.experience_years || '',
                category_id: profileData.category?.id || '',
                skills_ids: profileData.skills?.map(s => s.id) || [],
                social_links: profileData.social_links || { telegram: '', instagram: '', github: '', linkedin: '' }
            });
            setAllSkills(skillsData.results || skillsData);
            setAllCategories(categoriesData.results || categoriesData);
            setPortfolioItems(portfolioData.results || portfolioData);

            const jobsList = jobsData.results || jobsData;
            setActiveJobs(Array.isArray(jobsList) ? jobsList.filter(j => j.status === 'PUBLISHED' || j.status === 'IN_PROGRESS') : []);
            setDraftJobs(Array.isArray(jobsList) ? jobsList.filter(j => j.status === 'DRAFT') : []);

            setMyProposals(myProposalsData.results || myProposalsData);
            setReceivedProposals(receivedProposalsData.results || receivedProposalsData);
        } catch (err) {
            console.error('Failed to fetch profile data', err);
            showToast(t('profile.load_error'), 'error');
        } finally {
            if (!isRefresh) setIsLoading(false);
        }
    }, [user?.id, t, showToast]); // Only depend on user.id, not the whole user object

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleDeleteAccount = async () => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('profile.delete_account_confirm'),
            variant: 'danger'
        });
        if (!isConfirmed) return;
        try {
            setIsSaving(true);
            await profilesService.deleteAccount();
            showToast(t('profile.account_deleted'), 'success');
            logout();
            window.location.href = '/';
        } catch (err) {
            showToast(t('profile.delete_account_error'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsSaving(true);
            const formData = new FormData();
            formData.append('avatar', file);
            const updatedProfile = await profilesService.updateMyProfile(formData);
            setProfile(updatedProfile);
            showToast(t('profile.avatar_update_success'), 'success');
            await refreshUser();
        } catch (err) {
            showToast(t('profile.avatar_update_error'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAvatar = async () => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('profile.delete_avatar_confirm'),
            variant: 'danger'
        });
        if (!isConfirmed) return;
        try {
            setIsSaving(true);
            await profilesService.deleteAvatar();
            setProfile({ ...profile, avatar: null });
            showToast(t('profile.delete_avatar_success'), 'success');
            await refreshUser();
        } catch (err) {
            showToast(t('profile.delete_avatar_error'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        if (e) e.preventDefault();
        
        if (!formData.first_name || formData.first_name.trim() === '') {
            showToast('Поле "Имя" не может быть пустым', 'error');
            return false;
        }

        try {
            setIsSaving(true);
            const submissionData = { ...formData };
            if (!submissionData.birth_date) delete submissionData.birth_date;
            if (!submissionData.hourly_rate || submissionData.hourly_rate === '') delete submissionData.hourly_rate;
            if (!submissionData.experience_years || submissionData.experience_years === '') delete submissionData.experience_years;

            console.log('Submission data:', submissionData);
            const updatedProfile = await profilesService.updateMyProfile(submissionData);
            console.log('Updated profile from server:', updatedProfile);
            setProfile(updatedProfile);
            showToast(t('common.save_changes'), 'success');
            await refreshUser();
            return true;
        } catch (err) {
            console.error('Profile update error:', err);
            showToast(t('profile.action_error'), 'error');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleRoleSwitch = async (role) => {
        try {
            await authService.toggleRole(role);
            showToast(t('profile.role_change_success', { role: role === 'CLIENT' ? t('common.client') : t('common.freelancer') }), 'success');
            await refreshUser();
            window.location.reload();
        } catch (err) {
            showToast(t('profile.role_change_error'), 'error');
        }
    };

    const handlePortfolioSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            setIsSaving(true);
            const portfolioData = new FormData();
            portfolioData.append('title', portfolioFormData.title);
            portfolioData.append('description', portfolioFormData.description);
            portfolioData.append('url', portfolioFormData.url);
            if (portfolioFormData.image) {
                portfolioData.append('image', portfolioFormData.image);
            }

            if (editingPortfolioId) {
                await profilesService.updatePortfolioItem(editingPortfolioId, portfolioData);
                showToast(t('profile.work_updated'), 'success');
            } else {
                await profilesService.addPortfolioItem(portfolioData);
                showToast(t('profile.work_added'), 'success');
            }

            const refreshedPortfolio = await profilesService.getPortfolioItems(user?.id);
            setPortfolioItems(refreshedPortfolio.results || refreshedPortfolio);
            setIsPortfolioModalOpen(false);
            setEditingPortfolioId(null);
            setPortfolioFormData({ title: '', description: '', url: '', image: null });
        } catch (err) {
            showToast(t('profile.work_save_error'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePortfolioItem = async (id) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('profile.delete_work_confirm'),
            variant: 'danger'
        });
        if (!isConfirmed) return;
        try {
            await profilesService.deletePortfolioItem(id);
            setPortfolioItems(portfolioItems.filter(item => item.id !== id));
            showToast(t('profile.delete_work_success'), 'success');
        } catch (err) {
            showToast(t('profile.delete_work_error'), 'error');
        }
    };

    const handlePublishDraft = async (id) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('profile.publish_draft_confirm'),
            variant: 'success'
        });
        if (!isConfirmed) return;
        try {
            await jobsService.updateJobStatus(id, 'PUBLISHED');
            showToast(t('profile.publish_success'), 'success');
            const jobsData = await jobsService.getMyJobs();
            const jobsList = jobsData.results || jobsData;
            setActiveJobs(jobsList.filter(j => j.status === 'PUBLISHED' || j.status === 'IN_PROGRESS'));
            setDraftJobs(jobsList.filter(j => j.status === 'DRAFT'));
        } catch (err) {
            showToast(t('profile.publish_error'), 'error');
        }
    };

    const handleDeleteJob = async (id) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('profile.delete_job_confirm'),
            variant: 'danger'
        });
        if (!isConfirmed) return;
        try {
            await jobsService.deleteJob(id);
            showToast(t('profile.delete_job_success'), 'success');
            setActiveJobs(activeJobs.filter(j => j.id !== id));
            setDraftJobs(draftJobs.filter(j => j.id !== id));
        } catch (err) {
            showToast(t('profile.delete_job_error'), 'error');
        }
    };

    const handleProposalAction = async (id, action) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: action === 'reject' ? t('profile.reject_proposal_confirm') : t('profile.cancel_proposal_confirm'),
            variant: action === 'reject' ? 'danger' : 'warning'
        });
        if (!isConfirmed) return;
        try {
            if (action === 'reject') {
                await proposalsService.rejectProposal(id);
                setReceivedProposals(receivedProposals.filter(p => p.id !== id));
            } else {
                await proposalsService.cancelProposal(id);
                setMyProposals(myProposals.filter(p => p.id !== id));
            }
            showToast(t('common.save_changes'), 'success');
        } catch (err) {
            showToast(t('profile.action_error'), 'error');
        }
    };

    const handleAcceptProposal = async (proposalId) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('profile.accept_proposal_confirm'),
            variant: 'success'
        });
        if (isConfirmed) {
            try {
                await proposalsService.acceptProposal(proposalId);
                const received = await proposalsService.getReceivedProposals(user?.id);
                setReceivedProposals(received.results || received);
                showToast(t('profile.proposal_accepted'), 'success');
            } catch (e) {
                showToast(t('profile.accept_proposal_error'), 'error');
            }
        }
    };

    return {
        user,
        logout,
        profile,
        portfolioItems,
        activeJobs,
        draftJobs,
        myProposals,
        receivedProposals,
        isLoading,
        isSaving,
        formData,
        setFormData,
        allSkills,
        portfolioFormData,
        setPortfolioFormData,
        isPortfolioModalOpen,
        setIsPortfolioModalOpen,
        editingPortfolioId,
        setEditingPortfolioId,
        handleAvatarChange,
        handleDeleteAvatar,
        handleProfileUpdate,
        handleRoleSwitch,
        handlePortfolioSubmit,
        handleDeletePortfolioItem,
        handlePublishDraft,
        handleDeleteJob,
        handleProposalAction,
        handleAcceptProposal,
        handleDeleteAccount,
        allCategories,
        currentRole,
        switchRole,
        t,
        i18n
    };
};
