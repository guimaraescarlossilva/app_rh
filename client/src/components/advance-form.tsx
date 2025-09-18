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
import { useToast } from "@/hooks/use-toast";
import { insertAdvanceSchema, type Advance, type InsertAdvance, type Employee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AdvanceFormProps {
  advance?: Advance | null;
  onSuccess: () => void;
}

export default function AdvanceForm({ advance, onSuccess }: AdvanceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const form = useForm<InsertAdvance>({
    resolver: zodResolver(insertAdvanceSchema),
    defaultValues: {
      employeeId: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      baseAmount: "0",
      percentage: "40.00",
      advanceAmount: "0",
      paymentDate: "",
      status: "pendente",
    },
  });

  const watchedValues = form.watch(["baseAmount", "percentage"]);

  useEffect(() => {
    const [baseAmount, percentage] = watchedValues;
    if (baseAmount && percentage) {
      const base = parseFloat(baseAmount) || 0;
      const perc = parseFloat(percentage) || 0;
      const advanceAmount = (base * perc / 100).toFixed(2);
      form.setValue("advanceAmount", advanceAmount);
    }
  }, [watchedValues, form]);

  useEffect(() => {
    if (advance) {
      form.reset({
        employeeId: advance.employeeId,
        month: advance.month,
        year: advance.year,
        baseAmount: advance.baseAmount,
        percentage: advance.percentage,
        advanceAmount: advance.advanceAmount,
        paymentDate: advance.paymentDate || "",
        status: advance.status,
      });
    }
  }, [advance, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertAdvance) => {
      const response = await apiRequest("POST", "/api/advances", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advances"] });
      toast({
        title: "Adiantamento cadastrado",
        description: "O adiantamento foi cadastrado com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar o adiantamento.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertAdvance) => {
      const response = await apiRequest("PUT", `/api/advances/${advance!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advances"] });
      toast({
        title: "Adiantamento atualizado",
        description: "Os dados do adiantamento foram atualizados com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o adiantamento.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAdvance) => {
    const submitData = {
      ...data,
      paymentDate: data.paymentDate || null,
    };

    if (advance) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

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
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mês</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger data-testid="select-month">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
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
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger data-testid="select-year">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="baseAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Base</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field}
                    data-testid="input-base-amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Percentual (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="40.00" 
                    {...field}
                    data-testid="input-percentage"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="advanceAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Adiantamento</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field}
                    readOnly
                    className="bg-muted"
                    data-testid="input-advance-amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="processado">Processado</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-submit">
            {isLoading ? "Salvando..." : advance ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
