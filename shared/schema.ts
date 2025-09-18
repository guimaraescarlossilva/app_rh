import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, date, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const employeeStatusEnum = pgEnum("employee_status", ["ativo", "inativo", "afastado"]);
export const vacationStatusEnum = pgEnum("vacation_status", ["pendente", "aprovado", "em_gozo", "concluido", "rejeitado"]);
export const terminationReasonEnum = pgEnum("termination_reason", ["demissao", "rescisao", "aposentadoria", "abandono", "falecimento"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pendente", "processado", "pago"]);

// Users table for system access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Permission groups
export const permissionGroups = pgTable("permission_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// User group assignments
export const userGroups = pgTable("user_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: varchar("group_id").notNull().references(() => permissionGroups.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").default(sql`now()`).notNull(),
});

// Module permissions
export const modulePermissions = pgTable("module_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => permissionGroups.id, { onDelete: "cascade" }),
  module: text("module").notNull(), // dashboard, employees, vacations, terminations, advances, payroll, permissions
  canRead: boolean("can_read").default(false).notNull(),
  canCreate: boolean("can_create").default(false).notNull(),
  canUpdate: boolean("can_update").default(false).notNull(),
  canDelete: boolean("can_delete").default(false).notNull(),
});

// Job positions/roles
export const jobPositions = pgTable("job_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Employees table - main entity combining all Excel data
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cpf: text("cpf").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  positionId: varchar("position_id").references(() => jobPositions.id),
  admissionDate: date("admission_date").notNull(),
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  agreedSalary: decimal("agreed_salary", { precision: 10, scale: 2 }).notNull(),
  advancePercentage: decimal("advance_percentage", { precision: 5, scale: 2 }).default("40.00"),
  status: employeeStatusEnum("status").default("ativo").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Vacation control
export const vacations = pgTable("vacations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  acquisitionPeriodStart: date("acquisition_period_start").notNull(),
  acquisitionPeriodEnd: date("acquisition_period_end").notNull(),
  enjoymentLimit: date("enjoyment_limit").notNull(),
  enjoymentPeriodStart: date("enjoyment_period_start"),
  enjoymentPeriodEnd: date("enjoyment_period_end"),
  days: integer("days").notNull().default(30),
  status: vacationStatusEnum("status").default("pendente").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
});

