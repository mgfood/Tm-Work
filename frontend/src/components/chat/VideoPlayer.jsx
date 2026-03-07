import React, { useRef } from 'react';

const VideoPlayer = ({ src, onLoadStart, onLoadEnd }) => {
    const videoRef = useRef(null);

    return (
        <video
            ref={videoRef}
            src={src}
            className="w-full h-full max-h-[85vh] object-contain"
            onLoadStart={onLoadStart}
            onCanPlay={onLoadEnd}
            playsInline
        />
    );
};

export { VideoPlayer };
export default VideoPlayer;
