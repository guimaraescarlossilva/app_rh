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
import { insertPayrollSchema, type Payroll, type InsertPayroll, type Employee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface PayrollFormProps {
  payroll?: Payroll | null;
  onSuccess: () => void;
}

export default function PayrollForm({ payroll, onSuccess }: PayrollFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const form = useForm<InsertPayroll>({
    resolver: zodResolver(insertPayrollSchema),
    defaultValues: {
      employeeId: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      baseSalary: "0",
      agreedSalary: "0",
      advance: "0",
      nightShiftAdditional: "0",
      nightShiftDsr: "0",
      overtime: "0",
      overtimeDsr: "0",
      vacationBonus: "0",
      fiveYearBonus: "0",
      positionGratification: "0",
      generalGratification: "0",
      cashierGratification: "0",
      familyAllowance: "0",
      holidayPay: "0",
      unhealthiness: "0",
      maternityLeave: "0",
      tips: "0",
      others: "0",
      vouchers: "0",
      grossAmount: "0",
      inss: "0",
      inssVacation: "0",
      irpf: "0",
      unionFee: "0",
      absences: "0",
      absenceReason: "",
      netAmount: "0",
      status: "pendente",
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    // Calculate gross amount
    const earnings = [
      "baseSalary", "agreedSalary", "nightShiftAdditional", "nightShiftDsr",
      "overtime", "overtimeDsr", "vacationBonus", "fiveYearBonus",
      "positionGratification", "generalGratification", "cashierGratification",
      "familyAllowance", "holidayPay", "unhealthiness", "maternityLeave",
      "tips", "others"
    ];

    const totalEarnings = earnings.reduce((sum, field) => {
      return sum + (parseFloat(watchedValues[field as keyof typeof watchedValues] as string) || 0);
    }, 0);

    form.setValue("grossAmount", totalEarnings.toFixed(2));

    // Calculate net amount
    const deductions = [
      "advance", "vouchers", "inss", "inssVacation", "irpf", "unionFee", "absences"
    ];

    const totalDeductions = deductions.reduce((sum, field) => {
      return sum + (parseFloat(watchedValues[field as keyof typeof watchedValues] as string) || 0);
    }, 0);

    const netAmount = totalEarnings - totalDeductions;
    form.setValue("netAmount", netAmount.toFixed(2));
  }, [watchedValues, form]);

  useEffect(() => {
    if (payroll) {
      form.reset({
        employeeId: payroll.employeeId,
        month: payroll.month,
        year: payroll.year,
        baseSalary: payroll.baseSalary,
        agreedSalary: payroll.agreedSalary,
        advance: payroll.advance || "0",
        nightShiftAdditional: payroll.nightShiftAdditional || "0",
        nightShiftDsr: payroll.nightShiftDsr || "0",
        overtime: payroll.overtime || "0",
        overtimeDsr: payroll.overtimeDsr || "0",
        vacationBonus: payroll.vacationBonus || "0",
        fiveYearBonus: payroll.fiveYearBonus || "0",
        positionGratification: payroll.positionGratification || "0",
        generalGratification: payroll.generalGratification || "0",
        cashierGratification: payroll.cashierGratification || "0",
        familyAllowance: payroll.familyAllowance || "0",
        holidayPay: payroll.holidayPay || "0",
        unhealthiness: payroll.unhealthiness || "0",
        maternityLeave: payroll.maternityLeave || "0",
        tips: payroll.tips || "0",
        others: payroll.others || "0",
        vouchers: payroll.vouchers || "0",
        grossAmount: payroll.grossAmount,
        inss: payroll.inss || "0",
        inssVacation: payroll.inssVacation || "0",
        irpf: payroll.irpf || "0",
        unionFee: payroll.unionFee || "0",
        absences: payroll.absences || "0",
        absenceReason: payroll.absenceReason || "",
        netAmount: payroll.netAmount,
        status: payroll.status,
      });
    }
  }, [payroll, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertPayroll) => {
      const response = await apiRequest("POST", "/api/payroll", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/stats"] });
      toast({
        title: "Folha salarial cadastrada",
        description: "A folha salarial foi cadastrada com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar a folha salarial.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertPayroll) => {
      const response = await apiRequest("PUT", `/api/payroll/${payroll!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/stats"] });
      toast({
        title: "Folha salarial atualizada",
        description: "Os dados da folha salarial foram atualizados com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a folha salarial.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPayroll) => {
    if (payroll) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Informações Básicas</h3>
          
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
        </div>

        {/* Earnings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Proventos</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="baseSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salário Base</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-base-salary" />
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
                    <Input type="number" step="0.01" {...field} data-testid="input-agreed-salary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nightShiftAdditional"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adicional Noturno</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-night-shift" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="overtime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora Extra</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-overtime" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vacationBonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Férias</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-vacation-bonus" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fiveYearBonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quinquênio 5%</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-five-year-bonus" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="positionGratification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gratificação de Função</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-position-gratification" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="familyAllowance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salário Família</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-family-allowance" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tips"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gorjeta</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-tips" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Deductions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Descontos</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="advance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adiantamento</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-advance" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>INSS</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-inss" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="irpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imposto de Renda</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-irpf" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unionFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custeio Sindical</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-union-fee" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="absences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faltas</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-absences" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vouchers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vales</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} data-testid="input-vouchers" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="absenceReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo das Faltas</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva o motivo das faltas..."
                    {...field}
                    data-testid="textarea-absence-reason"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Totals */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Totais</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="grossAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Bruto</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      readOnly 
                      className="bg-muted"
                      data-testid="input-gross-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="netAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Líquido</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      readOnly 
                      className="bg-muted font-medium"
                      data-testid="input-net-amount"
                    />
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
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="processado">Processado</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-submit">
            {isLoading ? "Salvando..." : payroll ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
