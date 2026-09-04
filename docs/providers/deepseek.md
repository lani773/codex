# DeepSeek Provider Setup & Configuration

Codex provides first-class support for DeepSeek models.

## Configuration (`~/.codex/config.toml`)
```toml
[model_providers.deepseek]
name = "DeepSeek"
base_url = "https://api.deepseek.com"
api_key_env = "DEEPSEEK_API_KEY"

[profiles.deepseek]
model = "deepseek-v4-flash"
provider = "deepseek"
```

## Environment Variables
- `DEEPSEEK_API_KEY`: Your DeepSeek API Key.

## Models
- `deepseek-v4-flash`: Fast reasoning and coding model.
- `deepseek-v4-pro`: Advanced reasoning model.

## Command Line Usage
```shell
codex --model deepseek-v4-flash
codex --profile deepseek
```
