import type { CodexEvent } from "../../types/codex";

export type ConnectionState = "connected" | "connecting" | "disconnected" | "reconnecting";

type Command = { type: string; [key: string]: unknown };

/**
 * Owns the WebSocket connection lifecycle:
 * - Exponential backoff reconnect (capped at 30 s, max `maxAttempts`)
 * - Heartbeat every 25 s
 * - Command queue: commands sent while disconnected are replayed on reconnect
 * - Snapshot re-sync (`state.sync`) sent after every successful reconnect
 * - Malformed server events are silently dropped
 * - Never exposes the raw socket to consumers
 */
export class WebSocketManager {
  private socket?: WebSocket;
  private attempts = 0;
  private stopped = false;
  private heartbeat?: ReturnType<typeof window.setInterval>;
  private readonly listeners = new Set<(event: CodexEvent) => void>();
  private readonly commandQueue: Command[] = [];

  constructor(
    private readonly url: string,
    private readonly onState: (state: ConnectionState) => void,
    private readonly token?: string,
    private readonly maxAttempts = 10,
  ) {}

  connect(): void {
    this.stopped = false;
    this.open();
  }

  disconnect(): void {
    this.stopped = true;
    if (this.heartbeat !== undefined) window.clearInterval(this.heartbeat);
    this.socket?.close();
    this.onState("disconnected");
  }

  subscribe(listener: (event: CodexEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToGoal(goalId: string): boolean {
    return this.send({ type: "goal.subscribe", goal_id: goalId });
  }

  unsubscribeFromGoal(goalId: string): boolean {
    return this.send({ type: "goal.unsubscribe", goal_id: goalId });
  }

  /**
   * Send a command. Returns true when sent immediately, false when queued.
   * Queued commands are replayed in order after the next successful connect.
   */
  send(command: Command): boolean {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(command));
      return true;
    }
    // Do not queue heartbeats or authentication — they are auto-sent on open
    const skipQueue = ["heartbeat", "session.authenticate", "state.sync"].includes(
      command.type,
    );
    if (!skipQueue) {
      this.commandQueue.push(command);
    }
    return false;
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private open(): void {
    if (this.attempts >= this.maxAttempts) {
      this.onState("disconnected");
      return;
    }
    this.onState(this.attempts > 0 ? "reconnecting" : "connecting");
    try {
      this.socket = new WebSocket(this.url);
    } catch {
      // Invalid URL or unsupported protocol
      this.onState("disconnected");
      return;
    }

    this.socket.onopen = () => {
      this.attempts = 0;
      this.onState("connected");
      if (this.token) this.send({ type: "session.authenticate", token: this.token });
      this.send({ type: "state.sync" });
      this.startHeartbeat();
      this.flushQueue();
    };

    this.socket.onmessage = (message: MessageEvent<unknown>) =>
      this.route(message.data);

    this.socket.onclose = () => {
      if (this.heartbeat !== undefined) window.clearInterval(this.heartbeat);
      if (!this.stopped) this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  private startHeartbeat(): void {
    if (this.heartbeat !== undefined) window.clearInterval(this.heartbeat);
    this.heartbeat = window.setInterval(
      () => this.send({ type: "heartbeat" }),
      25_000,
    );
  }

  private scheduleReconnect(): void {
    this.attempts += 1;
    const delay = Math.min(1_000 * 2 ** this.attempts, 30_000);
    window.setTimeout(() => this.open(), delay);
  }

  private flushQueue(): void {
    while (this.commandQueue.length > 0) {
      const cmd = this.commandQueue.shift();
      if (cmd) this.send(cmd);
    }
  }

  private route(payload: unknown): void {
    if (typeof payload !== "string") return;
    try {
      const event = JSON.parse(payload) as CodexEvent;
      if (typeof event.type === "string") {
        this.listeners.forEach((listener) => listener(event));
      }
    } catch {
      // Malformed server event — drop without crashing or closing the connection
    }
  }
}
