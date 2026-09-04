.DEFAULT_GOAL := help

.PHONY: help
help: ## Show available commands
	@grep -E '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*## "}; {printf "%-20s %s\n", $$1, $$2}'

.PHONY: dev
dev: ## Enter the Nix development shell
	nix develop

.PHONY: direnv-allow
direnv-allow: ## Allow direnv for this repository
	direnv allow

.PHONY: versions
versions: ## Show development tool versions
	nix develop --command bash -c '\
		echo "Node:    $$(node --version)"; \
		echo "pnpm:    $$(pnpm --version)"; \
		echo "AWS CLI: $$(aws --version)"; \
		echo "jq:      $$(jq --version)"; \
	'

.PHONY: fmt
fmt: ## Format source files
	pnpm format
	nix fmt

.PHONY: fmt-check
fmt-check: ## Check formatting without modifying files
	pnpm format:check
	find . -type f -name '*.nix' -not -path './.git/*' -exec nixfmt --check {} +

.PHONY: lint
lint: ## Run lint checks
	pnpm lint

.PHONY: typecheck
typecheck: ## Run TypeScript type checking
	pnpm typecheck

.PHONY: test
test: ## Run tests
	pnpm test

.PHONY: flake-check
flake-check: ## Validate the Nix flake
	nix flake check

.PHONY: check
check: fmt-check lint typecheck test flake-check ## Run all non-destructive validation
