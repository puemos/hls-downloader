.PHONY: install build dev clean storybook

install:
	pnpm install

build:
	sh ./scripts/build.sh

dev:
	sh ./scripts/dev.sh

clean:
	sh ./scripts/clean.sh

storybook:
	sh ./scripts/storybook.sh
