import { useEffect, useRef } from "react";
import { useAuthStore } from "./use-auth";
import { useNotifications } from "@/stores/notifications";

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const { token } = useAuthStore();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//127.0.0.1:3000/ws?token=${token}`;

    const setupWebSocket = () => {
      try {
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log("WebSocket connected");
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "notification") {
              addNotification(data.notification);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.current.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.current.onclose = () => {
          console.log("WebSocket disconnected");
          // Attempt to reconnect after 5 seconds
          setTimeout(setupWebSocket, 5000);
        };
      } catch (error) {
        console.error("Error setting up WebSocket:", error);
        // Attempt to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
      }
    };

    setupWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token, addNotification]);
}
