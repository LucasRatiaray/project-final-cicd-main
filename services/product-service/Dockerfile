FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV APP_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3000

CMD ["node", "src/app.js"]