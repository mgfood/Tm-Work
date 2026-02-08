import React, { useState, useEffect, useRef } from 'react';
import {
    Send, User, Search, Briefcase, ShieldCheck,
    MoreVertical, Info, MessageSquare, ExternalLink,
    Clock, CheckCheck, Paperclip, Smile, ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import chatService from '../../api/chatService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';

const ChatPage = () => {
    const { t } = useTranslation();
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
        setNewMessage('');

        try {
            const sentMsg = await chatService.sendMessage(activeThread.id, content);
            setMessages(prev => [...prev, sentMsg]);
            fetchThreads();
        } catch (err) {
            showToast(t('chat.error_send'), 'error');
            setNewMessage(content);
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
            <div className="max-w-[1600px] mx-auto w-full flex h-full border-x border-slate-100 shadow-2xl shadow-slate-200/50 relative">

                {/* Sidebar */}
                <div className={`${activeThread ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-[400px] border-r border-slate-100 flex-col bg-slate-50/30 shrink-0`}>
                    <div className="p-4 md:p-6 bg-white border-b border-slate-100 flex-none">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4 md:mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                <MessageSquare className="text-primary-600" size={22} />
                            </div>
                            {t('chat.title')}
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
                                    {t(`chat.tabs.${type.toLowerCase()}`)}
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
                                <p className="text-sm font-medium">{t('chat.no_threads')}</p>
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
                                            ? 'bg-primary-600 border-primary-600 shadow-lg shadow-primary-600/20 md:translate-x-2'
                                            : 'bg-white border-transparent hover:border-slate-200 hover:bg-white shadow-sm'
                                            }`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-105 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
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
                                                        <span className="italic opacity-60">{t('chat.start_conversation')}</span>
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
                <div className={`${activeThread ? 'flex' : 'hidden md:flex'} flex-grow flex-col bg-white min-w-0`}>
                    {activeThread ? (
                        <div className="flex flex-col h-full relative">
                            {/* Sticky Header */}
                            <div className="h-16 md:h-20 px-4 md:px-8 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-xl z-20 shrink-0 shadow-sm">
                                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                                    <button 
                                        onClick={() => setActiveThread(null)}
                                        className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-primary-600 font-black text-lg md:text-xl border border-slate-100 shrink-0">
                                        {getPartner(activeThread)?.first_name?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-slate-900 text-sm md:text-lg flex items-center gap-2 truncate">
                                            {getPartner(activeThread)?.first_name} {getPartner(activeThread)?.last_name}
                                        </h3>
                                        {activeThread.type === 'JOB' && (
                                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-primary-600 font-bold">
                                                <Briefcase size={12} className="shrink-0" />
                                                <span className="truncate max-w-[120px] md:max-w-none">{activeThread.job_title}</span>
                                                <Link to={`/jobs/${activeThread.job}`} className="shrink-0 p-1 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                                                    <ExternalLink size={10} />
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 md:gap-2">
                                    <button className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-xl md:rounded-2xl hover:bg-slate-50 transition-all">
                                        <Info size={20} />
                                    </button>
                                    <button className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-xl md:rounded-2xl hover:bg-slate-50 transition-all">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div 
                                ref={chatContainerRef}
                                className="flex-grow overflow-y-auto px-4 md:px-12 py-6 md:py-8 space-y-6 md:space-y-8 bg-slate-50/30 custom-scrollbar"
                            >
                                {messages.map((msg, index) => {
                                    const isMe = msg.sender === user?.id;
                                    const showDate = index === 0 || 
                                        new Date(messages[index-1].created_at).toDateString() !== new Date(msg.created_at).toDateString();

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDate && (
                                                <div className="flex justify-center my-4 md:my-8">
                                                    <span className="px-4 py-1.5 bg-white rounded-full text-[10px] md:text-xs font-bold text-slate-400 shadow-sm border border-slate-100 uppercase tracking-widest">
                                                        {new Date(msg.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                                <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`relative p-4 md:p-5 rounded-3xl text-sm md:text-base leading-relaxed shadow-sm transition-all ${
                                                        isMe 
                                                        ? 'bg-primary-600 text-white rounded-tr-none' 
                                                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                                    }`}>
                                                        {msg.content}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2 px-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMe && <CheckCheck size={14} className="text-primary-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 md:p-8 bg-white border-t border-slate-100">
                                <form 
                                    onSubmit={handleSendMessage}
                                    className="max-w-4xl mx-auto relative flex items-center gap-2 md:gap-4"
                                >
                                    <div className="flex-grow relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <button type="button" className="text-slate-400 hover:text-primary-600 transition-colors">
                                                <Paperclip size={20} />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder={t('chat.input_placeholder')}
                                            className="w-full pl-12 pr-12 py-3 md:py-4 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl md:rounded-3xl text-sm md:text-base transition-all outline-none"
                                        />
                                        <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yellow-500 transition-colors">
                                            <Smile size={20} />
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="w-12 h-12 md:w-14 md:h-14 bg-primary-600 text-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-primary-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        <Send size={22} fill="currentColor" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full bg-slate-50/30 text-center p-12">
                            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8">
                                <MessageSquare size={40} className="text-primary-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">{t('chat.welcome_title')}</h3>
                            <p className="text-slate-500 max-w-sm font-medium uppercase text-xs tracking-[0.2rem]">
                                {t('chat.welcome_subtitle_1')} <span className="text-primary-600">{t('chat.welcome_subtitle_2')}</span>
                            </p>

                            <div className="mt-12 flex gap-4">
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <span className="text-xs font-black text-slate-900 uppercase">{t('chat.features.secure')}</span>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                        <Clock size={16} />
                                    </div>
                                    <span className="text-xs font-black text-slate-900 uppercase">{t('chat.features.fast')}</span>
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