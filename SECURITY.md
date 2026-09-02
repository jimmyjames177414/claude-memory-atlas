# Security Policy

This is a small personal project, maintained on a best-effort basis.

## Reporting a Vulnerability

Please use [GitHub Security Advisories](https://github.com/jimmyjames177414/claude-memory-atlas/security/advisories/new)
rather than a public issue, so a real problem isn't disclosed before a fix ships. I'll
do my best to respond within a few days.

## Supported Versions

Only the latest commit on `main` is supported. There are no maintained release branches.

## Known limitation (by design, not something you need to report)

Rendered markdown bodies are inserted as HTML with no sanitization pass - see
["A note on trust"](./README.md#a-note-on-trust) in the README. Only point this tool at
memory directories you trust. If you have a concrete exploit scenario beyond what's
already documented there, please do still open an advisory.
