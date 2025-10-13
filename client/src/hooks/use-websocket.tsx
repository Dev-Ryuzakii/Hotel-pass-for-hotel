import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const { token } = useAuth();

  const connect = useCallback(() => {
    if (!token) return;

    try {
      const wsUrl = new URL(WS_URL);
      wsUrl.searchParams.set('token', token);

      ws.current = new WebSocket(wsUrl.toString());

      ws.current.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message:', data);
          // Handle different message types here
          switch (data.type) {
            case 'notification':
              // Handle notification
              break;
            case 'booking_update':
              // Handle booking update
              break;
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [token]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return ws.current;
}
