# Ollama Local Model Setup & Configuration

## Configuration
```toml
[profiles.local]
model = "qwen2.5-coder"
provider = "ollama"
```

## Local Execution
Ollama models run locally on your hardware. Project code remains 100% private.

## CLI Usage
```shell
codex --model ollama/qwen2.5-coder
codex --profile local
```
