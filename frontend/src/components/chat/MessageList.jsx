import React from 'react';
import { CheckCheck } from 'lucide-react';
import SmartVideoAttachment from './SmartVideoAttachment';

const MessageList = ({
    messages,
    user,
    chatContainerRef,
    setSelectedImage,
    setSelectedVideo
}) => {
    return (
        <div
            ref={chatContainerRef}
            data-testid="message-list"
            className="flex-grow overflow-y-auto px-4 md:px-12 py-6 md:py-8 space-y-6 md:space-y-8 bg-slate-50/30 custom-scrollbar"
        >
            {messages.map((msg, index) => {
                const isMe = msg.sender === user?.id;
                const showDate = index === 0 ||
                    new Date(messages[index - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();

                return (
                    <React.Fragment key={msg.id}>
                        {showDate && (
                            <div className="flex justify-center my-4 md:my-8">
                                <span className="px-4 py-1.5 bg-white rounded-full text-[10px] md:text-xs font-bold text-slate-400 shadow-sm border border-slate-100 uppercase tracking-widest">
                                    {new Date(msg.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
                            <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`relative p-4 md:p-5 rounded-3xl text-sm md:text-base leading-relaxed shadow-sm transition-all ${isMe
                                    ? 'bg-primary-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                    }`}>
                                    {msg.attachment && (
                                        <div className="mb-2 group/attach max-w-[280px]">
                                            {msg.attachment.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) ? (
                                                <div
                                                    onClick={() => setSelectedImage(msg.attachment)}
                                                    className="relative cursor-pointer overflow-hidden rounded-xl border border-white/20 hover:opacity-90 transition-all shrink-0"
                                                >
                                                    <img
                                                        src={msg.attachment}
                                                        alt="Attachment"
                                                        className="w-full h-auto object-cover max-h-[200px]"
                                                    />
                                                </div>
                                            ) : (
                                                <SmartVideoAttachment
                                                    videoUrl={msg.attachment}
                                                    isMe={isMe}
                                                    onPlayVideo={() => setSelectedVideo(msg.attachment)}
                                                />
                                            )}
                                        </div>
                                    )}
                                    {msg.content && <p data-testid="message-content" className="whitespace-pre-wrap break-words">{msg.content}</p>}
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
        </div>
    );
};

export default MessageList;
