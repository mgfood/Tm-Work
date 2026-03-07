import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import chatService from '../../api/chatService';
import profilesService from '../../api/profilesService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import { useTranslation } from 'react-i18next';

import ChatInfoModal from './ChatInfoModal';
import VideoModal from '../../components/chat/VideoModal';
import ThreadSidebar from '../../components/chat/ThreadSidebar';
import ChatWindow from '../../components/chat/ChatWindow';

const ChatPage = () => {
    const { threadId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [threads, setThreads] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');

    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    const {
        messages: wsMessages,
        lastEvent,
        setLastEvent,
        sendMessage: sendWsMessage,
        isConnected
    } = useChatWebSocket(activeThread?.id);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploads, setUploads] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);

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
        const interval = setInterval(fetchThreads, 15000);
        return () => clearInterval(interval);
    }, []);

    // Fetch messages when threadId changes
    useEffect(() => {
        if (threadId) {
            const thread = threads.find(t => String(t.id) === threadId);
            if (thread) {
                setActiveThread(thread);
                fetchMessages(thread.id);
            } else if (threads.length > 0) {
                // If thread not found in list but id exists, we might need to fetch it specifically or it might be coming soon
                // For now, if we have threads but not this one, just clear active
            }
        } else {
            setActiveThread(null);
            setMessages([]);
        }
    }, [threadId, threads.length]);

    // Update activeThread data if threads list updates (e.g. for unread_count)
    useEffect(() => {
        if (threadId && threads.length > 0) {
            const updated = threads.find(t => String(t.id) === threadId);
            if (updated) setActiveThread(updated);
        }
    }, [threads]);

    useEffect(() => {
        if (wsMessages.length > 0) {
            const lastMsg = wsMessages[wsMessages.length - 1];
            setMessages(prev => {
                if (prev.some(m => m.id === lastMsg.id)) return prev;
                return [...prev, lastMsg];
            });
            scrollToBottom();
        }
    }, [wsMessages]);

    useEffect(() => {
        if (!lastEvent) return;

        if (lastEvent.type === 'history_cleared') {
            setMessages([]);
            showToast(t('chat.history_cleared'), 'info');
        } else if (lastEvent.type === 'user_update') {
            const { type } = lastEvent.data;
            if (type === 'thread_list_update' || type === 'thread_restored') {
                fetchThreads();
            }
        } else if (lastEvent.type === 'error' && lastEvent.code === 'blocked') {
            showToast(t('chat.confirm_block'), 'error');
        }
        setLastEvent(null);
    }, [lastEvent]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom(messages.length === 1 ? "auto" : "smooth");
        }
    }, [messages, activeThread?.id]);

    const fetchThreads = async () => {
        try {
            const data = await chatService.getThreads();
            setThreads(data.results || data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch threads', err);
        }
    };

    const fetchMessages = async (id) => {
        try {
            const data = await chatService.getMessages(id);
            setMessages(data.results || data);
            if (activeThread?.unread_count > 0) {
                await chatService.markAsRead(id);
                setThreads(prev => prev.map(t =>
                    t.id === id ? { ...t, unread_count: 0 } : t
                ));
            }
        } catch (err) {
            console.error('Failed to fetch messages', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeThread) return;
        const content = newMessage.trim();

        if (isConnected) {
            const sent = sendWsMessage(content);
            if (sent) {
                setNewMessage('');
                return;
            }
        }

        try {
            const sentMsg = await chatService.sendMessage(activeThread.id, content);
            setMessages(prev => {
                if (prev.some(m => m.id === sentMsg.id)) return prev;
                return [...prev, sentMsg];
            });
            setNewMessage('');
            fetchThreads();
        } catch (err) {
            if (err.response?.status === 403) {
                showToast(t('chat.confirm_block'), 'error');
            } else {
                showToast(t('chat.error_send'), 'error');
            }
        }
    };

    const handleClearHistory = async () => {
        if (!activeThread) return;
        setIsMenuOpen(false);
        const isConfirmed = await confirm({
            title: t('chat.clear_history'),
            message: t('chat.confirm_clear'),
            confirmText: t('common.confirm'),
            variant: 'danger'
        });
        if (!isConfirmed) return;

        try {
            await chatService.clearHistory(activeThread.id);
            setMessages([]);
            showToast(t('chat.history_cleared'), 'success');
        } catch (err) {
            console.error(err);
            showToast(t('chat.error_clear'), 'error');
        }
    };

    const handleFileUpload = () => fileInputRef.current.click();

    const onFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0 || !activeThread) return;

        files.forEach(async (file) => {
            const uploadId = Math.random().toString(36).substring(7);
            try {
                setUploads(prev => ({ ...prev, [uploadId]: { name: file.name, progress: 1 } }));
                const sentMsg = await chatService.sendMessage(
                    activeThread.id, '', file,
                    (progress) => setUploads(prev => ({ ...prev, [uploadId]: { ...prev[uploadId], progress } }))
                );
                setMessages(prev => {
                    if (prev.some(m => m.id === sentMsg.id)) return prev;
                    return [...prev, sentMsg];
                });
                setTimeout(() => setUploads(prev => {
                    const next = { ...prev };
                    delete next[uploadId];
                    return next;
                }), 1000);
            } catch (err) {
                console.error(err);
                showToast(`${t('chat.error_send')}: ${file.name}`, 'error');
                setUploads(prev => {
                    const next = { ...prev };
                    delete next[uploadId];
                    return next;
                });
            }
        });
        e.target.value = '';
    };

    const getPartner = (thread) => {
        if (!thread || !thread.participants_details) return null;
        return thread.participants_details.find(p => p.id !== user?.id) || thread.participants_details[0];
    };

    const handleDeleteThread = async () => {
        setIsMenuOpen(false);
        const isConfirmed = await confirm({
            title: t('chat.delete_title'),
            message: t('chat.delete_confirm'),
            confirmText: t('common.delete'),
            variant: 'danger'
        });
        if (!isConfirmed) return;

        try {
            await chatService.deleteThread(activeThread.id);
            setThreads(prev => prev.filter(t => t.id !== activeThread.id));
            navigate('/chat');
            showToast(t('chat.delete_success'), 'success');
        } catch (err) {
            console.error(err);
            showToast(t('chat.delete_error'), 'error');
        }
    };

    const handleBlockUser = async () => {
        if (!activeThread) return;
        const partner = getPartner(activeThread);
        if (!partner) return;

        const isBlocked = user.blocked_users?.includes(partner.id);
        const isConfirmed = await confirm({
            title: isBlocked ? t('chat.unblock_user') : t('chat.block_user'),
            message: isBlocked ? t('chat.confirm_unblock') : t('chat.confirm_block'),
            confirmText: isBlocked ? t('chat.unblock_user') : t('chat.block_user'),
            variant: 'danger'
        });
        if (!isConfirmed) return;

        try {
            if (isBlocked) {
                await profilesService.unblockUser(partner.id);
                showToast(t('chat.unblock_success'), 'success');
            } else {
                await profilesService.blockUser(partner.id);
                showToast(t('chat.block_success'), 'success');
            }
            await refreshUser();
            setIsMenuOpen(false);
        } catch (err) {
            console.error(err);
            showToast(t('common.error'), 'error');
        }
    };

    return (
        <div data-testid="chat-page" className={`flex-grow flex flex-col h-full bg-white overflow-hidden ${threadId ? 'pb-0' : 'pb-20'} md:pb-0`}>
            <div className="max-w-[1600px] mx-auto w-full flex h-full border-x border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                <ThreadSidebar
                    threads={threads}
                    activeThreadId={threadId}
                    onSelectThread={(t) => navigate(`/chat/${t.id}`)}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    loading={loading}
                    getPartner={getPartner}
                />

                <ChatWindow
                    activeThread={activeThread}
                    messages={messages}
                    user={user}
                    onBack={() => navigate('/chat')}
                    getPartner={getPartner}
                    setIsInfoOpen={setIsInfoOpen}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    handleClearHistory={handleClearHistory}
                    handleBlockUser={handleBlockUser}
                    handleDeleteThread={handleDeleteThread}
                    chatContainerRef={chatContainerRef}
                    setSelectedImage={setSelectedImage}
                    setSelectedVideo={setSelectedVideo}
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

            {activeThread && (
                <ChatInfoModal
                    isOpen={isInfoOpen}
                    onClose={() => setIsInfoOpen(false)}
                    partner={getPartner(activeThread)}
                    thread={activeThread}
                />
            )}

            {selectedImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 animate-in fade-in" onClick={() => setSelectedImage(null)}>
                    <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 text-white rounded-2xl hover:bg-white/20" onClick={() => setSelectedImage(null)}><X size={24} /></button>
                    <img src={selectedImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg animate-in zoom-in-95" />
                </div>
            )}

            {selectedVideo && <VideoModal videoSrc={selectedVideo} onClose={() => setSelectedVideo(null)} />}
        </div>
    );
};

export default ChatPage;