// Terminations/Rescissions
export const terminations = pgTable("terminations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  terminationDate: date("termination_date").notNull(),
  reason: terminationReasonEnum("reason").notNull(),
  description: text("description"),
  receiptIssued: boolean("receipt_issued").default(false),
  fgtsReleased: boolean("fgts_released").default(false),
  severanceProcessed: boolean("severance_processed").default(false),
  paymentDate: date("payment_date"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Salary advances
export const advances = pgTable("advances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  advanceAmount: decimal("advance_amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date"),
  status: paymentStatusEnum("status").default("pendente").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Payroll - comprehensive salary sheet
export const payroll = pgTable("payroll", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  agreedSalary: decimal("agreed_salary", { precision: 10, scale: 2 }).notNull(),
  advance: decimal("advance", { precision: 10, scale: 2 }).default("0.00"),
  nightShiftAdditional: decimal("night_shift_additional", { precision: 10, scale: 2 }).default("0.00"),
  nightShiftDsr: decimal("night_shift_dsr", { precision: 10, scale: 2 }).default("0.00"),
  overtime: decimal("overtime", { precision: 10, scale: 2 }).default("0.00"),
  overtimeDsr: decimal("overtime_dsr", { precision: 10, scale: 2 }).default("0.00"),
  vacationBonus: decimal("vacation_bonus", { precision: 10, scale: 2 }).default("0.00"),
  fiveYearBonus: decimal("five_year_bonus", { precision: 10, scale: 2 }).default("0.00"),
  positionGratification: decimal("position_gratification", { precision: 10, scale: 2 }).default("0.00"),
  generalGratification: decimal("general_gratification", { precision: 10, scale: 2 }).default("0.00"),
  cashierGratification: decimal("cashier_gratification", { precision: 10, scale: 2 }).default("0.00"),
  familyAllowance: decimal("family_allowance", { precision: 10, scale: 2 }).default("0.00"),
  holidayPay: decimal("holiday_pay", { precision: 10, scale: 2 }).default("0.00"),
  unhealthiness: decimal("unhealthiness", { precision: 10, scale: 2 }).default("0.00"),
  maternityLeave: decimal("maternity_leave", { precision: 10, scale: 2 }).default("0.00"),
  tips: decimal("tips", { precision: 10, scale: 2 }).default("0.00"),
  others: decimal("others", { precision: 10, scale: 2 }).default("0.00"),
  vouchers: decimal("vouchers", { precision: 10, scale: 2 }).default("0.00"),
  grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull(),
  inss: decimal("inss", { precision: 10, scale: 2 }).default("0.00"),
  inssVacation: decimal("inss_vacation", { precision: 10, scale: 2 }).default("0.00"),
  irpf: decimal("irpf", { precision: 10, scale: 2 }).default("0.00"),
  unionFee: decimal("union_fee", { precision: 10, scale: 2 }).default("0.00"),
  absences: decimal("absences", { precision: 10, scale: 2 }).default("0.00"),
  absenceReason: text("absence_reason"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").default("pendente").notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userGroups: many(userGroups),
}));

export const permissionGroupsRelations = relations(permissionGroups, ({ many }) => ({
  userGroups: many(userGroups),
  modulePermissions: many(modulePermissions),
}));

export const userGroupsRelations = relations(userGroups, ({ one }) => ({
  user: one(users, {
    fields: [userGroups.userId],
    references: [users.id],
  }),
  group: one(permissionGroups, {
    fields: [userGroups.groupId],
    references: [permissionGroups.id],
  }),
}));

export const modulePermissionsRelations = relations(modulePermissions, ({ one }) => ({
  group: one(permissionGroups, {
    fields: [modulePermissions.groupId],
    references: [permissionGroups.id],
  }),
}));

export const jobPositionsRelations = relations(jobPositions, ({ many }) => ({
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  position: one(jobPositions, {
    fields: [employees.positionId],
    references: [jobPositions.id],
  }),
  vacations: many(vacations),
  terminations: many(terminations),
  advances: many(advances),
  payroll: many(payroll),
}));

export const vacationsRelations = relations(vacations, ({ one }) => ({
  employee: one(employees, {
    fields: [vacations.employeeId],
    references: [employees.id],
  }),
  approver: one(users, {
    fields: [vacations.approvedBy],
    references: [users.id],
  }),
}));

export const terminationsRelations = relations(terminations, ({ one }) => ({
  employee: one(employees, {
    fields: [terminations.employeeId],
    references: [employees.id],
  }),
}));

export const advancesRelations = relations(advances, ({ one }) => ({
  employee: one(employees, {
    fields: [advances.employeeId],
    references: [employees.id],
  }),
}));

export const payrollRelations = relations(payroll, ({ one }) => ({
  employee: one(employees, {
    fields: [payroll.employeeId],
    references: [employees.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPermissionGroupSchema = createInsertSchema(permissionGroups).omit({
  id: true,
  createdAt: true,
});

export const insertUserGroupSchema = createInsertSchema(userGroups).omit({
  id: true,
  assignedAt: true,
});

export const insertModulePermissionSchema = createInsertSchema(modulePermissions).omit({
  id: true,
});

export const insertJobPositionSchema = createInsertSchema(jobPositions).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVacationSchema = createInsertSchema(vacations).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

export const insertTerminationSchema = createInsertSchema(terminations).omit({
  id: true,
  createdAt: true,
});

export const insertAdvanceSchema = createInsertSchema(advances).omit({
  id: true,
  createdAt: true,
});

export const insertPayrollSchema = createInsertSchema(payroll).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PermissionGroup = typeof permissionGroups.$inferSelect;
export type InsertPermissionGroup = z.infer<typeof insertPermissionGroupSchema>;
export type UserGroup = typeof userGroups.$inferSelect;
export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;
export type ModulePermission = typeof modulePermissions.$inferSelect;
export type InsertModulePermission = z.infer<typeof insertModulePermissionSchema>;
export type JobPosition = typeof jobPositions.$inferSelect;
export type InsertJobPosition = z.infer<typeof insertJobPositionSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Vacation = typeof vacations.$inferSelect;
export type InsertVacation = z.infer<typeof insertVacationSchema>;
export type Termination = typeof terminations.$inferSelect;
export type InsertTermination = z.infer<typeof insertTerminationSchema>;
export type Advance = typeof advances.$inferSelect;
export type InsertAdvance = z.infer<typeof insertAdvanceSchema>;
export type Payroll = typeof payroll.$inferSelect;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
