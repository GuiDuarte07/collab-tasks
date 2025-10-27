# -------------------------------------
# 1️⃣ Base image (com Node + corepack habilitado)
# -------------------------------------
FROM node:20-alpine AS base

# Definimos diretórios padrão do PNPM e PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# -------------------------------------
# 2️⃣ Dependência do Turbo (para podar dependências)
# -------------------------------------
FROM base AS pruner
RUN apk add --no-cache libc6-compat
RUN pnpm add -g turbo

COPY . .
RUN turbo prune --scope=api-gateway --docker

# -------------------------------------
# 3️⃣ Instalador (instala dependências apenas do app e seus deps)
# -------------------------------------
FROM base AS installer
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiamos apenas o que é necessário para instalar deps
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/full/ ./

# Instala apenas as dependências necessárias (cache eficiente)
RUN pnpm install --frozen-lockfile --ignore-scripts --prod

WORKDIR /app/apps/api-gateway
RUN pnpm install --frozen-lockfile --ignore-scripts --prod

# -------------------------------------
# 4️⃣ Builder (build da aplicação Nest)
# -------------------------------------
FROM base AS builder
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=installer /app ./
COPY --from=pruner /app/out/full/ ./

# Compila a aplicação (usa o turbo build do monorepo)
RUN pnpm turbo run build --filter=api-gateway...

# -------------------------------------
# 5️⃣ Runner (imagem final e leve)
# -------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Copiamos apenas o necessário para runtime
COPY --from=builder /app/apps/api-gateway/dist ./dist
COPY --from=builder /app/apps/api-gateway/package.json ./

COPY --from=installer /app/node_modules ./node_modules

# Segurança: evita que o app rode como root
USER node

EXPOSE 3001

# Define o comando final de execução
CMD ["node", "dist/main.js"]
