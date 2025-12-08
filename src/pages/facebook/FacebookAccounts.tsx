import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Trash2, Loader2, RefreshCw, 
  Settings, CheckCircle, XCircle, Wifi, Shield, RotateCcw,
  ExternalLink, Save, Copy, Eye, EyeOff, User
} from "lucide-react";
import { SiFacebook } from "@icons-pack/react-simple-icons";

interface FacebookAccount {
  id: string;
  account_name: string;
  account_email: string | null;
  account_password: string | null;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_username: string | null;
  proxy_password: string | null;
  status: string;
  created_at: string;
}

interface RotationSettings {
  enabled: boolean;
  mode: "sequential" | "random" | "least_used";
  switchAfter: number;
  cooldownMinutes: number;
}

const rotationModes = [
  { value: "sequential", label: "Sequential", description: "Use accounts in order" },
  { value: "random", label: "Random", description: "Randomly pick an account" },
  { value: "least_used", label: "Least Used", description: "Use account with fewest actions today" },
];

export default function FacebookAccounts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    accountName: "",
    email: "",
    password: "",
    proxyHost: "",
    proxyPort: "",
    proxyUsername: "",
    proxyPassword: ""
  });
  
  // Rotation settings
  const [rotationSettings, setRotationSettings] = useState<RotationSettings>({
    enabled: true,
    mode: "sequential",
    switchAfter: 50,
    cooldownMinutes: 30,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchAccounts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("facebook_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const handleOpenFacebook = () => {
    window.open('https://www.facebook.com/login', '_blank');
    toast({ 
      title: "Facebook Opened", 
      description: "Login to Facebook, then save your credentials here" 
    });
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: `${name} URL copied to clipboard` });
  };

  const handleSaveAccount = async () => {
    if (!formData.accountName.trim()) {
      toast({ title: "Error", description: "Account name is required", variant: "destructive" });
      return;
    }
    if (!formData.email.trim()) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("facebook_accounts")
        .insert({
          user_id: user?.id,
          account_name: formData.accountName,
          account_email: formData.email,
          account_password: formData.password || null,
          proxy_host: formData.proxyHost || null,
          proxy_port: formData.proxyPort ? parseInt(formData.proxyPort) : null,
          proxy_username: formData.proxyUsername || null,
          proxy_password: formData.proxyPassword || null,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Account Added!",
        description: "Facebook account saved successfully",
      });
      
      setAddDialogOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      console.error("Error saving account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save account",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      accountName: "",
      email: "",
      password: "",
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: ""
    });
    setShowPassword(false);
  };

  const handleReconnect = async (account: FacebookAccount) => {
    window.open('https://www.facebook.com/login', '_blank');
    toast({
      title: "Facebook Opened",
      description: `Login to Facebook, then your account will be reconnected`
    });

    // Set status to pending while user logs in
    await supabase
      .from("facebook_accounts")
      .update({ status: "pending" })
      .eq("id", account.id);

    fetchAccounts();

    // Auto-activate after 10 seconds (assuming user has logged in)
    setTimeout(async () => {
      await supabase
        .from("facebook_accounts")
        .update({ status: "active" })
        .eq("id", account.id);

      fetchAccounts();
      toast({
        title: "Account Reconnected",
        description: `${account.account_name} is now active`
      });
    }, 10000);
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("facebook_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Facebook account has been removed",
      });
      
      fetchAccounts();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("facebook_accounts")
        .update({ status: "disconnected" })
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Disconnected",
        description: "Account has been disconnected",
      });
      
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect",
        variant: "destructive",
      });
    }
  };

  const activeAccounts = useMemo(() => accounts.filter(a => a.status === "active"), [accounts]);
  const accountsWithProxy = useMemo(() => accounts.filter(a => a.proxy_host), [accounts]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <header className="mb-8 flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-gradient">Facebook Accounts</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage multiple Facebook accounts with rotation
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Rotation Settings
              </Button>
              <Dialog open={addDialogOpen} onOpenChange={(open) => {
                setAddDialogOpen(open);
                if (!open) {
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="hero">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5 text-[#1877F2]" />
                      Link Facebook Account
                    </DialogTitle>
                    <DialogDescription>
                      Open Facebook to login, then save your account here
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4 space-y-6">
                    {/* Facebook Logo and Instructions */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-[#1877F2]/20 flex items-center justify-center mb-4">
                        <SiFacebook className="h-10 w-10 text-[#1877F2]" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Click below to open Facebook login in a new tab. Login there, then return here to save your account.
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 w-full">
                        <Button 
                          className="flex-1 bg-[#1877F2] hover:bg-[#1877F2]/90"
                          onClick={handleOpenFacebook}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Facebook to Login
                        </Button>
                        <Button 
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyLink('https://www.facebook.com/login', 'Facebook')}
                          title="Copy Link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">How to link:</p>
                      <ol className="text-xs text-muted-foreground space-y-1">
                        <li>1. Open Facebook in the new tab</li>
                        <li>2. Login to your Facebook account</li>
                        <li>3. Return here and enter your credentials below</li>
                        <li>4. Click "Save Account" to add it</li>
                      </ol>
                    </div>

                    {/* Account Details Form */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name *</Label>
                        <Input
                          id="accountName"
                          placeholder="e.g., Business Account"
                          value={formData.accountName}
                          onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email / Phone *</Label>
                        <Input
                          id="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password (Optional)</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Proxy Settings (Collapsible) */}
                      <div className="border-t pt-4">
                        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Proxy Settings (Optional)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Host"
                            value={formData.proxyHost}
                            onChange={(e) => setFormData({ ...formData, proxyHost: e.target.value })}
                            className="h-9 text-sm"
                          />
                          <Input
                            placeholder="Port"
                            value={formData.proxyPort}
                            onChange={(e) => setFormData({ ...formData, proxyPort: e.target.value })}
                            className="h-9 text-sm"
                          />
                          <Input
                            placeholder="Username"
                            value={formData.proxyUsername}
                            onChange={(e) => setFormData({ ...formData, proxyUsername: e.target.value })}
                            className="h-9 text-sm"
                          />
                          <Input
                            type="password"
                            placeholder="Password"
                            value={formData.proxyPassword}
                            onChange={(e) => setFormData({ ...formData, proxyPassword: e.target.value })}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90"
                        onClick={handleSaveAccount}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Account
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card variant="glass" className="animate-fade-in">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20">
                  <SiFacebook className="h-6 w-6 text-[#1877F2]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{accounts.length}</p>
                  <p className="text-sm text-muted-foreground">Total Accounts</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeAccounts.length}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <RotateCcw className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rotationSettings.enabled ? "On" : "Off"}</p>
                  <p className="text-sm text-muted-foreground">Rotation</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <Wifi className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{accountsWithProxy.length}</p>
                  <p className="text-sm text-muted-foreground">With Proxy</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rotation Status Banner */}
          {rotationSettings.enabled && activeAccounts.length > 1 && (
            <Card variant="glass" className="mb-6 border-primary/30 animate-fade-in">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <RotateCcw className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Multi-Account Rotation Active</p>
                    <p className="text-sm text-muted-foreground">
                      Mode: {rotationModes.find(m => m.value === rotationSettings.mode)?.label} • 
                      Switch after {rotationSettings.switchAfter} actions • 
                      {rotationSettings.cooldownMinutes}min cooldown
                    </p>
                  </div>
                </div>
                <Badge className="bg-primary/20 text-primary border border-primary/30">
                  {activeAccounts.length} accounts in rotation
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Accounts List */}
          {accounts.length === 0 ? (
            <Card variant="glass" className="animate-fade-in">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <SiFacebook className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No accounts yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add Facebook accounts to enable multi-account rotation
                </p>
                <Button variant="glow" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account, index) => (
                <Card 
                  key={account.id} 
                  variant="glass" 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${
                          account.status === "active" 
                            ? "bg-[#1877F2]/10 border-[#1877F2]/20" 
                            : "bg-secondary/50 border-border"
                        }`}>
                          <SiFacebook className={`h-6 w-6 ${
                            account.status === "active" ? "text-[#1877F2]" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              {account.account_name}
                            </h3>
                            <Badge 
                              className={
                                account.status === "active" 
                                  ? "bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/30" 
                                  : account.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {account.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{account.account_email || "No email"}</span>
                            {account.proxy_host && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Proxy
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {account.status === "pending" ? (
                          <Button 
                            variant="glow" 
                            size="sm"
                            onClick={() => handleReconnect(account)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Connect
                          </Button>
                        ) : account.status === "active" ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDisconnect(account.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Disconnect
                          </Button>
                        ) : (
                          <Button 
                            variant="glow" 
                            size="sm"
                            onClick={() => handleReconnect(account)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reconnect
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Rotation Settings Dialog */}
          <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Multi-Account Rotation Settings</DialogTitle>
                <DialogDescription>
                  Configure how accounts are rotated during campaigns
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Rotation</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically switch between accounts
                    </p>
                  </div>
                  <Switch
                    checked={rotationSettings.enabled}
                    onCheckedChange={(checked) => 
                      setRotationSettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rotation Mode</Label>
                  <Select 
                    value={rotationSettings.mode} 
                    onValueChange={(value: "sequential" | "random" | "least_used") => 
                      setRotationSettings(prev => ({ ...prev, mode: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rotationModes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          <div>
                            <p>{mode.label}</p>
                            <p className="text-xs text-muted-foreground">{mode.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Switch After (actions)</Label>
                    <Input
                      type="number"
                      value={rotationSettings.switchAfter}
                      onChange={(e) => 
                        setRotationSettings(prev => ({ 
                          ...prev, 
                          switchAfter: parseInt(e.target.value) || 50 
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Switch to next account after this many actions
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Cooldown (minutes)</Label>
                    <Input
                      type="number"
                      value={rotationSettings.cooldownMinutes}
                      onChange={(e) => 
                        setRotationSettings(prev => ({ 
                          ...prev, 
                          cooldownMinutes: parseInt(e.target.value) || 30 
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Rest period before reusing an account
                    </p>
                  </div>
                </div>

                <Card variant="glass" className="border-primary/30">
                  <CardContent className="p-4">
                    <p className="text-sm">
                      <strong>Tip:</strong> Using multiple accounts with rotation helps 
                      avoid rate limits and keeps each account healthy for longer.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({ title: "Settings Saved", description: "Rotation settings updated" });
                  setSettingsDialogOpen(false);
                }}>
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
