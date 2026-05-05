.PHONY: dev migrate seed dev-docker prod-build prod-up prod-down db-up db-down

dev:
	pnpm dev

dev-docker:
	docker compose -f docker-compose.dev.yml up --build

db-up:
	docker compose -f docker-compose.dev.yml up -d redis mongo

db-down:
	docker compose -f docker-compose.dev.yml down redis mongo

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
