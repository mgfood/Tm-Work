import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell, Check, Trash2, Calendar, Clock,
    ArrowRight, MessageSquare, Briefcase,
    CreditCard, ShieldAlert, CheckCircle2
} from 'lucide-react';
import notificationsService from '../api/notificationsService';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAllNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationsService.getNotifications({ limit: 50 });
            setNotifications(data.results || data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await notificationsService.markAsRead(id);
            setNotifications(notifs => notifs.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsService.markAllAsRead();
            setNotifications(notifs => notifs.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (title) => {
        const t = title.toLowerCase();
        if (t.includes('сообщение')) return <MessageSquare className="text-blue-500" size={20} />;
        if (t.includes('отклик')) return <Briefcase className="text-primary-500" size={20} />;
        if (t.includes('баланс') || t.includes('средства')) return <CreditCard className="text-green-500" size={20} />;
        if (t.includes('системное')) return <ShieldAlert className="text-orange-500" size={20} />;
        return <Bell className="text-slate-400" size={20} />;
    };

    // Grouping notifications by date
    const grouped = notifications.reduce((groups, n) => {
        const date = new Date(n.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(n);
        return groups;
    }, {});

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">Уведомления</h1>
                    <p className="text-slate-500 font-medium">Будьте в курсе последних событий на платформе</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <CheckCircle2 size={18} className="text-green-600" />
                        Прочитать всё
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-100 rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            ) : Object.keys(grouped).length > 0 ? (
                <div className="space-y-12">
                    {Object.entries(grouped).map(([date, items]) => (
                        <div key={date}>
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                                <span>{date}</span>
                                <div className="h-px bg-slate-100 flex-grow"></div>
                            </h2>
                            <div className="space-y-4">
                                {items.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`premium-card p-6 flex items-start gap-6 transition-all group ${!notif.is_read ? 'border-primary-100 bg-primary-50/20' : 'bg-white'}`}
                                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                                    >
                                        <div className={`p-3 rounded-2xl shrink-0 ${!notif.is_read ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                                            {getIcon(notif.title)}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-bold text-slate-800">{notif.title}</h4>
                                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                                {notif.message}
                                            </p>
                                            {notif.link && (
                                                <Link
                                                    to={notif.link}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:gap-3 transition-all"
                                                >
                                                    Подробнее <ArrowRight size={14} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="premium-card p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bell className="text-slate-200" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Уведомлений пока нет</h3>
                    <p className="text-slate-400">Мы сообщим вам, когда случится что-то важное</p>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
