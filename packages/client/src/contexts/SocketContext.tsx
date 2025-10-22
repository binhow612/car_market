import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "../store/auth";
import { socketService } from "../services/socket.service";

interface SocketContextType {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    // Listen for connection status changes
    const updateConnectionStatus = (data: { connected: boolean }) => {
      setIsConnected(data.connected);
    };

    // Initial check
    setIsConnected(socketService.isConnected());

    // Listen for custom connection status change events
    const unsubscribe = socketService.on(
      "connectionStatusChanged",
      updateConnectionStatus
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
