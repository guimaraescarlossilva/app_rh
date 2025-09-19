# Relatório de Auditoria de Performance, Arquitetura e Segurança

## Sumário Executivo
- O servidor utiliza credenciais de produção hardcoded e sem configuração de pool, expondo o banco e causando saturação de conexões sob carga simultânea.【F:server/db.ts†L1-L12】
- As rotas invocam métodos de repositório inexistentes, provocando falhas e timeouts em praticamente todas as páginas que dependem desses dados (ex.: usuários, permissões, folha).【F:server/routes.ts†L18-L200】【F:server/storage-sql.ts†L66-L196】
- Consultas de listagem (`branches`, `employees`) fazem varredura completa de tabelas sem filtros/paginação e ainda ordenam por colunas sem índice, degradando o P95 e gerando lock no banco.【F:server/storage-sql.ts†L84-L189】【F:server/storage-sql.ts†L222-L309】
- Ausência de validação robusta e logs verbosos em hot paths comprometem segurança (injeção/DoS) e performance.

## Achados Prioritários

### P0.1 – Credenciais hardcoded e pool sem limites
- **Arquivos impactados:** `server/db.ts:1-12`
- **Problema:** O pool é criado com host/usuário/senha fixos e sem `max`, `idleTimeoutMillis` ou `connectionTimeoutMillis`.
- **Por que é um problema:** expõe credenciais, impede rotação/env var, abre risco de exfiltração e deixa o banco vulnerável a esgotamento de conexões (cada request pode abrir conexão nova até o limite do Postgres, derrubando o serviço). Custo: interrupção total sob pico.
- **Correção (diff):**
```diff
--- a/server/db.ts
+++ b/server/db.ts
-import pkg from 'pg';
-const { Pool } = pkg;
-
-// Database configuration for Render PostgreSQL
-export const pool = new Pool({
-  host: 'dpg-d0cdphs9c44c73ds27tg-a.oregon-postgres.render.com',
-  port: 5432,
-  database: 'nativas_db',
-  user: 'nativas_db_user',
-  password: 'Hu01lD4toCQHs00i0nJZZNyfr0iJL8Jl',
-  ssl: { rejectUnauthorized: false }
-});
+import "dotenv/config";
+import pkg from "pg";
+
+const { Pool } = pkg;
+
+const toInt = (value: string | undefined, fallback: number) => {
+  const parsed = Number.parseInt(value ?? "", 10);
+  return Number.isFinite(parsed) ? parsed : fallback;
+};
+
+const connectionString = process.env.DATABASE_URL;
+
+if (!connectionString) {
+  throw new Error("DATABASE_URL não configurado");
+}
+
+export const pool = new Pool({
+  connectionString,
+  max: toInt(process.env.PG_POOL_MAX, 20),
+  idleTimeoutMillis: toInt(process.env.PG_IDLE_TIMEOUT_MS, 30_000),
+  connectionTimeoutMillis: toInt(process.env.PG_CONNECTION_TIMEOUT_MS, 5_000),
+  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
+});
+
+export async function withConnection<T>(fn: (client: pkg.PoolClient) => Promise<T>): Promise<T> {
+  const client = await pool.connect();
+  try {
+    return await fn(client);
+  } finally {
+    client.release();
+  }
+}
```
- **Teste rápido:** `curl -I http://localhost:5000/api/branches` (depois de configurar `DATABASE_URL`).
- **Índices/SQL:** n/a.

