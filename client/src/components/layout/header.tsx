import { useLocation } from "wouter";
import { Bell, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pageNames = {
  "/": "Dashboard",
  "/employees": "Funcionários",
  "/vacations": "Controle de Férias",
  "/terminations": "Rescisões",
  "/advances": "Adiantamentos",
  "/payroll": "Folha Salarial",
  "/permissions": "Permissões",
};

export default function Header() {
  const [location] = useLocation();
  const currentPageName = pageNames[location as keyof typeof pageNames] || "Dashboard";

  return (
    <header className="bg-card border-b border-border px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">Sistema RH</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{currentPageName}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" data-testid="notifications-button">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notificações</span>
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full" data-testid="user-menu">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Admin</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@restaurante.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="logout-button">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
