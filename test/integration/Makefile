.PHONY: help images test

.DEFAULT_GOAL:=help

include .env

SERVICE ?=
PORT ?= 9000

up: ## Starts the Docker Compose environment with several services and Microservice Graph Explorer at http://localhost:9000.
	@echo "Starting Healthcheck spike..."
	./start.sh
	open "http://localhost:9000/#/status/http/demo-app:3000"

down: ## Tears down the test Docker Compose environment.
	@echo "Stopping Healthcheck spike..."
	docker-compose down --rmi local

start: ## Starts a particular service.
	@echo "Starting service $(SERVICE)..."
	docker-compose start $(SERVICE)

stop: ## Stops a particular service.
	@echo "Stoping service $(SERVICE)..."
	docker-compose stop $(SERVICE)

logs: ## Opens the environment logs.
	@echo "Starting logs $(SERVICE)..."
	docker-compose logs -f $(SERVICE)

help: ## Prints the help about targets.
	@printf "Usage:             make [\033[34mtarget\033[0m]\n"
	@printf "Default:           \033[34m%s\033[0m\n" $(.DEFAULT_GOAL)
	@printf "Targets:\n"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf " \033[34m%-17s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort
