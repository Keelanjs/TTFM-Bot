build:
	npm run build && node-lambda zip -n bot -A .

build-test-image:
	docker build -t bot:test -f Dockerfile .	