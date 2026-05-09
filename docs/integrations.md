# Integrations

Two patterns cover most CLI integrations: a **session-start greeting** and a **statusline glyph**.

## Session-start greeting

Run a tiny clingon when a new shell or agent session opens.

### Plain shell

In `~/.zshrc`, `~/.bashrc`, or fish config:

```sh
clingon --tiny --pad=1
clingon --tiny --welcome --date --cwd --git --pad=1
```

### Claude Code (SessionStart hook)

In `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          { "type": "command", "command": "clingon --tiny --welcome --pad=1" }
        ]
      }
    ]
  }
}
```

### Codex CLI / Goose / similar

Most agentic CLIs accept a startup command via config. Consult the tool's docs and use the same `clingon --tiny --welcome --pad=1` invocation.

## Statusline glyph

Use `--inline` for a one-line glyph that fits in any statusline.

### tmux

In `~/.tmux.conf`:

```
set -g status-right '#(clingon --inline --tiny --with-name orlando-reginald-morris-junior --no-color) %H:%M'
```

Pin the name with `--with-name` so the glyph is stable across refreshes.

### starship

In `~/.config/starship.toml`, add a custom module:

```toml
[custom.clingon]
command = 'clingon --inline --tiny --with-name orlando-reginald-morris-junior'
when = 'true'
format = '[$output]($style) '
```

### oh-my-posh

In your theme JSON, add a `command` segment:

```json
{
  "type": "command",
  "style": "plain",
  "properties": {
    "command": "clingon --inline --tiny --with-name orlando-reginald-morris-junior"
  }
}
```

### Claude Code statusline

In `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "clingon --inline --tiny --with-name orlando-reginald-morris-junior --no-color"
  }
}
```

## Notes

- `--inline` always emits exactly one line of output. Width matches the size: 4 chars for tiny, 5 for small, 7 for normal, 11 for large.
- `--no-color` is recommended for any tool that re-renders frequently; ANSI escape repaints can flicker in some statuslines.
- Statusline animation (advancing frames per refresh) is not currently supported. Use `--with-name` for stability.
- The screensaver mode (`clingon --screensaver`, future PR) is best run in a dedicated tmux pane — it owns the alternate buffer for the duration of its run.
