import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Check, X, Eye, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Vacation, Employee } from "@shared/schema";
import VacationForm from "@/components/vacation-form";
import { apiRequest } from "@/lib/queryClient";

export default function Vacations() {
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vacations = [], isLoading } = useQuery({
    queryKey: ["/api/vacations"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: vacationStats } = useQuery({
    queryKey: ["/api/vacations/stats"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PUT", `/api/vacations/${id}`, { status: "aprovado" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vacations/stats"] });
      toast({
        title: "Férias aprovadas",
        description: "A solicitação de férias foi aprovada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar a solicitação de férias.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PUT", `/api/vacations/${id}`, { status: "rejeitado" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vacations/stats"] });
      toast({
        title: "Férias rejeitadas",
        description: "A solicitação de férias foi rejeitada.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao rejeitar",
        description: "Não foi possível rejeitar a solicitação de férias.",
        variant: "destructive",
      });
    },
  });

  const getEmployee = (employeeId: string) => {
    return employees.find((emp: Employee) => emp.id === employeeId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "aprovado":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "em_gozo":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "concluido":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "rejeitado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente: "Pendente",
      aprovado: "Aprovado",
      em_gozo: "Em Gozo",
      concluido: "Concluído",
      rejeitado: "Rejeitado",
    };
    return labels[status] || status;
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedVacation(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Controle de Férias</h2>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setSelectedVacation(null)}
                data-testid="button-new-vacation"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Solicitação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Solicitação de Férias</DialogTitle>
              </DialogHeader>
              <VacationForm
                vacation={selectedVacation}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vacation Requests */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Solicitações de Férias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vacations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex flex-col items-center space-y-2">
                              <Calendar className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">Nenhuma solicitação de férias encontrada</p>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsFormOpen(true)}
                                data-testid="button-first-vacation"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Criar primeira solicitação
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        vacations.map((vacation: Vacation) => {
                          const employee = getEmployee(vacation.employeeId);
                          return (
                            <TableRow 
                              key={vacation.id}
                              data-testid={`row-vacation-${vacation.id}`}
                            >
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">{employee?.name || "—"}</div>
                                    <div className="text-xs text-muted-foreground">
                                      CPF: {employee?.cpf || "—"}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {vacation.enjoymentPeriodStart && vacation.enjoymentPeriodEnd ? (
                                    <>
                                      {new Date(vacation.enjoymentPeriodStart).toLocaleDateString("pt-BR")} -<br />
                                      {new Date(vacation.enjoymentPeriodEnd).toLocaleDateString("pt-BR")}
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground">Não definido</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{vacation.days}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(vacation.status)}>
                                  {getStatusLabel(vacation.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  {vacation.status === "pendente" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => approveMutation.mutate(vacation.id)}
                                        className="text-green-600 hover:text-green-700"
                                        data-testid={`button-approve-${vacation.id}`}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => rejectMutation.mutate(vacation.id)}
                                        className="text-red-600 hover:text-red-700"
                                        data-testid={`button-reject-${vacation.id}`}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    data-testid={`button-view-${vacation.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Resumo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pendentes</span>
                    <span className="font-semibold text-amber-600" data-testid="stat-pending">
                      {vacationStats?.pending || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Em gozo</span>
                    <span className="font-semibold text-blue-600" data-testid="stat-active">
                      {vacationStats?.active || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Vencendo em 30 dias</span>
                    <span className="font-semibold text-red-600" data-testid="stat-expiring">
                      {vacationStats?.expiring || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aprovadas</span>
                    <span className="font-semibold text-green-600" data-testid="stat-approved">
                      {vacationStats?.approved || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
