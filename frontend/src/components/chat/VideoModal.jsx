import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Download } from 'lucide-react';

const VideoModal = ({ videoSrc, onClose }) => {
    const videoRef = useRef(null);
    const seekingToRef = useRef(null); // Целевое время при seeking
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeking, setIsSeeking] = useState(false); // Перемотка в процессе
    const [bufferedRanges, setBufferedRanges] = useState([]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateBuffered = () => {
            const buffered = video.buffered;
            const ranges = [];
            for (let i = 0; i < buffered.length; i++) {
                ranges.push({
                    start: buffered.start(i),
                    end: buffered.end(i)
                });
            }
            setBufferedRanges(ranges);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
            setIsLoading(false);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);
        const handleProgress = () => updateBuffered();

        // Событие начала перемотки
        const handleSeeking = () => {
            setIsSeeking(true);
        };

        // Событие завершения перемотки
        const handleSeeked = () => {
            setIsSeeking(false);
            seekingToRef.current = null;
        };

        // Когда видео готово к воспроизведению после буферизации
        const handleCanPlayThrough = () => {
            if (seekingToRef.current !== null) {
                setIsSeeking(false);
                // Если перематывали во время воспроизведения, продолжаем играть
                if (isPlaying) {
                    video.play().catch(() => { });
                }
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('progress', handleProgress);
        video.addEventListener('seeking', handleSeeking);
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('canplaythrough', handleCanPlayThrough);

        // Инициализация
        if (video.readyState >= 1) {
            handleLoadedMetadata();
            updateBuffered();
        }

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('progress', handleProgress);
            video.removeEventListener('seeking', handleSeeking);
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('canplaythrough', handleCanPlayThrough);
        };
    }, [isPlaying]);

    const togglePlay = (e) => {
        e?.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play().catch(() => { });
        } else {
            video.pause();
        }
    };

    const handleProgressClick = (e) => {
        e.stopPropagation();
        e.preventDefault();

        const video = videoRef.current;
        if (!video || !duration) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, clickX / rect.width));
        const targetTime = percent * duration;

        // Запоминаем, что перематываем
        seekingToRef.current = targetTime;
        setIsSeeking(true);

        // Просто устанавливаем время - браузер сам разберется с буферизацией
        // Если часть не загружена, браузер начнет её загружать
        video.currentTime = targetTime;
    };

    const handleVolumeChange = (e) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        const val = parseFloat(e.target.value) || 0;
        video.volume = val;
        setVolume(val);
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Вычисляем процент загруженного видео (для самой дальней загруженной части)
    const getBufferedPercent = () => {
        if (!duration || bufferedRanges.length === 0) return 0;

        const maxBuffered = Math.max(...bufferedRanges.map(r => r.end));
        return (maxBuffered / duration) * 100;
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center"
            onMouseMove={() => setShowControls(true)}
        >
            {/* Video Element */}
            <div
                className="w-full h-full flex items-center justify-center"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <video
                    ref={videoRef}
                    src={videoSrc}
                    className="max-w-full max-h-full object-contain"
                    onDoubleClick={togglePlay}
                    preload="auto"
                    playsInline
                />
            </div>

            {/* Loading/Seeking Indicator */}
            {(isLoading || isSeeking) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-primary-500 border-r-primary-400 border-b-transparent border-l-transparent animate-spin"></div>
                            <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-transparent border-b-primary-300 border-l-primary-200 animate-spin [animation-duration:1.5s] [animation-direction:reverse]"></div>
                        </div>
                        <div className="text-center">
                            <p className="text-white text-base font-semibold mb-1">
                                {isLoading ? 'Загрузка видео' : 'Буферизация...'}
                            </p>
                            <p className="text-white/60 text-sm">
                                {isLoading ? 'Пожалуйста, подождите...' : 'Загрузка фрагмента видео'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Download Button */}
            <a
                href={videoSrc}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={`absolute top-4 md:top-6 left-4 md:left-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all duration-300 hover:scale-110 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
                title="Скачать видео"
            >
                <Download size={24} strokeWidth={2.5} />
            </a>

            {/* Close Button */}
            <button
                className={`absolute top-4 md:top-6 right-4 md:right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all duration-300 hover:scale-110 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
                <X size={24} strokeWidth={2.5} />
            </button>

            {/* Bottom Controls */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-xl p-6 md:p-8 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Progress Bar with Buffered Indicator */}
                <div
                    className="group h-2 bg-white/10 rounded-full mb-6 cursor-pointer hover:h-2.5 transition-all relative overflow-visible"
                    onClick={handleProgressClick}
                >
                    {/* Buffered progress (серый фон показывает загруженные части) */}
                    <div
                        className="absolute top-0 left-0 h-full bg-white/20 rounded-full transition-all"
                        style={{ width: `${getBufferedPercent()}%` }}
                    />

                    {/* Current progress (цветной) */}
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-300 rounded-full shadow-lg shadow-primary-500/50 transition-all pointer-events-none"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-2xl shadow-primary-500/80 scale-0 group-hover:scale-100 transition-transform" />
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center gap-4 md:gap-6 text-white">
                    {/* Play/Pause */}
                    <button
                        type="button"
                        onClick={togglePlay}
                        className="w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all duration-300 hover:scale-110"
                    >
                        {isPlaying ? (
                            <Pause size={22} fill="currentColor" strokeWidth={0} />
                        ) : (
                            <Play size={22} fill="currentColor" strokeWidth={0} className="ml-0.5" />
                        )}
                    </button>

                    {/* Time Display */}
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-white">
                            {formatTime(currentTime)}
                        </span>
                        <span className="text-white/40">/</span>
                        <span className="font-mono text-sm font-medium text-white/60">
                            {formatTime(duration)}
                        </span>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Volume Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                const video = videoRef.current;
                                if (video) {
                                    const newVolume = volume === 0 ? 1 : 0;
                                    video.volume = newVolume;
                                    setVolume(newVolume);
                                }
                            }}
                            className="hover:text-primary-400 transition-colors duration-300 p-1"
                        >
                            {volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                        </button>

                        {/* Volume Slider */}
                        <div className="relative w-20 md:w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-white via-gray-100 to-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-150"
                                style={{ width: `${volume * 100}%` }}
                            />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={handleVolumeChange}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg pointer-events-none transition-all duration-150"
                                style={{ left: `calc(${volume * 100}% - 7px)` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoModal;
