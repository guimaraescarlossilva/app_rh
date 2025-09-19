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
import { useToast } from "@/hooks/use-toast";
import { insertVacationSchema, type Vacation, type InsertVacation, type Employee } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";

interface VacationFormProps {
  vacation?: Vacation | null;
  onSuccess: () => void;
}

export default function VacationForm({ vacation, onSuccess }: VacationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const form = useForm<InsertVacation>({
    resolver: zodResolver(insertVacationSchema),
    defaultValues: {
      employeeId: "",
      acquisitionPeriodStart: "",
      acquisitionPeriodEnd: "",
      enjoymentLimit: "",
      enjoymentPeriodStart: "",
      enjoymentPeriodEnd: "",
      days: 30,
      status: "pendente",
      notes: "",
    },
  });

  useEffect(() => {
    if (vacation) {
      form.reset({
        employeeId: vacation.employeeId,
        acquisitionPeriodStart: vacation.acquisitionPeriodStart,
        acquisitionPeriodEnd: vacation.acquisitionPeriodEnd,
        enjoymentLimit: vacation.enjoymentLimit,
        enjoymentPeriodStart: vacation.enjoymentPeriodStart || "",
        enjoymentPeriodEnd: vacation.enjoymentPeriodEnd || "",
        days: vacation.days,
        status: vacation.status,
        notes: vacation.notes || "",
      });
    }
  }, [vacation, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertVacation) => {
      const response = await apiRequest("POST", "/api/vacations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vacations/stats"] });
      toast({
        title: "Solicitação criada",
        description: "A solicitação de férias foi criada com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao criar",
        description: "Não foi possível criar a solicitação de férias.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertVacation) => {
      const response = await apiRequest("PUT", `/api/vacations/${vacation!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vacations/stats"] });
      toast({
        title: "Solicitação atualizada",
        description: "A solicitação de férias foi atualizada com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a solicitação de férias.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVacation) => {
    if (vacation) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Funcionário</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-employee">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees.map((employee: Employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="acquisitionPeriodStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Início Período Aquisitivo</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-acquisition-start" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acquisitionPeriodEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fim Período Aquisitivo</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-acquisition-end" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enjoymentLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite para Gozo</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-enjoyment-limit" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dias de Férias</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    max="30" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                    data-testid="input-days"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enjoymentPeriodStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Início do Gozo (Opcional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-enjoyment-start" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enjoymentPeriodEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fim do Gozo (Opcional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-enjoyment-end" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em_gozo">Em Gozo</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações sobre as férias..."
                  {...field}
                  data-testid="textarea-notes"
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
            {isLoading ? "Salvando..." : vacation ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
