build:
	npm run build && node-lambda zip -n bot -A .

build-test-image:
	docker build -t bot:test -f Dockerfile .	

start-test-container:
	docker-compose -f docker-compose.test-image.yaml up