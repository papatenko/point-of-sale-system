FROM node:20-alpine
WORKDIR /app
# copy package files first - Docker caches this layer
# only reruns npm install if package.json changes
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install turbo@latest -g && npm ci --omit=dev
# copy source code - changes here don't invalidate npm install cache
COPY . .
RUN turbo run build --filter=frontend
RUN rm -rf frontend/node_modules
EXPOSE 3000
CMD ["turbo", "run", "start", "--filter=backend"]