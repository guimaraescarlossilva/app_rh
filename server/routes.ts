import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

// Schema de validação para funcionários
const insertEmployeeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  branchId: z.string().min(1, "Filial é obrigatória"),
  positionId: z.string().optional().nullable(),
  admissionDate: z.string().min(1, "Data de admissão é obrigatória"),
  baseSalary: z.number().min(0, "Salário base deve ser positivo"),
  agreedSalary: z.number().min(0, "Salário acordado deve ser positivo"),
  advancePercentage: z.number().min(0).max(100).optional(),
  status: z.enum(["ativo", "inativo", "afastado"]).default("ativo"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      console.log("🔍 [API] POST /api/auth/refresh - Tentativa de refresh");
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token é obrigatório" });
      }

      // Por enquanto, vamos apenas retornar o usuário atual
      // Em uma implementação real, você validaria o token e buscaria o usuário
      const user = await storage.getUserByCpf("admin");
      
      if (!user) {
        console.log("❌ [API] POST /api/auth/refresh - Usuário não encontrado");
        return res.status(401).json({ message: "Token inválido" });
      }

      if (!user.active) {
        console.log("❌ [API] POST /api/auth/refresh - Usuário inativo");
        return res.status(401).json({ message: "Usuário inativo" });
      }

      console.log("✅ [API] POST /api/auth/refresh - Refresh bem-sucedido");
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        message: "Refresh realizado com sucesso",
        user: userWithoutPassword,
        token: "dummy_token" // Em uma implementação real, você geraria um novo token
      });
    } catch (error) {
      console.error("❌ [API] POST /api/auth/refresh - Erro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("🔍 [API] POST /api/auth/login - Tentativa de login");
      console.log("🔍 [API] POST /api/auth/login - Request body:", req.body);
      
      const { cpf, password } = req.body;
      
      if (!cpf || !password) {
        console.log("❌ [API] POST /api/auth/login - CPF ou senha não fornecidos");
        return res.status(400).json({ message: "CPF e senha são obrigatórios" });
      }

      console.log("🔍 [API] POST /api/auth/login - Buscando usuário por CPF:", cpf);
      
      // Teste de conexão com Prisma
      try {
        const { prisma } = await import('./prisma');
        await prisma.$queryRaw`SELECT 1`;
        console.log("✅ [API] POST /api/auth/login - Conexão com Prisma OK");
      } catch (dbError) {
        console.error("❌ [API] POST /api/auth/login - Erro de conexão com Prisma:", dbError);
        throw new Error("Erro de conexão com o banco de dados");
      }
      
      const user = await storage.getUserByCpf(cpf);
      
      if (!user) {
        console.log("❌ [API] POST /api/auth/login - Usuário não encontrado");
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      if (!user.active) {
        console.log("❌ [API] POST /api/auth/login - Usuário inativo");
        return res.status(401).json({ message: "Usuário inativo" });
      }

      console.log("🔍 [API] POST /api/auth/login - Verificando senha");
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        console.log("❌ [API] POST /api/auth/login - Senha inválida");
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      console.log("✅ [API] POST /api/auth/login - Login bem-sucedido");
      // Retornar dados do usuário sem a senha
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        message: "Login realizado com sucesso",
        user: userWithoutPassword,
        token: "dummy_token" // Em uma implementação real, você geraria um token JWT
      });
    } catch (error) {
      console.error("❌ [API] POST /api/auth/login - Erro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Permissions routes
  app.get("/api/permissions/groups", async (req, res) => {
    const startTime = Date.now();
    const reqId = Math.random().toString(36).substr(2, 9);
    
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const search = req.query.search as string;
      
      const groups = await storage.getPermissionGroups({ limit, offset, search });
      
      res.set({
        'X-Total-Count': groups.length.toString(),
        'X-Request-ID': reqId,
        'X-Response-Time': `${Date.now() - startTime}ms`
      });
      
      res.json(groups);
    } catch (error) {
      console.error(`[${reqId}] GET /api/permissions/groups error:`, error);
      res.status(500).json({ 
        message: "Failed to fetch permission groups",
        error: error instanceof Error ? error.message : "Unknown error",
        requestId: reqId
      });
    }
  });

  app.get("/api/permissions/catalog", async (req, res) => {
    const startTime = Date.now();
    const reqId = Math.random().toString(36).substr(2, 9);
    
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const search = req.query.search as string;
      
      const permissions = await storage.getModulePermissionsCatalog({ limit, offset, search });
      
      res.set({
        'X-Total-Count': permissions.length.toString(),
        'X-Request-ID': reqId,
        'X-Response-Time': `${Date.now() - startTime}ms`
      });
      
      res.json(permissions);
    } catch (error) {
      console.error(`[${reqId}] GET /api/permissions/catalog error:`, error);
      res.status(500).json({ 
        message: "Failed to fetch permissions catalog",
        error: error instanceof Error ? error.message : "Unknown error",
        requestId: reqId
      });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    const startTime = Date.now();
    const reqId = Math.random().toString(36).substr(2, 9);
    
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const search = req.query.search as string;
      
      const users = await storage.getUsers({ limit, offset, search });
      
      res.set({
        'X-Total-Count': users.length.toString(),
        'X-Request-ID': reqId,
        'X-Response-Time': `${Date.now() - startTime}ms`
      });
      
      res.json(users);
    } catch (error) {
      console.error(`[${reqId}] GET /api/users error:`, error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updateData: any = { ...req.body };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      const user = await storage.updateUser(req.params.id, updateData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Permission Groups routes
  app.get("/api/permission-groups", async (req, res) => {
    try {
      const groups = await storage.getPermissionGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permission groups" });
    }
  });

  app.post("/api/permission-groups", async (req, res) => {
    try {
      const validatedData = insertPermissionGroupSchema.parse(req.body);
      const group = await storage.createPermissionGroup(validatedData);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid group data" });
    }
  });

  app.put("/api/permission-groups/:id", async (req, res) => {
    try {
      const group = await storage.updatePermissionGroup(req.params.id, req.body);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Failed to update group" });
    }
  });

  app.delete("/api/permission-groups/:id", async (req, res) => {
    try {
      await storage.deletePermissionGroup(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // User Groups routes
  app.get("/api/users/:userId/groups", async (req, res) => {
    try {
      const userGroups = await storage.getUserGroups(req.params.userId);
      res.json(userGroups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  app.post("/api/user-groups", async (req, res) => {
    try {
      const validatedData = insertUserGroupSchema.parse(req.body);
      const assignment = await storage.assignUserToGroup(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Invalid assignment data" });
    }
  });

  app.delete("/api/user-groups/:userId/:groupId", async (req, res) => {
    try {
      await storage.removeUserFromGroup(req.params.userId, req.params.groupId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove user from group" });
    }
  });

  // Permission Groups routes
  app.get("/api/permission-groups", async (req, res) => {
    const startTime = Date.now();
    const reqId = Math.random().toString(36).substr(2, 9);
    
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const search = req.query.search as string;
      
      const groups = await storage.getPermissionGroups({ limit, offset, search });
      
      res.set({
        'X-Total-Count': groups.length.toString(),
        'X-Request-ID': reqId,
        'X-Response-Time': `${Date.now() - startTime}ms`
      });
      
      res.json(groups);
    } catch (error) {
      console.error(`[${reqId}] GET /api/permission-groups error:`, error);
      res.status(500).json({ message: "Failed to fetch permission groups" });
    }
  });

  app.get("/api/permission-groups/:id", async (req, res) => {
    try {
      const group = await storage.getPermissionGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Permission group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permission group" });
    }
  });

  app.post("/api/permission-groups", async (req, res) => {
    try {
      const group = await storage.createPermissionGroup(req.body);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid permission group data" });
    }
  });

  app.put("/api/permission-groups/:id", async (req, res) => {
    try {
      const group = await storage.updatePermissionGroup(req.params.id, req.body);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid permission group data" });
    }
  });

  app.delete("/api/permission-groups/:id", async (req, res) => {
    try {
      await storage.deletePermissionGroup(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete permission group" });
    }
  });

  // Module Permissions routes
  app.get("/api/groups/:groupId/permissions", async (req, res) => {
    try {
      const permissions = await storage.getModulePermissions(req.params.groupId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post("/api/module-permissions", async (req, res) => {
    try {
      const permission = await storage.setModulePermission(req.body);
      res.status(201).json(permission);
    } catch (error) {
      res.status(400).json({ message: "Invalid permission data" });
    }
  });

  app.delete("/api/module-permissions/:groupId/:module", async (req, res) => {
    try {
      await storage.deleteModulePermission(req.params.groupId, req.params.module);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });

  // Job Positions routes
  app.get("/api/job-positions", async (req, res) => {
    const reqId = (req as any).reqId || 'unknown';
    
    try {
      console.log(`🔍 [${reqId}] GET /api/job-positions - Buscando cargos/funções`);
      console.error(`🚨 [${reqId}] FORÇANDO LOG - Chamando storage.getJobPositions()`);
      
      const positions = await storage.getJobPositions();
      
      console.log(`✅ [${reqId}] GET /api/job-positions - ${positions.length} cargos encontrados`);
      console.error(`🚨 [${reqId}] FORÇANDO LOG - Cargos retornados:`, JSON.stringify(positions, null, 2));
      
      res.json(positions);
    } catch (error) {
      console.error(`❌ [${reqId}] GET /api/job-positions - Erro:`, error);
      console.error(`🚨 [${reqId}] FORÇANDO LOG - Erro ao buscar cargos:`, error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to fetch job positions" });
    }
  });

  app.post("/api/job-positions", async (req, res) => {
    try {
      const validatedData = insertJobPositionSchema.parse(req.body);
      const position = await storage.createJobPosition(validatedData);
      res.status(201).json(position);
    } catch (error) {
      res.status(400).json({ message: "Invalid position data" });
    }
  });

  app.put("/api/job-positions/:id", async (req, res) => {
    try {
      const position = await storage.updateJobPosition(req.params.id, req.body);
      res.json(position);
    } catch (error) {
      res.status(400).json({ message: "Failed to update position" });
    }
  });

  app.delete("/api/job-positions/:id", async (req, res) => {
    try {
      await storage.deleteJobPosition(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete position" });
    }
  });

  // Branches routes
  app.get("/api/branches", async (req, res) => {
    const startTime = Date.now();
    const reqId = Math.random().toString(36).substr(2, 9);
    
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const search = req.query.search as string;
      
      const branches = await storage.getBranches({ limit, offset, search });
      
      res.set({
        'X-Total-Count': branches.length.toString(),
        'X-Request-ID': reqId,
        'X-Response-Time': `${Date.now() - startTime}ms`
      });
      
      res.json(branches);
    } catch (error) {
      console.error(`[${reqId}] GET /api/branches error:`, error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  app.get("/api/branches/:id", async (req, res) => {
    try {
      const branch = await storage.getBranch(req.params.id);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json(branch);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch branch" });
    }
  });

  app.post("/api/branches", async (req, res) => {
    try {
      console.log("🔍 [API] POST /api/branches - Criando filial:", req.body);
      const branch = await storage.createBranch(req.body);
      console.log("✅ [API] POST /api/branches - Filial criada:", branch);
      res.status(201).json(branch);
    } catch (error) {
      console.error("❌ [API] POST /api/branches - Erro:", error);
      res.status(500).json({ message: "Failed to create branch" });
    }
  });

  app.put("/api/branches/:id", async (req, res) => {
    try {
      const branch = await storage.updateBranch(req.params.id, req.body);
      res.json(branch);
    } catch (error) {
      res.status(400).json({ message: "Failed to update branch" });
    }
  });

  app.delete("/api/branches/:id", async (req, res) => {
    try {
      await storage.deleteBranch(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete branch" });
    }
  });

  // Employees routes
  app.get("/api/employees", async (req, res) => {
    const startTime = Date.now();
    const reqId = Math.random().toString(36).substr(2, 9);
    
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const search = req.query.search as string;
      
      const employees = await storage.getEmployees({ limit, offset, search });
      
      res.set({
        'X-Total-Count': employees.length.toString(),
        'X-Request-ID': reqId,
        'X-Response-Time': `${Date.now() - startTime}ms`
      });
      
      res.json(employees);
    } catch (error) {
      console.error(`[${reqId}] GET /api/employees error:`, error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/stats", async (req, res) => {
    try {
      const stats = await storage.getEmployeeStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee stats" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    const reqId = (req as any).reqId || 'unknown';
    
    try {
      console.log(`🔍 [${reqId}] POST /api/employees - INÍCIO DA REQUISIÇÃO`);
      console.log(`📝 [${reqId}] POST /api/employees - Request Body:`, JSON.stringify(req.body, null, 2));
      console.log(`🔗 [${reqId}] POST /api/employees - Headers:`, JSON.stringify(req.headers, null, 2));
      
      // Força o log no console mesmo em produção
      console.error(`🚨 [${reqId}] FORÇANDO LOG - Tentativa de criar funcionário:`, req.body);
      
      const validatedData = insertEmployeeSchema.parse(req.body);
      console.log(`✅ [${reqId}] POST /api/employees - Dados validados:`, JSON.stringify(validatedData, null, 2));
      console.error(`🚨 [${reqId}] FORÇANDO LOG - Dados validados OK`);
      
      // Converte a data de string para Date e corrige positionId vazio
      const employeeData = {
        ...validatedData,
        admissionDate: new Date(validatedData.admissionDate),
        positionId: validatedData.positionId === "" ? null : validatedData.positionId
      };
      
      console.log(`🔄 [${reqId}] POST /api/employees - Dados para criação:`, JSON.stringify(employeeData, null, 2));
      console.error(`🚨 [${reqId}] FORÇANDO LOG - Chamando storage.createEmployee`);
      
      const employee = await storage.createEmployee(employeeData);
      
      console.log(`✅ [${reqId}] POST /api/employees - Funcionário criado:`, JSON.stringify(employee, null, 2));
      console.error(`🚨 [${reqId}] FORÇANDO LOG - Funcionário criado com sucesso`);
      
      res.status(201).json(employee);
    } catch (error) {
      console.error(`❌ [${reqId}] POST /api/employees - ERRO CAPTURADO:`, error);
      console.error(`🚨 [${reqId}] FORÇANDO LOG - Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof z.ZodError) {
        const errorResponse = { 
          message: "Dados inválidos", 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
        
        console.error(`🚨 [${reqId}] FORÇANDO LOG - Erro de validação Zod:`, JSON.stringify(errorResponse, null, 2));
        return res.status(400).json(errorResponse);
      }
      
      // Log detalhado do erro
      console.error(`🚨 [${reqId}] FORÇANDO LOG - Erro não é Zod:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      
      res.status(500).json({ message: "Erro interno do servidor", requestId: reqId });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.updateEmployee(req.params.id, req.body);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Vacations routes
  app.get("/api/vacations", async (req, res) => {
    try {
      const vacations = await storage.getVacations();
      res.json(vacations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vacations" });
    }
  });

  app.get("/api/vacations/stats", async (req, res) => {
    try {
      const stats = await storage.getVacationStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vacation stats" });
    }
  });

  app.get("/api/employees/:employeeId/vacations", async (req, res) => {
    try {
      const vacations = await storage.getEmployeeVacations(req.params.employeeId);
      res.json(vacations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee vacations" });
    }
  });

  app.post("/api/vacations", async (req, res) => {
    try {
      const validatedData = insertVacationSchema.parse(req.body);
      const vacation = await storage.createVacation(validatedData);
      res.status(201).json(vacation);
    } catch (error) {
      res.status(400).json({ message: "Invalid vacation data" });
    }
  });

  app.put("/api/vacations/:id", async (req, res) => {
    try {
      const vacation = await storage.updateVacation(req.params.id, req.body);
      res.json(vacation);
    } catch (error) {
      res.status(400).json({ message: "Failed to update vacation" });
    }
  });

  app.delete("/api/vacations/:id", async (req, res) => {
    try {
      await storage.deleteVacation(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vacation" });
    }
  });

  // Terminations routes
  app.get("/api/terminations", async (req, res) => {
    try {
      const terminations = await storage.getTerminations();
      res.json(terminations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch terminations" });
    }
  });

  app.post("/api/terminations", async (req, res) => {
    try {
      const validatedData = insertTerminationSchema.parse(req.body);
      const termination = await storage.createTermination(validatedData);
      res.status(201).json(termination);
    } catch (error) {
      res.status(400).json({ message: "Invalid termination data" });
    }
  });

  app.put("/api/terminations/:id", async (req, res) => {
    try {
      const termination = await storage.updateTermination(req.params.id, req.body);
      res.json(termination);
    } catch (error) {
      res.status(400).json({ message: "Failed to update termination" });
    }
  });

  app.delete("/api/terminations/:id", async (req, res) => {
    try {
      await storage.deleteTermination(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete termination" });
    }
  });

  // Advances routes
  app.get("/api/advances", async (req, res) => {
    try {
      const advances = await storage.getAdvances();
      res.json(advances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch advances" });
    }
  });

  app.get("/api/employees/:employeeId/advances", async (req, res) => {
    try {
      const advances = await storage.getEmployeeAdvances(req.params.employeeId);
      res.json(advances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee advances" });
    }
  });

  app.post("/api/advances", async (req, res) => {
    try {
      const validatedData = insertAdvanceSchema.parse(req.body);
      const advance = await storage.createAdvance(validatedData);
      res.status(201).json(advance);
    } catch (error) {
      res.status(400).json({ message: "Invalid advance data" });
    }
  });

  app.put("/api/advances/:id", async (req, res) => {
    try {
      const advance = await storage.updateAdvance(req.params.id, req.body);
      res.json(advance);
    } catch (error) {
      res.status(400).json({ message: "Failed to update advance" });
    }
  });

  app.delete("/api/advances/:id", async (req, res) => {
    try {
      await storage.deleteAdvance(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete advance" });
    }
  });

  // Payroll routes
  app.get("/api/payroll", async (req, res) => {
    const startTime = Date.now();
    const reqId = Math.random().toString(36).substr(2, 9);
    
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const search = req.query.search as string;
      
      const payroll = await storage.getPayroll({ limit, offset, search });
      
      res.set({
        'X-Total-Count': payroll.length.toString(),
        'X-Request-ID': reqId,
        'X-Response-Time': `${Date.now() - startTime}ms`
      });
      
      res.json(payroll);
    } catch (error) {
      console.error(`[${reqId}] GET /api/payroll error:`, error);
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.get("/api/payroll/stats", async (req, res) => {
    try {
      // TODO: Implement getPayrollStats method
      res.json({ total: 0, processed: 0, pending: 0 });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll stats" });
    }
  });

  app.get("/api/employees/:employeeId/payroll", async (req, res) => {
    try {
      // TODO: Implement getEmployeePayroll method
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee payroll" });
    }
  });

  app.post("/api/payroll", async (req, res) => {
    try {
      const payrollEntry = await storage.createPayrollEntry(req.body);
      res.status(201).json(payrollEntry);
    } catch (error) {
      res.status(400).json({ message: "Invalid payroll data" });
    }
  });

  app.put("/api/payroll/:id", async (req, res) => {
    try {
      const payrollEntry = await storage.updatePayrollEntry(req.params.id, req.body);
      res.json(payrollEntry);
    } catch (error) {
      res.status(400).json({ message: "Failed to update payroll entry" });
    }
  });

  app.delete("/api/payroll/:id", async (req, res) => {
    try {
      await storage.deletePayrollEntry(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payroll entry" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
