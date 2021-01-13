# Disable echoing of commands
MAKEFLAGS += --silent

# Add build-time variables
PREFIX := $(shell go list ./version)
VERSION := v0.1.0
COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null)
GO_VERSION := $(shell go version)
COMPILE_TIME := $(shell LC_ALL=en_US date)

# Supported browsers
BROWSERLIST := chrome87,firefox84,safari14,edge86

BUILD_VARIABLES := -X "$(PREFIX).Version=$(VERSION)" -X "$(PREFIX).Commit=$(COMMIT)" -X "$(PREFIX).GoVersion=$(GO_VERSION)" -X "$(PREFIX).CompileTime=$(COMPILE_TIME)"
BUILD_FLAGS := -ldflags '$(BUILD_VARIABLES)'

# Configure build output
binary = pewview
build = GOOS=$(1) GOARCH=$(2) go build $(BUILD_FLAGS) -o build/$(binary)$(3) ./cmd/pewview/pewview.go
tar = cd build && tar -czf $(1)_$(2).tar.gz $(binary)$(3) && rm $(binary)$(3)
zip = cd build && zip $(1)_$(2).zip $(binary)$(3) && rm $(binary)$(3)

source := $(shell find . -type f -name '*.go')

.PHONY: help build package frontend server dev generate-traffic windows darwin linux watch format lint clean

# Produce a short description of available make commands
help:
	pcregrep -Mo '^(#.*\n)+^[^# ]+:' Makefile | sed "s/^\([^# ]\+\):/> \1/g" | sed "s/^#\s\+\(.\+\)/\1/g" | GREP_COLORS='ms=1;34' grep -E --color=always '^>.*|$$' | GREP_COLORS='ms=1;37' grep -E --color=always '^[^>].*|$$'

# Build for the native platform
build: frontend build/pewview

# Package for all platforms
package: ./build/frontend.zip windows darwin linux

# Run a development server for the frontend
dev: frontend
	python3 -m http.server --directory ./build/frontend 8080

# Generate NetFlow v5 traffic using nflow-generator
# To install:
# go get github.com/Sirupsen/logrus
# go get github.com/jessevdk/go-flags
# go get github.com/nerdalert/nflow-generator
generate-traffic:
	nflow-generator -t 127.0.0.1 -p 2056

# Watch the frontend for changes and automatically rebuild it
watch-frontend:
	while true; do \
	$(MAKE) frontend; \
	which inotifywait && inotifywait -qre close_write ./frontend; \
	which fswatch && fswatch -1 ./frontend; \
	sleep 1; \
	done

# Format Go code
format: $(source) Makefile
	gofmt -l -s -w .

# Lint Go code
lint: $(source) Makefile
	golint .

# Build the server
server: build/pewview

# Build for the native platform. For cross-platform builds, see "package" below
build/pewview: $(source) Makefile
	go build $(BUILD_FLAGS) -o $@ cmd/pewview/pewview.go

# Build the frontend
frontend: ./frontend/index.html ./frontend/index.css ./build/frontend/index.min.js $(frontend_target_resources)
	rm -rf ./build/frontend/static &> /dev/null || true
	cp -r ./frontend/static ./build/frontend
	cp ./frontend/index.html ./build/frontend/
	cp ./frontend/index.css ./build/frontend/

./build/frontend.zip: frontend
	zip ./build/frontend.zip -r ./build/frontend

./build/frontend/index.min.js: $(wildcard ./frontend/*.js) $(wildcard ./frontend/rendering/*.js) $(wildcard ./frontend/include/*.js)
	mkdir -p ./build/frontend
	# Build minified distribution with no debugging
	npx esbuild ./frontend/main.js --bundle --outfile=./build/frontend/index.min.js --external:fs --external:path --minify --sourcemap --target=$(BROWSERLIST) --define:process.env.NODE_ENV=\"production\"

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
