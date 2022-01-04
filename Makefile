ECR_BASE := 036958288468.dkr.ecr.us-east-2.amazonaws.com/turntable/discord-bot

build:
	npm run build && node-lambda zip -n bot -A .

build-image:
	docker build -t ${ECR_BASE}:latest -f Dockerfile .	

start-test-container:
	docker-compose -f docker-compose.test-image.yaml up

push-image:
	aws ecr get-login-password | docker login --username AWS --password-stdin ${ECR_BASE}	
	docker push ${ECR_BASE}:latest
