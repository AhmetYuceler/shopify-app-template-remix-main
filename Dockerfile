# Cache buster: 2025-11-10-07:20
FROM node:18-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app


COPY package.json package-lock.json* ./

# Install all dependencies first (including devDependencies for build)
RUN npm ci 2>/dev/null || npm install
RUN npm cache clean --force

COPY . .

# Generate Prisma Client and run migrations
RUN npx prisma generate
RUN npx prisma migrate deploy

# Build the app
RUN npm run build

# Remove devDependencies and CLI packages after build
RUN npm prune --production
RUN npm remove @shopify/cli || true

CMD ["npm", "run", "start"]