### P0.2 – Rotas chamam métodos inexistentes (falha imediata)
- **Arquivos impactados:** `server/routes.ts:18-560`, `server/storage-sql.ts:66-309`
- **Problema:** `storage-sql` só implementa Branches/Employees, mas as rotas chamam `getUserByEmail`, `getUsers`, `getPermissionGroups`, etc. Como `tsx` transpila sem typecheck, essas chamadas viram `TypeError: storage.getUsers is not a function`, retornando 500 ou travando requisições.
- **Por que é um problema:** Cada endpoint dessas entidades fica indisponível, bloqueando login/permissões/folha e causando timeouts na UI. Custo: funcionalidades críticas fora do ar.
- **Correção (diff) – exemplo para camada de usuários (replicar padrão para grupos, permissões, férias, folha, etc.):**
```diff
--- a/server/storage-sql.ts
+++ b/server/storage-sql.ts
-import { pool } from "./db";
+import { pool, withConnection } from "./db";
+
+export interface User {
+  id: string;
+  name: string;
+  email: string;
+  password: string;
+  active: boolean;
+  createdAt: Date;
+}
+
+export interface InsertUser {
+  name: string;
+  email: string;
+  password: string;
+  active?: boolean;
+}
@@
-export interface IStorage {
-  // Branches
+export interface IStorage {
+  // Users
+  getUser(id: string): Promise<User | undefined>;
+  getUserByEmail(email: string): Promise<User | undefined>;
+  createUser(user: InsertUser): Promise<User>;
+  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
+  deleteUser(id: string): Promise<void>;
+
+  // Branches
   getBranches(): Promise<Branch[]>;
@@
 export class SQLStorage implements IStorage {
+  // Users
+  async getUser(id: string): Promise<User | undefined> {
+    return withConnection(async (client) => {
+      const { rows } = await client.query(
+        `SELECT id, name, email, password, active, created_at
+         FROM rh_db.users
+         WHERE id = $1`,
+        [id]
+      );
+      if (rows.length === 0) return undefined;
+      const row = rows[0];
+      return {
+        id: row.id,
+        name: row.name,
+        email: row.email,
+        password: row.password,
+        active: row.active,
+        createdAt: row.created_at,
+      };
+    });
+  }
+
+  async getUserByEmail(email: string): Promise<User | undefined> {
+    return withConnection(async (client) => {
+      const { rows } = await client.query(
+        `SELECT id, name, email, password, active, created_at
+         FROM rh_db.users
+         WHERE email = $1`,
+        [email]
+      );
+      return rows[0];
+    });
+  }
+
+  async getUsers(): Promise<User[]> {
+    return withConnection(async (client) => {
+      const { rows } = await client.query(
+        `SELECT id, name, email, password, active, created_at
+         FROM rh_db.users
+         ORDER BY created_at DESC
+         LIMIT $1 OFFSET $2`,
+        [50, 0]
+      );
+      return rows;
+    });
+  }
+
+  async createUser(user: InsertUser): Promise<User> {
+    return withConnection(async (client) => {
+      const { rows } = await client.query(
+        `INSERT INTO rh_db.users (name, email, password, active)
+         VALUES ($1, $2, $3, COALESCE($4, TRUE))
+         RETURNING id, name, email, password, active, created_at`,
+        [user.name, user.email, user.password, user.active]
+      );
+      return rows[0];
+    });
+  }
+
+  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
+    const fields: string[] = [];
+    const values: unknown[] = [];
+    let index = 1;
+
+    if (user.name !== undefined) {
+      fields.push(`name = $${index++}`);
+      values.push(user.name);
+    }
+    if (user.email !== undefined) {
+      fields.push(`email = $${index++}`);
+      values.push(user.email);
+    }
+    if (user.password !== undefined) {
+      fields.push(`password = $${index++}`);
+      values.push(user.password);
+    }
+    if (user.active !== undefined) {
+      fields.push(`active = $${index++}`);
+      values.push(user.active);
+    }
+
+    fields.push(`created_at = created_at`);
+    values.push(id);
+
+    return withConnection(async (client) => {
+      const { rows } = await client.query(
+        `UPDATE rh_db.users
+         SET ${fields.join(", ")}
+         WHERE id = $${index}
+         RETURNING id, name, email, password, active, created_at`,
+        values
+      );
+      return rows[0];
+    });
+  }
+
+  async deleteUser(id: string): Promise<void> {
+    await withConnection((client) => client.query(
+      `DELETE FROM rh_db.users WHERE id = $1`,
+      [id]
+    ));
+  }
+
   // Branches
   async getBranches(): Promise<Branch[]> {
-    try {
-      console.log("🔍 [STORAGE] getBranches - Iniciando consulta no banco");
-      const result = await pool.query(`
-        SELECT id, fantasy_name, address, phone, email, cnpj, city, state,
-               neighborhood, zip_code, active, created_at, updated_at
-        FROM rh_db.branches
-        ORDER BY fantasy_name ASC
-      `);
-      console.log("✅ [STORAGE] getBranches - Consulta executada com sucesso");
-      console.log("📊 [STORAGE] getBranches - Registros encontrados:", result.rows.length);
-      return result.rows.map(row => ({
+    try {
+      const { rows } = await pool.query(`
+        SELECT id, fantasy_name, address, phone, email, cnpj, city, state,
+               neighborhood, zip_code, active, created_at, updated_at
+        FROM rh_db.branches
+        ORDER BY created_at DESC
+        LIMIT $1 OFFSET $2
+      `, [50, 0]);
+      return rows.map(row => ({
         id: row.id,
```
- **Teste rápido:** `curl -X POST http://localhost:5000/api/auth/login -d '{"email":"...","password":"..."}' -H 'Content-Type: application/json'`
- **Índices/SQL:** ver seção `Indices/SQL` abaixo para `users`, `permission_groups`, etc.

