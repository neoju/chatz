.PHONY: dev migrate seed dev-docker prod-build prod-up prod-down

dev:
	pnpm dev

dev-docker:
	docker compose -f docker-compose.dev.yml up --build

migrate:
	@echo "[migrate] No migrations defined yet (Phase 2 will add MongoDB schemas)."

seed:
	@echo "[seed] No seed data defined yet (Phase 2 will add seed scripts)."

prod-build:
	docker compose build

prod-up:
	docker compose up -d

prod-down:
	docker compose down
