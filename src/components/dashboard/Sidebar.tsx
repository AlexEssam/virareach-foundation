import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  LogOut,
  Coins,
  Key,
  ChevronLeft,
  ChevronDown,
  Users,
  Download,
  Send,
  BarChart3,
  UserPlus
} from "lucide-react";
import { SiFacebook, SiWhatsapp, SiInstagram } from "@icons-pack/react-simple-icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [facebookOpen, setFacebookOpen] = useState(location.pathname.startsWith("/facebook"));
  const [whatsappOpen, setWhatsappOpen] = useState(location.pathname.startsWith("/whatsapp"));
  const [instagramOpen, setInstagramOpen] = useState(location.pathname.startsWith("/instagram"));

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;
  const isFacebookActive = location.pathname.startsWith("/facebook");
  const isWhatsappActive = location.pathname.startsWith("/whatsapp");
  const isInstagramActive = location.pathname.startsWith("/instagram");

  const mainMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: MessageSquare, label: "Campaigns", disabled: true },
    { icon: Coins, label: "Points", disabled: true },
    { icon: Key, label: "License", disabled: true },
    { icon: Settings, label: "Settings", disabled: true },
  ];

  const facebookMenuItems = [
    { icon: Users, label: "Accounts", path: "/facebook/accounts" },
    { icon: Download, label: "Extractor", path: "/facebook/extractor" },
    { icon: Send, label: "Publisher", path: "/facebook/publisher" },
    { icon: BarChart3, label: "Group Analyzer", path: "/facebook/analyzer" },
  ];

  const whatsappMenuItems = [
    { icon: Send, label: "Sending", path: "/whatsapp/sending" },
    { icon: Download, label: "Extractor", path: "/whatsapp/extractor" },
    { icon: Users, label: "Groups", path: "/whatsapp/groups" },
  ];

  const instagramMenuItems = [
    { icon: Users, label: "Accounts", path: "/instagram/accounts" },
    { icon: Download, label: "Extractor", path: "/instagram/extractor" },
    { icon: UserPlus, label: "Follow/Unfollow", path: "/instagram/follow" },
    { icon: Send, label: "Messaging", path: "/instagram/messaging" },
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

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {mainMenuItems.map((item) => (
          <Button
            key={item.label}
            variant={isActive(item.path || "") ? "glow" : "ghost"}
            className={`w-full justify-start gap-3 ${collapsed ? 'px-3' : ''} ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={item.disabled}
            onClick={() => item.path && navigate(item.path)}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Button>
        ))}

        {/* Facebook Tools Section */}
        {!collapsed ? (
          <Collapsible open={facebookOpen} onOpenChange={setFacebookOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isFacebookActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <SiFacebook className="h-5 w-5 shrink-0" color="#1877F2" />
                  <span>Facebook Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${facebookOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {facebookMenuItems.map((item) => (
                <Button
                  key={item.label}
                  variant={isActive(item.path) ? "glow" : "ghost"}
                  className="w-full justify-start gap-3 h-9 text-sm"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Button
            variant={isFacebookActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/facebook/accounts")}
          >
            <SiFacebook className="h-5 w-5 shrink-0" color="#1877F2" />
          </Button>
        )}

        {/* WhatsApp Tools Section */}
        {!collapsed ? (
          <Collapsible open={whatsappOpen} onOpenChange={setWhatsappOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isWhatsappActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <SiWhatsapp className="h-5 w-5 shrink-0" color="#25D366" />
                  <span>WhatsApp Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${whatsappOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {whatsappMenuItems.map((item) => (
                <Button
                  key={item.label}
                  variant={isActive(item.path) ? "glow" : "ghost"}
                  className="w-full justify-start gap-3 h-9 text-sm"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Button
            variant={isWhatsappActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/whatsapp/sending")}
          >
            <SiWhatsapp className="h-5 w-5 shrink-0" color="#25D366" />
          </Button>
        )}

        {/* Instagram Tools Section */}
        {!collapsed ? (
          <Collapsible open={instagramOpen} onOpenChange={setInstagramOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isInstagramActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <SiInstagram className="h-5 w-5 shrink-0" color="#E4405F" />
                  <span>Instagram Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${instagramOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {instagramMenuItems.map((item) => (
                <Button
                  key={item.label}
                  variant={isActive(item.path) ? "glow" : "ghost"}
                  className="w-full justify-start gap-3 h-9 text-sm"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Button
            variant={isInstagramActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/instagram/accounts")}
          >
            <SiInstagram className="h-5 w-5 shrink-0" color="#E4405F" />
          </Button>
        )}
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
