import { expect, test, vi, afterEach } from "vitest";
import { WebSocketManager } from "./WebSocketManager";
class MockWebSocket {
  static readonly OPEN = 1;
  static instances: MockWebSocket[] = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((message: MessageEvent) => void) | null = null;
  send = vi.fn();
  constructor(readonly url: string) { MockWebSocket.instances.push(this); }
  close() { this.onclose?.(); }
  open() { this.readyState = MockWebSocket.OPEN; this.onopen?.(); }
  message(data: unknown) { this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent); }
}
afterEach(() => { MockWebSocket.instances = []; vi.useRealTimers(); });
test("authenticates, syncs state, and routes typed events", () => { vi.stubGlobal("WebSocket", MockWebSocket); const onState = vi.fn(); const onEvent = vi.fn(); const manager = new WebSocketManager("ws://localhost/ws", onState, "token-1"); manager.subscribe(onEvent); manager.connect(); const socket = MockWebSocket.instances[0]; socket.open(); expect(onState).toHaveBeenLastCalledWith("connected"); expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ type: "session.authenticate", token: "token-1" })); expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ type: "state.sync" })); socket.message({ type: "task.progress", task_id: "task-1", progress: 50, message: "Coding" }); expect(onEvent).toHaveBeenCalledWith({ type: "task.progress", task_id: "task-1", progress: 50, message: "Coding" }); manager.disconnect(); });
test("reconnects with backoff after an unexpected close", () => { vi.useFakeTimers(); vi.stubGlobal("WebSocket", MockWebSocket); const manager = new WebSocketManager("ws://localhost/ws", vi.fn()); manager.connect(); MockWebSocket.instances[0].close(); vi.advanceTimersByTime(2_000); expect(MockWebSocket.instances).toHaveLength(2); manager.disconnect(); });
