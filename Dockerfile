FROM node:latest

RUN apt install imagemagick
RUN yarn config set prefix /root/.yarn && \
    yarn global add feishu-pages --prefix /usr/local
ADD ./entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
