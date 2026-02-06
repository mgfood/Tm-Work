import React, { useState, useEffect, useRef } from 'react';
import {
    Send, User, Search, Briefcase, ShieldCheck,
    MoreVertical, Info, MessageSquare, ExternalLink,
    Clock, CheckCheck, Paperclip, Smile
} from 'lucide-react';
import { Link } from 'react-router-dom';
import chatService from '../../api/chatService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ChatPage = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [threads, setThreads] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    const scrollToBottom = (behavior = "smooth") => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: behavior
            });
        }
    };

    useEffect(() => {
        fetchThreads();
        const interval = setInterval(fetchThreads, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeThread) {
            fetchMessages(activeThread.id);
            const interval = setInterval(() => fetchMessages(activeThread.id), 5000);
            return () => clearInterval(interval);
        }
    }, [activeThread]);

    // Scroll but more carefully - only when messages change or thread changes
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom(messages.length === 1 ? "auto" : "smooth");
        }
    }, [messages, activeThread]);

    const fetchThreads = async () => {
        try {
            const data = await chatService.getThreads();
            setThreads(data.results || data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch threads', err);
        }
    };

    const fetchMessages = async (threadId) => {
        try {
            const data = await chatService.getMessages(threadId);
            setMessages(data.results || data);
            if (activeThread?.unread_count > 0) {
                await chatService.markAsRead(threadId);
            }
        } catch (err) {
            console.error('Failed to fetch messages', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeThread) return;

        const content = newMessage.trim();
        setNewMessage(''); // Clear immediately for better UX

        try {
            const sentMsg = await chatService.sendMessage(activeThread.id, content);
            setMessages(prev => [...prev, sentMsg]);
            fetchThreads();
        } catch (err) {
            showToast('Ошибка при отправке сообщения', 'error');
            setNewMessage(content); // Restore if failed
        }
    };

    const getPartner = (thread) => {
        if (!thread || !thread.participants_details) return null;
        return thread.participants_details.find(p => p.id !== user?.id) || thread.participants_details[0];
    };

    const filteredThreads = activeTab === 'ALL'
        ? threads
        : threads.filter(t => t.type === activeTab);

    return (
        <div className="flex-grow flex flex-col h-[calc(100vh-64px)] bg-white overflow-hidden">
            <div className="max-w-[1600px] mx-auto w-full flex h-full border-x border-slate-100 shadow-2xl shadow-slate-200/50">

                {/* Sidebar */}
                <div className="w-80 md:w-[400px] border-r border-slate-100 flex flex-col bg-slate-50/30 shrink-0">
                    <div className="p-6 bg-white border-b border-slate-100 flex-none">
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                <MessageSquare className="text-primary-600" size={22} />
                            </div>
                            Чаты
                        </h2>
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-hide">
                            {['ALL', 'SYSTEM', 'JOB', 'PERSONAL', 'SUPPORT'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setActiveTab(type)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap px-3 ${activeTab === type
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {type === 'ALL' ? 'Все' : type === 'SYSTEM' ? 'Оповещения' : type === 'JOB' ? 'Заказы' : type === 'SUPPORT' ? 'Поддержка' : 'Личные'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-sm border border-slate-50"></div>
                            ))
                        ) : filteredThreads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <MessageSquare size={48} className="opacity-10 mb-4" />
                                <p className="text-sm font-medium">Нет активных чатов</p>
                            </div>
                        ) : (
                            filteredThreads.map(thread => {
                                const partner = getPartner(thread);
                                const isActive = activeThread?.id === thread.id;
                                return (
                                    <button
                                        key={thread.id}
                                        onClick={() => setActiveThread(thread)}
                                        className={`w-full p-4 rounded-2xl transition-all flex items-center gap-4 text-left group border ${isActive
                                            ? 'bg-primary-600 border-primary-600 shadow-lg shadow-primary-600/20 translate-x-2'
                                            : 'bg-white border-transparent hover:border-slate-200 hover:bg-white shadow-sm'
                                            }`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-105 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                {partner?.first_name?.[0] || '?'}
                                            </div>
                                            {thread.unread_count > 0 && (
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center font-black border-4 border-white">
                                                    {thread.unread_count}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`font-black truncate text-base ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                                    {partner?.first_name} {partner?.last_name}
                                                </span>
                                                <span className={`text-[10px] uppercase font-bold tracking-tighter shrink-0 ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                                                    {thread.last_message ? new Date(thread.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className={`text-xs truncate font-medium ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                                                    {thread.last_message?.content || (
                                                        <span className="italic opacity-60">Начните общение...</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Main Window */}
                <div className="flex-grow flex flex-col bg-white min-w-0">
                    {activeThread ? (
                        <div className="flex flex-col h-full relative">
                            {/* Sticky Header */}
                            <div className="h-20 px-4 md:px-8 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-xl z-20 shrink-0 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary-600 font-black text-xl border border-slate-100">
                                        {getPartner(activeThread)?.first_name?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-slate-900 text-lg flex items-center gap-2 truncate">
                                            {getPartner(activeThread)?.first_name} {getPartner(activeThread)?.last_name}
                                        </h3>
                                        {activeThread.type === 'JOB' && (
                                            <div className="flex items-center gap-2 text-xs text-primary-600 font-bold">
                                                <Briefcase size={14} />
                                                <span className="truncate max-w-[200px] md:max-w-none">{activeThread.job_title}</span>
                                                <Link to={`/jobs/${activeThread.job}`} className="shrink-0 p-1 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                                                    <ExternalLink size={12} />
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-2xl hover:bg-slate-50 transition-all">
                                        <Info size={22} />
                                    </button>
                                    <button className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-2xl hover:bg-slate-50 transition-all">
                                        <MoreVertical size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Container (Scrollable) */}
                            <div
                                className="flex-grow overflow-y-auto px-4 md:px-12 py-8 space-y-8 bg-[#f8fafc]/50 custom-scrollbar"
                                ref={chatContainerRef}
                            >
                                {messages.map((msg, index) => {
                                    const isOwn = msg.sender === user?.id;
                                    const date = new Date(msg.created_at);

                                    return (
                                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`group flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                                                <div className={`p-4 md:p-5 rounded-3xl text-[15px] leading-relaxed shadow-sm transition-all ${isOwn
                                                    ? 'bg-primary-600 text-white rounded-br-none shadow-primary-600/10 font-medium'
                                                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none font-medium'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                                <div className={`flex items-center gap-2 mt-2 px-1 opacity-60 group-hover:opacity-100 transition-opacity`}>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isOwn && (
                                                        <div className={msg.is_read ? 'text-primary-500' : 'text-slate-300'}>
                                                            <CheckCheck size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} className="h-2" />
                            </div>

                            {/* Sticky Input Area */}
                            <div className="px-4 md:px-8 py-6 border-t border-slate-100 bg-white shrink-0">
                                {activeThread.type === 'SYSTEM' ? (
                                    <div className="max-w-4xl mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            Это системный чат. Ответы не принимаются.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3 p-1.5 bg-slate-50 rounded-[2rem] border-2 border-slate-100 focus-within:border-primary-500/30 focus-within:bg-white transition-all shadow-sm">
                                        <div className="w-4"></div>
                                        <textarea
                                            rows="1"
                                            className="flex-grow p-4 bg-transparent outline-none text-base font-medium resize-none min-h-[56px] max-h-32 py-4 scrollbar-hide text-slate-900"
                                            placeholder="Введите ваше сообщение..."
                                            value={newMessage}
                                            onChange={(e) => {
                                                setNewMessage(e.target.value);
                                                e.target.style.height = 'inherit';
                                                e.target.style.height = `${e.target.scrollHeight}px`;
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                    e.target.style.height = 'inherit';
                                                }
                                            }}
                                        />
                                        <div className="w-2"></div>
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className={`p-4 rounded-full transition-all flex items-center justify-center ${newMessage.trim()
                                                ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/30 hover:scale-105 active:scale-95'
                                                : 'bg-slate-200 text-slate-400'
                                                }`}
                                        >
                                            <Send size={22} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                                        </button>
                                    </form>
                                )}
                                {activeThread.type !== 'SYSTEM' && (
                                    <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-[0.2rem]">
                                        Нажмите Enter чтобы отправить сообщение
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-12 bg-slate-50/10 relative overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-100/10 rounded-full blur-[100px] -z-10"></div>

                            <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary-600/10 mb-10 border border-white relative group">
                                <div className="absolute inset-0 bg-primary-600 rounded-[2.5rem] scale-90 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                <MessageSquare size={48} className="text-primary-600 animate-bounce-subtle relative z-10" />
                            </div>

                            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Ваш центр общения</h3>
                            <p className="text-slate-400 max-w-xs font-bold leading-relaxed uppercase text-xs tracking-[0.2rem]">
                                Выберите диалог слева для <span className="text-primary-600">начала работы</span>
                            </p>

                            <div className="mt-12 flex gap-4">
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <span className="text-xs font-black text-slate-900 uppercase">Безопасно</span>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                        <Clock size={16} />
                                    </div>
                                    <span className="text-xs font-black text-slate-900 uppercase">Быстро</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
