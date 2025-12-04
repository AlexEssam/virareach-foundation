import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Key, Shield, CheckCircle, XCircle, Clock, Zap, Crown, Star } from "lucide-react";
import { toast } from "sonner";

interface License {
  id: string;
  license_key: string;
  status: string;
  activated_at: string | null;
  expires_at: string | null;
  device_fingerprint: string | null;
}

export default function License() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [license, setLicense] = useState<License | null>(null);
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLicenseData();
    }
  }, [user]);

  const fetchLicenseData = async () => {
    try {
      const { data, error } = await supabase
        .from("licenses")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      setLicense(data);
    } catch (error) {
      console.error("Error fetching license:", error);
    } finally {
      setLoading(false);
    }
  };

  const activateLicense = async () => {
    if (!licenseKey.trim()) {
      toast.error("Please enter a license key");
      return;
    }

    setActivating(true);
    try {
      // Check if license exists and is available
      const { data: existingLicense, error: fetchError } = await supabase
        .from("licenses")
        .select("*")
        .eq("license_key", licenseKey.trim())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!existingLicense) {
        toast.error("Invalid license key");
        return;
      }

      if (existingLicense.status === "active" && existingLicense.user_id !== user?.id) {
        toast.error("This license is already activated on another account");
        return;
      }

      // Activate the license
      const { error: updateError } = await supabase
        .from("licenses")
        .update({
          user_id: user?.id,
          status: "active",
          activated_at: new Date().toISOString(),
        })
        .eq("license_key", licenseKey.trim());

      if (updateError) throw updateError;

      toast.success("License activated successfully!");
      setLicenseKey("");
      fetchLicenseData();
    } catch (error) {
      console.error("Error activating license:", error);
      toast.error("Failed to activate license");
    } finally {
      setActivating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case "expired":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      case "inactive":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const features = [
    { name: "Unlimited Social Accounts", included: true },
    { name: "AI Image Generation", included: true },
    { name: "AI Video Creation", included: true },
    { name: "All Platform Extractors", included: true },
    { name: "Mass Messaging", included: true },
    { name: "Auto-Engagement", included: true },
    { name: "Priority Support", included: true },
    { name: "API Access", included: true },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">License</h1>
            <p className="text-muted-foreground">Manage your ViraReach license and unlock all features</p>
          </div>

          {/* License Status Card */}
          <Card className="glass-strong border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/20">
                    <Key className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">License Status</p>
                    {loading ? (
                      <p className="text-lg text-muted-foreground">Loading...</p>
                    ) : license ? (
                      <div className="space-y-1">
                        {getStatusBadge(license.status)}
                        <p className="text-sm text-muted-foreground mt-2">
                          Activated: {formatDate(license.activated_at)}
                        </p>
                        {license.expires_at && (
                          <p className="text-sm text-muted-foreground">
                            Expires: {formatDate(license.expires_at)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-lg text-yellow-400">No license activated</p>
                    )}
                  </div>
                </div>
                {license?.status === "active" && (
                  <Crown className="h-12 w-12 text-yellow-400" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activate License */}
          {(!license || license.status !== "active") && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Activate License
                </CardTitle>
                <CardDescription>Enter your license key to unlock all premium features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter your license key (e.g., VIRA-XXXX-XXXX-XXXX)"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="glow" onClick={activateLicense} disabled={activating}>
                    {activating ? "Activating..." : "Activate"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Don't have a license? Purchase one from our website to unlock all features.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Features List */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Premium Features
              </CardTitle>
              <CardDescription>Everything included with your ViraReach license</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature) => (
                  <div
                    key={feature.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-foreground">{feature.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-center">Starter</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span>5 Social Accounts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span>1,000 AI Credits/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span>Basic Support</span>
                </div>
                <Button className="w-full" variant="outline" onClick={() => toast.info("Coming soon!")}>
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-strong border-primary/50">
              <CardHeader>
                <Badge className="w-fit mx-auto mb-2">Popular</Badge>
                <CardTitle className="text-center">Professional</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">$79</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span>25 Social Accounts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span>10,000 AI Credits/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span>Priority Support</span>
                </div>
                <Button className="w-full" variant="glow" onClick={() => toast.info("Coming soon!")}>
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-center">Enterprise</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">$199</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span>Unlimited Accounts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span>Unlimited AI Credits</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span>Dedicated Support</span>
                </div>
                <Button className="w-full" variant="outline" onClick={() => toast.info("Coming soon!")}>
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
