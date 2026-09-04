FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV APP_ENV=production
ENV PORT=3001

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3001

CMD ["node", "src/app.js"]