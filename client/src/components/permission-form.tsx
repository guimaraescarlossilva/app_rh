import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  insertUserSchema, 
  insertPermissionGroupSchema,
  type User as SystemUser, 
  type InsertUser, 
  type PermissionGroup,
  type InsertPermissionGroup
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

interface PermissionFormProps {
  type: "user" | "group";
  data?: SystemUser | PermissionGroup | null;
  onSuccess: () => void;
}

const userFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  restaurantIds: z.array(z.string()).min(1, "Selecione pelo menos um restaurante"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function PermissionForm({ type, data, onSuccess }: PermissionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissionGroups = [] } = useQuery({
    queryKey: ["/api/permission-groups"],
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ["/api/restaurants"],
  });

  const userForm = useForm<InsertUser & { confirmPassword: string; restaurantIds: string[] }>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      active: true,
      restaurantIds: [],
    },
  });

  const groupForm = useForm<InsertPermissionGroup>({
    resolver: zodResolver(insertPermissionGroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const form = type === "user" ? userForm : groupForm;

  useEffect(() => {
    if (data && type === "user") {
      const user = data as SystemUser;
      userForm.reset({
        name: user.name,
        email: user.email,
        password: "",
        confirmPassword: "",
        active: user.active,
      });
    } else if (data && type === "group") {
      const group = data as PermissionGroup;
      groupForm.reset({
        name: group.name,
        description: group.description || "",
      });
    }
  }, [data, type, userForm, groupForm]);

  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário cadastrado",
        description: "O usuário foi cadastrado com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar o usuário.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<InsertUser>) => {
      const user = data as SystemUser;
      const response = await apiRequest("PUT", `/api/users/${user.id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário atualizado",
        description: "Os dados do usuário foram atualizados com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: InsertPermissionGroup) => {
      const response = await apiRequest("POST", "/api/permission-groups", groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permission-groups"] });
      toast({
        title: "Grupo cadastrado",
        description: "O grupo de permissão foi cadastrado com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar o grupo de permissão.",
        variant: "destructive",
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (groupData: InsertPermissionGroup) => {
      const group = data as PermissionGroup;
      const response = await apiRequest("PUT", `/api/permission-groups/${group.id}`, groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permission-groups"] });
      toast({
        title: "Grupo atualizado",
        description: "Os dados do grupo foram atualizados com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o grupo de permissão.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (formData: any) => {
    if (type === "user") {
      const { confirmPassword, ...userData } = formData;
      if (data) {
        // Only include password if it's not empty
        const updateData = userData.password ? userData : { ...userData, password: undefined };
        updateUserMutation.mutate(updateData);
      } else {
        createUserMutation.mutate(userData);
      }
    } else {
      if (data) {
        updateGroupMutation.mutate(formData);
      } else {
        createGroupMutation.mutate(formData);
      }
    }
  };

  const isLoading = 
    createUserMutation.isPending || 
    updateUserMutation.isPending ||
    createGroupMutation.isPending ||
    updateGroupMutation.isPending;

  if (type === "user") {
    return (
      <Form {...userForm}>
        <form onSubmit={userForm.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={userForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome completo" {...field} data-testid="input-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={userForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={userForm.control}
            name="restaurantIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restaurantes *</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {restaurants.map((restaurant: any) => (
                    <div key={restaurant.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`restaurant-${restaurant.id}`}
                        checked={field.value?.includes(restaurant.id)}
                        onCheckedChange={(checked) => {
                          const currentValue = field.value || [];
                          if (checked) {
                            field.onChange([...currentValue, restaurant.id]);
                          } else {
                            field.onChange(currentValue.filter((id: string) => id !== restaurant.id));
                          }
                        }}
                      />
                      <Label htmlFor={`restaurant-${restaurant.id}`} className="text-sm">
                        {restaurant.fantasyName}
                      </Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={userForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {data ? "Nova Senha (deixe vazio para manter)" : "Senha"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Digite a senha" 
                      {...field}
                      data-testid="input-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={userForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Confirme a senha" 
                      {...field}
                      data-testid="input-confirm-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={userForm.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-active"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Usuário ativo</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-submit">
              {isLoading ? "Salvando..." : data ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...groupForm}>
      <form onSubmit={groupForm.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={groupForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Grupo</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome do grupo" {...field} data-testid="input-group-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={groupForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o grupo e suas permissões..."
                  {...field}
                  data-testid="textarea-group-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-submit">
            {isLoading ? "Salvando..." : data ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
