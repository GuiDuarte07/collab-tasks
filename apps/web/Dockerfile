# Turborepo-optimized Dockerfile for React/Vite frontend
FROM node:20-alpine AS base

# Install pnpm and turbo
RUN npm install -g pnpm@latest turbo@latest

# Set working directory
WORKDIR /app

# Copy package files from root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy all source code
COPY . .

# Install all dependencies
ENV CI=true
RUN pnpm install --no-frozen-lockfile

# Build shared types first using Turbo
RUN turbo run build:types

# Development stage
FROM base AS development
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=development
# Use Turbo to run the specific service
CMD ["turbo", "run", "dev", "--filter=web"]

# Production stage
FROM base AS production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Build the web app using Turbo
RUN turbo run build --filter=web

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# For production, we'll serve the built files using a simple HTTP server
# Install serve to serve static files
RUN npm install -g serve

# Serve the built files
CMD ["serve", "-s", "apps/web/dist", "-l", "3000"]
