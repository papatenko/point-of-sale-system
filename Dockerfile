FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install turbo@latest -g && \
    npm i --omit=dev && \
    turbo run build --filter=frontend && \
    npm cache clean --force && \
    rm -rf /root/.npm
EXPOSE 3000
CMD ["turbo", "run", "start", "--filter=backend"]