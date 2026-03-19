FROM node:20-alpine

WORKDIR /app

RUN npm install turbo@latest -g

COPY . .

RUN npm install

RUN turbo run build --filter=frontend  # only builds frontend at build time

EXPOSE 3000

CMD ["turbo", "run", "dev", "--filter=backend"]