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
import { Plus, Search, Edit, Trash2, User, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Termination, Employee } from "@shared/types";
import TerminationForm from "@/components/termination-form";
import { apiRequest } from "@/lib/queryClient";

export default function Terminations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTermination, setSelectedTermination] = useState<Termination | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: terminations = [], isLoading } = useQuery({
    queryKey: ["/api/terminations"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/terminations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminations"] });
      toast({
        title: "Rescisão excluída",
        description: "A rescisão foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a rescisão.",
        variant: "destructive",
      });
    },
  });

  const getEmployee = (employeeId: string) => {
    return employees.find((emp: Employee) => emp.id === employeeId);
  };

  const filteredTerminations = terminations.filter((termination: Termination) => {
    const employee = getEmployee(termination.employeeId);
    return employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           employee?.cpf.includes(searchTerm);
  });

  const handleEdit = (termination: Termination) => {
    setSelectedTermination(termination);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta rescisão?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedTermination(null);
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      demissao: "Demissão",
      rescisao: "Rescisão",
      aposentadoria: "Aposentadoria",
      abandono: "Abandono",
      falecimento: "Falecimento",
    };
    return labels[reason] || reason;
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "demissao":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "rescisao":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "aposentadoria":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "abandono":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "falecimento":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
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
          <h2 className="text-2xl font-bold text-foreground">Gestão de Rescisões</h2>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setSelectedTermination(null)}
                data-testid="button-new-termination"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Rescisão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTermination ? "Editar Rescisão" : "Nova Rescisão"}
                </DialogTitle>
              </DialogHeader>
              <TerminationForm
                termination={selectedTermination}
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
                    data-testid="input-search-terminations"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terminations Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Data de Rescisão</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerminations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <UserX className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm ? "Nenhuma rescisão encontrada" : "Nenhuma rescisão cadastrada"}
                          </p>
                          {!searchTerm && (
                            <Button 
                              variant="outline" 
                              onClick={() => setIsFormOpen(true)}
                              data-testid="button-first-termination"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar primeira rescisão
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTerminations.map((termination: Termination) => {
                      const employee = getEmployee(termination.employeeId);
                      return (
                        <TableRow 
                          key={termination.id} 
                          className="hover:bg-muted/50"
                          data-testid={`row-termination-${termination.id}`}
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
                            {new Date(termination.terminationDate).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge className={getReasonColor(termination.reason)}>
                              {getReasonLabel(termination.reason)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1 text-xs">
                              <div className="flex items-center space-x-1">
                                <span className={termination.receiptIssued ? "text-green-600" : "text-red-600"}>
                                  {termination.receiptIssued ? "✓" : "✗"}
                                </span>
                                <span>Recibo</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className={termination.fgtsReleased ? "text-green-600" : "text-red-600"}>
                                  {termination.fgtsReleased ? "✓" : "✗"}
                                </span>
                                <span>FGTS</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className={termination.severanceProcessed ? "text-green-600" : "text-red-600"}>
                                  {termination.severanceProcessed ? "✓" : "✗"}
                                </span>
                                <span>Rescisão</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {termination.paymentDate ? 
                              new Date(termination.paymentDate).toLocaleDateString("pt-BR") : 
                              <span className="text-muted-foreground">Pendente</span>
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEdit(termination)}
                                data-testid={`button-edit-${termination.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(termination.id)}
                                className="text-destructive hover:text-destructive"
                                data-testid={`button-delete-${termination.id}`}
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
