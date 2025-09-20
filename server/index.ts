import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./migrate-sql";
import { randomUUID } from 'crypto';
import { checkConnection } from "./db";
import { connectPrisma, checkPrismaConnection } from "./prisma";
import { createDefaultUser } from "./create-default-user";
import { addCpfField } from "./add-cpf-field";

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Structured logging middleware
app.use((req, res, next) => {
  const reqId = req.headers['x-request-id'] as string || randomUUID();
  const startTime = Date.now();
  
  req.reqId = reqId;
  res.set('X-Request-ID', reqId);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      reqId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
    
    // Log slow routes (>500ms)
    if (duration > 500) {
      console.warn(`🐌 [SLOW_ROUTE] ${req.method} ${req.path} took ${duration}ms`, logData);
    } else {
      console.log(JSON.stringify(logData));
    }
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealthy = await checkConnection();
  const prismaHealthy = await checkPrismaConnection();
  const health = {
    status: (dbHealthy && prismaHealthy) ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected',
    prisma: prismaHealthy ? 'connected' : 'disconnected'
  };
  
  res.status((dbHealthy && prismaHealthy) ? 200 : 503).json(health);
});

// Register routes
registerRoutes(app);

// Setup Vite in development
if (process.env.NODE_ENV === "development") {
  setupVite(app);
} else {
  serveStatic(app);
}

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const reqId = (req as any).reqId || randomUUID();
  console.error(`[${reqId}] Unhandled error:`, error);
  
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    requestId: reqId
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: "Not found",
    path: req.path,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

async function startServer() {
  try {
    console.log("🚀 [SERVER] Iniciando servidor...");
    
    // Connect to Prisma
    console.log("🔗 [SERVER] Conectando ao Prisma...");
    await connectPrisma();
    console.log("✅ [SERVER] Prisma conectado com sucesso");
    
    // Run migrations
    console.log("🔄 [SERVER] Executando migrações do banco...");
    await runMigrations();
    console.log("✅ [SERVER] Migrações concluídas com sucesso");
    
    // Add CPF field if needed
    console.log("🔄 [SERVER] Verificando campo CPF...");
    await addCpfField();
    console.log("✅ [SERVER] Campo CPF verificado com sucesso");
    
    // Create default user
    console.log("👤 [SERVER] Criando usuário padrão...");
    await createDefaultUser();
    console.log("✅ [SERVER] Usuário padrão criado com sucesso");
    
    // Register routes
    console.log("🛣️ [SERVER] Registrando rotas...");
    console.log("✅ [SERVER] Rotas registradas com sucesso");
    
    // Start server
    console.log(`🌐 [SERVER] Configurando servidor na porta ${PORT}...`);
    app.listen(PORT, HOST, () => {
      console.log(`🎉 [SERVER] Servidor rodando na porta ${PORT}`);
      console.log(`🔗 [SERVER] URL: http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("❌ [SERVER] Falha ao iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();
