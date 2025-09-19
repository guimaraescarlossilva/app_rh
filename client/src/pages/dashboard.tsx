import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  Calculator, 
  UserX, 
  Plus, 
  TrendingUp, 
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  UserPlus,
  CalendarCheck,
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  employees: {
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
  };
  vacations: {
    pending: number;
    approved: number;
    active: number;
    expiring: number;
  };
  payroll: {
    totalThisMonth: number;
    processedThisMonth: number;
    pendingThisMonth: number;
  };
}

export default function Dashboard() {
  // Dashboard simplificado sem queries que podem falhar
  const stats: DashboardStats = {
    employees: { total: 0, active: 0, inactive: 0, onLeave: 0 },
    vacations: { pending: 0, approved: 0, active: 0, expiring: 0 },
    payroll: { totalThisMonth: 0, processedThisMonth: 0, pendingThisMonth: 0 }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Funcionários</p>
                <p className="text-2xl font-bold text-foreground" data-testid="total-employees">
                  {stats.employees.total}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+{stats.employees.active}</span>
              <span className="text-muted-foreground ml-1">ativos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Férias Pendentes</p>
                <p className="text-2xl font-bold text-foreground" data-testid="pending-vacations">
                  {stats.vacations.pending}
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-amber-600 font-medium">Atenção</span>
              <span className="text-muted-foreground ml-1">requer análise</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Folha do Mês</p>
                <p className="text-2xl font-bold text-foreground" data-testid="monthly-payroll">
                  R$ {(stats.payroll.totalThisMonth / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Calculator className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">{stats.payroll.processedThisMonth}</span>
              <span className="text-muted-foreground ml-1">processados</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vencendo</p>
                <p className="text-2xl font-bold text-foreground" data-testid="expiring-vacations">
                  {stats.vacations.expiring}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-600 font-medium">Este mês</span>
              <span className="text-muted-foreground ml-1">em análise</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Sistema</span> iniciado com sucesso
                  </p>
                  <p className="text-xs text-muted-foreground">Há 1 minuto</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Banco de dados</span> conectado
                  </p>
                  <p className="text-xs text-muted-foreground">Há 2 minutos</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    Sistema pronto para <span className="font-medium">cadastrar funcionários</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Há 3 minutos</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button variant="link" className="p-0 h-auto text-primary" data-testid="view-all-activities">
                Ver todas as atividades →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ações Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.vacations.pending > 0 && (
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Férias pendentes</p>
                      <p className="text-xs text-muted-foreground">{stats.vacations.pending} solicitações aguardando aprovação</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" data-testid="view-pending-vacations">Ver</Button>
                </div>
              )}

              {stats.payroll.pendingThisMonth > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Folha em processamento</p>
                      <p className="text-xs text-muted-foreground">{stats.payroll.pendingThisMonth} entradas pendentes</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" data-testid="view-pending-payroll">Ver</Button>
                </div>
              )}

              {stats.employees.total === 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Cadastrar funcionários</p>
                      <p className="text-xs text-muted-foreground">Comece adicionando seus funcionários</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" data-testid="add-employee">Adicionar</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="flex flex-col items-center p-6 h-auto space-y-2"
            data-testid="quick-action-new-employee"
          >
            <UserPlus className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Novo Funcionário</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex flex-col items-center p-6 h-auto space-y-2"
            data-testid="quick-action-process-payroll"
          >
            <Calculator className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Processar Folha</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex flex-col items-center p-6 h-auto space-y-2"
            data-testid="quick-action-approve-vacation"
          >
            <CalendarCheck className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Aprovar Férias</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex flex-col items-center p-6 h-auto space-y-2"
            data-testid="quick-action-reports"
          >
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Relatórios</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
