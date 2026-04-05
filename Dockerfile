# --- Build frontend ---
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Build backend ---
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# --- Final image ---
FROM node:18-alpine
WORKDIR /app

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/package*.json ./
COPY --from=frontend-build /app/frontend/dist ./public

RUN npm install --omit=dev

ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/server.js"]
