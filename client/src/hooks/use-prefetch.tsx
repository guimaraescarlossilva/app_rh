import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

// Mapeamento de rotas para queries que devem ser pré-carregadas
const ROUTE_PREFETCH_MAP: Record<string, string[]> = {
  '/': ['api/dashboard/stats'],
  '/dashboard': ['api/dashboard/stats'],
  '/branches': ['api/branches'],
  '/employees': ['api/employees'],
  '/vacations': ['api/vacations', 'api/employees'],
  '/terminations': ['api/terminations', 'api/employees'],
  '/advances': ['api/advances', 'api/employees'],
  '/payroll': ['api/payroll', 'api/employees'],
  '/permissions': ['api/permissions/groups', 'api/permissions/catalog'],
};

/**
 * Hook para prefetch de dados baseado na navegação
 * Melhora a performance de navegação entre telas pré-carregando dados
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  const [location] = useLocation();

  useEffect(() => {
    // Prefetch para a rota atual
    const currentRouteQueries = ROUTE_PREFETCH_MAP[location] || [];
    
    // Prefetch imediato para a rota atual
    currentRouteQueries.forEach(query => {
      queryClient.prefetchQuery([query], {
        staleTime: 5 * 60 * 1000, // 5 minutos
      });
    });

    // Prefetch para rotas relacionadas (com delay para priorizar a rota atual)
    setTimeout(() => {
      // Encontrar rotas relacionadas baseado em padrões comuns
      const relatedRoutes = Object.keys(ROUTE_PREFETCH_MAP).filter(route => {
        // Evitar a rota atual
        if (route === location) return false;
        
        // Considerar relacionadas se compartilham queries
        const routeQueries = ROUTE_PREFETCH_MAP[route] || [];
        const currentQueries = ROUTE_PREFETCH_MAP[location] || [];
        
        return routeQueries.some(query => currentQueries.includes(query));
      });

      // Prefetch para rotas relacionadas
      relatedRoutes.forEach(route => {
        const queries = ROUTE_PREFETCH_MAP[route] || [];
        queries.forEach(query => {
          queryClient.prefetchQuery([query], {
            staleTime: 5 * 60 * 1000, // 5 minutos
          });
        });
      });
    }, 1000); // Delay de 1 segundo para priorizar a rota atual
  }, [location, queryClient]);
}