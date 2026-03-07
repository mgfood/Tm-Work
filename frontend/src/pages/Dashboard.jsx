import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Briefcase, Clock, CheckCircle2, AlertCircle,
    Plus, ArrowRight, User
} from 'lucide-react';
import jobsService from '../api/jobsService';
import { useAuth } from '../context/AuthContext';
import { SkeletonList } from '../components/ui/Skeleton';

const Dashboard = () => {
    const { t } = useTranslation();
    const { user, currentRole } = useAuth();
    const [myJobs, setMyJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        const fetchMyJobs = async () => {
            try {
                setLoading(true);
                let data;
                if (currentRole === 'CLIENT') {
                    data = await jobsService.getMyJobs(user.id);
                } else if (currentRole === 'FREELANCER') {
                    data = await jobsService.getMyWorks(user.id);
                } else {
                    // Fallback or handle undecided role
                    data = await jobsService.getJobs(); // Or empty?
                }
                setMyJobs(data.results || data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        if (user && currentRole) fetchMyJobs();
    }, [user, currentRole]);

    if (!user) return (
        <div className="flex-grow flex items-center justify-center p-20 text-center">
            <div className="premium-card p-12 max-w-md">
                <User size={48} className="mx-auto text-slate-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    {t('dashboard.auth_required')}
                </h2>
                <p className="text-slate-500 mb-8">
                    {t('dashboard.auth_subtitle')}
                </p>
                <Link to="/login" className="btn-primary inline-block w-full">
                    {t('dashboard.login_button')}
                </Link>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        {t('dashboard.welcome', { name: user.first_name || 'User' })}
                    </h1>
                    <p className="text-slate-500">{t('dashboard.welcome_subtitle')}</p>
                </div>
                <Link to="/jobs/create" className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> {t('dashboard.new_order')}
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <Briefcase size={24} className="text-primary-600" />
                            {t('dashboard.active_projects')}
                        </h2>

                        {loading ? (
                            <SkeletonList />
                        ) : myJobs.length === 0 ? (
                            <div className="premium-card p-12 text-center">
                                <p className="text-slate-500">{t('dashboard.no_projects')}</p>
                                <Link to="/jobs" className="text-primary-600 font-bold mt-4 inline-block hover:underline">
                                    {t('dashboard.find_job')}
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myJobs.map(job => (
                                    <Link
                                        key={job.id}
                                        to={`/jobs/${job.id}`}
                                        className="premium-card p-6 flex justify-between items-center group"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${job.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                                                    job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                        job.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' :
                                                            job.status === 'DISPUTE' ? 'bg-red-100 text-red-700' :
                                                                job.status === 'CANCELLED' ? 'bg-slate-200 text-slate-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {job.status_display || job.status}
                                                </span>
                                                <span className="text-xs text-slate-400">{t('dashboard.id')}: #{job.id}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                                                {job.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {t('dashboard.budget')}: {job.budget} TMT
                                            </p>
                                        </div>
                                        <ArrowRight size={20} className="text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="space-y-8">
                    <div className="premium-card p-8 bg-primary-600 text-white shadow-xl shadow-primary-600/30">
                        <h3 className="font-bold mb-6 opacity-80 uppercase tracking-widest text-xs">
                            {t('dashboard.stats_title')}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-3xl font-bold">{myJobs.length}</div>
                                <div className="text-xs opacity-70">{t('dashboard.projects_count')}</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">0</div>
                                <div className="text-xs opacity-70">{t('dashboard.reviews_count')}</div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-8">
                        <h3 className="font-bold text-slate-900 mb-4">{t('dashboard.tips_title')}</h3>
                        <ul className="space-y-4 text-sm text-slate-600">
                            <li className="flex gap-3">
                                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                                {t('dashboard.tip_profile')}
                            </li>
                            <li className="flex gap-3">
                                <AlertCircle size={18} className="text-orange-500 shrink-0" />
                                {t('dashboard.tip_escrow')}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;