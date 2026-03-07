import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useChatWebSocket = (threadId) => {
    const [messages, setMessages] = useState([]);
    const [lastEvent, setLastEvent] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const { user } = useAuth();

    // Determine WebSocket URL 
    const getWsUrl = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
        const host = apiUrl.replace(/^https?:\/\//, '');
        const token = localStorage.getItem('access_token');
        const path = threadId ? `${threadId}/` : '';
        return `${wsProtocol}://${host}/ws/chat/${path}?token=${token}`;
    };

    useEffect(() => {
        if (!user) return;

        let socket = null;
        let isReconnecting = false;

        const connect = () => {
            const url = getWsUrl();
            // console.log('Connecting to WebSocket:', url);

            socket = new WebSocket(url);
            socketRef.current = socket;

            socket.onopen = () => {
                // console.log('WebSocket Connected');
                setIsConnected(true);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'chat_message') {
                        if (data.message.error === 'blocked') {
                            setLastEvent({ type: 'error', code: 'blocked' });
                            return;
                        }
                        setMessages((prev) => {
                            if (prev.some(m => m.id === data.message.id)) return prev;
                            return [...prev, data.message];
                        });
                    } else {
                        setLastEvent(data);
                    }
                } catch (e) {
                    console.error('WS Message Parse Error:', e);
                }
            };

            socket.onclose = (event) => {
                setIsConnected(false);
                socketRef.current = null;
                // console.log('WebSocket Disconnected', event.code);
            };

            socket.onerror = (error) => {
                // console.error('WebSocket Error:', error);
            };
        };

        connect();

        return () => {
            if (socket) {
                // Silently close without triggering callbacks
                const closeSocket = () => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.close();
                    } else if (socket.readyState === WebSocket.CONNECTING) {
                        // Wait a bit for connection to establish before closing
                        socket.addEventListener('open', () => socket.close(), { once: true });
                    }
                };

                socket.onopen = null;
                socket.onmessage = null;
                socket.onclose = null;
                socket.onerror = null;

                closeSocket();
                socketRef.current = null;
            }
        };
    }, [threadId, user]);

    const sendMessage = useCallback((content) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                command: 'send_message',
                message: content
            }));
            return true;
        }
        return false;
    }, []);

    return { messages, setMessages, lastEvent, setLastEvent, sendMessage, isConnected };
};
