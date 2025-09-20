// Sistema de cache simples em memória para consultas frequentes
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verifica se o cache expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Invalida cache por padrão (ex: todos os caches de usuários)
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Retorna estatísticas do cache
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const cache = new MemoryCache();

// Função helper para cache com fallback
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Tenta buscar do cache primeiro
  const cached = cache.get<T>(key);
  if (cached !== null) {
    console.log(`🎯 [CACHE] Hit para chave: ${key}`);
    return cached;
  }

  console.log(`🔄 [CACHE] Miss para chave: ${key}, buscando dados...`);
  
  // Se não está no cache, busca os dados
  const data = await fetchFn();
  
  // Armazena no cache
  cache.set(key, data, ttl);
  
  return data;
}

// Chaves de cache padronizadas
export const CacheKeys = {
  users: (search?: string, limit?: number, offset?: number) => 
    `users:${search || 'all'}:${limit || 50}:${offset || 0}`,
  permissionGroups: (search?: string, limit?: number, offset?: number) => 
    `permission_groups:${search || 'all'}:${limit || 50}:${offset || 0}`,
  branches: (search?: string, limit?: number, offset?: number) => 
    `branches:${search || 'all'}:${limit || 50}:${offset || 0}`,
  employees: (search?: string, limit?: number, offset?: number) => 
    `employees:${search || 'all'}:${limit || 50}:${offset || 0}`,
  payroll: (search?: string, limit?: number, offset?: number) => 
    `payroll:${search || 'all'}:${limit || 50}:${offset || 0}`,
  userById: (id: string) => `user:${id}`,
  branchById: (id: string) => `branch:${id}`,
  employeeById: (id: string) => `employee:${id}`,
} as const;