> **Observação:** replicar o mesmo padrão `withConnection + LIMIT/OFFSET parametrizados` para grupos, permissões, férias, adiantamentos, rescisões e folha. Sem isso as páginas continuarão quebradas.

### P0.3 – Listagens sem paginação + ORDER BY sem índice
- **Arquivos impactados:** `server/storage-sql.ts:84-189`, `server/storage-sql.ts:222-309`
- **Problema:** As queries de `branches` e `employees` fazem `SELECT ... ORDER BY ...` sem `LIMIT/OFFSET` parametrizáveis. Em tabelas com milhares de linhas isso gera full scan + sort, elevando P95 > segundos e causando timeouts.
- **Por que é um problema:** o servidor fica bloqueado em sorting e transfere payload gigantes. Custo: múltiplos segundos por request, memória alta, queda de throughput.
- **Correção (diff) sugerida:**
```diff
-  async getBranches(): Promise<Branch[]> {
-    try {
-      const result = await pool.query(`
-        SELECT ...
-        FROM rh_db.branches
-        ORDER BY fantasy_name ASC
-      `);
-      return result.rows.map(...);
-    }
-  }
+  async getBranches({ limit = 50, offset = 0, search }: { limit?: number; offset?: number; search?: string } = {}): Promise<Branch[]> {
+    const cappedLimit = Math.min(Math.max(limit, 1), 200);
+    const clauses: string[] = [];
+    const params: unknown[] = [];
+
+    if (search) {
+      clauses.push(`(fantasy_name ILIKE $${params.length + 1} OR cnpj ILIKE $${params.length + 1})`);
+      params.push(`%${search}%`);
+    }
+
+    params.push(cappedLimit);
+    params.push(offset);
+
+    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
+    const query = `
+      SELECT id, fantasy_name, address, phone, email, cnpj, city, state,
+             neighborhood, zip_code, active, created_at, updated_at
+      FROM rh_db.branches
+      ${where}
+      ORDER BY updated_at DESC
+      LIMIT $${params.length - 1} OFFSET $${params.length}
+    `;
+
+    const { rows } = await withConnection((client) => client.query(query, params));
+    return rows.map(mapBranchRow);
+  }
```

*(Aplicar abordagem idêntica em `getEmployees`, `getUsers`, etc., e atualizar as rotas para ler `limit`/`offset` da query string com valores padrão e teto de 200.)*

- **Teste rápido:** `curl 'http://localhost:5000/api/employees?limit=50&offset=0'`
- **Índices/SQL:** ver itens `IDX01`, `IDX02` na seção de índices.

### P1.1 – Logs verbosos em hot path
- **Arquivos:** `server/index.ts:8-70`, `server/routes.ts:10-200`, `server/storage-sql.ts:84-189`
- **Problema:** logs de request/resposta serializam JSON inteiro (`JSON.stringify`), além de múltiplos `console.log` por operação.
- **Impacto:** cada request sofre overhead de serialização (principalmente listas grandes), aumenta I/O de stdout e polui observabilidade.
- **Correção:** trocar por logger estruturado (pino) com campos básicos (`reqId`, `path`, `duration`, `status`) e log em nível `debug` apenas sob flag. Instrumentar tempo de query com `withConnection`.

### P1.2 – Bcrypt no event-loop
- **Arquivos:** `server/routes.ts:24-27`, `server/routes.ts:75-93`
- **Problema:** `bcrypt.compare`/`hash` executam scrypt na thread principal.
- **Impacto:** bloqueia event-loop sob logins concorrentes. Mover para fila/worker (`worker_threads`) ou trocar para `bcryptjs` com `await setImmediate`.

### P1.3 – Falta de validação robusta
- **Arquivos:** `shared/types.ts:259-318`
- **Problema:** `insert*Schema.parse` apenas faz cast, sem validação real.
- **Impacto:** entrada inválida/SQL injection (strings concatenadas nas consultas dinâmicas) passam sem filtro. Substituir por Zod/Yup com sanitização.

