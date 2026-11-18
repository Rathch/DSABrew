SHELL := /bin/bash

APP_IMAGE_REPO ?= ghcr.io/rathch/dsabrew
WEB_IMAGE_REPO ?= ghcr.io/rathch/dsabrew-web
DEPLOY_SSH ?= server_np
DEPLOY_DIR ?= /opt/apps/dsabrew

export APP_IMAGE_REPO WEB_IMAGE_REPO DEPLOY_SSH DEPLOY_DIR

.PHONY: help build push deploy remote

help:
	@echo "Verfuegbare Targets:"
	@echo "  make build    # API- und Web-Image lokal bauen"
	@echo "  make push     # Images bauen und nach GHCR pushen"
	@echo "  make deploy   # bauen, pushen, Compose kopieren, Server pull + recreate"
	@echo "  make remote   # nur Server: pull und recreate (Images liegen schon auf GHCR)"
	@echo "  DEPLOY_SSH=$(DEPLOY_SSH)  DEPLOY_DIR=$(DEPLOY_DIR)"

build:
	./deploy/deploy.sh --build-only

push:
	./deploy/deploy.sh --push

deploy:
	./deploy/deploy.sh

remote:
	./deploy/deploy.sh --remote-only
