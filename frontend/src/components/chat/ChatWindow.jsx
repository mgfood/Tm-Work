import React from 'react';
import { ChevronLeft, Briefcase, ExternalLink, MoreVertical, RotateCcw, ShieldAlert, Trash2, MessageSquare, ShieldCheck, Clock, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({
    activeThread,
    messages,
    user,
    onBack,
    getPartner,
    setIsInfoOpen,
    isMenuOpen,
    setIsMenuOpen,
    handleClearHistory,
    handleBlockUser,
    handleDeleteThread,
    chatContainerRef,
    setSelectedImage,
    setSelectedVideo,
    newMessage,
    setNewMessage,
    handleSendMessage,
    handleFileUpload,
    fileInputRef,
    onFileChange,
    showEmojiPicker,
    setShowEmojiPicker,
    uploads,
    isConnected
}) => {
    const { t } = useTranslation();

    if (!activeThread) {
        return (
            <div className="hidden md:flex flex-col items-center justify-center h-full bg-slate-50/30 text-center p-12 flex-grow">
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
        );
    }

    const partner = getPartner(activeThread);

    return (
        <div className="flex-grow flex flex-col bg-white min-w-0 h-full">
            <div className="flex flex-col h-full relative">
                {/* Sticky Header */}
                <div className="h-16 md:h-20 px-4 md:px-8 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-xl z-20 shrink-0 shadow-sm">
                    <div className="flex items-center gap-2 md:gap-4 min-w-0">
                        <button
                            onClick={onBack}
                            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-primary-600 font-black text-lg md:text-xl border border-slate-100 shrink-0">
                            {partner?.first_name?.[0]}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-black text-slate-900 text-sm md:text-lg flex items-center gap-2 truncate">
                                {partner?.first_name} {partner?.last_name}
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
                    <div className="flex items-center gap-1 md:gap-2 relative">
                        <button
                            onClick={() => setIsInfoOpen(true)}
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl md:rounded-2xl transition-all"
                        >
                            <Info size={20} />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition-all ${isMenuOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <MoreVertical size={20} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 top-14 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-2 animate-in zoom-in-95 origin-top-right">
                                    <button
                                        onClick={handleClearHistory}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-bold text-sm"
                                    >
                                        <RotateCcw size={16} />
                                        {t('chat.clear_history')}
                                    </button>
                                    <button
                                        onClick={handleBlockUser}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${user.blocked_users?.includes(partner?.id)
                                            ? 'text-emerald-600 hover:bg-emerald-50'
                                            : 'text-red-600 hover:bg-red-50'
                                            }`}
                                    >
                                        <ShieldAlert size={16} />
                                        {user.blocked_users?.includes(partner?.id) ? t('chat.unblock_user') : t('chat.block_user')}
                                    </button>
                                    <button
                                        onClick={handleDeleteThread}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm"
                                    >
                                        <Trash2 size={16} />
                                        {t('common.delete')}
                                    </button>
                                </div>
                            )}
                        </div>
                        {isMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>}
                    </div>
                </div>

                <MessageList
                    messages={messages}
                    user={user}
                    chatContainerRef={chatContainerRef}
                    setSelectedImage={setSelectedImage}
                    setSelectedVideo={setSelectedVideo}
                />

                <MessageInput
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    handleSendMessage={handleSendMessage}
                    handleFileUpload={handleFileUpload}
                    fileInputRef={fileInputRef}
                    onFileChange={onFileChange}
                    showEmojiPicker={showEmojiPicker}
                    setShowEmojiPicker={setShowEmojiPicker}
                    uploads={uploads}
                    isConnected={isConnected}
                />
            </div>
        </div>
    );
};

export default ChatWindow;
