# Generic OpenAI-Compatible Provider Setup

You can configure any custom OpenAI-compatible API endpoint in your `~/.codex/config.toml` without recompiling Codex.

## Configuration Example
```toml
[model_providers.my_provider]
name = "My Custom Provider"
base_url = "https://example.com/v1"
api_key_env = "MY_PROVIDER_API_KEY"

[models.my_model]
provider = "my_provider"
model_id = "my-custom-model"
```
