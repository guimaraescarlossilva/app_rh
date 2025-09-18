import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema, insertPermissionGroupSchema, insertUserGroupSchema,
  insertModulePermissionSchema, insertJobPositionSchema, insertEmployeeSchema,
  insertVacationSchema, insertTerminationSchema, insertAdvanceSchema,
  insertPayrollSchema, insertBranchSchema
} from "@shared/schema";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("🔍 [API] POST /api/auth/login - Tentativa de login");
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      console.log("🔍 [API] POST /api/auth/login - Buscando usuário:", email);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log("❌ [API] POST /api/auth/login - Usuário não encontrado");
        return res.status(401).json({ message: "Credenciais inválidas" });
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
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("❌ [API] POST /api/auth/login - Erro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      console.log("🔍 [API] GET /api/users - Iniciando busca de usuários");
      const users = await storage.getUsers();
      console.log("✅ [API] GET /api/users - Usuários encontrados:", users.length);
      console.log("📋 [API] GET /api/users - Dados:", JSON.stringify(users, null, 2));
      res.json(users);
    } catch (error) {
      console.error("❌ [API] GET /api/users - Erro:", error);
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
      const validatedData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const user = await storage.createUser({
        ...validatedData,
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
      const validatedData = insertModulePermissionSchema.parse(req.body);
      const permission = await storage.setModulePermission(validatedData);
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
    try {
      const positions = await storage.getJobPositions();
      res.json(positions);
    } catch (error) {
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
    try {
      console.log("🔍 [API] GET /api/branches - Iniciando busca de filiais");
      const branches = await storage.getBranches();
      console.log("✅ [API] GET /api/branches - Filiais encontradas:", branches.length);
      console.log("📋 [API] GET /api/branches - Dados:", JSON.stringify(branches, null, 2));
      res.json(branches);
    } catch (error) {
      console.error("❌ [API] GET /api/branches - Erro:", error);
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
      const validatedData = insertBranchSchema.parse(req.body);
      const branch = await storage.createBranch(validatedData);
      res.status(201).json(branch);
    } catch (error) {
      res.status(400).json({ message: "Invalid branch data" });
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
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
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
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data" });
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
    try {
      const payroll = await storage.getPayroll();
      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.get("/api/payroll/stats", async (req, res) => {
    try {
      const stats = await storage.getPayrollStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll stats" });
    }
  });

  app.get("/api/employees/:employeeId/payroll", async (req, res) => {
    try {
      const payroll = await storage.getEmployeePayroll(req.params.employeeId);
      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee payroll" });
    }
  });

  app.post("/api/payroll", async (req, res) => {
    try {
      const validatedData = insertPayrollSchema.parse(req.body);
      const payrollEntry = await storage.createPayrollEntry(validatedData);
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
