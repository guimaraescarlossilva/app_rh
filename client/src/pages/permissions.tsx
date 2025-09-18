import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Edit, Trash2, User, Shield, Users, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User as SystemUser, PermissionGroup } from "@shared/schema";
import PermissionForm from "@/components/permission-form";
import { apiRequest } from "@/lib/queryClient";

export default function Permissions() {
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: permissionGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/permission-groups"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/permission-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permission-groups"] });
      toast({
        title: "Grupo excluído",
        description: "O grupo de permissão foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o grupo de permissão.",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: SystemUser) => {
    setSelectedUser(user);
    setIsUserFormOpen(true);
  };

  const handleEditGroup = (group: PermissionGroup) => {
    setSelectedGroup(group);
    setIsGroupFormOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleDeleteGroup = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este grupo?")) {
      deleteGroupMutation.mutate(id);
    }
  };

  const handleUserFormSuccess = () => {
    setIsUserFormOpen(false);
    setSelectedUser(null);
  };

  const handleGroupFormSuccess = () => {
    setIsGroupFormOpen(false);
    setSelectedGroup(null);
  };

  const isLoading = usersLoading || groupsLoading;

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
          <h2 className="text-2xl font-bold text-foreground">Gestão de Permissões</h2>
          <div className="flex space-x-3">
            <Dialog open={isGroupFormOpen} onOpenChange={setIsGroupFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedGroup(null)}
                  data-testid="button-new-group"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Novo Grupo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedGroup ? "Editar Grupo" : "Novo Grupo"}
                  </DialogTitle>
                </DialogHeader>
                <PermissionForm
                  type="group"
                  data={selectedGroup}
                  onSuccess={handleGroupFormSuccess}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setSelectedUser(null)}
                  data-testid="button-new-user"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedUser ? "Editar Usuário" : "Novo Usuário"}
                  </DialogTitle>
                </DialogHeader>
                <PermissionForm
                  type="user"
                  data={selectedUser}
                  onSuccess={handleUserFormSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" data-testid="tab-users">Usuários</TabsTrigger>
            <TabsTrigger value="groups" data-testid="tab-groups">Grupos de Permissão</TabsTrigger>
            <TabsTrigger value="modules" data-testid="tab-modules">Módulos</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex flex-col items-center space-y-2">
                              <User className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsUserFormOpen(true)}
                                data-testid="button-first-user"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar primeiro usuário
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user: SystemUser) => (
                          <TableRow 
                            key={user.id}
                            data-testid={`row-user-${user.id}`}
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-foreground">{user.name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{user.email}</TableCell>
                            <TableCell>
                              <Badge className={user.active ? 
                                "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : 
                                "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }>
                                {user.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  data-testid={`button-edit-user-${user.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-destructive hover:text-destructive"
                                  data-testid={`button-delete-user-${user.id}`}
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
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {permissionGroups.length === 0 ? (
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center space-y-2 text-center">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">Nenhum grupo de permissão cadastrado</p>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsGroupFormOpen(true)}
                          data-testid="button-first-group"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Criar primeiro grupo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                permissionGroups.map((group: PermissionGroup) => (
                  <Card key={group.id} data-testid={`card-group-${group.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">{group.name}</CardTitle>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGroup(group)}
                            data-testid={`button-edit-group-${group.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGroup(group.id)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-group-${group.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {group.description || "Sem descrição"}
                      </p>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Criado em:</span>
                        <span className="ml-2 font-medium">
                          {new Date(group.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Dashboard", description: "Painel principal com estatísticas", icon: Shield },
                { name: "Funcionários", description: "Gestão de funcionários", icon: Users },
                { name: "Férias", description: "Controle de férias", icon: Shield },
                { name: "Rescisões", description: "Gestão de rescisões", icon: Shield },
                { name: "Adiantamentos", description: "Controle de adiantamentos", icon: Shield },
                { name: "Folha Salarial", description: "Gestão da folha salarial", icon: Shield },
                { name: "Permissões", description: "Gestão de usuários e permissões", icon: Key },
              ].map((module) => (
                <Card key={module.name} data-testid={`card-module-${module.name.toLowerCase()}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <module.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{module.name}</h3>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
