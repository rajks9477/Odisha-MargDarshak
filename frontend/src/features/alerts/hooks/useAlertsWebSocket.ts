"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DriverAlert } from "../types/alertTypes";
import { NotificationWebService } from "../services/notificationWebService";

interface UseAlertsWebSocketReturn {
  isConnected: boolean;
  lastMessage: any;
  reconnect: () => void;
}

export function useAlertsWebSocket(
  onNewAlert?: (alert: DriverAlert) => void
): UseAlertsWebSocketReturn {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== "undefined" ? window.location.hostname + ":8000" : "127.0.0.1:8000");
    const wsUrl = `${wsProtocol}//${wsHost}/api/v1/driver/alerts/ws${token ? `?token=${token}` : ""}`;

    try {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);

          if (data.type === "ALERT_CREATED" || data.type === "EMERGENCY_BROADCAST") {
            const alert = data.alert as DriverAlert;
            if (alert) {
              NotificationWebService.showSystemNotification(alert);
              if (onNewAlert) onNewAlert(alert);
            }
          }
        } catch {
          // Heartbeat or raw text response
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect after 5s
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn("WebSocket connection initialization failed", err);
      setIsConnected(false);
    }
  }, [onNewAlert]);

  useEffect(() => {
    connect();

    // Heartbeat ping interval
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastMessage,
    reconnect: connect,
  };
}
