FROM node:16.6.0
ARG bundle=bot.zip
RUN apt-get update \
  && apt-get install -y curl jq unzip \
  && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
  && unzip -q awscliv2.zip \ 
  && ./aws/install \
  && apt-get clean
    
ADD ${bundle} /tmp
RUN mkdir -p /app
WORKDIR /app
ADD entrypoint.sh /app
RUN unzip -q /tmp/${bundle}
ENTRYPOINT [ "/app/entrypoint.sh" ]