### P2 – Outros pontos
- `runMigrations` cria tabelas sem índices secundários, além de `COUNT(*)` em tabela potencialmente grande.【F:server/migrate-sql.ts†L156-L238】
- `storage-sql` duplica tipos já presentes em `shared/types.ts`, aumentando risco de divergência.【F:server/storage-sql.ts†L4-L63】【F:shared/types.ts†L1-L140】
- Falta de rate-limiting, cache e instrumentação P50/P95.

## Índices/SQL Recomendados
Arquivo `sql/recommendations.sql` contém scripts completos. Principais itens:

- **IDX01 – Branches por ordenação/busca:**
  ```sql
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branches_updated_at
    ON rh_db.branches (updated_at DESC);
  -- Rollback: DROP INDEX IF EXISTS idx_branches_updated_at;
  ```
  Justificativa: cobre `ORDER BY updated_at DESC LIMIT/OFFSET`.

- **IDX02 – Employees por status + ordenação:**
  ```sql
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_status_updated_at
    ON rh_db.employees (status, updated_at DESC);
  -- Rollback: DROP INDEX IF EXISTS idx_employees_status_updated_at;
  ```
  Útil para dashboards filtrando por status.

- **IDX03 – User groups / permissões:** índices em `user_groups (user_id)`, `module_permissions (group_id, module)` para evitar scans completos quando os métodos forem implementados.

## Comandos de Diagnóstico
1. **Lint / Typecheck** – corrigir scripts no `package.json` e então executar:
   ```bash
   npm run lint
   npm run check
   ```
   (Atualmente `npm run check` falha com 199 erros – priorizar correção das rotas e componentes citados.)【9cbd14†L1-L120】
2. **Benchmark HTTP:**
   ```bash
   npx autocannon -d 20 -c 50 http://localhost:5000/api/branches?limit=50
   ```
3. **Postgres – habilitar e consultar top offenders:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
   SELECT query, calls, total_time, mean_time, rows
     FROM pg_stat_statements
    WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
 ORDER BY mean_time DESC
    LIMIT 10;
   ```
4. **EXPLAIN (ANALYZE, BUFFERS) – endpoints críticos:**
   ```sql
   EXPLAIN (ANALYZE, BUFFERS)
   SELECT id, fantasy_name
     FROM rh_db.branches
    WHERE fantasy_name ILIKE '%padrao%'
    ORDER BY updated_at DESC
    LIMIT 50 OFFSET 0;

   EXPLAIN (ANALYZE, BUFFERS)
   SELECT id, name, status
     FROM rh_db.employees
    WHERE status = 'ativo'
    ORDER BY updated_at DESC
    LIMIT 50 OFFSET 0;
   ```

## Checklist Final (ordem sugerida)
1. Aplicar correção do pool (`server/db.ts`) e definir variáveis `DATABASE_URL`, `PG_POOL_MAX`, `PG_IDLE_TIMEOUT_MS`, `PG_CONNECTION_TIMEOUT_MS`.
2. Reimplementar camada de repositório (`storage-sql.ts`) cobrindo **todas** as entidades usadas em `routes.ts` com `withConnection`, paginação e parâmetros.
3. Ajustar rotas para consumir paginação (`limit`, `offset`, `search`) e retornar cabeçalhos `X-Total-Count` quando aplicável.
4. Adicionar validação com Zod e sanitização de entrada.
5. Substituir logs verbosos por logger estruturado (reqId, duração) e mover `bcrypt` para worker/fila.
6. Criar índices recomendados e validar com `EXPLAIN` + `pg_stat_statements`.
7. Configurar cache de listas estáveis (branches, cargos) em Redis/memory por 60s.
8. Adicionar rate limiting básico (por IP) e headers de cache (Etag/Cache-Control) para GET.
9. Instrumentar métricas (P50/P95) e healthcheck de pool.
10. Ajustar scripts `lint/typecheck`, corrigir erros pendentes e automatizar no CI.

## Observabilidade / Instrumentação
- Introduzir `pino` com serializer para request/response, incluir `reqId` (usar `cls-hooked` ou `async_local_storage`).
- Medir tempo de query em `withConnection` e exportar via Prometheus (`histogram` para P50/P95).
- Registrar métricas de pool (`pool.totalCount`, `idleCount`, `waitingCount`) no `/metrics`.

