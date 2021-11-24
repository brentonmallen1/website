HUGO_BIN=hugo

.PHONY: build demo release

build:
	$(HUGO_BIN) --themesDir=../.. --source=brentonmallen

demo:
	$(HUGO_BIN) server -D --themesDir=../.. --source=brentonmallen

release: build
	rm -rf ./resources && cp -r ./brentonmallen/resources ./resources
