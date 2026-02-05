import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, Check, ExternalLink, Loader2 } from 'lucide-react';
import notificationsService from '../../api/notificationsService';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const [notifsData, countData] = await Promise.all([
                notificationsService.getNotifications({ limit: 5 }),
                notificationsService.getUnreadCount()
            ]);
            setNotifications(notifsData.results || notifsData);
            setUnreadCount(countData.count);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds as per requirements
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationsService.markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsService.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-5 duration-200">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-900">Уведомления</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1"
                            >
                                <Check size={14} /> Прочитать всё
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="animate-spin text-primary-500" size={24} />
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notif.is_read ? 'bg-primary-50/30' : ''}`}
                                        onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                    >
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <h4 className={`text-sm font-bold ${!notif.is_read ? 'text-primary-900' : 'text-slate-700'}`}>
                                                {notif.title}
                                            </h4>
                                            {!notif.is_read && (
                                                <div className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-1.5"></div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {notif.link && (
                                                <Link
                                                    to={notif.link}
                                                    onClick={() => setIsOpen(false)}
                                                    className="text-[10px] text-primary-600 font-bold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Перейти <ExternalLink size={10} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400">
                                <BellOff size={32} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Нет новых уведомлений</p>
                            </div>
                        )}
                    </div>

                    <Link
                        to="/notifications"
                        onClick={() => setIsOpen(false)}
                        className="block p-4 text-center text-sm font-bold text-slate-600 hover:bg-slate-50 border-t border-slate-50 transition-colors"
                    >
                        Показать все
                    </Link>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
