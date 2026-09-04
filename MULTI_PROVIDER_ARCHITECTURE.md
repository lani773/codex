# Multi-Provider Architecture Specification for OpenAI Codex

## Architecture Overview

```
                    ┌─────────────────────────┐
                    │       Codex Agent       │
                    │                         │
                    │  Planning               │
                    │  Tool execution         │
                    │  Context management     │
                    │  Patch generation       │
                    │  Terminal & MCP         │
                    └────────────┬────────────┘
                                 │
                        Unified Model API
                                 │
                   ┌─────────────┴─────────────┐
                   │     Provider Manager      │
                   │ (Router, Fallback, Health)│
                   └─────────────┬─────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
   ┌─────────┴─────────┐ ┌───────┴─────────┐ ┌───────┴─────────┐
   │ OpenAI Adapter    │ │ DeepSeek Adapter│ │ Anthropic Adapt.│
   └─────────┬─────────┘ └───────┬─────────┘ └───────┬─────────┘
             │                   │                   │
      OpenAI Backend      DeepSeek Backend    Anthropic Backend
```

---

## 1. Provider Abstraction & Interface Specification

### `ModelProvider` Trait Extensions (`codex-rs/model-provider`)

```rust
pub trait ModelProviderAdapter: fmt::Debug + Send + Sync {
    fn id(&self) -> &str;
    fn name(&self) -> &str;
    fn capabilities(&self) -> ProviderCapabilities;
    
    fn authenticate(&self) -> Pin<Box<dyn Future<Output = CodexResult<()>> + Send + '_>>;
    fn list_models(&self) -> Pin<Box<dyn Future<Output = CodexResult<Vec<ModelSpec>>> + Send + '_>>;
    
    fn send_request(
        &self,
        request: UnifiedRequest,
    ) -> Pin<Box<dyn Future<Output = CodexResult<UnifiedResponse>> + Send + '_>>;
    
    fn stream_response(
        &self,
        request: UnifiedRequest,
    ) -> Pin<Box<dyn Future<Output = CodexResult<BoxStream<'static, StreamEvent>>> + Send + '_>>;
}
```

### `ProviderCapabilities`

```rust
pub struct ProviderCapabilities {
    pub text: bool,
    pub vision: bool,
    pub reasoning: bool,
    pub tool_calling: bool,
    pub parallel_tool_calls: bool,
    pub structured_output: bool,
    pub streaming: bool,
    pub mcp: bool,
    pub subagents: bool,
    pub web_search: bool,
    pub code_execution: bool,
    pub context_window: usize,
    pub max_output_tokens: usize,
}
```

---

## 2. Unified Request/Response Format

### `UnifiedMessage`
```rust
pub struct UnifiedMessage {
    pub role: MessageRole, // System, User, Assistant, Tool
    pub content: String,
    pub tool_calls: Vec<UnifiedToolCall>,
    pub tool_results: Vec<UnifiedToolResult>,
    pub reasoning: Option<ReasoningContent>,
    pub metadata: HashMap<String, String>,
}
```

### `StreamEvent`
```rust
pub enum StreamEvent {
    TextDelta(String),
    ReasoningDelta(String),
    ToolCallStarted { id: String, name: String },
    ToolCallDelta { id: String, args_json_delta: String },
    ToolCallFinished { id: String },
    UsageUpdate(UsageStats),
    Error(String),
    Completed,
}
```

---

## 3. Provider Adapters Suite

1. **`OpenAIProviderAdapter`**: OpenAI `/v1/responses` & `/v1/chat/completions`.
2. **`DeepSeekProviderAdapter`**: DeepSeek V4 Flash & Pro models via custom/standard endpoints, supporting `reasoning_content`.
3. **`AnthropicProviderAdapter`**: Messages API with prompt caching & native tool definitions.
4. **`GeminiProviderAdapter`**: Google Gemini REST/gRPC API adapter.
5. **`OpenRouterProviderAdapter`**: OpenRouter routing adapter.
6. **`OllamaProviderAdapter` & `LMStudioProviderAdapter`**: Local model execution adapters.
7. **`AzureOpenAIProviderAdapter`**: Azure OpenAI deployment mapping.
8. **`OpenAICompatibleProviderAdapter`**: Configurable generic OpenAI format endpoints.

---

## 4. Configuration Schema (`config.toml`)

```toml
[profiles.default]
model = "gpt-5"
provider = "openai"

[profiles.deepseek]
model = "deepseek-v4-flash"
provider = "deepseek"

[profiles.local]
model = "qwen"
provider = "ollama"

[model_providers.deepseek]
name = "DeepSeek"
base_url = "https://api.deepseek.com"
api_key_env = "DEEPSEEK_API_KEY"

[model_providers.my_custom]
name = "My Custom Provider"
base_url = "https://example.com/v1"
api_key_env = "MY_PROVIDER_API_KEY"

[routing]
enabled = false

[routing.coding]
model = "deepseek-v4-flash"

[routing.reasoning]
model = "gpt-5"

[fallback]
enabled = true
models = ["gpt-5", "deepseek-v4-flash"]
```

---

## 5. Security & Isolation Model

- API Keys are never printed in logs or passed in agent prompts.
- Environment variables (`OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`, etc.) are resolved per adapter.
- Sandboxing policies (Windows/Linux sandboxes), terminal approvals, and MCP security boundaries remain unaffected by provider selection.
