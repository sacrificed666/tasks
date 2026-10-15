# 📝 Tasks: run `make` to list every command
SHELL := /bin/bash
.DEFAULT_GOAL := help
.SILENT:

# The Docker environment: development, staging or production
ENV ?= development
ENVS := development staging production
# Docker Compose with the overlay of the environment
COMPOSE = docker compose -f compose.yaml -f docker/$(ENV).yaml
# The oldest supported Node.js major version
NODE_MIN := 24
# Ports of the dev server and the preview, and the base path
PORT ?= 5173
PREVIEW_PORT := 4173
BASE := /
# The port inside the container: the Vite dev server, or nginx
CONTAINER_PORT = $(if $(filter development,$(ENV)),5173,8080)

# Colours and emoji, off with NO_COLOR=1 or when the output is not a terminal
ifeq ($(NO_COLOR)$(shell [ -t 2 ] || echo pipe),)
  B := \033[1m
  D := \033[2m
  R := \033[31m
  G := \033[32m
  Y := \033[33m
  C := \033[36m
  M := \033[35m
  X := \033[0m
endif

# Status lines: a step, a success, a warning and a failure that stops make
step = printf "\n$(B)$(C)▶ %s$(X)\n" "$(1)"
ok = printf "$(G)✅ %s$(X)\n" "$(1)"
warn = printf "$(Y)⚠️  %s$(X)\n" "$(1)"
fail = { printf "$(R)❌ %s$(X)\n" "$(1)"; exit 1; }
# Opens an address on macOS or Linux
opener = $(shell command -v open || command -v xdg-open || echo echo)

# Colours the environment tags of the help
tags = gsub(/\[DEV\]/, "$(G)[DEV]$(X)", s); gsub(/\[STAGE\]/, "$(Y)[STAGE]$(X)", s); gsub(/\[PROD\]/, "$(R)[PROD]$(X)", s)

##@ 📖 Help

help: ## 📖 Show every command
	printf "\n$(B)📝 Tasks$(X) $(D)make <command>$(X)   $(G)[DEV]$(X) $(D)development$(X)  $(Y)[STAGE]$(X) $(D)staging$(X)  $(R)[PROD]$(X) $(D)production$(X)\n"
	awk 'BEGIN {FS = ":.*## "} \
	  /^##@/ {s = substr($$0, 5); $(tags); printf "\n$(B)%s$(X)\n", s} \
	  /^[a-zA-Z0-9_-]+:.*## / {s = $$2; $(tags); printf "  $(C)%-15s$(X) %s\n", $$1, s}' $(MAKEFILE_LIST)
	printf "\n$(D)Examples: make setup · make dev · make check · make stage-up · make prod-logs$(X)\n\n"

##@ 🧰 Setup

setup: install env browsers hooks ## 🧰 Everything for the first run: packages, .env, browsers and Git hooks
	$(call ok,Ready. Next: make dev)

install: node-version ## 📦 Install the exact dependencies from package-lock.json
	$(call step,Installing dependencies)
	npm ci

env: ## 🔐 Create .env from .env.example if it is missing
	if [ -f .env ]; then $(call ok,.env already exists); \
	else cp .env.example .env && $(call ok,Created .env from .env.example: it only sets Docker ports); fi

browsers: ## 🎭 Install Chromium and WebKit for the end-to-end tests
	$(call step,Installing Playwright Chromium and WebKit)
	npx playwright install chromium webkit

hooks: ## 🪝 Check format, lint, text and commit messages before every commit
	git config core.hooksPath .githooks
	$(call ok,Git hooks are on: .githooks/pre-commit and .githooks/commit-msg)

# Stops when Node.js is older than NODE_MIN
node-version:
	major=$$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0); \
	if [ "$$major" -lt "$(NODE_MIN)" ]; then $(call fail,Node.js $(NODE_MIN) or newer is required (found $$(node -v 2>/dev/null || echo none))); fi

doctor: ## 🩺 Check Node, npm, Docker and the env file
	$(call step,Checking the tools)
	printf "  %-10s %s\n" "Node.js" "$$(node -v 2>/dev/null || echo missing)" "npm" "$$(npm -v 2>/dev/null || echo missing)" "Docker" "$$(docker --version 2>/dev/null | cut -d, -f1 | sed 's/Docker version //' || echo missing)"
	$(MAKE) --no-print-directory node-version && $(call ok,Node.js $(NODE_MIN)+ found)
	[ -d node_modules ] && $(call ok,Dependencies installed) || $(call warn,Dependencies missing: run make install)
	$(call ok,Tasks needs no API keys: everything runs in the browser)

##@ 🛠️  [DEV] Development: on this machine or in Docker with hot reload

dev: node-version ## 🚀 [DEV] Start the dev server on PORT (5173) with hot reload
	npx vite --port $(PORT)

open: ## 🌐 [DEV] Open the dev server in the browser
	$(opener) http://localhost:$(PORT)$(BASE)

screenshots: ## 📸 [DEV] Retake the README pictures from the preview (make build preview)
	node scripts/screenshots.mjs http://localhost:$(PREVIEW_PORT)/

flags: ## 🏳️  [DEV] Copy the language flags into public/
	npm run flags

dev-up: ## 🐳 [DEV] Start the development container with hot reload on port 5173
	$(MAKE) --no-print-directory up ENV=development

dev-down: ## 🛑 [DEV] Stop the development container
	$(MAKE) --no-print-directory down ENV=development

dev-restart: ## 🔄 [DEV] Rebuild and restart the development container
	$(MAKE) --no-print-directory restart ENV=development

dev-logs: ## 📜 [DEV] Follow the logs of the development container
	$(MAKE) --no-print-directory logs ENV=development

dev-ps: ## 📋 [DEV] Show the state and health of the development container
	$(MAKE) --no-print-directory ps ENV=development

dev-shell: ## 🐚 [DEV] Open a shell in the development container
	$(MAKE) --no-print-directory shell ENV=development

dev-open: ## 🌐 [DEV] Open the development container in the browser
	$(MAKE) --no-print-directory open-env ENV=development

dev-clean: ## 🧹 [DEV] Remove the development containers, volumes and image
	$(MAKE) --no-print-directory docker-clean ENV=development

##@ ✅ Quality: the same checks for every environment

lint: ## 🔍 Lint the code with Oxlint
	npm run lint

fix: ## 🪄 Fix lint findings and format everything
	npm run lint:fix
	npm run format
	$(call ok,Fixed and formatted)

format: ## 🎨 Format the code with Oxfmt
	npm run format

typecheck: ## 🧠 Check the types
	npm run typecheck

test: ## 🧪 Run the unit tests once
	npm run test:run

test-watch: ## 👀 Run the unit tests on every change
	npm test

coverage: ## 📊 Run the unit tests with coverage
	npm run test:coverage

e2e: ## 🎭 Run the end-to-end tests with axe and Lighthouse
	npm run test:e2e

e2e-ui: ## 🖱️  Open the end-to-end tests in the Playwright UI
	npx playwright test --ui

e2e-chromium: ## 🎭 Run the end-to-end tests in Chromium with Lighthouse, like CI
	npx playwright test --project=lighthouse

e2e-webkit: ## 🧭 Run the end-to-end tests in WebKit, like CI
	npx playwright test --project=webkit

check: ## ✅ Lint, the dash check, format check, types and unit tests
	$(call step,Checking everything)
	npm run check
	$(call ok,All checks passed)

ci: node-version ## 🚦 What CI runs: signatures, changelog, checks, coverage, build and e2e
	$(call step,Checking the registry signatures and the changelog)
	npm audit signatures
	node scripts/release-notes.mjs > /dev/null
	$(call step,Checks and coverage)
	npm run lint
	npm run lint:text
	npm run format:check
	npm run typecheck
	npm run test:coverage
	$(MAKE) --no-print-directory build
	$(call step,End-to-end tests)
	E2E_PREBUILT=true npm run test:e2e
	$(call ok,CI passed)

##@ 🧪 [STAGE] Staging: the production build in Docker, hidden from search engines

stage-up: ## 🐳 [STAGE] Build and start the staging container in the background on port 8081
	$(MAKE) --no-print-directory up ENV=staging

stage-down: ## 🛑 [STAGE] Stop the staging container
	$(MAKE) --no-print-directory down ENV=staging

stage-restart: ## 🔄 [STAGE] Rebuild and restart the staging container
	$(MAKE) --no-print-directory restart ENV=staging

stage-logs: ## 📜 [STAGE] Follow the logs of the staging container
	$(MAKE) --no-print-directory logs ENV=staging

stage-ps: ## 📋 [STAGE] Show the state and health of the staging container
	$(MAKE) --no-print-directory ps ENV=staging

stage-shell: ## 🐚 [STAGE] Open a shell in the staging container
	$(MAKE) --no-print-directory shell ENV=staging

stage-open: ## 🌐 [STAGE] Open the staging container in the browser
	$(MAKE) --no-print-directory open-env ENV=staging

stage-clean: ## 🧹 [STAGE] Remove the staging containers, volumes and image
	$(MAKE) --no-print-directory docker-clean ENV=staging

##@ 🚀 [PROD] Production

build: node-version ## 🏗️  [PROD] Type-check, build into dist/ and check the output
	$(call step,Building)
	npm run build
	node scripts/build-report.mjs

preview: ## 👀 [PROD] Serve the production build on port 4173
	npx vite preview --port $(PREVIEW_PORT)

live: ## 📡 [PROD] Check the live site like the hourly monitor
	node scripts/check-live.mjs

live-lighthouse: ## 🚦 [PROD] Run Lighthouse on the live site like the weekly monitor
	node scripts/lighthouse-live.mjs

prod-up: ## 🐳 [PROD] Build and start the production container in the background on port 8080
	$(MAKE) --no-print-directory up ENV=production

prod-down: ## 🛑 [PROD] Stop the production container (asks first)
	$(MAKE) --no-print-directory down ENV=production

prod-restart: ## 🔄 [PROD] Rebuild and restart the production container (asks first)
	$(MAKE) --no-print-directory restart ENV=production

prod-logs: ## 📜 [PROD] Follow the logs of the production container
	$(MAKE) --no-print-directory logs ENV=production

prod-ps: ## 📋 [PROD] Show the state and health of the production container
	$(MAKE) --no-print-directory ps ENV=production

prod-shell: ## 🐚 [PROD] Open a shell in the production container
	$(MAKE) --no-print-directory shell ENV=production

prod-open: ## 🌐 [PROD] Open the production container in the browser
	$(MAKE) --no-print-directory open-env ENV=production

prod-clean: ## 🧹 [PROD] Remove the production containers, volumes and image (asks first)
	$(MAKE) --no-print-directory docker-clean ENV=production

##@ 🐳 Docker for any ENV (ENV=development, staging or production)

# Stops when ENV is not one of ENVS
env-guard:
	$(if $(filter $(ENV),$(ENVS)),,$(call fail,ENV must be one of: $(ENVS)))

# Creates .env on the first start; it only sets the Docker ports
docker-env:
	[ -f .env ] || { cp .env.example .env && $(call ok,Created .env from .env.example: it only sets Docker ports); }

# Asks before changing production; YES=1 answers for scripts
confirm:
	if [ "$(ENV)" = production ] && [ "$(YES)" != 1 ]; then \
	  read -r -p "⚠️  This changes production. Type yes to continue: " answer; \
	  [ "$$answer" = yes ] || $(call fail,Cancelled); \
	fi

up: env-guard docker-env ## 🐳 Start ENV: development with hot reload, others in the background
	if [ "$(ENV)" = development ]; then \
	  $(call step,Starting $(ENV) with hot reload); $(COMPOSE) up --build --watch; \
	else \
	  $(call step,Starting $(ENV) in the background); $(COMPOSE) up --build -d && $(call ok,$(ENV) is running: make logs ENV=$(ENV)); \
	fi

down: env-guard confirm ## 🛑 Stop ENV and remove its containers
	$(COMPOSE) down
	$(call ok,$(ENV) stopped)

restart: env-guard confirm docker-env ## 🔄 Rebuild and restart ENV
	$(COMPOSE) down
	$(MAKE) --no-print-directory up ENV=$(ENV)

logs: env-guard ## 📜 Follow the logs of ENV
	$(COMPOSE) logs -f --tail=100

ps: env-guard ## 📋 Show the containers of ENV and their health
	$(COMPOSE) ps

shell: env-guard ## 🐚 Open a shell in the running ENV container
	$(COMPOSE) exec app sh

open-env: env-guard ## 🌐 Open the running ENV in the browser
	address=$$($(COMPOSE) port app $(CONTAINER_PORT) 2>/dev/null | head -n 1 | sed 's/^0\.0\.0\.0/localhost/'); \
	if [ -z "$$address" ]; then $(call fail,$(ENV) is not running: start it with make up ENV=$(ENV)); fi; \
	$(opener) "http://$$address$(BASE)"

build-image: env-guard docker-env ## 🏗️  Build the image of ENV without starting it
	$(call step,Building tasks:$(ENV))
	$(COMPOSE) build
	$(call ok,Image tasks:$(ENV) built)

config: env-guard docker-env ## 🧾 Print the merged Compose configuration of ENV
	$(COMPOSE) config

docker-clean: env-guard confirm ## 🧹 Remove the containers, volumes and images of ENV
	$(COMPOSE) down --rmi local --volumes --remove-orphans
	$(call ok,$(ENV) cleaned up)

status: ## 🚦 Show which environments are running
	for env in $(ENVS); do \
	  printf "\n$(B)%s$(X)\n" "$$env"; \
	  docker compose -f compose.yaml -f docker/$$env.yaml ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || $(call warn,Docker is not running); \
	done

##@ 📦 Maintenance

outdated: ## 📦 List outdated packages
	npm outdated || true

audit: ## 🛡️  Check the dependencies for known vulnerabilities
	npm audit

shared: ## 🔗 Compare the files shared with ../tasks, ../weather and ../faceit-stats
	node scripts/check-shared.mjs

shared-sync: ## 🔁 Copy the shared files of this app over the other two
	node scripts/check-shared.mjs --sync

clean: ## 🧹 Remove build output, caches and reports
	rm -rf dist coverage test-results playwright-report blob-report lighthouse-live node_modules/.vite tsconfig.tsbuildinfo
	$(call ok,Cleaned)

reset: clean ## ♻️  Clean, then reinstall the dependencies from scratch
	rm -rf node_modules
	$(MAKE) --no-print-directory install

info: ## ℹ️  Show the versions of the app and the tools
	printf "  %-12s %s\n" "Tasks" "$$(node -p "require('./package.json').version")" "Node.js" "$$(node -v)" "npm" "$$(npm -v)" "Docker" "$$(docker --version 2>/dev/null | cut -d, -f1 | sed 's/Docker version //' || echo missing)"

.PHONY: help setup install env browsers hooks node-version doctor dev open screenshots flags dev-up dev-down dev-restart dev-logs dev-ps dev-shell dev-open dev-clean lint fix format typecheck test test-watch coverage e2e e2e-ui e2e-chromium e2e-webkit check ci stage-up stage-down stage-restart stage-logs stage-ps stage-shell stage-open stage-clean build preview live live-lighthouse prod-up prod-down prod-restart prod-logs prod-ps prod-shell prod-open prod-clean env-guard docker-env confirm up down restart logs ps shell open-env build-image config docker-clean status outdated audit shared shared-sync clean reset info
