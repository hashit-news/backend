FROM node:17-alpine as builder

ENV NODE_ENV=build

USER node
WORKDIR /home/node
COPY ["package.json", "yarn.lock", "./"]
RUN yarn

COPY --chown=node:node . .
RUN yarn build

FROM node:17-alpine
USER node
WORKDIR /home/node

ENV NODE_ENV=production

COPY --from=builder --chown=node:node /home/node/package*.json ./
COPY --from=builder --chown=node:node /home/node/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /home/node/dist/ ./dist/

EXPOSE 8080

CMD ["yarn", "start:prod"]
