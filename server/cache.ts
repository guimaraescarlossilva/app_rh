// Sistema de cache avançado em memória para consultas frequentes
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
  hits: number; // Contador de acessos
  lastAccessed: number; // Timestamp do último acesso
}

interface CacheOptions {
  maxSize?: number; // Tamanho máximo do cache
  cleanupInterval?: number; // Intervalo de limpeza em ms
  defaultTTL?: number; // TTL padrão em ms
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos
  private readonly maxSize: number;
  private readonly cleanupInterval: number;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private hitCount = 0;
  private missCount = 0;

  constructor(options?: CacheOptions) {
    this.maxSize = options?.maxSize || 1000; // Limite padrão de 1000 itens
    this.cleanupInterval = options?.cleanupInterval || 60 * 1000; // Limpeza a cada 1 minuto
    this.defaultTTL = options?.defaultTTL || this.defaultTTL;
    
    // Inicia o timer de limpeza automática
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  // Limpa entradas expiradas e mantém o tamanho máximo
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    // Remove entradas expiradas
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    // Se ainda estiver acima do tamanho máximo, remove as entradas menos acessadas
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => {
          // Prioriza por hits e depois por último acesso
          if (a[1].hits === b[1].hits) {
            return a[1].lastAccessed - b[1].lastAccessed;
          }
          return a[1].hits - b[1].hits;
        });
      
      // Remove as entradas menos acessadas até atingir 90% do tamanho máximo
      const targetSize = Math.floor(this.maxSize * 0.9);
      const toRemove = this.cache.size - targetSize;
      
      for (let i = 0; i < toRemove; i++) {
        if (entries[i]) {
          this.cache.delete(entries[i][0]);
        }
      }
    }
    
    if (expiredCount > 0 || this.cache.size > this.maxSize) {
      console.log(`🧹 [CACHE] Limpeza: ${expiredCount} expirados, ${this.cache.size} restantes`);
    }
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Limpa o cache se estiver cheio antes de adicionar
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.cleanup();
    }
    
    const now = Date.now();
    const existingEntry = this.cache.get(key);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      hits: existingEntry?.hits || 0,
      lastAccessed: now
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // Verifica se o cache expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Atualiza estatísticas de acesso
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.hitCount++;
    
    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  // Invalida cache por padrão (ex: todos os caches de usuários)
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`🔄 [CACHE] Invalidados ${count} itens com padrão: ${pattern}`);
    }
  }

  // Retorna estatísticas do cache
  getStats() {
    const hitRate = this.hitCount + this.missCount > 0 
      ? (this.hitCount / (this.hitCount + this.missCount)) * 100 
      : 0;
      
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: `${hitRate.toFixed(2)}%`,
      keys: Array.from(this.cache.keys()),
      memoryUsageEstimate: this.estimateMemoryUsage()
    };
  }
  
  // Estima o uso de memória (aproximado)
  private estimateMemoryUsage(): string {
    // Estimativa simples baseada no número de entradas
    // Cada entrada tem aproximadamente 1KB em média (dados + metadados)
    const estimatedBytes = this.cache.size * 1024;
    
    if (estimatedBytes < 1024 * 1024) {
      return `${(estimatedBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }
}

// Cria uma instância do cache com configurações otimizadas
export const cache = new MemoryCache({
  maxSize: 2000,                // Máximo de 2000 itens em cache
  cleanupInterval: 2 * 60 * 1000, // Limpeza a cada 2 minutos
  defaultTTL: 5 * 60 * 1000     // TTL padrão de 5 minutos
});

// Configurações de TTL por tipo de dados
export const CacheTTL = {
  VERY_SHORT: 30 * 1000,        // 30 segundos
  SHORT: 1 * 60 * 1000,         // 1 minuto
  MEDIUM: 5 * 60 * 1000,        // 5 minutos
  LONG: 15 * 60 * 1000,         // 15 minutos
  VERY_LONG: 60 * 60 * 1000     // 1 hora
};

// Função helper para cache com fallback e tratamento de erros
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number,
  options?: { forceRefresh?: boolean, logLevel?: 'none' | 'minimal' | 'verbose' }
): Promise<T> {
  const { forceRefresh = false, logLevel = 'minimal' } = options || {};
  const startTime = Date.now();
  
  // Se forceRefresh está ativado, ignora o cache
  if (!forceRefresh) {
    // Tenta buscar do cache primeiro
    const cached = cache.get<T>(key);
    if (cached !== null) {
      if (logLevel !== 'none') {
        console.log(`🎯 [CACHE] Hit para chave: ${key}`);
      }
      return cached;
    }
  } else if (logLevel !== 'none') {
    console.log(`🔄 [CACHE] Ignorando cache para chave: ${key} (forceRefresh=true)`);
  }

  if (logLevel !== 'none') {
    console.log(`🔄 [CACHE] Miss para chave: ${key}, buscando dados...`);
  }
  
  try {
    // Se não está no cache, busca os dados
    const data = await fetchFn();
    
    // Armazena no cache
    cache.set(key, data, ttl);
    
    if (logLevel === 'verbose') {
      const duration = Date.now() - startTime;
      console.log(`✅ [CACHE] Dados obtidos para chave: ${key} em ${duration}ms`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ [CACHE] Erro ao buscar dados para chave: ${key}`, error);
    throw error;
  }
}

