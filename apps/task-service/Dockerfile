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
RUN turbo prune --scope=task-service --docker

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

# Compila a aplicação diretamente no diretório do serviço
WORKDIR /app/apps/task-service
RUN pnpm run build && ls -la dist/

# -------------------------------------
# 5 - Runner (imagem final e leve)
# -------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Copia estrutura do monorepo necessária
COPY --from=installer /app/package.json ./package.json
COPY --from=installer /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages ./packages

# Copia o app compilado
COPY --from=builder /app/apps/task-service/dist ./apps/task-service/dist
COPY --from=builder /app/apps/task-service/package.json ./apps/task-service/package.json

COPY --from=installer /app/apps/task-service/node_modules ./apps/task-service/node_modules

# Segurança: evita que o app rode como root
USER node

EXPOSE 3002

WORKDIR /app/apps/task-service
CMD ["node", "dist/src/main.js"]
