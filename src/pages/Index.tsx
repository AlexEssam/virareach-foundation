import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Rocket } from "lucide-react";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Zap,
      title: "Multi-Platform",
      description: "Automate across Facebook, WhatsApp, Instagram, Telegram & more",
    },
    {
      icon: Shield,
      title: "Secure & Licensed",
      description: "Enterprise-grade security with device-bound licensing",
    },
    {
      icon: Rocket,
      title: "Points System",
      description: "Flexible credit-based usage for all automation tasks",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-vira-cyan/5 via-transparent to-vira-purple/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-vira-cyan/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-vira-purple/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-vira-cyan/5 rounded-full blur-3xl animate-pulse-slow" />

      {/* Header */}
      <header className="relative z-10 p-6">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Sign In
            </Button>
            <Button variant="hero" onClick={() => navigate("/register")}>
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Marketing Automation Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Automate Your
              <span className="block text-gradient">Marketing Reach</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ViraReach helps you automate and scale your marketing across multiple platforms. 
              Save time, reach more people, and grow your business.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" onClick={() => navigate("/register")}>
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="xl" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="glass p-6 rounded-2xl text-left animate-fade-in"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-sm text-muted-foreground">
        <p>© 2024 ViraReach. All rights reserved.</p>
      </footer>
    </div>
  );
}
