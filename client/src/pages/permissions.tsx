import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Plus, Edit, Trash2, User, Shield, Users, Key, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User as SystemUser, PermissionGroup } from "@shared/types";
import PermissionForm from "@/components/permission-form";
import { apiRequest } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Permissions() {
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    data: users = [], 
    isLoading: usersLoading, 
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return response.json();
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: permissionGroups = [], 
    isLoading: groupsLoading, 
    error: groupsError,
    refetch: refetchGroups
  } = useQuery({
    queryKey: ["/api/permission-groups"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/permission-groups");
      return response.json();
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
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

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[160px]" />
          </div>
        </div>
      ))}
    </div>
  );

  const ErrorAlert = ({ error, retry }: { error: Error; retry: () => void }) => (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Erro ao carregar dados: {error.message}
        <Button variant="outline" size="sm" className="ml-2" onClick={retry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>
  );

  if (usersError || groupsError) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Gestão de Permissões</h2>
        </div>
        {usersError && <ErrorAlert error={usersError} retry={refetchUsers} />}
        {groupsError && <ErrorAlert error={groupsError} retry={refetchGroups} />}
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" data-testid="tab-users">Usuários</TabsTrigger>
            <TabsTrigger value="groups" data-testid="tab-groups">Grupos de Permissão</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Usuários do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Grupos</TableHead>
                        <TableHead>Filiais</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
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
                              <Badge variant="secondary">
                                {(user as any).groupNames || "Nenhum"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {(user as any).branchNames || "Nenhuma"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.active ? "default" : "secondary"}>
                                {user.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  disabled={deleteUserMutation.isPending}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Grupos de Permissão
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupsLoading ? (
                  <LoadingSkeleton />
                ) : permissionGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhum grupo de permissão cadastrado</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsGroupFormOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Criar primeiro grupo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Usuários</TableHead>
                        <TableHead>Permissões</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissionGroups.map((group: PermissionGroup) => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>{group.description || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {(group as any).userCount || 0} usuários
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {(group as any).permissionCount || 0} permissões
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(group.createdAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditGroup(group)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteGroupMutation.mutate(group.id)}
                                disabled={deleteGroupMutation.isPending}
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
