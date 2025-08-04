.PHONY: build dev clean

SRC_FILES := $(shell find src -type f)
SCRIPTS := $(wildcard scripts/*.sh)
BUILD_STAMP := dist/.build-stamp
FIREFOX := extension-firefox.xpi
CHROME := extension-chrome.zip

build: $(CHROME) $(FIREFOX)

$(CHROME): $(BUILD_STAMP)
	zip -r -FS $@ dist/

$(FIREFOX): $(BUILD_STAMP)
	cd dist && zip -r -FS ../$@ *

$(BUILD_STAMP): $(SRC_FILES) $(SCRIPTS) package.json pnpm-lock.yaml
	sh ./scripts/build.sh
	touch $@

dev: $(CHROME) $(FIREFOX)
	sh ./scripts/dev.sh

clean:
	rm -rf dist $(CHROME) $(FIREFOX) $(BUILD_STAMP)
