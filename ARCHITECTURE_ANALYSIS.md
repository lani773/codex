# Architecture Analysis: Multi-AI Coding Agent Platform Refactoring for OpenAI Codex

## Executive Summary
This document provides a comprehensive analysis of the existing OpenAI Codex codebase (`codex-rs`), identifying provider-coupling points, architectural assumptions, and required refactorings to evolve Codex into a provider-agnostic, multi-model coding agent platform supporting OpenAI, DeepSeek, Anthropic, Gemini, OpenRouter, Ollama, LM Studio, Azure, and OpenAI-compatible providers.

---

## 1. Current Architecture Overview

Currently, Codex has a partial abstraction around providers:
- **`codex_model_provider_info::ModelProviderInfo`**: Configuration struct storing provider names, `base_url`, `env_key`, headers, and `wire_api`.
- **`codex_model_provider::ModelProvider`**: A trait with methods for `capabilities()`, `auth()`, `models_manager()`, and `api_provider()`.
- **`codex_api` / `codex_protocol`**: Protocols heavily tailored to OpenAI's `/v1/responses` wire API, including OpenAI-specific items like `compaction_trigger`, `x-openai-actor-authorization`, and ChatGPT auth tokens.

### Key Existing Components
- `codex-rs/model-provider-info`: Defines supported provider metadata (`OPENAI_PROVIDER_ID`, `AMAZON_BEDROCK_PROVIDER_ID`, `OLLAMA_OSS_PROVIDER_ID`, `LMSTUDIO_OSS_PROVIDER_ID`).
- `codex-rs/model-provider`: Implements `ModelProvider` trait for `ConfiguredModelProvider` and `AmazonBedrockModelProvider`.
- `codex-rs/models-manager`: Model discovery, local JSON catalog (`models.json`), model info overrides, and fallback heuristics.
- `codex-rs/protocol`: Protocol definitions (requests, responses, tools, items, streaming signals).
- `codex-rs/tui`: Terminal User Interface displaying current provider, model, status, and system logs.

---

## 2. Identified Provider Coupling Points

1. **Wire API Lock-in (`WireApi::Responses`)**:
   - `ModelProviderInfo` defaults to OpenAI's `/v1/responses` endpoint format. Other model providers (e.g. Anthropic, Gemini, DeepSeek, Ollama native APIs) use standard Chat Completions `/v1/chat/completions` or provider-native JSON RPC / REST schemas.
2. **Hardcoded OpenAI Models & Defaults**:
   - Models like `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-5`, and `codex-auto-review` are hardcoded in `ModelProvider` default methods (`approval_review_preferred_model`, `memory_extraction_preferred_model`).
3. **Provider Identification by String Matching**:
   - Direct calls to `.is_openai()` and `.is_amazon_bedrock()` exist throughout `codex-model-provider`, `codex-api`, and `models-manager`.
4. **Auth & Header Coupling**:
   - Auth logic heavily relies on `requires_openai_auth` and OpenAI ChatGPT tokens.
5. **Tool & Reasoning Formatting**:
   - Tool calls and reasoning tokens are structured strictly around OpenAI's `Responses` items format (`Item::FunctionCall`, `Item::Reasoning`).

---

## 3. Required Refactoring & Architecture Evolution

To support dynamic multi-provider routing without modifying core agent logic:

### A. Core Provider Abstraction (`ModelProvider` Trait Enhancement)
- Extend `ModelProvider` trait to support provider adapter instantiation, capabilities negotiation, request translation, and event streaming.
- Introduce `ProviderCapabilities` expanding beyond remote compaction:
  - `supports_tools`, `supports_parallel_tools`, `supports_reasoning`, `supports_vision`, `supports_mcp`, `supports_subagents`, `supports_streaming`, `context_window`, `max_output_tokens`.

### B. Unified Request / Response Layer
- Implement `UnifiedMessage` representation for agent state:
  - Role (`system`, `user`, `assistant`, `tool`), content, tool calls, tool results, reasoning contents, attachments, metadata.
- Implement `ProviderAdapter` pattern:
  - `OpenAIAdapter`, `DeepSeekAdapter`, `AnthropicAdapter`, `GeminiAdapter`, `OpenRouterAdapter`, `OllamaAdapter`, `LMStudioAdapter`, `AzureOpenAIAdapter`, `OpenAICompatibleAdapter`.

### C. Dynamic Model Catalog & Profiles
- Expand `model_providers` in `config.toml` to support generic OpenAI-compatible custom providers.
- Implement configuration profiles (`[profiles.default]`, `[profiles.deepseek]`, `[profiles.claude]`, `[profiles.local]`).
- Add `/model` command in CLI/TUI and `--profile` / `--model` CLI flags.

### D. Provider Health, Routing & Fallback
- `ProviderHealth` system checking authentication, latency, status, and capabilities (`codex providers`).
- Task-based model router (`[routing.coding]`, `[routing.reasoning]`, `[routing.fast]`).
- Resilient fallback mechanism (`[fallback.models]`).

---

## 4. Files to Modify vs. Files to Preserve

### Files / Crates to Modify / Add:
- `codex-rs/model-provider-info`: Add new provider IDs (`deepseek`, `anthropic`, `gemini`, `openrouter`, `azure`, `compatible`) and expanded provider config options.
- `codex-rs/model-provider`: Add adapter traits, `UnifiedMessage`, provider capability checks, health status, and adapter implementations in `src/providers/`.
- `codex-rs/models-manager`: Model catalog dynamic registration, routing, fallback handling.
- `codex-rs/tui` & `codex-rs/codex-cli`: Add `/model` interactive selector, model switching context preserved, `codex providers` & `codex usage` command outputs.
- `docs/providers/`: Detailed provider documentation markdown files.

### Critical Components to PRESERVE (Untouched):
- `codex-rs/sandboxing` & `windows-sandbox-rs`: Sandbox isolation and security boundaries.
- `codex-rs/mcp-server`: MCP server protocols and tool bindings.
- Approvals policy & filesystem guardrails.

---

## 5. Risk Assessment & Migration Strategy

- **Backward Compatibility**: Existing OpenAI users MUST experience zero breaking changes. Default profile will remain OpenAI.
- **Context Isolation**: When switching providers during an active session, reset model context cleanly to avoid protocol mismatches.
- **Credential Security**: Isolate API keys per provider in memory, preventing header cross-contamination.
