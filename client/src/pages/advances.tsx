import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Edit, Trash2, User, HandCoins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Advance, Employee } from "@shared/types";
import AdvanceForm from "@/components/advance-form";
import { apiRequest } from "@/lib/queryClient";

export default function Advances() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: advances = [], isLoading } = useQuery({
    queryKey: ["/api/advances"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/advances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advances"] });
      toast({
        title: "Adiantamento excluído",
        description: "O adiantamento foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o adiantamento.",
        variant: "destructive",
      });
    },
  });

  const getEmployee = (employeeId: string) => {
    return employees.find((emp: Employee) => emp.id === employeeId);
  };

  const filteredAdvances = advances.filter((advance: Advance) => {
    const employee = getEmployee(advance.employeeId);
    return employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           employee?.cpf.includes(searchTerm);
  });

  const handleEdit = (advance: Advance) => {
    setSelectedAdvance(advance);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este adiantamento?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedAdvance(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "processado":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pago":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente: "Pendente",
      processado: "Processado",
      pago: "Pago",
    };
    return labels[status] || status;
  };

  const getMonthName = (month: number) => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[month - 1] || month.toString();
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Gestão de Adiantamentos</h2>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setSelectedAdvance(null)}
                data-testid="button-new-advance"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Adiantamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedAdvance ? "Editar Adiantamento" : "Novo Adiantamento"}
                </DialogTitle>
              </DialogHeader>
              <AdvanceForm
                advance={selectedAdvance}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Nome do funcionário ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-advances"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advances Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor Base</TableHead>
                    <TableHead>Percentual</TableHead>
                    <TableHead>Valor Adiantamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdvances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <HandCoins className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm ? "Nenhum adiantamento encontrado" : "Nenhum adiantamento cadastrado"}
                          </p>
                          {!searchTerm && (
                            <Button 
                              variant="outline" 
                              onClick={() => setIsFormOpen(true)}
                              data-testid="button-first-advance"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar primeiro adiantamento
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdvances.map((advance: Advance) => {
                      const employee = getEmployee(advance.employeeId);
                      return (
                        <TableRow 
                          key={advance.id} 
                          className="hover:bg-muted/50"
                          data-testid={`row-advance-${advance.id}`}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground">{employee?.name || "—"}</div>
                                <div className="text-sm text-muted-foreground">{employee?.cpf || "—"}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {getMonthName(advance.month)}/{advance.year}
                          </TableCell>
                          <TableCell className="text-sm">
                            R$ {Number(advance.baseAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {Number(advance.percentage).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            R$ {Number(advance.advanceAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(advance.status)}>
                              {getStatusLabel(advance.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEdit(advance)}
                                data-testid={`button-edit-${advance.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(advance.id)}
                                className="text-destructive hover:text-destructive"
                                data-testid={`button-delete-${advance.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
