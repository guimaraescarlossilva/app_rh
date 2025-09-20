import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

// Hook para consultas otimizadas com cache inteligente
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    enabled?: boolean;
    select?: (data: T) => any;
  }
) {
  const queryClient = useQueryClient();
  
  // Configurações otimizadas baseadas no tipo de dados
  const optimizedOptions = useMemo(() => {
    const baseKey = queryKey[0];
    
    // Dados que mudam pouco (filiais, grupos de permissão)
    if (baseKey.includes('branches') || baseKey.includes('permission-groups')) {
      return {
        staleTime: 10 * 60 * 1000, // 10 minutos
        gcTime: 15 * 60 * 1000, // 15 minutos
        ...options,
      };
    }
    
    // Dados que mudam com frequência (usuários, funcionários)
    if (baseKey.includes('users') || baseKey.includes('employees')) {
      return {
        staleTime: 2 * 60 * 1000, // 2 minutos
        gcTime: 5 * 60 * 1000, // 5 minutos
        ...options,
      };
    }
    
    // Dados transacionais (folha de pagamento, férias)
    if (baseKey.includes('payroll') || baseKey.includes('vacations') || baseKey.includes('advances')) {
      return {
        staleTime: 1 * 60 * 1000, // 1 minuto
        gcTime: 3 * 60 * 1000, // 3 minutos
        ...options,
      };
    }
    
    // Configuração padrão
    return {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      ...options,
    };
  }, [queryKey, options]);

  return useQuery({
    queryKey,
    queryFn,
    ...optimizedOptions,
  });
}

// Hook para pré-carregar dados relacionados
export function usePrefetchRelated() {
  const queryClient = useQueryClient();
  
  const prefetchBranches = () => {
    queryClient.prefetchQuery({
      queryKey: ["/api/branches"],
      staleTime: 10 * 60 * 1000,
    });
  };
  
  const prefetchPermissionGroups = () => {
    queryClient.prefetchQuery({
      queryKey: ["/api/permissions/groups"],
      staleTime: 10 * 60 * 1000,
    });
  };
  
  const prefetchEmployees = () => {
    queryClient.prefetchQuery({
      queryKey: ["/api/employees"],
      staleTime: 2 * 60 * 1000,
    });
  };
  
  return {
    prefetchBranches,
    prefetchPermissionGroups,
    prefetchEmployees,
  };
}

// Hook para invalidar cache de forma inteligente
export function useSmartInvalidation() {
  const queryClient = useQueryClient();
  
  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  };
  
  const invalidateBranches = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
  };
  
  const invalidateEmployees = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    // Invalida também estatísticas relacionadas
    queryClient.invalidateQueries({ queryKey: ["/api/employees/stats"] });
  };
  
  const invalidatePayroll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
    queryClient.invalidateQueries({ queryKey: ["/api/payroll/stats"] });
  };
  
  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };
  
  return {
    invalidateUsers,
    invalidateBranches,
    invalidateEmployees,
    invalidatePayroll,
    invalidateAll,
  };
}
