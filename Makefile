# Disable echoing of commands
MAKEFLAGS += --silent

# Add build-time variables
PREFIX := $(shell go list ./version)
VERSION := v0.1.0
COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null)
GO_VERSION := $(shell go version)
COMPILE_TIME := $(shell LC_ALL=en_US date)

BUILD_VARIABLES := -X "$(PREFIX).Version=$(VERSION)" -X "$(PREFIX).Commit=$(COMMIT)" -X "$(PREFIX).GoVersion=$(GO_VERSION)" -X "$(PREFIX).CompileTime=$(COMPILE_TIME)"
BUILD_FLAGS := -ldflags '$(BUILD_VARIABLES)'

# Resources used in the frontend
frontend_resources := $(shell find frontend/include -type f)
frontend_target_resources := $(addprefix build/,$(frontend_resources))

# Configure build output
binary = pewview
build = GOOS=$(1) GOARCH=$(2) go build $(BUILD_FLAGS) -o build/$(binary)$(3) ./cmd/pewview/pewview.go
tar = cd build && tar -czf $(1)_$(2).tar.gz $(binary)$(3) && rm $(binary)$(3)
zip = cd build && zip $(1)_$(2).zip $(binary)$(3) && rm $(binary)$(3)

.PHONY: build frontend dev watch format lint clean

# Build for the native platform
build: frontend build/pewview

# Run a development server for the frontend
dev: frontend
	python3 -m http.server --directory ./build/frontend 8080

# Watch the frontend for changes and automatically rebuild it
watch-frontend:
	while true; do \
	$(MAKE) frontend; \
	which inotifywait && inotifywait -qre close_write .; \
	which fswatch && fswatch -1 .; \
	sleep 1; \
	done

# Format Go code
format: $(source) Makefile
	gofmt -l -s -w .

# Lint Go code
lint: $(source) Makefile
	golint .

# Build for the native platform. For cross-platform builds, see "package" below
build/pewview: $(source) Makefile
	go build $(BUILD_FLAGS) -o $@ cmd/pewview/pewview.go

# Build the frontend
frontend: ./build/frontend/index.html ./build/frontend/script.js ./build/frontend/style.css $(frontend_target_resources)

# Copy the frontend's static resources and include the hash in the filename
$(frontend_target_resources): build/%: %
	mkdir -p "$$(dirname "$@")"
	cp "$<" "$@"
	./scripts/hash-filename.sh "$@" ./build/frontend/index.html ./build/frontend/script.js

# Copy frontend source
./build/frontend/index.html: ./frontend/index.html
	mkdir -p ./build/frontend
	cp ./frontend/index.html ./build/frontend/
./build/frontend/script.js: ./frontend/script.js
	mkdir -p ./build/frontend
	cp ./frontend/script.js ./build/frontend/
./build/frontend/style.css: ./frontend/style.css
	mkdir -p ./build/frontend
	cp ./frontend/style.css ./build/frontend/

# Build for Linux
linux: build/linux_arm.tar.gz build/linux_arm64.tar.gz build/linux_386.tar.gz build/linux_amd64.tar.gz
build/linux_386.tar.gz: $(sources)
	$(call build,linux,386,)
	$(call tar,linux,386)
build/linux_amd64.tar.gz: $(sources)
	$(call build,linux,amd64,)
	$(call tar,linux,amd64)
build/linux_arm.tar.gz: $(sources)
	$(call build,linux,arm,)
	$(call tar,linux,arm)
build/linux_arm64.tar.gz: $(sources)
	$(call build,linux,arm64,)
	$(call tar,linux,arm64)

# Build for Windows
windows: build/windows_386.zip build/windows_amd64.zip
build/windows_386.zip: $(sources)
	$(call build,windows,386,.exe)
	$(call zip,windows,386,.exe)
build/windows_amd64.zip: $(sources)
	$(call build,windows,amd64,.exe)
	$(call zip,windows,amd64,.exe)

# Build for macOS
darwin: build/darwin_amd64.tar.gz
build/darwin_amd64.tar.gz: $(sources)
	$(call build,darwin,amd64,)
	$(call tar,darwin,amd64)

# Clean all dynamically created files
clean:
	rm -rf ./build &> /dev/null || true
