# Disable echoing of commands
MAKEFLAGS += --silent

frontend_resources := $(shell find frontend/include -type f)

frontend_target_resources := $(addprefix build/,$(frontend_resources))

build: frontend

dev: frontend
	python3 -m http.server --directory ./build/frontend 8080

watch:
	while true; do \
	$(MAKE) frontend; \
	which inotifywait && inotifywait -qre close_write .; \
	which fswatch && fswatch -1 .; \
	sleep 1; \
	done

frontend: ./build/frontend/index.html ./build/frontend/script.js ./build/frontend/style.css $(frontend_target_resources)

$(frontend_target_resources): build/%: %
	mkdir -p "$$(dirname "$@")"
	cp "$<" "$@"
	./scripts/hash-filename.sh "$@" ./build/frontend/index.html ./build/frontend/script.js

./build/frontend/index.html: ./frontend/index.html
	mkdir -p ./build/frontend
	cp ./frontend/index.html ./build/frontend/

./build/frontend/script.js: ./frontend/script.js
	mkdir -p ./build/frontend
	cp ./frontend/script.js ./build/frontend/

./build/frontend/style.css: ./frontend/style.css
	mkdir -p ./build/frontend
	cp ./frontend/style.css ./build/frontend/

clean:
	rm -rf ./build &> /dev/null || true
