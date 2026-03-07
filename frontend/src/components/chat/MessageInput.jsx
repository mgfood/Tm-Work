import React from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useTranslation } from 'react-i18next';

const MessageInput = ({
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

    return (
        <div className="p-4 md:p-8 bg-white border-t border-slate-100">
            {Object.keys(uploads).length > 0 && (
                <div className="max-w-4xl mx-auto mb-4 space-y-3">
                    {Object.entries(uploads).map(([id, upload]) => (
                        <div key={id} className="animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between text-[10px] font-black uppercase text-primary-600 mb-1.5 px-1">
                                <span className="truncate max-w-[200px]">{upload.name}</span>
                                <span>{upload.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-500 transition-all duration-300 ease-out"
                                    style={{ width: `${upload.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <form
                onSubmit={handleSendMessage}
                className="max-w-4xl mx-auto relative flex items-center gap-2 md:gap-4"
            >
                <div className="flex-grow relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={onFileChange}
                            className="hidden"
                            multiple
                        />
                        <button
                            type="button"
                            onClick={handleFileUpload}
                            className="text-slate-400 hover:text-primary-600 transition-colors"
                        >
                            <Paperclip size={20} />
                        </button>
                    </div>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        data-testid="message-input"
                        placeholder={isConnected ? t('chat.input_placeholder') : t('chat.input_placeholder_offline')}
                        className="w-full pl-12 pr-12 py-3 md:py-4 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl md:rounded-3xl text-sm md:text-base transition-all outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yellow-500 transition-colors"
                    >
                        <Smile size={20} />
                    </button>
                    {showEmojiPicker && (
                        <div className="absolute bottom-full right-0 mb-2 z-50">
                            <EmojiPicker
                                onEmojiClick={(emojiData) => {
                                    setNewMessage(prev => prev + emojiData.emoji);
                                    setShowEmojiPicker(false);
                                }}
                                emojiStyle="native"
                                width={300}
                                height={400}
                            />
                        </div>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    data-testid="send-message-button"
                    className="w-12 h-12 md:w-14 md:h-14 bg-primary-600 text-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-primary-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                    <Send size={22} fill="currentColor" />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;
