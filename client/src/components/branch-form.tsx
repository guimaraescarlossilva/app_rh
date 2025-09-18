import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Branch } from "@shared/schema";

interface BranchFormProps {
  branch?: Branch | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const states = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function BranchForm({ 
  branch, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: BranchFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (branch) {
      setValue("fantasyName", branch.fantasyName);
      setValue("address", branch.address);
      setValue("phone", branch.phone || "");
      setValue("email", branch.email || "");
      setValue("cnpj", branch.cnpj);
      setValue("city", branch.city);
      setValue("state", branch.state);
      setValue("neighborhood", branch.neighborhood);
      setValue("zipCode", branch.zipCode);
      setActive(branch.active);
    }
  }, [branch, setValue]);

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/^(\d{5})(\d)/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else {
      return numbers.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
  };

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      active,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fantasyName">Nome Fantasia *</Label>
          <Input
            id="fantasyName"
            {...register("fantasyName", { required: "Nome fantasia é obrigatório" })}
            placeholder="Ex: Restaurante do João"
          />
          {errors.fantasyName && (
            <p className="text-sm text-red-500">{errors.fantasyName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ *</Label>
          <Input
            id="cnpj"
            {...register("cnpj", { 
              required: "CNPJ é obrigatório",
              pattern: {
                value: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
                message: "CNPJ deve estar no formato 00.000.000/0000-00"
              }
            })}
            placeholder="00.000.000/0000-00"
            onChange={(e) => {
              const formatted = formatCNPJ(e.target.value);
              setValue("cnpj", formatted);
            }}
          />
          {errors.cnpj && (
            <p className="text-sm text-red-500">{errors.cnpj.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço *</Label>
        <Input
          id="address"
          {...register("address", { required: "Endereço é obrigatório" })}
          placeholder="Ex: Rua das Flores, 123"
        />
        {errors.address && (
          <p className="text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro *</Label>
          <Input
            id="neighborhood"
            {...register("neighborhood", { required: "Bairro é obrigatório" })}
            placeholder="Ex: Centro"
          />
          {errors.neighborhood && (
            <p className="text-sm text-red-500">{errors.neighborhood.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            {...register("city", { required: "Cidade é obrigatória" })}
            placeholder="Ex: São Paulo"
          />
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado *</Label>
          <Select onValueChange={(value) => setValue("state", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-red-500">{errors.state.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipCode">CEP *</Label>
        <Input
          id="zipCode"
          {...register("zipCode", { 
            required: "CEP é obrigatório",
            pattern: {
              value: /^\d{5}-\d{3}$/,
              message: "CEP deve estar no formato 00000-000"
            }
          })}
          placeholder="00000-000"
          onChange={(e) => {
            const formatted = formatCEP(e.target.value);
            setValue("zipCode", formatted);
          }}
        />
        {errors.zipCode && (
          <p className="text-sm text-red-500">{errors.zipCode.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="(00) 0000-0000"
            onChange={(e) => {
              const formatted = formatPhone(e.target.value);
              setValue("phone", formatted);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email inválido"
              }
            })}
            placeholder="contato@restaurante.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={active}
          onCheckedChange={setActive}
        />
        <Label htmlFor="active">Filial ativa</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : branch ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}
