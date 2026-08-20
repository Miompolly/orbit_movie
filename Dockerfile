FROM node:20-alpine AS frontend-build
ARG GEMINI_API_KEY=
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json ./
COPY App.tsx index.tsx types.ts ./
COPY components/ components/
COPY pages/ pages/
COPY services/ services/
COPY public/ public/
RUN GEMINI_API_KEY=${GEMINI_API_KEY} npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=frontend-build /app/dist ../dist
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node", "server.js"]
