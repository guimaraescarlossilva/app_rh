import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  console.log(`🔍 [API_REQUEST] ${method} ${url}`, data ? { data } : '');
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  console.log(`📊 [API_REQUEST] ${method} ${url} - Status: ${res.status} ${res.statusText}`);
  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
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
    console.log(`✅ [QUERY_FN] GET ${url} - Dados recebidos:`, data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por padrão
      staleTime: 5 * 60 * 1000,
      // Manter dados em cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry automático com backoff exponencial
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) {
          return false; // Não retry em 401
        }
        return failureCount < 3;
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
});
