FROM node:20-alpine

WORKDIR /app

RUN npm install turbo@latest -g

COPY . .

# FOR PRODUCTION SERVER:
# If there is a docker secret under the name: NODE_ENV
RUN --mount=type=secret,id=DB_HOST \
    --mount=type=secret,id=DB_USER \
    --mount=type=secret,id=DB_PASSWORD \
    --mount=type=secret,id=DB_NAME \
    if [ -f /run/secrets/DB_HOST ]; then \
        echo "DB_HOST=$(cat /run/secrets/DB_HOST)" >> ./backend/.env; \
    fi && \
    if [ -f /run/secrets/DB_USER ]; then \
        echo "DB_USER=$(cat /run/secrets/DB_USER)" >> ./backend/.env; \
    fi && \
    if [ -f /run/secrets/DB_PASSWORD ]; then \
        echo "DB_PASSWORD=$(cat /run/secrets/DB_PASSWORD)" >> ./backend/.env; \
    fi && \
    if [ -f /run/secrets/DB_NAME ]; then \
        echo "DB_NAME=$(cat /run/secrets/DB_NAME)" >> ./backend/.env; \
    fi && \
    echo "PORT=3000" >> ./backend/.env


RUN npm install

RUN turbo run build --filter=frontend  # only builds frontend at build time

EXPOSE 3000

CMD ["npm", "run", "dev"] 