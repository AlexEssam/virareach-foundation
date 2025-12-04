import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  LogOut,
  Coins,
  Key,
  ChevronLeft
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: MessageSquare, label: "Campaigns", disabled: true },
    { icon: Coins, label: "Points", disabled: true },
    { icon: Key, label: "License", disabled: true },
    { icon: Settings, label: "Settings", disabled: true },
  ];

  return (
    <aside className={`h-screen glass-strong flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <Logo size="sm" showText={!collapsed} />
          {onToggle && (
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
              <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant={item.active ? "glow" : "ghost"}
            className={`w-full justify-start gap-3 ${collapsed ? 'px-3' : ''} ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={item.disabled}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t border-border/50">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 ${collapsed ? 'px-3' : ''}`}
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
