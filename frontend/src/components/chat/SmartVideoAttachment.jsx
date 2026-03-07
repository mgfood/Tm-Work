import React, { useState, useEffect } from 'react';
import { Play, Download, FileText } from 'lucide-react';
import { isShortVideo } from '../../utils/videoHelpers';

/**
 * Компонент для умного отображения видео
 * - Короткие видео (≤2 мин): кликабельный превью с воспроизведением
 * - Длинные видео (>2 мин): файл с кнопкой скачивания
 */
const SmartVideoAttachment = ({ videoUrl, src, isMe, onPlayVideo, onOpen, t }) => {
    const url = videoUrl || src;
    const handlePlay = onPlayVideo || onOpen;
    const [videoType, setVideoType] = useState(null); // 'short' | 'long' | null

    useEffect(() => {
        if (!url) return;
        // Проверяем длительность при монтировании
        isShortVideo(url).then(isShort => {
            setVideoType(isShort ? 'short' : 'long');
        }).catch(() => {
            // В случае ошибки показываем как файл
            setVideoType('long');
        });
    }, [url]);

    const getFileName = (link) => {
        if (!link || typeof link !== 'string') return 'video_file';
        try {
            return decodeURIComponent(link.split('/').pop().split('?')[0]);
        } catch (e) {
            return 'video_file';
        }
    };

    if (!url) return null;

    // Пока проверяется - показываем как файл с "Проверка..."
    if (videoType === null) {
        return (
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isMe ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'
                }`}>
                <div className={`p-2 rounded-xl shrink-0 ${isMe ? 'bg-white/20' : 'bg-primary-50 text-primary-600'
                    }`}>
                    <Play size={20} />
                </div>
                <div className="overflow-hidden min-w-0">
                    <div className={`text-sm font-bold truncate ${isMe ? 'text-white' : 'text-slate-700'
                        }`}>
                        {getFileName(url)}
                    </div>
                    <div className={`text-[10px] font-medium ${isMe ? 'text-white/60' : 'text-slate-500'
                        }`}>
                        Проверка длительности...
                    </div>
                </div>
            </div>
        );
    }

    // Короткое видео - показываем превью с кнопкой воспроизведения
    if (videoType === 'short') {
        return (
            <div
                onClick={() => handlePlay && handlePlay(url)}
                className="relative cursor-pointer overflow-hidden rounded-xl border border-white/20 hover:opacity-90 transition-all shrink-0 bg-black"
            >
                <video
                    src={url}
                    className="max-h-60 w-full object-contain rounded-xl"
                    muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-16 h-16 flex items-center justify-center bg-primary-600 rounded-full shadow-xl">
                        <Play size={32} fill="white" className="ml-1" />
                    </div>
                </div>
            </div>
        );
    }

    // Длинное видео - показываем как файл для скачивания
    return (
        <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isMe ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'
            }`}>
            <div className={`p-2 rounded-xl shrink-0 ${isMe ? 'bg-white/20' : 'bg-primary-50 text-primary-600'
                }`}>
                <Play size={20} />
            </div>
            <div className="overflow-hidden min-w-0">
                <div className={`text-sm font-bold truncate ${isMe ? 'text-white' : 'text-slate-700'
                    }`}>
                    {getFileName(url)}
                </div>
                <div className={`text-[10px] font-medium ${isMe ? 'text-white/60' : 'text-slate-500'
                    }`}>
                    Видео длиннее 2 минут
                </div>
                <a
                    href={url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[10px] font-bold uppercase tracking-wider hover:opacity-70 transition-opacity flex items-center gap-1 mt-0.5 ${isMe ? 'text-white/60' : 'text-primary-600'
                        }`}
                >
                    <Download size={10} />
                    {t ? t('common.download') : 'Скачать'}
                </a>
            </div>
        </div>
    );
};

export default SmartVideoAttachment;
