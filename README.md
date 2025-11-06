# 🌿 Jungle Gaming — Desafio Full-stack Júnior  
**Sistema de Gestão de Tarefas Colaborativo**

---

## 🧭 Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura & Estrutura do Monorepo](#arquitetura--estrutura-do-monorepo)
3. [Setup e Execução](#setup-e-execução)
4. [Detalhamento dos Requisitos](#detalhamento-dos-requisitos)
   - [Autenticação & Gateway](#autenticação--gateway)
   - [Tarefas & Comentários](#tarefas--comentários)
   - [Notificações & WebSocket](#notificações--websocket)
   - [Infraestrutura & Docker](#infraestrutura--docker)
5. [Frontend (React + TanStack Router + shadcn/ui)](#frontend-react--tanstack-router--shadcnui)
6. [Backend (Nest.js + Microservices)](#backend-nestjs--microservices)
7. [Mensageria (RabbitMQ)](#mensageria-rabbitmq)
8. [Banco de Dados & Migrations](#banco-de-dados--migrations)
9. [Validação & Segurança](#validação--segurança)
10. [Logs, Rate Limiting & Health Checks](#logs-rate-limiting--health-checks)
11. [Decisões Técnicas e Trade-offs](#decisões-técnicas-e-trade-offs)
12. [Desafios do Projeto](#desafios-do-projeto)
13. [Problemas Conhecidos e Melhorias Futuras](#problemas-conhecidos-e-melhorias-futuras)
14. [Tempo Gasto e Organização do Desenvolvimento](#tempo-gasto-e-organização-do-desenvolvimento)
15. [Referências e Materiais de Apoio](#referências-e-materiais-de-apoio)

---

## 🧩 Visão Geral

Este projeto implementa um **Sistema de Gestão de Tarefas Colaborativo**, com autenticação JWT, CRUD completo de tarefas, comentários, atribuições e notificações em tempo real via WebSocket.

O sistema foi construído com base na stack obrigatória:

- **Frontend:** React.js + TanStack Router + shadcn/ui + Tailwind CSS  
- **Backend:** Nest.js + TypeORM + RabbitMQ + PostgreSQL
- **Infraestrutura:** Docker, docker-compose e monorepo com Turborepo

---

## 🏗️ Arquitetura & Estrutura do Monorepo

```
.
├── apps/
│   ├── web/                      # Frontend React
│   ├── api-gateway/              # HTTP Gateway + WebSocket
│   ├── auth-service/             # Serviço de autenticação (Nest microservice)
│   ├── task-service/             # Serviço de tarefas (Nest microservice)
│   └── notifications-service/    # Serviço de notificações (Nest microservice)
├── packages/
│   ├── eslint-config/            # Configuração de lint compartilhada
│   ├── typescript-config/        # Configurações de TypeScript compartilhadas
│   └── ui/                       # Componentes compartilhados
├── docker-compose.yml
├── turbo.json
└── README.md
```

### Diagrama de Arquitetura (simplificado)

```text
            ┌────────────┐
            │   Web App  │
            │ React + WS │
            └─────┬──────┘
                  │ HTTP / WS
           ┌──────┴────────┐
           │  API Gateway  │
           │  Nest.js HTTP │
           └──────┬────────┘
     ┌────────────┼───────────────┐
     │            │               │
Auth Service   Task Service   Notifications Service
 (Nest + DB)   (Nest + DB)    (Nest + WS + DB)
     │             │              │
     └───────── RabbitMQ ─────────┘
```

---

## ⚙️ Setup e Execução

### 1. Pré-requisitos

- Docker + Docker Compose
- Node.js 20+
- PNPM (ou npm/yarn)

### 2. Instalação

```bash
pnpm install
```

### 3. Executar com Docker Compose

```bash
docker-compose up --build
```

### 4. Endpoints principais

- **Frontend:** http://localhost:3000
- **API Gateway (Swagger):** http://localhost:3001/api/docs
- **RabbitMQ Dashboard:** http://localhost:15672 (user: `admin` / pass: `admin`)
- **Postgres:** localhost:5432

---

## 🔐 Autenticação & Gateway

**Endpoints:**

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

**Tecnologias:** Nest.js + Passport + JWT + bcrypt

**Tokens:**

- `accessToken` — expira em 15 min
- `refreshToken` — expira em 7 dias

**Validação:** class-validator + class-transformer

**Swagger/OpenAPI:** exposto em `/api/docs`

---

## ✅ Tarefas & Comentários

- **CRUD:** `/api/tasks`
- **Atribuição:** múltiplos usuários
- **Campos:** title, description, deadline, priority, status
- **Comentários:** `/api/tasks/:id/comments`
- **Histórico:** registro de eventos de criação/edição/comentário

**Eventos RabbitMQ:**

- `task.created`
- `task.updated`
- `task.comment.created`

---

## 🔔 Notificações & WebSocket

**Serviço:** notifications-service

**Eventos WebSocket:**

- `task:created`
- `task:updated`
- `comment:new`

**Fluxo:**

1. Task → publica evento no RabbitMQ
2. Notifications Service → consome e reenvia para o api-gateway via post
3. Api-gateway envia o evento para os interessados via socket
3. Web App → exibe toast / update em tempo real

---

## 🐳 Infraestrutura & Docker

- **Banco:** PostgreSQL 17 (volume persistente)
- **Mensageria:** RabbitMQ (com painel de gestão)
- **Orquestração:** Docker Compose
- **Rede:** app_network (bridge)

**Volumes persistentes:**

- `postgres_data`
- `rabbitmq_data`

---

## 💻 Frontend (React + TanStack Router + shadcn/ui)

**Páginas:**

- Login / Registro
- Lista de tarefas com busca e filtros
- Detalhe da tarefa com comentários

**UI:** shadcn/ui + Tailwind CSS

**Estado global:** Zustand

**Validação:** react-hook-form + zod

**Feedback:** skeleton loaders + toast notifications

**WebSocket:** conexão para atualizações em tempo real

**TanStack Query:** gerenciamento de cache e revalidação

---

## ⚙️ Backend (Nest.js + Microservices)

Cada microserviço é modular e isolado:

| Serviço                  | Porta | Função                                      |
|--------------------------|-------|---------------------------------------------|
| API Gateway              | 3001  | HTTP público + WebSocket                    |
| Auth Service             | 3002  | Registro, login, refresh, validação JWT     |
| Task Service             | 3003  | CRUD de tarefas, comentários e histórico    |
| Notifications Service    | 3004  | Consome eventos e envia WS                  |

**Comunicação:** via RabbitMQ

**ORM:** TypeORM + PostgreSQL

**Migrations:** via `typeorm migration:run`

---

## 📡 Mensageria (RabbitMQ)

**Filas:**

- `auth_queue`
- `task_queue`
- `notification_queue`

**Bindings:** cada serviço consome apenas o que precisa

**Persistência:** mensagens salvas até confirmação de consumo

---

## 🗄️ Banco de Dados & Migrations

- **ORM:** TypeORM
- **Entidades:** users, tasks, task_comments, task_assingments, task_audits, refresh_tokens, notifications
- **Migrations:** versionadas em cada serviço

**Scripts:**

```bash
pnpm run migration:run
pnpm run migration:generate -- migrations/NomeDaMigration
pnpm run migration:create -- migrations/NomeDaMigration
pnpm run migration:revert
```

---

## 🔒 Validação & Segurança

- Hash de senha com **bcrypt**
- JWT com **refresh token** seguro
- **Rate Limiting** no Gateway: 10 req/seg
- Sanitização de entrada com **class-transformer**
- DTOs fortemente tipados e validados

---

## 📊 Logs, Rate Limiting & Health Checks

- **Logs:** Winston (JSON + timestamps)
- **Health Check:** endpoint `/health` em cada serviço
- **Rate Limiting:** Nest Throttler (10 req/s por IP)
- **CORS:** permite qualquer origem no momento

---

## 🧠 Decisões Técnicas e Trade-offs

| Tema                          | Decisão                     | Motivo                                          |
|-------------------------------|-----------------------------|-------------------------------------------------|
| Comunicação entre serviços    | RabbitMQ                    | Garantir desacoplamento e escalabilidade        |
| ORM                           | TypeORM                     | Requisito obrigatório, integração direta com Nest |
| Armazenamento                 | PostgreSQL                  | Consistência e compatibilidade com TypeORM      |
| Auth Centralizada             | Auth Service + Gateway      | Simplificar fluxo JWT                           |
| Estado Frontend               | TanStack Query + Context    | Melhor cache + simplicidade                     |
| UI Lib                        | shadcn/ui                   | Padrão consistente e rápido de montar           |



---

## 🚧 Desafios do Projeto

### 1. Configuração do Monorepo com Docker
**Desafio:** Resolução de dependências workspace (`@repo/*`) dentro dos containers Docker. Com certeza a primeira e uma das mais difíceis complicações desse projeto foi entender a lógica de um monorepo e como fazer uso de suas vantegens, usar Docker nese contexto foi um verdadeiro desafio, e sinto que tenho vários pontos a melhorar para conseguir constuir uma arquitetura melhor para o projeto.

**Problema encontrado:**
- O `turbo prune` não copiava corretamente os pacotes do workspace para dentro do container
- Symlinks do pnpm não funcionavam corretamente entre Windows e Alpine Linux
- `node_modules` local do serviço não era copiado, causando falhas em `@repo/shared-types`

**Solução implementada:**
- Cópia manual de `packages/`, `pnpm-workspace.yaml` e `node_modules` da raiz
- Cópia do `node_modules` local de cada app (`apps/*/node_modules`) que contém os symlinks corretos
- Build direto com `pnpm run build` ao invés de `turbo build --filter`

Fica como dívida tecnica do projeto, estudar e entender melhor o processo de build com o turborepo.

### 2. Conectividade entre Containers
**Desafio:** Serviços não conseguiam se comunicar com Postgres e RabbitMQ.

**Problema encontrado:**
- `.env` configurado com `DB_HOST=localhost` e `RABBITMQ_URL=localhost`
- Dentro do Docker, `localhost` aponta para o próprio container, não para os serviços vizinhos

**Solução implementada:**
- Ajuste do `.env` para usar hostnames do Docker Compose:
  - `DB_HOST=db`
  - `RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672`
- Garantir que todos os serviços usam `env_file: .env` no `docker-compose.yml`

Para desenvolvimento, achei mais confortável programar fora do container Docker, e para isso, era necessário alterar a configuração do .env, é válido para isso criar um script e programação que entenda em qual ambiente está sendo executado e validar qual comando docker-compose usar + quais variáveis do env.


### 3. Desenvolvimento de Microserviços
**Desafio:** Entender como funciona a lógica e comunicação entre microserviços usando RabbitMQ.

**Problema encontrado:**
- Primeira experiência prática com arquitetura de microserviços
- Dificuldade em definir limites de responsabilidade entre serviços
- Debugging distribuído mais complexo (logs em múltiplos containers)

**Solução implementada:**
- Estudo aprofundado da documentação do NestJS sobre microservices
- Separação clara de responsabilidades: Auth (autenticação), Task (lógica de negócio), Notifications (eventos)
- Implementação de padrão de eventos usando RabbitMQ com filas dedicadas
- Uso de logs estruturados com contexto de serviço para facilitar debugging

**Aprendizados:**
- Microserviços oferecem escalabilidade mas adicionam complexidade operacional
- Mensageria assíncrona desacopla serviços mas requer tratamento de falhas
- Logs distribuídos e tracing são essenciais em ambientes com múltiplos serviços

---

## 🧩 Problemas Conhecidos e Melhorias Futuras

- [ ] Adicionar testes unitários com Jest
- [ ] Melhorar tratamento de erros
- [ ] Criar página de perfil de usuário
- [ ] Melhorar a organização de interfaces distruibuidas

---

## ⏱️ Tempo Gasto e Organização do Desenvolvimento

| Fase                                 | Tarefas                                        | Tempo Estimado |
|--------------------------------------|------------------------------------------------|----------------|
| Planejamento e setup do monorepo     | Estrutura base, lint, tsconfig, docker-compose | 3d             |
| Auth Service + Gateway               | JWT, bcrypt, refresh, guards                   | 2d             |
| Task Service                         | CRUD + comentários + eventos                   | 2d             |
| Notifications Service                | RabbitMQ + WebSocket                           | 2d             |
| Frontend                             | Auth + listagem + detalhes + UI                | 3d            |
| Ajustes, testes e documentação       | README, testes manuais                         | 1d             |

**Total:** 13 dias

---

## Considerações

Construir um sistema colaborativo de gestão de tarefas foi um desafio bastante interessante, o desenvolvimento do mesmo foi inspirado em soluções como o Jira. Foi um desafio amplo e, ao mesmo tempo, muito enriquecedor. Grande parte das dificuldades veio de tópicos novos para mim: arquitetura em monorepo, uso efetivo do Turborepo, desenho e isolamento de microserviços e configuração da comunicação assíncrona entre eles. 

Ao longo do desenvolvimento fui refinando a experiência: estilização dos comentários, tela de tarefas mais fluida, feedbacks visuais e organização progressiva da estrutura. Ainda vejo espaço para evoluir na padronização de pastas, separação de responsabilidades e melhor aproveitamento dos pacotes compartilhados do monorepo.

Considero o resultado atual consistente para o tempo investido e pretendo continuar avançando: adicionar testes automatizados, aprimorar observabilidade e segurança, e incluir novas funcionalidades como criação de equipes, lista de contatos/seguidores, envio de e‑mails e outros recursos colaborativos. Foi um processo de muito aprendizado e tornou-se uma base sólida para evolução futura.

---

## 📚 Referências e Materiais de Apoio

- [Nest.js Docs](https://docs.nestjs.com/)
- [TanStack Router](https://tanstack.com/router)
- [shadcn/ui](https://ui.shadcn.com/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [TypeORM Docs](https://typeorm.io/)

---

## 🚀 Desenvolvido por Guilherme Duarte

**Contato:** guilhduart.abr@gmail.com


# Pontos Técnicos

## Back-End

### Jwt Guard
Responsável por validar o header `Authorization` na requisição:

<p align="center">
  <img src="./readme-imgs/jwt-guard.png" alt="Jwt Guard" width="560" />
 </p>

### DTOs com validação
Exemplo de DTO enriquecido com tags de documentação swagger e validações via class-validator

<p align="center">
  <img src="./readme-imgs/registerDTO.png" alt="Jwt Guard" width="560" />
 </p>

 ### DTOs com validação
Exemplo de DTO enriquecido com tags de documentação swagger e validações via class-validator

<p align="center">
  <img src="./readme-imgs/registerDTO.png" alt="Jwt Guard" width="560" />
 </p>

Outros pontos são o uso de Controllers, Services, decorators, rxjs, ClientProxy para comunicação entre serviços, health check, etc

## Front-End

### Telas

Tela inicial do sistema:

<p align="center">
  <img src="./readme-imgs/frontend_board.png" alt="Jwt Guard" width="560" />
 </p>


Tela de criação de tarefas:

<p align="center">
  <img src="./readme-imgs/frontend_createtask.png" alt="Jwt Guard" width="560" />
 </p>


### Hooks personalizados e react-query

<p align="center">
  <img src="./readme-imgs/useQuery.png" alt="Jwt Guard" width="560" />
 </p>

 ### React-hook-form e Zod


<p align="center">
  <img src="./readme-imgs/usezodforms.png" alt="Jwt Guard" width="560" />
 </p>

 Além de outras implentações como uso de TipTap para Rich Text, shadcn para os componentes, tailwind, e socket.io para comunicação em tempo real (useWebSocket). 
