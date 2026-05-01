# Git Operations

## Remote

Target repository:

```text
https://github.com/noahbenzing1979-boop/Scizo
```

## Token Safety

Do not commit tokens, token filenames, `.env` files, or secret-like artifacts.

Use a fresh token outside chat, preferably as:

```powershell
$env:GITHUB_TOKEN = "<fresh token>"
```

The repo can be initialized through normal `git` commands when Git is installed, or through the GitHub REST contents API when Git is not available on PATH.

## First Push Contents

The first push should include only the curated scaffold:

- README, LICENSE, `.gitignore`, package and Vite config
- `assets/banner.png`
- `client/`, `server/`, `shared/`, `docs/`, and `patches/`

Do not include old generated drafts, unrelated audio files, or local credentials.
