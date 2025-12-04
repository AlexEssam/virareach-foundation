import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Key, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface LicenseStatusProps {
  license: {
    license_key: string;
    status: string;
    expires_at: string | null;
  } | null;
  onRefresh: () => void;
}

export function LicenseStatus({ license, onRefresh }: LicenseStatusProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const activateLicense = async () => {
    if (!licenseKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a license key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use secure server-side function to activate license
      const { data, error } = await supabase.rpc('activate_license', {
        license_key_input: licenseKey.trim()
      });

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        toast({
          title: "Activation Failed",
          description: result.error || "Failed to activate license.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "License Activated!",
        description: result.message || "Your license has been successfully activated.",
      });
      setLicenseKey("");
      onRefresh();
    } catch (error) {
      console.error("License activation error:", error);
      toast({
        title: "Error",
        description: "Failed to activate license. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!license) {
      return <Badge variant="outline" className="border-destructive/50 text-destructive">No License</Badge>;
    }
    
    switch (license.status) {
      case "active":
        return <Badge className="bg-primary/20 text-primary border border-primary/30">Active</Badge>;
      case "expired":
        return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">Expired</Badge>;
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">License Status</CardTitle>
              <CardDescription>Manage your ViraReach license</CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {license?.status === "active" ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <CheckCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">License Active</p>
              <p className="text-sm text-muted-foreground">
                Key: {license.license_key.slice(0, 8)}...{license.license_key.slice(-4)}
              </p>
              {license.expires_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expires: {new Date(license.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <XCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm">No active license. Enter your license key to activate.</p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter license key..."
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                disabled={loading}
              />
              <Button onClick={activateLicense} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
