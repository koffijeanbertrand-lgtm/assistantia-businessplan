import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Settings, LogOut, Menu, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: FolderKanban, label: "Projets", path: "/admin/projects" },
  { icon: Users, label: "Utilisateurs", path: "/admin/users" },
  { icon: Mail, label: "Messages", path: "/admin/contacts" },
  { icon: Settings, label: "Paramètres", path: "/admin/settings" },
];

const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-xl font-bold text-sidebar-foreground">Administration</h2>
        <p className="text-sm text-muted-foreground mt-1">AI Business Planner</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-full">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onNavigate={() => {}} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
};
