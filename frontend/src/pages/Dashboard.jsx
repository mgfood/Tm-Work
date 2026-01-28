import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Briefcase, Clock, CheckCircle2, AlertCircle,
    Plus, ArrowRight, User
} from 'lucide-react';
import jobsService from '../api/jobsService';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [myJobs, setMyJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyJobs = async () => {
            try {
                setLoading(true);
                // If user is client, fetch jobs they created. 
                // If freelancer, they should probably see their proposals or active jobs.
                // For now, let's fetch jobs where they are either client or freelancer.
                const data = await jobsService.getJobs();
                setMyJobs(data.results || data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchMyJobs();
    }, [user]);

    if (!user) return (
        <div className="flex-grow flex items-center justify-center p-20 text-center">
            <div className="premium-card p-12 max-w-md">
                <User size={48} className="mx-auto text-slate-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Войдите в систему</h2>
                <p className="text-slate-500 mb-8">Чтобы увидеть свои проекты и управлять ими, необходимо авторизоваться.</p>
                <Link to="/login" className="btn-primary inline-block w-full">Войти в аккаунт</Link>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Привет, {user.first_name || 'пользователь'}!</h1>
                    <p className="text-slate-500">Добро пожаловать в ваш личный кабинет.</p>
                </div>
                <Link to="/jobs/create" className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Новый заказ
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content: Jobs List */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <Briefcase size={24} className="text-primary-600" />
                            Ваши активные проекты
                        </h2>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>)}
                            </div>
                        ) : myJobs.length === 0 ? (
                            <div className="premium-card p-12 text-center">
                                <p className="text-slate-500">У вас пока нет активных проектов.</p>
                                <Link to="/jobs" className="text-primary-600 font-bold mt-4 inline-block hover:underline">Найти работу прямо сейчас</Link>
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
                                                            'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {job.status_display || job.status}
                                                </span>
                                                <span className="text-xs text-slate-400">ID: #{job.id}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                                                {job.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">Бюджет: {job.budget} TMT</p>
                                        </div>
                                        <ArrowRight size={20} className="text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar: Stats and Tips */}
                <div className="space-y-8">
                    <div className="premium-card p-8 bg-primary-600 text-white shadow-xl shadow-primary-600/30">
                        <h3 className="font-bold mb-6 opacity-80 uppercase tracking-widest text-xs">Статистика</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-3xl font-bold">{myJobs.length}</div>
                                <div className="text-xs opacity-70">Проектов</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">0</div>
                                <div className="text-xs opacity-70">Отзывов</div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-8">
                        <h3 className="font-bold text-slate-900 mb-4">Советы</h3>
                        <ul className="space-y-4 text-sm text-slate-600">
                            <li className="flex gap-3">
                                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                                Заполните профиль, чтобы привлечь больше заказчиков.
                            </li>
                            <li className="flex gap-3">
                                <AlertCircle size={18} className="text-orange-500 shrink-0" />
                                Используйте систему Escrow для защиты ваших оплат.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
