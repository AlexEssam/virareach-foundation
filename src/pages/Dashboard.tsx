import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ModuleCard } from "@/components/dashboard/ModuleCard";
import { LicenseStatus } from "@/components/dashboard/LicenseStatus";
import { Coins, Zap, Send, Activity, Image } from "lucide-react";
import { 
  SiFacebook, 
  SiWhatsapp, 
  SiInstagram, 
  SiTelegram 
} from "@icons-pack/react-simple-icons";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [points, setPoints] = useState<number>(0);
  const [license, setLicense] = useState<{
    license_key: string;
    status: string;
    expires_at: string | null;
  } | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch points
      const { data: pointsData } = await supabase
        .from("points")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      
      if (pointsData) {
        setPoints(pointsData.balance);
      }

      // Fetch license
      const { data: licenseData } = await supabase
        .from("licenses")
        .select("license_key, status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      
      if (licenseData) {
        setLicense(licenseData);
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const modules = [
    {
      title: "Facebook",
      description: "Automate posts, messages, and engagement",
      icon: SiFacebook,
      color: "#1877F2",
      path: "/facebook/accounts",
    },
    {
      title: "WhatsApp",
      description: "Bulk messaging and auto-replies",
      icon: SiWhatsapp,
      color: "#25D366",
      path: "/whatsapp/accounts",
    },
    {
      title: "Instagram",
      description: "Schedule posts and manage DMs",
      icon: SiInstagram,
      color: "#E4405F",
      path: "/instagram/accounts",
    },
    {
      title: "Telegram",
      description: "Channel management and bots",
      icon: SiTelegram,
      color: "#0088CC",
      path: "/telegram/accounts",
    },
    {
      title: "AI Image",
      description: "Generate and edit images with AI",
      icon: Image,
      color: "#8B5CF6",
      path: "/ai/image",
    },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <header className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold">
              Welcome back, <span className="text-gradient">{profile?.full_name || "User"}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your marketing automation
            </p>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <StatsCard
                title="Points Balance"
                value={points.toLocaleString()}
                subtitle="Available credits"
                icon={Coins}
              />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <StatsCard
                title="Campaigns"
                value="0"
                subtitle="Active campaigns"
                icon={Zap}
              />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <StatsCard
                title="Messages Sent"
                value="0"
                subtitle="This month"
                icon={Send}
              />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <StatsCard
                title="Success Rate"
                value="--"
                subtitle="Delivery rate"
                icon={Activity}
              />
            </div>
          </div>

          {/* License Status */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <LicenseStatus license={license} onRefresh={fetchUserData} />
          </div>

          {/* Modules Grid */}
          <section className="animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <h2 className="text-xl font-semibold mb-4">Automation Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {modules.map((module, index) => (
                <div key={module.title} className="animate-fade-in" style={{ animationDelay: `${0.7 + index * 0.1}s` }}>
                  <ModuleCard
                    title={module.title}
                    description={module.description}
                    icon={module.icon}
                    color={module.color}
                    locked={!license}
                    onClick={() => {
                      if (module.path) {
                        navigate(module.path);
                      } else {
                        toast({
                          title: `${module.title} Module`,
                          description: "This module is coming soon!",
                        });
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
