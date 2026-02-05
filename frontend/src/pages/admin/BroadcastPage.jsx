import React, { useState } from 'react';
import { Send, Users, User, AlertCircle, CheckCircle2, Loader2, Megaphone } from 'lucide-react';
import axiosInstance from '../../api/client';

const BroadcastPage = () => {
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState('ALL'); // 'ALL' or 'SELECTED'
    const [userIds, setUserIds] = useState(''); // Comma separated for simplicity in this version
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = {
                message,
                target_type: targetType,
                user_ids: userIds ? userIds.split(',').map(id => id.trim()) : []
            };
            const response = await axiosInstance.post('/chat/admin-broadcast/broadcast/', data);
            setResult(response.data.status);
            setMessage('');
            setUserIds('');
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Ошибка при отправке рассылки');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 mb-2 flex items-center gap-4">
                    <Megaphone className="text-primary-600" size={40} />
                    Рассылка
                </h1>
                <p className="text-slate-500 font-medium">Отправка системных сообщений всем или выбранным пользователям</p>
            </div>

            <div className="premium-card p-10">
                <form onSubmit={handleSend} className="space-y-8">
                    <div className="space-y-4">
                        <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">Кому отправить</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setTargetType('ALL')}
                                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${targetType === 'ALL'
                                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                                        : 'border-slate-100 hover:border-slate-200 text-slate-500'
                                    }`}
                            >
                                <Users size={32} />
                                <span className="font-bold">Всем пользователям</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetType('SELECTED')}
                                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${targetType === 'SELECTED'
                                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                                        : 'border-slate-100 hover:border-slate-200 text-slate-500'
                                    }`}
                            >
                                <User size={32} />
                                <span className="font-bold">Выбранным по ID</span>
                            </button>
                        </div>
                    </div>

                    {targetType === 'SELECTED' && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">ID пользователей</label>
                            <input
                                type="text"
                                value={userIds}
                                onChange={(e) => setUserIds(e.target.value)}
                                placeholder="Например: 1, 5, 12, 44"
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-100 transition-all outline-none font-medium"
                            />
                            <p className="mt-2 text-xs text-slate-400">Введите ID через запятую</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Текст сообщения</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows="6"
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-100 transition-all outline-none font-medium resize-none"
                            placeholder="Напишите важное объявление для пользователей..."
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-2xl flex items-center gap-3 text-sm font-bold">
                            <CheckCircle2 size={20} />
                            {result}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !message}
                        className="w-full py-5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 text-white font-black rounded-2xl shadow-xl shadow-primary-200 transition-all flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : (
                            <>
                                <Send size={20} />
                                Запустить рассылку
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BroadcastPage;
