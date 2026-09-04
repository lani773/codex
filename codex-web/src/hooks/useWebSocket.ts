import { useEffect, useRef } from "react";
import {
  WebSocketManager,
  type ConnectionState,
} from "../services/websocket/WebSocketManager";
import type { CodexEvent } from "../types/codex";

type Options = {
  url: string;
  token?: string;
  enabled: boolean;
  onState: (state: ConnectionState) => void;
  onEvent: (event: CodexEvent) => void;
};

/**
 * Manages a WebSocketManager lifetime tied to the component lifecycle.
 * Returns a stable `send` ref so callers can send commands without re-rendering.
 */
export function useWebSocket({ url, token, enabled, onState, onEvent }: Options) {
  const managerRef = useRef<WebSocketManager | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const manager = new WebSocketManager(url, onState, token);
    managerRef.current = manager;
    const unsub = manager.subscribe(onEvent);
    manager.connect();
    return () => {
      unsub();
      manager.disconnect();
      managerRef.current = null;
    };
    // onState / onEvent are stable refs from App — intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, url, token]);

  return managerRef;
}
