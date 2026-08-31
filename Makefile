.DEFAULT_GOAL := help

.PHONY: help
help:
	@grep -E '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*## "}; {printf "%-20s %s\n", $$1, $$2}'

.PHONY: dev
dev:
	nix develop

.PHONY: direnv-allow
direnv-allow:
	direnv allow

.PHONY: check
check:
	nix flake check

.PHONY: typecheck
typecheck:
	pnpm typecheck

.PHONY: versions
versions:
	nix develop --command bash -c '\
		echo "Node:    $$(node --version)"; \
		echo "pnpm:    $$(pnpm --version)"; \
		echo "AWS CLI: $$(aws --version)"; \
		echo "jq:      $$(jq --version)"; \
	'

.PHONY: fmt
fmt:
	nix fmt
