FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV APP_ENV=production
ENV PORT=3002

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3002

CMD ["node", "src/app.js"]