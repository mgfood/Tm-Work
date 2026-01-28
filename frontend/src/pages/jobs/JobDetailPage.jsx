import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Clock, DollarSign, User, Calendar, ArrowLeft,
    Send, AlertCircle, CheckCircle2, FileText,
    Briefcase, Check
} from 'lucide-react';
import jobsService from '../../api/jobsService';
import proposalsService from '../../api/proposalsService';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const JobDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [job, setJob] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Proposal submission state
    const [proposalData, setProposalData] = useState({ message: '', price: '', deadline_days: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [proposalError, setProposalError] = useState('');

    // Proposal acceptance state
    const [acceptingId, setAcceptingId] = useState(null);

    useEffect(() => {
        const fetchJobData = async () => {
            try {
                setLoading(true);
                const [jobData, proposalsData] = await Promise.all([
                    jobsService.getJobById(id),
                    proposalsService.getProposals({ job: id }).catch(() => ({ results: [] }))
                ]);

                setJob(jobData);
                setProposals(proposalsData.results || proposalsData);
                setProposalData(prev => ({ ...prev, price: jobData.budget }));
            } catch (err) {
                setError('Заказ не найден или у вас нет доступа.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobData();
    }, [id]);

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
            setProposalError(err.response?.data?.detail || 'Ошибка при отправке отклика. Возможно, вы уже откликались.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAcceptProposal = async (proposalId) => {
        if (!window.confirm('Вы уверены, что хотите принять этот отклик? Это заблокирует бюджет заказа в системе Escrow.')) {
            return;
        }

        setAcceptingId(proposalId);
        try {
            await proposalsService.acceptProposal(proposalId);
            // Refresh job data
            const updatedJob = await jobsService.getJobById(id);
            setJob(updatedJob);
            const updatedProposals = await proposalsService.getProposals({ job: id });
            setProposals(updatedProposals.results || updatedProposals);
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка при принятии отклика');
        } finally {
            setAcceptingId(null);
        }
    };

    if (loading) return (
        <div className="max-w-4xl mx-auto px-6 py-20 animate-pulse">
            <div className="h-10 w-2/3 bg-slate-100 rounded mb-8"></div>
            <div className="h-64 bg-slate-50 rounded-2xl"></div>
        </div>
    );

    if (error || !job) return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <div className="premium-card p-12">
                <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900">{error || 'Заказ не найден'}</h2>
                <Link to="/jobs" className="btn-primary mt-8 inline-block">Вернуться к списку</Link>
            </div>
        </div>
    );

    const isClient = user?.id === job.client;
    const hasAcceptedProposal = proposals.some(p => p.is_accepted);

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-8 transition-colors font-medium">
                <ArrowLeft size={18} />
                Назад
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="premium-card p-10">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${job.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                                    job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                }`}>
                                {job.status_display || job.status}
                            </span>
                            <span className="text-slate-400 text-sm flex items-center gap-1">
                                <Calendar size={14} />
                                Опубликовано: {new Date(job.created_at).toLocaleDateString('ru-RU')}
                            </span>
                        </div>

                        <h1 className="text-4xl font-extrabold text-slate-900 mb-8 leading-tight">{job.title}</h1>

                        <div className="prose prose-slate max-w-none">
                            <h3 className="text-xl font-bold mb-4">Описание задачи</h3>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">
                                {job.description}
                            </p>
                        </div>

                        {job.files?.length > 0 && (
                            <div className="mt-10 pt-10 border-t border-slate-100">
                                <h4 className="font-bold mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-primary-600" />
                                    Прикрепленные файлы
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
                                            Файл #{file.id}
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
                                <Briefcase size={24} className="text-primary-600" />
                                Отклики ({proposals.length})
                            </h3>

                            {proposals.length === 0 ? (
                                <div className="premium-card p-12 text-center text-slate-500">
                                    Пока нет откликов на этот проект.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {proposals.map(proposal => (
                                        <div
                                            key={proposal.id}
                                            className={`premium-card p-6 border-2 transition-all ${proposal.is_accepted ? 'border-primary-600 bg-primary-50' : 'border-transparent'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">Фрилансер #{proposal.freelancer}</div>
                                                        <div className="text-xs text-slate-400">Отправлено {new Date().toLocaleDateString('ru-RU')}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-primary-600">{proposal.price} TMT</div>
                                                    <div className="text-xs text-slate-500">{proposal.deadline_days} дн.</div>
                                                </div>
                                            </div>

                                            <p className="text-slate-600 text-sm mb-6 leading-relaxed italic">
                                                "{proposal.message}"
                                            </p>

                                            {isClient && job.status === 'PUBLISHED' && !hasAcceptedProposal && (
                                                <button
                                                    onClick={() => handleAcceptProposal(proposal.id)}
                                                    disabled={acceptingId === proposal.id}
                                                    className="w-full btn-primary py-2 text-sm flex items-center justify-center gap-2"
                                                >
                                                    {acceptingId === proposal.id ? 'Принятие...' : <><Check size={16} /> Принять отклик</>}
                                                </button>
                                            )}

                                            {proposal.is_accepted && (
                                                <div className="text-center py-2 bg-primary-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                                    <CheckCircle2 size={16} /> Выбран исполнителем
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Proposal Form (For Freelancers) */}
                    {!isClient && !submitSuccess && job.status === 'PUBLISHED' && (
                        <div className="premium-card p-10 border-2 border-primary-50">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Send size={24} className="text-primary-600" />
                                Оставить отклик
                            </h3>

                            {proposalError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3">
                                    <AlertCircle size={20} className="shrink-0" />
                                    <p>{proposalError}</p>
                                </div>
                            )}

                            <form onSubmit={handleProposalSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Ваша цена (TMT)</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={proposalData.price}
                                            onChange={(e) => setProposalData(prev => ({ ...prev, price: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Срок (в днях)</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Например: 5"
                                            value={proposalData.deadline_days}
                                            onChange={(e) => setProposalData(prev => ({ ...prev, deadline_days: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Сопроводительное письмо</label>
                                    <textarea
                                        rows="5"
                                        required
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Расскажите, почему вы подходите для этого проекта..."
                                        value={proposalData.message}
                                        onChange={(e) => setProposalData(prev => ({ ...prev, message: e.target.value }))}
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full btn-primary py-4 text-lg"
                                >
                                    {isSubmitting ? 'Отправка...' : 'Отправить отклик'}
                                </button>
                            </form>
                        </div>
                    )}

                    {job.status !== 'PUBLISHED' && !isClient && (
                        <div className="premium-card p-10 text-center text-slate-500">
                            Этот заказ больше не принимает отклики.
                        </div>
                    )}

                    {submitSuccess && (
                        <div className="premium-card p-10 bg-green-50 border-green-200 text-center">
                            <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4" />
                            <h3 className="text-2xl font-bold text-green-800">Отклик успешно отправлен!</h3>
                            <p className="text-green-700 mt-2">Заказчик увидит ваше предложение и сможет связаться с вами.</p>
                            <button
                                onClick={() => navigate('/jobs')}
                                className="mt-8 px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all"
                            >
                                Вернуться к поиску
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <div className="premium-card p-8">
                        <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-6">Детали проекта</h4>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500">Бюджет</div>
                                    <div className="text-xl font-bold text-slate-900">{job.budget} TMT</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500">Дедлайн</div>
                                    <div className="text-lg font-bold text-slate-900">
                                        {new Date(job.deadline).toLocaleDateString('ru-RU')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-8">
                        <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-6">Заказчик</h4>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                                <User size={28} />
                            </div>
                            <div>
                                <div className="font-bold text-lg text-slate-900">Заказчик #{job.client}</div>
                                <div className="text-sm text-slate-500">На платформе с 2026</div>
                            </div>
                        </div>
                        <button className="w-full btn-secondary py-3 text-sm">Профиль заказчика</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetailPage;
