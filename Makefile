.DEFAULT_GOAL := help
.PHONY: help pack test

VERSION := $(shell node -p "require('./manifest.json').version")
ARCHIVE := dist/refined-alphaxiv-$(VERSION).zip
FILES := manifest.json content.js content.css icons/16.png icons/32.png icons/48.png icons/128.png LICENSE.md

help: ## Show available commands
	@sed -ne 's/^\([a-z]*\):.*## /make \1 — /p' $(MAKEFILE_LIST)

pack: ## Create the distribution ZIP
	@mkdir -p dist
	zip -X -FS $(ARCHIVE) $(FILES)

test: ## Run regression checks
	node --test test/content.test.cjs
