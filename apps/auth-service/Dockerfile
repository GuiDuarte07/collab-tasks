# -------------------------------------
# 1 - Base image (com Node + corepack habilitado)
# -------------------------------------
FROM node:20-alpine AS base

# Definimos diretórios padrão do PNPM e PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# -------------------------------------
# 2 -  Dependência do Turbo (para podar dependências)
# -------------------------------------
FROM base AS pruner
RUN apk add --no-cache libc6-compat
RUN pnpm add -g turbo

COPY . .
RUN turbo prune --scope=auth-service --docker

# -------------------------------------
# 3 - Instalador (instala dependências apenas do app e seus deps)
# -------------------------------------
FROM base AS installer
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copia apenas o que é necessário para instalar deps
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/full/ ./

# Instala dependências necessárias
RUN pnpm install --frozen-lockfile --ignore-scripts

# -------------------------------------
# 4 - Builder (build da aplicação Nest)
# -------------------------------------
FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN pnpm add -g turbo

WORKDIR /app

COPY --from=installer /app ./
COPY --from=pruner /app/out/full/ ./

# Compila a aplicação (usa o turbo build do monorepo)
RUN pnpm turbo run build --filter=auth-service

# -------------------------------------
# 5 - Runner (imagem final e leve)
# -------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Copia apenas o necessário para runtime
COPY --from=builder /app/apps/auth-service/dist ./dist
COPY --from=builder /app/apps/auth-service/package.json ./

COPY --from=installer /app/node_modules ./node_modules

# Segurança: evita que o app rode como root
USER node

EXPOSE 3002

# Define o comando final de execução
CMD ["node", "dist/main.js"]