// Chaves de cache padronizadas com namespaces e TTLs recomendados
export const CacheKeys = {
  // Usuários - TTL médio (5 min)
  users: (search?: string, limit?: number, offset?: number) => 
    `users:list:${search || 'all'}:${limit || 50}:${offset || 0}`,
  userById: (id: string) => 
    `users:id:${id}`,
  userByEmail: (email: string) => 
    `users:email:${email}`,
  userByCpf: (cpf: string) => 
    `users:cpf:${cpf}`,
  
  // Grupos de permissão - TTL longo (15 min)
  permissionGroups: (search?: string, limit?: number, offset?: number) => 
    `permission_groups:list:${search || 'all'}:${limit || 50}:${offset || 0}`,
  permissionGroupById: (id: string) => 
    `permission_groups:id:${id}`,
  
  // Filiais - TTL longo (15 min)
  branches: (search?: string, limit?: number, offset?: number) => 
    `branches:list:${search || 'all'}:${limit || 50}:${offset || 0}`,
  branchById: (id: string) => 
    `branches:id:${id}`,
  
  // Funcionários - TTL médio (5 min)
  employees: (search?: string, limit?: number, offset?: number) => 
    `employees:list:${search || 'all'}:${limit || 50}:${offset || 0}`,
  employeeById: (id: string) => 
    `employees:id:${id}`,
  
  // Folha de pagamento - TTL curto (1 min)
  payroll: (search?: string, limit?: number, offset?: number) => 
    `payroll:list:${search || 'all'}:${limit || 50}:${offset || 0}`,
  payrollById: (id: string) => 
    `payroll:id:${id}`,
  
  // Estatísticas - TTL muito curto (30s)
  stats: (type: string) => 
    `stats:${type}`,
};

// Função para invalidar cache por entidade
export function invalidateEntityCache(entity: string, id?: string): void {
  if (id) {
    // Invalida apenas a entidade específica
    cache.invalidatePattern(`^${entity}:id:${id}`);
    console.log(`🔄 [CACHE] Invalidado cache para ${entity} com ID ${id}`);
  } else {
    // Invalida todas as entidades deste tipo
    cache.invalidatePattern(`^${entity}:`);
    console.log(`🔄 [CACHE] Invalidado todo o cache para ${entity}`);
  }
}

export const cacheKeys = {
  userById: (id: string) => `user:${id}`,
  branchById: (id: string) => `branch:${id}`,
  employeeById: (id: string) => `employee:${id}`,
} as const;
