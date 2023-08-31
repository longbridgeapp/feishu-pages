FROM node:latest

RUN yarn config set prefix /root/.yarn && \
  yarn global add feishu-pages

ENTRYPOINT ["yarn", "feishu-pages"]