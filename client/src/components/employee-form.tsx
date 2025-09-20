import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { type Employee, type InsertEmployee } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const employeeFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  branchId: z.string().min(1, "Filial é obrigatória"),
  positionId: z.string().optional(),
  admissionDate: z.string().min(1, "Data de admissão é obrigatória"),
  baseSalary: z.string().min(1, "Salário base é obrigatório"),
  agreedSalary: z.string().min(1, "Salário acordado é obrigatório"),
  advancePercentage: z.string().optional(),
  status: z.enum(["ativo", "inativo", "afastado"]).default("ativo"),
});

interface EmployeeFormProps {
  employee?: Employee | null;
  onSuccess: () => void;
}

export default function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobPositions = [] } = useQuery({
    queryKey: ["/api/job-positions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/job-positions");
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/branches");
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      phone: "",
      address: "",
      branchId: "",
      positionId: "",
      admissionDate: "",
      baseSalary: "0",
      agreedSalary: "0",
      advancePercentage: "40.00",
      status: "ativo",
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        name: employee.name,
        cpf: employee.cpf,
        email: employee.email || "",
        phone: employee.phone || "",
        address: employee.address || "",
        branchId: employee.branchId || "",
        positionId: employee.positionId || "",
        admissionDate: employee.admissionDate.split('T')[0], // Converte para formato date input
        baseSalary: String(employee.baseSalary),
        agreedSalary: String(employee.agreedSalary),
        advancePercentage: String(employee.advancePercentage || 40.00),
        status: employee.status,
      });
    }
  }, [employee, form]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof employeeFormSchema>) => {
      // Converte strings para números onde necessário
      const employeeData: InsertEmployee = {
        ...data,
        baseSalary: Number(data.baseSalary),
        agreedSalary: Number(data.agreedSalary),
        advancePercentage: data.advancePercentage ? Number(data.advancePercentage) : 40.00,
      };
      const response = await apiRequest("POST", "/api/employees", employeeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Funcionário cadastrado",
        description: "O funcionário foi cadastrado com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar o funcionário.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof employeeFormSchema>) => {
      // Converte strings para números onde necessário
      const employeeData: InsertEmployee = {
        ...data,
        baseSalary: Number(data.baseSalary),
        agreedSalary: Number(data.agreedSalary),
        advancePercentage: data.advancePercentage ? Number(data.advancePercentage) : 40.00,
      };
      const response = await apiRequest("PUT", `/api/employees/${employee!.id}`, employeeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Funcionário atualizado",
        description: "Os dados do funcionário foram atualizados com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o funcionário.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof employeeFormSchema>) => {
    if (employee) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
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
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} data-testid="input-cpf" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
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
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} data-testid="input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Endereço completo" {...field} data-testid="input-address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Filial *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-branch">
                      <SelectValue placeholder="Selecione a filial" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {branches.map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.fantasyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="positionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Função</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-position">
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {jobPositions.map((position: any) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="admissionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Admissão</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-admission-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="baseSalary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salário Base</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-base-salary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreedSalary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salário Acordado</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-agreed-salary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="advancePercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>% Adiantamento</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="40.00" {...field} data-testid="input-advance-percentage" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="afastado">Afastado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-submit">
            {isLoading ? "Salvando..." : employee ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
