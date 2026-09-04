# Development Instructions

- Node.js and pnpm are provided by `flake.nix`; use `direnv allow` or `nix develop` before running project commands.
- After code or configuration changes, run `make check` as the default validation command.
- When formatting is needed, run `make fmt`, then run `make check` to confirm the non-destructive validation.
- Run `pnpm typecheck` after TypeScript changes.
