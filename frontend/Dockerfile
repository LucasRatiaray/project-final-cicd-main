FROM node:20-alpine

WORKDIR /app

ENV PORT=8080

COPY package.json ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV APP_ENV=production

EXPOSE 8080

CMD ["node", "server.cjs"]