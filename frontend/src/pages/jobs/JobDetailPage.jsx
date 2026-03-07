import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useTranslation } from 'react-i18next';
import {
    Clock, DollarSign, User, Calendar, ArrowLeft,
    Send, AlertCircle, CheckCircle2, FileText,
    Briefcase, Check, MessageSquare, Loader2, Plus, X,
    Edit3, Trash2
} from 'lucide-react';
import jobsService from '../../api/jobsService';
import proposalsService from '../../api/proposalsService';
import chatService from '../../api/chatService';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewCard from '../../components/reviews/ReviewCard';
import reviewsService from '../../api/reviewsService';

const JobDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const { t } = useTranslation();

    const [job, setJob] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [jobReviews, setJobReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Proposal submission state
    const [proposalData, setProposalData] = useState({ message: '', price: '', deadline_days: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [proposalError, setProposalError] = useState('');

    // Proposal acceptance state
    const [acceptingId, setAcceptingId] = useState(null);

    // Submission and Action state
    const [submissionContent, setSubmissionContent] = useState('');
    const [submissionFileIds, setSubmissionFileIds] = useState([]);
    const [isSubmittingWork, setIsSubmittingWork] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchJobData = async () => {
            try {
                setLoading(true);
                const [jobData, proposalsData, reviewsData] = await Promise.all([
                    jobsService.getJobById(id),
                    proposalsService.getProposals({ job: id }).catch(() => ({ results: [] })),
                    apiClient.get(`/reviews/?job=${id}`).catch(() => ({ data: [] }))
                ]);

                setJob(jobData);
                setProposals(proposalsData.results || proposalsData);
                setJobReviews(reviewsData.data.results || reviewsData.data);
                setProposalData(prev => ({ ...prev, price: jobData.budget }));
            } catch (err) {
                setError(t('errors.jobNotFoundAccess'));
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobData();
    }, [id, t]);

    const handleProposalSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }

        setIsSubmitting(true);
        setProposalError('');

        try {
            await proposalsService.createProposal({
                job: id,
                ...proposalData
            });
            setSubmitSuccess(true);
        } catch (err) {
            setProposalError(err.response?.data?.detail || t('errors.proposalSubmitError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectProposal = async (proposalId) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('profile.reject_proposal_confirm'),
            confirmText: t('common.yes'),
            cancelText: t('common.no'),
            variant: 'danger'
        });

        if (!isConfirmed) return;

        try {
            await proposalsService.rejectProposal(proposalId);
            showToast(t('toasts.proposalRejected'), 'info');
            const updatedProposals = await proposalsService.getProposals({ job: id });
            setProposals(updatedProposals.results || updatedProposals);
        } catch (err) {
            showToast(err.response?.data?.error || t('errors.action_error'), 'error');
        }
    };

    const handleAcceptProposal = async (proposalId) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('confirmations.acceptProposal'),
            confirmText: t('common.accept'),
            variant: 'success'
        });

        if (!isConfirmed) return;

        setAcceptingId(proposalId);
        try {
            await proposalsService.acceptProposal(proposalId);
            showToast(t('toasts.proposalAccepted'), 'success');
            // Refresh job data
            const updatedJob = await jobsService.getJobById(id);
            setJob(updatedJob);
            const updatedProposals = await proposalsService.getProposals({ job: id });
            setProposals(updatedProposals.results || updatedProposals);
        } catch (err) {
            showToast(err.response?.data?.error || t('errors.acceptProposalError'), 'error');
        } finally {
            setAcceptingId(null);
        }
    };

    const handleSubmitWork = async (e) => {
        e.preventDefault();
        if (!submissionContent) return;

        setIsSubmittingWork(true);
        try {
            await apiClient.post(`/jobs/${id}/submit-work/`, {
                content: submissionContent,
                file_ids: submissionFileIds
            });
            showToast(t('toasts.workSubmitted'), 'success');
            // Refresh state
            const updatedJob = await jobsService.getJobById(id);
            setJob(updatedJob);
            setSubmissionContent('');
            setSubmissionFileIds([]);
        } catch (err) {
            showToast(err.response?.data?.error || t('errors.submitWorkError'), 'error');
        } finally {
            setIsSubmittingWork(false);
        }
    };

    const handleApproveWork = async () => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('confirmations.approveWork'),
            confirmText: t('common.approve'),
            variant: 'success'
        });

        if (!isConfirmed) return;

        setActionLoading(true);
        try {
            await apiClient.post(`/jobs/${id}/approve-work/`);
            showToast(t('toasts.workApproved'), 'success');
            const updatedJob = await jobsService.getJobById(id);
            setJob(updatedJob);
        } catch (err) {
            showToast(err.response?.data?.error || t('errors.approveWorkError'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteJob = async () => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('profile.delete_job_confirm'),
            confirmText: t('common.delete'),
            variant: 'danger'
        });

        if (!isConfirmed) return;

        setActionLoading(true);
        try {
            await jobsService.deleteJob(id);
            showToast(t('profile.delete_job_success'), 'success');
            navigate('/dashboard');
        } catch (err) {
            showToast(t('profile.delete_job_error'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestRevision = async () => {
        setActionLoading(true);
        try {
            await apiClient.post(`/jobs/${id}/request-revision/`);
            showToast(t('toasts.revisionRequested'), 'info');
            const updatedJob = await jobsService.getJobById(id);
            setJob(updatedJob);
        } catch (err) {
            showToast(err.response?.data?.error || t('errors.revisionRequestError'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div data-testid="job-details-loading" className="max-w-4xl mx-auto px-6 py-20 animate-pulse">
            <div className="h-10 w-2/3 bg-slate-100 rounded mb-8"></div>
            <div className="h-64 bg-slate-50 rounded-2xl"></div>
        </div>
    );

    if (error || !job) return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <div className="premium-card p-12">
                <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                <h2 data-testid="job-error" className="text-2xl font-bold text-slate-900">{error || t('errors.jobNotFound')}</h2>
                <Link to="/jobs" className="btn-primary mt-8 inline-block">{t('buttons.backToList')}</Link>
            </div>
        </div>
    );

    const isClient = user?.id === job.client;
    const filteredProposals = proposals.filter(p => p.status !== 'REJECTED');
    const hasAcceptedProposal = proposals.some(p => p.status === 'ACCEPTED');

    return (
        <div data-testid="job-details-container" className="max-w-5xl mx-auto px-6 py-12">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-8 transition-colors font-medium">
                <ArrowLeft size={18} />
                {t('common.back')}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="premium-card p-10">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <span data-testid="job-status" data-status={job.status} className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${job.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                                    job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                        job.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' :
                                            job.status === 'COMPLETED' ? 'bg-primary-100 text-primary-700' :
                                                'bg-slate-100 text-slate-700'
                                    }`}>
                                    {t(`job.statuses.${job.status.toLowerCase()}`)}
                                </span>
                                <span className="text-slate-400 text-sm flex items-center gap-1">
                                    <Calendar size={14} /> {t('job.published')}: {new Date(job.created_at).toLocaleDateString('ru-RU')}
                                </span>
                            </div>

                            {isClient && job.status === 'PUBLISHED' && (
                                <div className="flex gap-2">
                                    <Link
                                        to={`/jobs/${id}/edit`}
                                        data-testid="edit-job-button"
                                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                                    >
                                        <Edit3 size={16} /> {t('common.edit')}
                                    </Link>
                                    <button
                                        onClick={handleDeleteJob}
                                        data-testid="delete-job-button"
                                        disabled={actionLoading}
                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                                    >
                                        <Trash2 size={16} /> {t('common.delete')}
                                    </button>
                                </div>
                            )}
                        </div>

                        <h1 data-testid="job-title" className="text-4xl font-extrabold text-slate-900 mb-8 leading-tight">{job.title}</h1>

                        <div className="prose prose-slate max-w-none">
                            <h3 className="text-xl font-bold mb-4">{t('job.descriptionTitle')}</h3>
                            <p data-testid="job-description" className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">
                                {job.description}
                            </p>
                        </div>

                        {job.files?.length > 0 && (
                            <div className="mt-10 pt-10 border-t border-slate-100">
                                <h4 className="font-bold mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-primary-600" /> {t('job.attachedFiles')}
                                </h4>
                                <div className="flex flex-wrap gap-4">
                                    {job.files.map(file => (
                                        <a
                                            key={file.id}
                                            href={file.file}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            {t('job.file')} #{file.id}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Proposals List (For Client) */}
                    {isClient && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <Briefcase size={24} className="text-primary-600" /> {t('job.proposals')} ({filteredProposals.length})
                            </h3>

                            {proposals.length === 0 ? (
                                <div className="premium-card p-12 text-center text-slate-500">
                                    {t('job.noProposals')}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredProposals.map(proposal => (
                                        <div
                                            key={proposal.id}
                                            data-testid="proposal-card"
                                            data-proposal-id={proposal.id}
                                            data-proposal-status={proposal.status}
                                            className={`premium-card p-6 border-2 transition-all ${proposal.status === 'ACCEPTED' ? 'border-primary-500 bg-primary-50/30' : 'border-transparent'}`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                                        <User size={20} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <Link to={`/talents/${proposal.freelancer}`} className="font-bold text-slate-900 hover:text-primary-600">
                                                            {proposal.freelancer_name || `${t('common.freelancer')} #${proposal.freelancer}`}
                                                        </Link>
                                                        <div className="text-xs text-slate-400">{new Date(proposal.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-black text-primary-600">${proposal.price}</div>
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{proposal.deadline_days} {t('common.days')}</div>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm mb-6 leading-relaxed bg-white/50 p-4 rounded-xl border border-slate-100 italic">
                                                "{proposal.message}"
                                            </p>

                                            <div className="flex gap-2 mt-4">
                                                {job.status === 'PUBLISHED' && !hasAcceptedProposal && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAcceptProposal(proposal.id)}
                                                            disabled={acceptingId === proposal.id}
                                                            data-testid="accept-proposal-button"
                                                            className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
                                                        >
                                                            {acceptingId === proposal.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                                                            {t('buttons.acceptProposal')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectProposal(proposal.id)}
                                                            data-testid="reject-proposal-button"
                                                            className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors"
                                                            title={t('common.reject')}
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    to={`/chat?user=${proposal.freelancer}`}
                                                    className="flex-1 btn-secondary py-2.5 text-sm flex items-center justify-center gap-2"
                                                >
                                                    <MessageSquare size={16} /> {t('buttons.write')}
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Execution/Work Submission Section */}
                    {job.status === 'IN_PROGRESS' && (
                        <div className="premium-card p-10 border-l-4 border-l-blue-500">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Clock className="text-blue-500" /> {t('job.workInProgress')}
                            </h3>

                            {job.freelancer === user?.id ? (
                                <form onSubmit={handleSubmitWork} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">{t('job.workResultLabel')}</label>
                                        <textarea
                                            value={submissionContent}
                                            onChange={(e) => setSubmissionContent(e.target.value)}
                                            data-testid="submission-content-input"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[150px]"
                                            placeholder={t('job.workResultPlaceholder')}
                                            required
                                        />
                                    </div>

                                    {/* File Upload for Submission */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center hover:border-primary-400 transition-all cursor-pointer group relative mb-4">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={async (e) => {
                                                const files = Array.from(e.target.files);
                                                for (const file of files) {
                                                    const formData = new FormData();
                                                    formData.append('file', file);
                                                    try {
                                                        const res = await apiClient.post(`/jobs/${id}/upload-file/`, formData);
                                                        setSubmissionFileIds(prev => [...prev, res.data.id]);
                                                        showToast(t('editJob.fileUploadSuccess'), 'success');
                                                    } catch (err) {
                                                        showToast(t('editJob.fileUploadError'), 'error');
                                                    }
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                                                <Plus size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700">{t('editJob.uploadPlaceholder')}</p>
                                                <p className="text-xs text-slate-400 mt-1">{t('editJob.uploadHint')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {submissionFileIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {submissionFileIds.map(fid => (
                                                <div key={fid} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold border border-primary-100 flex items-center gap-2">
                                                    {t('job.file')} #{fid}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmittingWork}
                                        data-testid="submit-work-button"
                                        className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-lg"
                                    >
                                        {isSubmittingWork ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                        {t('buttons.submitWork')}
                                    </button>
                                </form>
                            ) : (
                                <div className="bg-blue-50 text-blue-700 p-6 rounded-2xl flex items-start gap-4">
                                    <AlertCircle className="shrink-0 mt-1" />
                                    <p className="font-medium">{t('job.waitingForFreelancer')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Under Review / Approval Section */}
                    {job.status === 'SUBMITTED' && (
                        <div className="premium-card p-10 border-l-4 border-l-amber-500">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Clock className="text-amber-500" /> {t('job.workUnderReview')}
                            </h3>

                            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200">
                                <h4 className="font-bold text-slate-900 mb-3">{t('job.submittedContent')}</h4>
                                <div className="text-slate-600 whitespace-pre-line mb-4">{job.submission?.content}</div>

                                {job.submission?.files?.length > 0 && (
                                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                                        {job.submission.files && job.submission.files.map(file => (
                                            <a
                                                key={file.id}
                                                href={file.file}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                                            >
                                                <FileText size={14} className="text-primary-600" />
                                                {t('job.file')} #{file.id}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {isClient ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        onClick={handleApproveWork}
                                        disabled={actionLoading}
                                        data-testid="approve-work-button"
                                        className="btn-primary py-4 flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                                        {t('buttons.approveWork')}
                                    </button>
                                    <button
                                        onClick={handleRequestRevision}
                                        disabled={actionLoading}
                                        data-testid="request-revision-button"
                                        className="btn-secondary py-4 flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" /> : <AlertCircle size={20} />}
                                        {t('buttons.requestRevision')}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-amber-50 text-amber-700 p-6 rounded-2xl flex items-start gap-4">
                                    <AlertCircle className="shrink-0 mt-1" />
                                    <p className="font-medium">{t('job.waitingForClientReview')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Completed Section */}
                    {job.status === 'COMPLETED' && (
                        <div className="space-y-8">
                            <div className="premium-card p-10 border-l-4 border-l-green-500 bg-green-50/30">
                                <div className="flex items-center gap-4 text-green-600 mb-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={28} />
                                    </div>
                                    <h3 className="text-3xl font-black">{t('job.completedStatus')}</h3>
                                </div>
                                <p className="text-slate-600 text-lg">{t('job.completedText')}</p>
                            </div>

                            {/* Reviews Section */}
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-slate-900">{t('job.reviewsTitle')}</h3>
                                {jobReviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {jobReviews.map(review => (
                                            <ReviewCard key={review.id} review={review} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 italic">{t('job.noReviews')}</div>
                                )}

                                {/* Review Form (if user is part of job and hasn't reviewed) */}
                                {['IN_PROGRESS', 'SUBMITTED', 'COMPLETED'].includes(job.status) &&
                                    (isClient || job.freelancer === user?.id) &&
                                    !jobReviews.some(r => r.author === user?.id) && (
                                        <div className="mt-8">
                                            <ReviewForm
                                                job={job}
                                                onReviewSubmitted={() => window.location.reload()}
                                            />
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    <div className="premium-card p-8">
                        <div className="mb-8">
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{t('job.budget')}</div>
                            <div className="text-4xl font-black text-slate-900 flex items-center gap-1">
                                <span className="text-primary-600">$</span>
                                {job.budget}
                            </div>
                        </div>

                        {!isClient && job.status === 'PUBLISHED' && (
                            <>
                                {submitSuccess ? (
                                    <div className="bg-green-50 border border-green-100 text-green-700 p-6 rounded-2xl text-center">
                                        <CheckCircle2 className="mx-auto mb-3" size={32} />
                                        <div className="font-bold text-lg mb-1">{t('job.proposalSent')}</div>
                                        <div className="text-sm opacity-90">{t('job.proposalSentSub')}</div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleProposalSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">{t('job.yourPrice')}</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="number"
                                                    required
                                                    data-testid="proposal-price-input"
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 font-bold"
                                                    value={proposalData.price}
                                                    onChange={e => setProposalData({ ...proposalData, price: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">{t('job.deadlineDays')}</label>
                                            <div className="relative">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="number"
                                                    required
                                                    data-testid="proposal-deadline-input"
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 font-bold"
                                                    value={proposalData.deadline_days}
                                                    onChange={e => setProposalData({ ...proposalData, deadline_days: e.target.value })}
                                                    placeholder="7"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">{t('job.coverLetter')}</label>
                                            <textarea
                                                required
                                                data-testid="proposal-message-input"
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 min-h-[120px] text-sm"
                                                value={proposalData.message}
                                                onChange={e => setProposalData({ ...proposalData, message: e.target.value })}
                                                placeholder={t('job.coverLetterPlaceholder')}
                                            />
                                        </div>
                                        {proposalError && (
                                            <div className="text-red-500 text-xs font-medium bg-red-50 p-3 rounded-lg flex items-center gap-2">
                                                <AlertCircle size={14} /> {proposalError}
                                            </div>
                                        )}
                                        <button
                                            disabled={isSubmitting}
                                            data-testid="submit-proposal-button"
                                            className="w-full btn-primary py-4 font-bold text-lg shadow-xl shadow-primary-200 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                            {t('buttons.sendProposal')}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}

                        <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('job.deadline')}</div>
                                    <div className="font-bold text-slate-900">
                                        {new Date(job.deadline).toLocaleDateString('ru-RU')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-8">
                        <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-6">{t('job.clientInfo')}</h4>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                                <User size={28} />
                            </div>
                            <div>
                                <div className="font-bold text-lg text-slate-900">{job.client_name || `${t('common.client')} #${typeof job.client === 'object' ? job.client?.id : job.client}`}</div>
                                <div className="text-sm text-slate-500">{t('job.onPlatformSince')} 2026</div>
                            </div>
                        </div>
                        <Link
                            to={`/talents/${typeof job.client === 'object' ? job.client?.id : job.client}`}
                            className="w-full btn-secondary py-3 text-sm block text-center"
                        >
                            {t('buttons.clientProfile')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetailPage;