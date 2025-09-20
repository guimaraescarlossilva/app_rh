import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'date';
  required?: boolean;
  placeholder?: string;
  validation?: (value: string) => string | null;
}

interface OptimizedFormProps {
  title: string;
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  invalidateQueries?: string[];
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Componente de formulário otimizado para cadastros
 * Inclui validação, feedback visual e integração com React Query
 */
const OptimizedForm: React.FC<OptimizedFormProps> = ({
  title,
  fields,
  onSubmit,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  onCancel,
  invalidateQueries = [],
  successMessage = 'Operação realizada com sucesso!',
  errorMessage = 'Ocorreu um erro. Tente novamente.',
}) => {
  const [formData, setFormData] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro quando o usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      // Validação de campo obrigatório
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} é obrigatório`;
        isValid = false;
      } 
      // Validação personalizada
      else if (field.validation && formData[field.name]) {
        const error = field.validation(formData[field.name]);
        if (error) {
          newErrors[field.name] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      
      // Invalidar queries para atualizar dados
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(query => {
          queryClient.invalidateQueries([query]);
        });
      }
      
      // Feedback de sucesso
      toast({
        title: 'Sucesso',
        description: successMessage,
        variant: 'default',
      });
      
      // Limpar formulário
      const emptyData = fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {});
      setFormData(emptyData);
    } catch (error) {
      // Feedback de erro
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Erro ao enviar formulário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-card rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}{field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              value={formData[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
              className={errors[field.name] ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors[field.name] && (
              <p className="text-sm text-destructive">{errors[field.name]}</p>
            )}
          </div>
        ))}
        
        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processando...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OptimizedForm;