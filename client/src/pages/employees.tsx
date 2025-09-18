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
import { Plus, Search, Eye, Edit, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@shared/schema";
import EmployeeForm from "@/components/employee-form";
import { apiRequest } from "@/lib/queryClient";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Funcionário excluído",
        description: "O funcionário foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o funcionário.",
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = (employees as Employee[]).filter((employee: Employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.cpf.includes(searchTerm)
  );

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este funcionário?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedEmployee(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inativo":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "afastado":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
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
          <h2 className="text-2xl font-bold text-foreground">Gestão de Funcionários</h2>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setSelectedEmployee(null)}
                data-testid="button-add-employee"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedEmployee ? "Editar Funcionário" : "Novo Funcionário"}
                </DialogTitle>
              </DialogHeader>
              <EmployeeForm
                employee={selectedEmployee}
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
                    placeholder="Nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-employees"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Admissão</TableHead>
                    <TableHead>Salário Base</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <User className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm ? "Nenhum funcionário encontrado" : "Nenhum funcionário cadastrado"}
                          </p>
                          {!searchTerm && (
                            <Button 
                              variant="outline" 
                              onClick={() => setIsFormOpen(true)}
                              data-testid="button-first-employee"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar primeiro funcionário
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee: Employee) => (
                      <TableRow 
                        key={employee.id} 
                        className="hover:bg-muted/50"
                        data-testid={`row-employee-${employee.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">{employee.name}</div>
                              <div className="text-sm text-muted-foreground">{employee.email || "—"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{employee.cpf}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(employee.admissionDate).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-sm">
                          R$ {Number(employee.baseSalary).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status === "ativo" ? "Ativo" : 
                             employee.status === "inativo" ? "Inativo" : "Afastado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(employee)}
                              data-testid={`button-edit-${employee.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(employee.id)}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-${employee.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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
