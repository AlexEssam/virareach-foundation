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
  UserPlus,
  TrendingUp,
  Heart,
  Linkedin,
  Mail,
  FileText,
  Database,
  Smartphone,
  AtSign,
  MapPin,
  Image,
  Video,
  Type,
  Volume2
} from "lucide-react";
import { SiFacebook, SiWhatsapp, SiInstagram, SiX, SiTelegram, SiTiktok, SiPinterest, SiReddit, SiSnapchat } from "@icons-pack/react-simple-icons";
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
  const [xOpen, setXOpen] = useState(location.pathname.startsWith("/x"));
  const [telegramOpen, setTelegramOpen] = useState(location.pathname.startsWith("/telegram"));
  const [linkedinOpen, setLinkedinOpen] = useState(location.pathname.startsWith("/linkedin"));
  const [emailOpen, setEmailOpen] = useState(location.pathname.startsWith("/email"));
  const [b2bOpen, setB2bOpen] = useState(location.pathname.startsWith("/b2b"));
  const [tiktokOpen, setTiktokOpen] = useState(location.pathname.startsWith("/tiktok"));
  const [pinterestOpen, setPinterestOpen] = useState(location.pathname.startsWith("/pinterest"));
  const [redditOpen, setRedditOpen] = useState(location.pathname.startsWith("/reddit"));
  const [snapchatOpen, setSnapchatOpen] = useState(location.pathname.startsWith("/snapchat"));
  const [vkOpen, setVkOpen] = useState(location.pathname.startsWith("/vk"));
  const [googleMapsOpen, setGoogleMapsOpen] = useState(location.pathname.startsWith("/googlemaps"));

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;
  const isFacebookActive = location.pathname.startsWith("/facebook");
  const isWhatsappActive = location.pathname.startsWith("/whatsapp");
  const isInstagramActive = location.pathname.startsWith("/instagram");
  const isXActive = location.pathname.startsWith("/x");
  const isTelegramActive = location.pathname.startsWith("/telegram");
  const isLinkedinActive = location.pathname.startsWith("/linkedin");
  const isEmailActive = location.pathname.startsWith("/email");
  const isB2BActive = location.pathname.startsWith("/b2b");
  const isTiktokActive = location.pathname.startsWith("/tiktok");
  const isPinterestActive = location.pathname.startsWith("/pinterest");
  const isRedditActive = location.pathname.startsWith("/reddit");
  const isSnapchatActive = location.pathname.startsWith("/snapchat");
  const isVkActive = location.pathname.startsWith("/vk");
  const isGoogleMapsActive = location.pathname.startsWith("/googlemaps");

  const topMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: MessageSquare, label: "Campaigns", path: "/campaigns" },
    { icon: Image, label: "AI Image", path: "/ai/image" },
    { icon: Video, label: "AI Video", path: "/ai/video" },
    { icon: Type, label: "Text Tools", path: "/ai/text" },
    { icon: Volume2, label: "Audio Tools", path: "/ai/audio" },
  ];

  const bottomMenuItems = [
    { icon: Coins, label: "Points", path: "/points" },
    { icon: Key, label: "License", path: "/license" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const facebookMenuItems = [
    { icon: Users, label: "Accounts", path: "/facebook/accounts" },
    { icon: Download, label: "Extractor", path: "/facebook/extractor" },
    { icon: Send, label: "Publisher", path: "/facebook/publisher" },
    { icon: BarChart3, label: "Group Analyzer", path: "/facebook/analyzer" },
    { icon: MessageSquare, label: "Messaging", path: "/facebook/messaging" },
    { icon: Heart, label: "Social Automation", path: "/facebook/social" },
    { icon: Users, label: "Groups Manager", path: "/facebook/groups" },
  ];

  const whatsappMenuItems = [
    { icon: Smartphone, label: "Accounts", path: "/whatsapp/accounts" },
    { icon: Send, label: "Sending", path: "/whatsapp/sending" },
    { icon: Download, label: "Extractor", path: "/whatsapp/extractor" },
    { icon: Users, label: "Groups", path: "/whatsapp/groups" },
    { icon: Users, label: "Contacts", path: "/whatsapp/contacts" },
    { icon: MessageSquare, label: "Auto-Reply", path: "/whatsapp/autoreply" },
    { icon: BarChart3, label: "Scheduler", path: "/whatsapp/scheduler" },
    { icon: TrendingUp, label: "Discover Groups", path: "/whatsapp/discover" },
  ];

  const instagramMenuItems = [
    { icon: Users, label: "Accounts", path: "/instagram/accounts" },
    { icon: Download, label: "Extractor", path: "/instagram/extractor" },
    { icon: UserPlus, label: "Follow/Unfollow", path: "/instagram/follow" },
    { icon: Send, label: "Messaging", path: "/instagram/messaging" },
    { icon: BarChart3, label: "Analytics", path: "/instagram/analytics" },
    { icon: AtSign, label: "Mentions", path: "/instagram/mentions" },
  ];

  const xMenuItems = [
    { icon: Smartphone, label: "Accounts", path: "/x/manager" },
    { icon: Download, label: "Extractors", path: "/x/extractors" },
    { icon: Send, label: "Publishing", path: "/x/publishing" },
    { icon: Heart, label: "Auto-Interactions", path: "/x/interactions" },
    { icon: TrendingUp, label: "Trends Monitor", path: "/x/trends" },
    { icon: Users, label: "Account Checker", path: "/x/accounts" },
    { icon: BarChart3, label: "Bookmarks", path: "/x/bookmarks" },
    { icon: Settings, label: "Tweet Monitor", path: "/x/monitor" },
    { icon: TrendingUp, label: "X Plus AI", path: "/x/plus" },
  ];

  const telegramMenuItems = [
    { icon: Smartphone, label: "Accounts", path: "/telegram/accounts" },
    { icon: Download, label: "Extractor", path: "/telegram/extractor" },
    { icon: Send, label: "Sender", path: "/telegram/sender" },
    { icon: Users, label: "Group Manager", path: "/telegram/groups" },
    { icon: TrendingUp, label: "Group Marketing", path: "/telegram/marketing" },
  ];

  const linkedinMenuItems = [
    { icon: Smartphone, label: "Accounts", path: "/linkedin/accounts" },
    { icon: Download, label: "Extract Center", path: "/linkedin/extract" },
    { icon: Send, label: "Messaging Center", path: "/linkedin/messaging" },
    { icon: BarChart3, label: "Analysis", path: "/linkedin/analysis" },
  ];

  const emailMenuItems = [
    { icon: Send, label: "Campaigns", path: "/email/campaigns" },
    { icon: FileText, label: "Templates", path: "/email/templates" },
  ];

  const b2bMenuItems = [
    { icon: Database, label: "Data Center", path: "/b2b/data-center" },
  ];

  const tiktokMenuItems = [
    { icon: Smartphone, label: "Accounts", path: "/tiktok/accounts" },
    { icon: Download, label: "Extractor", path: "/tiktok/extractor" },
    { icon: UserPlus, label: "Follow/Unfollow", path: "/tiktok/follow" },
    { icon: AtSign, label: "Mentions", path: "/tiktok/mentions" },
    { icon: Send, label: "Messaging", path: "/tiktok/messaging" },
  ];

  const pinterestMenuItems = [
    { icon: Smartphone, label: "Accounts", path: "/pinterest/accounts" },
    { icon: Download, label: "Extractor", path: "/pinterest/extractor" },
    { icon: UserPlus, label: "Follow/Unfollow", path: "/pinterest/follow" },
    { icon: Send, label: "Messaging", path: "/pinterest/messaging" },
    { icon: TrendingUp, label: "Publisher", path: "/pinterest/publisher" },
    { icon: BarChart3, label: "Boards", path: "/pinterest/boards" },
  ];

  const redditMenuItems = [
    { icon: Smartphone, label: "Accounts", path: "/reddit/accounts" },
    { icon: Users, label: "Communities", path: "/reddit/communities" },
    { icon: Heart, label: "Upvotes & Saves", path: "/reddit/upvotes" },
    { icon: Send, label: "Publisher", path: "/reddit/publisher" },
  ];

  const snapchatMenuItems = [
    { icon: Smartphone, label: "Accounts", path: "/snapchat/accounts" },
    { icon: Download, label: "Extractor", path: "/snapchat/extractor" },
    { icon: Send, label: "Messaging", path: "/snapchat/messaging" },
  ];

  const vkMenuItems = [
    { icon: Smartphone, label: "Accounts", path: "/vk/accounts" },
    { icon: Download, label: "Extractor", path: "/vk/extractor" },
    { icon: Send, label: "Messaging", path: "/vk/messaging" },
    { icon: Users, label: "Communities", path: "/vk/communities" },
  ];

  const googleMapsMenuItems = [
    { icon: Download, label: "Extractor", path: "/googlemaps/extractor" },
    { icon: Database, label: "Businesses", path: "/googlemaps/businesses" },
    { icon: BarChart3, label: "Reviews", path: "/googlemaps/reviews" },
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
        {topMenuItems.map((item) => (
          <Button
            key={item.label}
            variant={isActive(item.path) ? "glow" : "ghost"}
            className={`w-full justify-start gap-3 ${collapsed ? 'px-3' : ''}`}
            onClick={() => navigate(item.path)}
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
            onClick={() => navigate("/whatsapp/accounts")}
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

        {/* TikTok Tools Section */}
        {!collapsed ? (
          <Collapsible open={tiktokOpen} onOpenChange={setTiktokOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isTiktokActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <SiTiktok className="h-5 w-5 shrink-0" />
                  <span>TikTok Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${tiktokOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {tiktokMenuItems.map((item) => (
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
            variant={isTiktokActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/tiktok/extractor")}
          >
            <SiTiktok className="h-5 w-5 shrink-0" />
          </Button>
        )}

        {/* X (Twitter) Tools Section */}
        {!collapsed ? (
          <Collapsible open={xOpen} onOpenChange={setXOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isXActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <SiX className="h-5 w-5 shrink-0" />
                  <span>X Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${xOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {xMenuItems.map((item) => (
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
            variant={isXActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/x/manager")}
          >
            <SiX className="h-5 w-5 shrink-0" />
          </Button>
        )}

        {/* Telegram Tools Section */}
        {!collapsed ? (
          <Collapsible open={telegramOpen} onOpenChange={setTelegramOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isTelegramActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <SiTelegram className="h-5 w-5 shrink-0" color="#26A5E4" />
                  <span>Telegram Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${telegramOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {telegramMenuItems.map((item) => (
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
            variant={isTelegramActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/telegram/accounts")}
          >
            <SiTelegram className="h-5 w-5 shrink-0" color="#26A5E4" />
          </Button>
        )}

        {/* LinkedIn Tools Section */}
        {!collapsed ? (
          <Collapsible open={linkedinOpen} onOpenChange={setLinkedinOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isLinkedinActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Linkedin className="h-5 w-5 shrink-0 text-[#0A66C2]" />
                  <span>LinkedIn Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${linkedinOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {linkedinMenuItems.map((item) => (
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
            variant={isLinkedinActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/linkedin/accounts")}
          >
            <Linkedin className="h-5 w-5 shrink-0 text-[#0A66C2]" />
          </Button>
        )}

        {/* Email Marketing Section */}
        {!collapsed ? (
          <Collapsible open={emailOpen} onOpenChange={setEmailOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isEmailActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-[#EA4335]" />
                  <span>Email Marketing</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${emailOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {emailMenuItems.map((item) => (
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
            variant={isEmailActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/email/campaigns")}
          >
            <Mail className="h-5 w-5 shrink-0 text-[#EA4335]" />
          </Button>
        )}

        {/* B2B Data Center Section */}
        {!collapsed ? (
          <Collapsible open={b2bOpen} onOpenChange={setB2bOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isB2BActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 shrink-0 text-[#10B981]" />
                  <span>B2B Data Center</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${b2bOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {b2bMenuItems.map((item) => (
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
            variant={isB2BActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/b2b/data-center")}
          >
            <Database className="h-5 w-5 shrink-0 text-[#10B981]" />
          </Button>
        )}

        {/* Pinterest Tools Section */}
        {!collapsed ? (
          <Collapsible open={pinterestOpen} onOpenChange={setPinterestOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isPinterestActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <SiPinterest className="h-5 w-5 shrink-0" color="#E60023" />
                  <span>Pinterest Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${pinterestOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {pinterestMenuItems.map((item) => (
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
            variant={isPinterestActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/pinterest/accounts")}
          >
            <SiPinterest className="h-5 w-5 shrink-0" color="#E60023" />
          </Button>
        )}

        {/* Reddit Tools Section */}
        {!collapsed ? (
          <Collapsible open={redditOpen} onOpenChange={setRedditOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isRedditActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <SiReddit className="h-5 w-5 shrink-0" color="#FF4500" />
                  <span>Reddit Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${redditOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {redditMenuItems.map((item) => (
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
            variant={isRedditActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/reddit/accounts")}
          >
            <SiReddit className="h-5 w-5 shrink-0" color="#FF4500" />
          </Button>
        )}

        {/* Snapchat Tools Section */}
        {!collapsed ? (
          <Collapsible open={snapchatOpen} onOpenChange={setSnapchatOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isSnapchatActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <SiSnapchat className="h-5 w-5 shrink-0" color="#FFFC00" />
                  <span>Snapchat Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${snapchatOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {snapchatMenuItems.map((item) => (
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
            variant={isSnapchatActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/snapchat/accounts")}
          >
            <SiSnapchat className="h-5 w-5 shrink-0" color="#FFFC00" />
          </Button>
        )}

        {/* VK Tools Section */}
        {!collapsed ? (
          <Collapsible open={vkOpen} onOpenChange={setVkOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isVkActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">VK</div>
                  <span>VK Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${vkOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {vkMenuItems.map((item) => (
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
            variant={isVkActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/vk/accounts")}
          >
            <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">VK</div>
          </Button>
        )}

        {/* Google Maps Tools Section */}
        {!collapsed ? (
          <Collapsible open={googleMapsOpen} onOpenChange={setGoogleMapsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isGoogleMapsActive ? "glow" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-[#EA4335]" />
                  <span>Google Maps</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${googleMapsOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-1">
              {googleMapsMenuItems.map((item) => (
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
            variant={isGoogleMapsActive ? "glow" : "ghost"}
            className="w-full justify-center px-3"
            onClick={() => navigate("/googlemaps/extractor")}
          >
            <MapPin className="h-5 w-5 shrink-0 text-[#EA4335]" />
          </Button>
        )}

        {/* Bottom Menu Items */}
        <div className="pt-4 mt-4 border-t border-border/50 space-y-2">
          {bottomMenuItems.map((item) => (
            <Button
              key={item.label}
              variant={isActive(item.path) ? "glow" : "ghost"}
              className={`w-full justify-start gap-3 ${collapsed ? 'px-3' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </div>
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
