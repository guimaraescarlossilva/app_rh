import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/ui/icons';
import OptimizedForm from './optimized-form';
import { FormField } from '@/shared/types';

interface NewEntityModalProps {
  title: string;
  entityName: string;
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  invalidateQueries: string[];
  buttonLabel?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  successMessage?: string;
}

/**
 * Componente de modal para cadastro de novas entidades
 * Utiliza o formulário otimizado e pode ser reutilizado em todas as telas
 */
const NewEntityModal: React.FC<NewEntityModalProps> = ({
  title,
  entityName,
  fields,
  onSubmit,
  invalidateQueries,
  buttonLabel = 'Novo',
  buttonVariant = 'default',
  buttonSize = 'default',
  successMessage,
}) => {
  const [open, setOpen] = React.useState(false);

  const handleSubmit = async (data: Record<string, string>) => {
    await onSubmit(data);
    setOpen(false); // Fechar modal após submissão bem-sucedida
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <PlusIcon className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{`Novo ${entityName}`}</DialogTitle>
        </DialogHeader>
        <OptimizedForm
          title={title}
          fields={fields}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          invalidateQueries={invalidateQueries}
          successMessage={successMessage || `${entityName} cadastrado com sucesso!`}
        />
      </DialogContent>
    </Dialog>
  );
};

export default NewEntityModal;