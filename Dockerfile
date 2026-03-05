FROM node:18-alpine AS base
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app

FROM base AS prepare
RUN npm install turbo@latest -g

FROM prepare AS build
COPY . .
RUN turbo prune --scope=backend --scope=frontend --docker

FROM base AS final
WORKDIR /app
RUN npm install turbo@latest -g
COPY --from=build /app/out/json/ .
COPY --from=build /app/out/yarn.lock ./yarn.lock
RUN yarn install