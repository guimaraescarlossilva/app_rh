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
import { insertTerminationSchema, type Termination, type InsertTermination, type Employee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface TerminationFormProps {
  termination?: Termination | null;
  onSuccess: () => void;
}

export default function TerminationForm({ termination, onSuccess }: TerminationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const form = useForm<InsertTermination>({
    resolver: zodResolver(insertTerminationSchema),
    defaultValues: {
      employeeId: "",
      terminationDate: "",
      reason: "demissao",
      description: "",
      receiptIssued: false,
      fgtsReleased: false,
      severanceProcessed: false,
      paymentDate: "",
    },
  });

  useEffect(() => {
    if (termination) {
      form.reset({
        employeeId: termination.employeeId,
        terminationDate: termination.terminationDate,
        reason: termination.reason,
        description: termination.description || "",
        receiptIssued: termination.receiptIssued,
        fgtsReleased: termination.fgtsReleased,
        severanceProcessed: termination.severanceProcessed,
        paymentDate: termination.paymentDate || "",
      });
    }
  }, [termination, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertTermination) => {
      const response = await apiRequest("POST", "/api/terminations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminations"] });
      toast({
        title: "Rescisão cadastrada",
        description: "A rescisão foi cadastrada com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar a rescisão.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertTermination) => {
      const response = await apiRequest("PUT", `/api/terminations/${termination!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminations"] });
      toast({
        title: "Rescisão atualizada",
        description: "Os dados da rescisão foram atualizados com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a rescisão.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTermination) => {
    const submitData = {
      ...data,
      paymentDate: data.paymentDate || null,
    };

    if (termination) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
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
            name="terminationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Rescisão</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-termination-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-reason">
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="demissao">Demissão</SelectItem>
                    <SelectItem value="rescisao">Rescisão</SelectItem>
                    <SelectItem value="aposentadoria">Aposentadoria</SelectItem>
                    <SelectItem value="abandono">Abandono</SelectItem>
                    <SelectItem value="falecimento">Falecimento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detalhes sobre a rescisão..."
                  {...field}
                  data-testid="textarea-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">Status dos Documentos</h4>
          
          <FormField
            control={form.control}
            name="receiptIssued"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-receipt"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Recibo emitido</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fgtsReleased"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-fgts"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>FGTS liberado</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="severanceProcessed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-severance"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Rescisão processada</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Pagamento (Opcional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid="input-payment-date" />
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
            {isLoading ? "Salvando..." : termination ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
