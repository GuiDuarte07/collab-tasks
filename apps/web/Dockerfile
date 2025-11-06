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
# 2 - Dependência do Turbo (para podar dependências)
# -------------------------------------
FROM base AS pruner
RUN apk add --no-cache libc6-compat
RUN pnpm add -g turbo

COPY . .
RUN turbo prune --scope=web --docker

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
# 4 - Builder (build da aplicação Vite + React)
# -------------------------------------
FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN pnpm add -g turbo

WORKDIR /app

COPY --from=installer /app ./
COPY --from=pruner /app/out/full/ ./

# Build da aplicação web (gera arquivos estáticos)
RUN pnpm turbo run build --filter=web

# -------------------------------------
# 5 - Runner (nginx para servir arquivos estáticos)
# -------------------------------------
FROM node:20-alpine AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copia node_modules (inclui vite para preview) e workspace metadata
COPY --from=installer /app/pnpm-workspace.yaml ./
COPY --from=installer /app/package.json ./
COPY --from=installer /app/pnpm-lock.yaml ./
COPY --from=installer /app/node_modules ./node_modules
# Também precisamos do node_modules específico do pacote web (para binários como vite)
COPY --from=installer /app/apps/web/node_modules ./apps/web/node_modules
# Não precisamos dos pacotes fonte (packages/*) no estágio de preview,
# pois o build já gerou artefatos em dist. Removido COPY dos packages.

# Copia o app e o build estático
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

WORKDIR /app/apps/web

# Servir via vite preview na porta 3000
EXPOSE 3000

CMD ["pnpm", "run", "preview", "--host", "0.0.0.0", "--port", "3000"]

