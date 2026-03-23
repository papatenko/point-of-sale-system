FROM node:20-alpine
WORKDIR /app
RUN npm install turbo@latest -g
COPY . .
RUN npm install
EXPOSE 3000
CMD ["turbo", "run", "start", "--filter=backend"]