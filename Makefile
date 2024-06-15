HUGO_BIN=hugo

.PHONY: build demo release

build:
	$(HUGO_BIN) --themesDir=themes --source=.

demo:
	$(HUGO_BIN) server -D --themesDir=themes --source=.

release: build
	rm -rf ./resources && cp -r ./website/resources ./resources
