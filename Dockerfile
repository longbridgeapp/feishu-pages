FROM node:latest

RUN yarn config set prefix /root/.yarn && \
  yarn global add feishu-pages --prefix /usr/local

ENTRYPOINT ["/usr/local/bin/feishu-pages"]