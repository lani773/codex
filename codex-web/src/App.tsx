import { useCallback, useState } from "react";
import { INITIAL_STATE, goalReducer } from "./hooks/useGoalReducer";
import { useWebSocket } from "./hooks/useWebSocket";
import { GoalBuilderPage } from "./pages/GoalBuilderPage";
import { GoalPage } from "./pages/GoalPage";
import { TasksPage } from "./pages/TasksPage";
import { PlanPage } from "./pages/PlanPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { ChangesPage } from "./pages/ChangesPage";
import { FilesPage } from "./pages/FilesPage";
import { TestsPage } from "./pages/TestsPage";
import { TerminalPage } from "./pages/TerminalPage";
import { TimelinePage } from "./pages/TimelinePage";
import { ChatPage } from "./pages/ChatPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { NotificationBell } from "./components/NotificationBell";
import { ErrorState } from "./components/EmptyState";
import { files as demoFiles, changes as demoChanges } from "./data/demo";
import type { ConnectionState } from "./services/websocket/WebSocketManager";
import type { GoalAction } from "./hooks/useGoalReducer";

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useState(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState("workspace");
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [chatDraft, setChatDraft] = useState("");
  const [wsUrl, setWsUrl] = useState(() => {
    // Determine ws:// or wss:// based on current protocol
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host; // includes port if present
    // The backend handles /ws, adjust if needed based on proxy config
    return `${proto}//${host}/ws`;
  });

  // Setup WebSocket connection and wire it to the reducer
  const handleEvent = useCallback((event: any) => {
    // Only dispatch if the event is a valid CodexEvent
    if (event && event.type) {
      dispatch((prev) => goalReducer(prev, { type: "WS_EVENT", event }));
    }
  }, []);

  const wsManagerRef = useWebSocket({
    url: wsUrl,
    enabled: true,
    onState: setConnectionState,
    onEvent: handleEvent,
  });

  const sendCommand = (cmd: any) => {
    wsManagerRef.current?.send(cmd);
  };

  // ─── Mock bootstrap ────────────────────────────────────────────────────────
  
  // Expose a global hook to load mock data for testing UI offline
  (window as any).loadMockData = async () => {
    const demo = await import("./data/demo");
    dispatch((prev) => goalReducer(prev, {
      type: "INIT_MOCK",
      goal: demo.goal,
      tasks: demo.tasks,
      messages: demo.messages,
      activity: demo.activities,
      approvals: demo.approvals,
      question: undefined,
      terminalEntries: demo.terminalEntries,
      testResults: demo.testResults,
    }));
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  // Goal creation (called by GoalBuilderPage)
  const handleCreateGoal = async (title: string, objective: string) => {
    // If we're disconnected, try sending it anyway (WSManager will queue it)
    sendCommand({
      type: "goal.update",
      goal_id: "new_goal", // Backend should replace this or expect a specific creation command
      patch: { title, objective }
    });
    
    // Optimistic update for the UI if backend doesn't respond immediately
    dispatch((prev) => goalReducer(prev, {
      type: "SET_GOAL",
      goal: {
        id: "optimistic_goal",
        title,
        objective,
        status: "planning",
        progress: 0,
        requirements: [],
        successCriteria: [],
      }
    }));
    setActiveTab("workspace");
  };

  // Chat message sending
  const handleSendMessage = () => {
    if (!chatDraft.trim()) return;
    sendCommand({
      type: "chat.message",
      goal_id: state.goal.id,
      content: chatDraft.trim(),
    });
    
    // Optimistic local update
    dispatch((prev) => goalReducer(prev, {
      type: "ADD_MESSAGE",
      message: {
        id: crypto.randomUUID(),
        role: "user",
        content: chatDraft.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    }));
    setChatDraft("");
  };

  // ─── Connection Banner ──────────────────────────────────────────────────────

  const renderConnectionBanner = () => {
    if (connectionState === "connected") return null;
    return (
      <div className={`connection-banner ${connectionState}`}>
        {connectionState === "disconnected" && (
          <p>
            <span aria-hidden="true">⚠</span> 
            Disconnected from backend. Retrying... 
            <button className="text-button" onClick={() => window.location.reload()}>Reload page</button>
          </p>
        )}
        {connectionState === "connecting" && <p><span className="spinner" aria-hidden="true" /> Connecting to Codex...</p>}
        {connectionState === "reconnecting" && <p><span className="spinner" aria-hidden="true" /> Reconnecting to Codex...</p>}
      </div>
    );
  };

  // ─── Router / Tab Switcher ────────────────────────────────────────────────

  if (state.goal.status === "draft") {
    return (
      <div className="app-container">
        {renderConnectionBanner()}
        <header className="app-header">
          <div className="brand">
            <span className="logo" aria-hidden="true">⬡</span>
            <h1>Codex</h1>
            <span className="version">v0.1</span>
          </div>
        </header>
        <main className="app-main">
          <GoalBuilderPage onCreate={handleCreateGoal} />
        </main>
      </div>
    );
  }

  const unreadApprovals = state.approvals.filter(a => a.status === "pending").length;

  return (
    <div className="app-container layout-sidebar">
      {renderConnectionBanner()}
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        <div className="brand">
          <span className="logo" aria-hidden="true">⬡</span>
          <h1>Codex</h1>
          <span className="version">v0.1</span>
        </div>

        <nav className="nav-group">
          <button
            className={activeTab === "workspace" ? "nav-link active" : "nav-link"}
            onClick={() => setActiveTab("workspace")}
          >
            Workspace
          </button>
          <button
            className={activeTab === "goal" ? "nav-link active" : "nav-link"}
            onClick={() => setActiveTab("goal")}
          >
            Goal & Scope
          </button>
          <button
            className={activeTab === "plan" ? "nav-link active" : "nav-link"}
            onClick={() => setActiveTab("plan")}
          >
            Execution Plan
          </button>
          <button
            className={activeTab === "tasks" ? "nav-link active" : "nav-link"}
            onClick={() => setActiveTab("tasks")}
          >
            Tasks
          </button>
          <button
            className={activeTab === "chat" ? "nav-link active" : "nav-link"}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </button>
        </nav>

        <nav className="nav-group nav-group-secondary">
          <span className="nav-group-label">Verification</span>
          <button
            className={activeTab === "files" ? "nav-link active" : "nav-link"}
            onClick={() => setActiveTab("files")}
          >
            Files
          </button>
          <button
            className={activeTab === "changes" ? "nav-link active" : "nav-link"}
            onClick={() => setActiveTab("changes")}
          >
            Changes
          </button>
          <button
            className={activeTab === "tests" ? "nav-link active" : "nav-link"}
            onClick={() => setActiveTab("tests")}
          >
            Tests
          </button>
        </nav>

        <nav className="nav-group nav-group-secondary">
          <span className="nav-group-label">System</span>
          <button
            className={activeTab === "approvals" ? "nav-link active" : "nav-link"}
            onClick={() => setActiveTab("approvals")}
          >
            Approvals
            {unreadApprovals > 0 && <span className="badge danger">{unreadApprovals}</span>}
          </button>
          <button
            className={activeTab === "terminal" ? "nav-link active" : "nav-link"}
            onClick={() => setActiveTab("terminal")}
          >
            Terminal
          </button>
          <button
            className={activeTab === "timeline" ? "nav-link active" : "nav-link"}
            onClick={() => setActiveTab("timeline")}
          >
            Timeline
          </button>
        </nav>

        <div className="sidebar-footer">
          <NotificationBell
            count={state.activity.length}
            unread={0}
            onClick={() => setActiveTab("timeline")}
          />
          <button className="theme-toggle" onClick={() => {
            const current = document.documentElement.getAttribute("data-theme");
            document.documentElement.setAttribute("data-theme", current === "light" ? "dark" : "light");
          }}>
            ◑
          </button>
        </div>
      </aside>

      <main className="app-main main-content">
        {activeTab === "workspace" && (
          <WorkspacePage
            goal={state.goal}
            tasks={state.tasks}
            activity={state.activity}
            messages={state.messages}
            question={state.question}
            draft={chatDraft}
            agents={state.agents}
            providers={state.providers}
            onDraftChange={setChatDraft}
            onSend={handleSendMessage}
            onAnswer={(answer) => {
              if (state.question) {
                sendCommand({ type: "question.answer", question_id: state.question.id, answer });
                dispatch((prev) => goalReducer(prev, { type: "DISMISS_QUESTION" }));
              }
            }}
            onOpenPlan={() => setActiveTab("plan")}
            onAttach={(files) => console.log("Attach files:", files)}
          />
        )}

        {activeTab === "goal" && (
          <GoalPage
            goal={state.goal}
            onToggleRequirement={(id) => dispatch((prev) => goalReducer(prev, { type: "TOGGLE_REQUIREMENT", id }))}
            onAddRequirement={(text) => dispatch((prev) => goalReducer(prev, { type: "ADD_REQUIREMENT", text }))}
            onDeleteRequirement={(id) => dispatch((prev) => goalReducer(prev, { type: "DELETE_REQUIREMENT", id }))}
            onToggleCriterion={(id) => dispatch((prev) => goalReducer(prev, { type: "TOGGLE_CRITERION", id }))}
            onAddCriterion={(text) => dispatch((prev) => goalReducer(prev, { type: "ADD_CRITERION", text }))}
            onDeleteCriterion={(id) => dispatch((prev) => goalReducer(prev, { type: "DELETE_CRITERION", id }))}
            onUpdateObjective={(objective) => dispatch((prev) => goalReducer(prev, { type: "UPDATE_OBJECTIVE", objective }))}
          />
        )}

        {activeTab === "plan" && (
          <PlanPage
            tasks={state.tasks}
            goalStatus={state.goal.status}
            onApprovePlan={() => sendCommand({ type: "plan.approve", goal_id: state.goal.id })}
            onRetryTask={(taskId) => sendCommand({ type: "task.retry", goal_id: state.goal.id, task_id: taskId })}
          />
        )}

        {activeTab === "tasks" && (
          <TasksPage
            tasks={state.tasks}
            onRetryTask={(taskId) => sendCommand({ type: "task.retry", goal_id: state.goal.id, task_id: taskId })}
          />
        )}

        {activeTab === "chat" && (
          <ChatPage
            messages={state.messages}
            draft={chatDraft}
            onDraftChange={setChatDraft}
            onSend={handleSendMessage}
            onAttach={(files) => console.log("Attach files:", files)}
          />
        )}

        {activeTab === "files" && (
          <FilesPage
            files={demoFiles as any} // Still using mock files for demo purposes until backend sends them
            onLoadFile={(id) => console.log("Load file content:", id)}
          />
        )}

        {activeTab === "changes" && (
          <ChangesPage
            changes={demoChanges as any} // Still using mock changes
            onApproveAll={() => console.log("Approve all changes")}
            onApproveChange={(id) => console.log("Approve change:", id)}
            onRejectChange={(id) => console.log("Reject change:", id)}
          />
        )}

        {activeTab === "tests" && <TestsPage results={state.testResults} />}

        {activeTab === "approvals" && (
          <ApprovalsPage
            approvals={state.approvals}
            onDecide={(approvalId, decision) => {
              sendCommand({ type: "approval.decide", approval_id: approvalId, decision });
              dispatch((prev) => goalReducer(prev, { type: "DECIDE_APPROVAL", approvalId, decision }));
            }}
          />
        )}

        {activeTab === "terminal" && <TerminalPage entries={state.terminalEntries} />}

        {activeTab === "timeline" && <TimelinePage events={[]} />}
      </main>
    </div>
  );
}
