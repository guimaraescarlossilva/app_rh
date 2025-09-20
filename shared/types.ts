// Tipos para o sistema de RH
export interface Branch {
  id: string;
  fantasyName: string;
  address: string;
  phone?: string;
  email?: string;
  cnpj: string;
  city: string;
  state: string;
  neighborhood: string;
  zipCode: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsertBranch {
  fantasyName: string;
  address: string;
  phone?: string;
  email?: string;
  cnpj: string;
  city: string;
  state: string;
  neighborhood: string;
  zipCode: string;
  active?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  active: boolean;
  createdAt: string;
}

export interface InsertUser {
  name: string;
  email: string;
  password: string;
  active?: boolean;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface InsertPermissionGroup {
  name: string;
  description?: string;
}

export interface JobPosition {
  id: string;
  name: string;
  description?: string;
  baseSalary?: number;
  createdAt: string;
}

export interface InsertJobPosition {
  name: string;
  description?: string;
  baseSalary?: number;
}

export interface Employee {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  address?: string;
  branchId: string;
  positionId?: string;
  admissionDate: string;
  baseSalary: number;
  agreedSalary: number;
  advancePercentage: number;
  status: 'ativo' | 'inativo' | 'afastado';
  createdAt: string;
  updatedAt: string;
}

// Tipos para formulários otimizados
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'date' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  validation?: (value: string) => string | null;
  options?: { value: string; label: string }[];
  defaultValue?: string | boolean;
}

export interface FormConfig {
  entityName: string;
  title: string;
  fields: FormField[];
  invalidateQueries: string[];
  successMessage?: string;
  errorMessage?: string;
}

// Tipos para operações de API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InsertEmployee {
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  address?: string;
  branchId: string;
  positionId?: string;
  admissionDate: string;
  baseSalary: number;
  agreedSalary: number;
  advancePercentage?: number;
  status?: 'ativo' | 'inativo' | 'afastado';
}

export interface Vacation {
  id: string;
  employeeId: string;
  acquisitionPeriodStart: string;
  acquisitionPeriodEnd: string;
  enjoymentLimit: string;
  enjoymentPeriodStart?: string;
  enjoymentPeriodEnd?: string;
  days: number;
  status: 'pendente' | 'aprovado' | 'em_gozo' | 'concluido' | 'rejeitado';
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface InsertVacation {
  employeeId: string;
  acquisitionPeriodStart: string;
  acquisitionPeriodEnd: string;
  enjoymentLimit: string;
  enjoymentPeriodStart?: string;
  enjoymentPeriodEnd?: string;
  days?: number;
  status?: 'pendente' | 'aprovado' | 'em_gozo' | 'concluido' | 'rejeitado';
  notes?: string;
}

export interface Termination {
  id: string;
  employeeId: string;
  terminationDate: string;
  reason: 'demissao' | 'rescisao' | 'aposentadoria' | 'abandono' | 'falecimento';
  description?: string;
  receiptIssued: boolean;
  fgtsReleased: boolean;
  severanceProcessed: boolean;
  paymentDate?: string;
  createdAt: string;
}

export interface InsertTermination {
  employeeId: string;
  terminationDate: string;
  reason: 'demissao' | 'rescisao' | 'aposentadoria' | 'abandono' | 'falecimento';
  description?: string;
  receiptIssued?: boolean;
  fgtsReleased?: boolean;
  severanceProcessed?: boolean;
  paymentDate?: string;
}

export interface Advance {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseAmount: number;
  percentage: number;
  advanceAmount: number;
  paymentDate?: string;
  status: 'pendente' | 'processado' | 'pago';
  createdAt: string;
}

export interface InsertAdvance {
  employeeId: string;
  month: number;
  year: number;
  baseAmount: number;
  percentage: number;
  advanceAmount: number;
  paymentDate?: string;
  status?: 'pendente' | 'processado' | 'pago';
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  agreedSalary: number;
  advance: number;
  nightShiftAdditional: number;
  nightShiftDsr: number;
  overtime: number;
  overtimeDsr: number;
  vacationBonus: number;
  fiveYearBonus: number;
  positionGratification: number;
  generalGratification: number;
  cashierGratification: number;
  familyAllowance: number;
  holidayPay: number;
  unhealthiness: number;
  maternityLeave: number;
  tips: number;
  others: number;
  vouchers: number;
  grossAmount: number;
  inss: number;
  inssVacation: number;
  irpf: number;
  unionFee: number;
  absences: number;
  absenceReason?: string;
  netAmount: number;
  status: 'pendente' | 'processado' | 'pago';
  processedAt?: string;
  createdAt: string;
}

export interface InsertPayroll {
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  agreedSalary: number;
  advance?: number;
  nightShiftAdditional?: number;
  nightShiftDsr?: number;
  overtime?: number;
  overtimeDsr?: number;
  vacationBonus?: number;
  fiveYearBonus?: number;
  positionGratification?: number;
  generalGratification?: number;
  cashierGratification?: number;
  familyAllowance?: number;
  holidayPay?: number;
  unhealthiness?: number;
  maternityLeave?: number;
  tips?: number;
  others?: number;
  vouchers?: number;
  grossAmount: number;
  inss?: number;
  inssVacation?: number;
  irpf?: number;
  unionFee?: number;
  absences?: number;
  absenceReason?: string;
  netAmount: number;
  status?: 'pendente' | 'processado' | 'pago';
  processedAt?: string;
}

// Schemas de validação simples (sem Zod por enquanto)
export const insertBranchSchema = {
  parse: (data: any) => data as InsertBranch
};

export const insertUserSchema = {
  parse: (data: any) => data as InsertUser
};

export const insertPermissionGroupSchema = {
  parse: (data: any) => data as InsertPermissionGroup
};

export const insertJobPositionSchema = {
  parse: (data: any) => data as InsertJobPosition
};

export const insertEmployeeSchema = {
  parse: (data: any) => data as InsertEmployee
};

export const insertVacationSchema = {
  parse: (data: any) => data as InsertVacation
};

export const insertTerminationSchema = {
  parse: (data: any) => data as InsertTermination
};

export const insertAdvanceSchema = {
  parse: (data: any) => data as InsertAdvance
};

export const insertPayrollSchema = {
  parse: (data: any) => data as InsertPayroll
};
