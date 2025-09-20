import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";

// Configurações otimizadas para o React Query
const STALE_TIME = 5 * 60 * 1000; // 5 minutos
const CACHE_TIME = 30 * 60 * 1000; // 30 minutos
const RETRY_COUNT = 2;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const startTime = performance.now();
  try {
    console.log(`🔍 [API_REQUEST] ${method} ${url}`, data ? { data } : '');
    
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log(`📊 [API_REQUEST] ${method} ${url} - Status: ${res.status} ${res.statusText}`);
    
    await throwIfResNotOk(res);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ [API_REQUEST] ${method} ${url} completed in ${duration.toFixed(2)}ms`);
    }
    
    return res;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`❌ [API_REQUEST] ${method} ${url} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const startTime = performance.now();
    try {
      const url = queryKey.join("/") as string;
      console.log(`🔍 [QUERY_FN] GET ${url}`);
      
      const res = await fetch(url);
      console.log(`📊 [QUERY_FN] GET ${url} - Status: ${res.status} ${res.statusText}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`⚠️ [QUERY_FN] GET ${url} - 401 Unauthorized, retornando null`);
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [QUERY_FN] GET ${url} - Dados recebidos em ${duration.toFixed(2)}ms:`, data);
      } else {
        console.log(`✅ [QUERY_FN] GET ${url} - Dados recebidos`);
      }
      
      return data;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`❌ [QUERY_FN] Query failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por padrão
      staleTime: STALE_TIME,
      // Manter dados em cache por 30 minutos (aumentado)
      gcTime: CACHE_TIME,
      // Retry automático com backoff exponencial
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) {
          return false; // Não retry em 401
        }
        return failureCount < RETRY_COUNT;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch automático quando a janela ganha foco (apenas se dados estão stale)
      refetchOnWindowFocus: 'always',
      // Não refetch automaticamente em reconexão de rede
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations apenas uma vez
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Log de erros em queries
      console.error(`Query error: ${query.queryKey}`, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Log de erros em mutations
      console.error('Mutation error:', error);
    },
  }),
});
