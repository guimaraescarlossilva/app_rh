import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Utensils, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  UserX, 
  HandCoins, 
  Calculator, 
  Shield,
  User,
  Building2
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Restaurantes", href: "/restaurants", icon: Building2 },
  { name: "Funcionários", href: "/employees", icon: Users },
  { name: "Controle de Férias", href: "/vacations", icon: Calendar },
  { name: "Rescisões", href: "/terminations", icon: UserX },
  { name: "Adiantamentos", href: "/advances", icon: HandCoins },
  { name: "Folha Salarial", href: "/payroll", icon: Calculator },
  { name: "Permissões", href: "/permissions", icon: Shield },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-card border-r border-border overflow-y-auto">
        {/* Logo Header */}
        <div className="flex items-center flex-shrink-0 px-4">
          <Utensils className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-xl font-semibold text-foreground">Sistema RH</h1>
        </div>
        
        {/* Navigation Menu */}
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  data-testid={`nav-${item.href.replace('/', '') || 'dashboard'}`}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* User Profile */}
        <div className="flex-shrink-0 flex border-t border-border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-foreground">Admin</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
