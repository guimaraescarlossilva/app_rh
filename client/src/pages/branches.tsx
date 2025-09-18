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
import { Plus, Search, Eye, Edit, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Branch } from "@shared/schema";
import BranchForm from "@/components/branch-form";
import { apiRequest } from "@/lib/queryClient";

export default function Branches() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch branches
  const { data: branches = [], isLoading, error } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      console.log("🔍 [FRONTEND] Buscando filiais...");
      try {
        const response = await apiRequest<Branch[]>("/api/branches");
        const data = await response.json();
        console.log("✅ [FRONTEND] Filiais recebidas:", data);
        return data;
      } catch (error) {
        console.error("❌ [FRONTEND] Erro ao buscar filiais:", error);
        throw error;
      }
    },
  });

  // Log dos dados recebidos
  console.log("📊 [FRONTEND] Estado da query:", { branches, isLoading, error });

  // Create branch mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/branches", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setIsFormOpen(false);
      toast({
        title: "Sucesso",
        description: "Filial cadastrada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar filial.",
        variant: "destructive",
      });
    },
  });

  // Update branch mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/branches/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setEditingBranch(null);
      toast({
        title: "Sucesso",
        description: "Filial atualizada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar filial.",
        variant: "destructive",
      });
    },
  });

  // Delete branch mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/branches/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({
        title: "Sucesso",
        description: "Filial removida com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover filial.",
        variant: "destructive",
      });
    },
  });

  const filteredBranches = branches.filter((branch) =>
    branch.fantasyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.cnpj.includes(searchTerm) ||
    branch.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta filial?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingBranch(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Filiais</h1>
          <p className="text-muted-foreground">
            Gerencie as filiais do sistema
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBranch(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Filial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? "Editar Filial" : "Nova Filial"}
              </DialogTitle>
            </DialogHeader>
            <BranchForm
              branch={editingBranch}
              onSubmit={handleFormSubmit}
              onCancel={handleFormClose}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Filiais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">
                      {branch.fantasyName}
                    </TableCell>
                    <TableCell>{branch.cnpj}</TableCell>
                    <TableCell>{branch.city}</TableCell>
                    <TableCell>{branch.state}</TableCell>
                    <TableCell>
                      <Badge variant={branch.active ? "default" : "secondary"}>
                        {branch.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(branch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(branch.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredBranches.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma filial encontrada.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
