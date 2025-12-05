import { useEffect, useState } from "react";
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
  Plus, Smartphone, Trash2, Loader2, RefreshCw, 
  Settings, CheckCircle, XCircle, Wifi, Shield, RotateCcw,
  ExternalLink, Download, Save, Copy
} from "lucide-react";

interface WhatsAppAccount {
  id: string;
  phone_number: string;
  account_name: string | null;
  status: string;
  messages_sent_today: number;
  last_message_at: string | null;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_username: string | null;
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
  { value: "least_used", label: "Least Used", description: "Use account with fewest messages today" },
];

export default function WhatsAppAccounts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // Form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [proxyHost, setProxyHost] = useState("");
  const [proxyPort, setProxyPort] = useState("");
  const [proxyUsername, setProxyUsername] = useState("");
  const [proxyPassword, setProxyPassword] = useState("");
  
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
        .from("whatsapp_accounts")
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

  const handleAddAccount = async () => {
    if (!phoneNumber.trim()) {
      toast({ title: "Error", description: "Please enter phone number", variant: "destructive" });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from("whatsapp_accounts")
        .insert({
          user_id: user!.id,
          phone_number: phoneNumber.trim(),
          account_name: accountName.trim() || null,
          proxy_host: proxyHost.trim() || null,
          proxy_port: proxyPort ? parseInt(proxyPort) : null,
          proxy_username: proxyUsername.trim() || null,
          proxy_password: proxyPassword.trim() || null,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Account Added",
        description: "Now scan QR code to connect",
      });
      
      resetForm();
      setAddDialogOpen(false);
      fetchAccounts();
    } catch (error: any) {
      console.error("Error adding account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add account",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setAccountName("");
    setProxyHost("");
    setProxyPort("");
    setProxyUsername("");
    setProxyPassword("");
  };

  const handleOpenWhatsAppWeb = () => {
    window.open('https://web.whatsapp.com/', '_blank');
    toast({ 
      title: "WhatsApp Web Opened", 
      description: "Link your device in WhatsApp Web, then save your account here" 
    });
  };

  const handleOpenWhatsAppDownload = () => {
    window.open('https://www.whatsapp.com/download', '_blank');
    toast({ 
      title: "WhatsApp Download Page Opened", 
      description: "Download WhatsApp for your device" 
    });
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: `${name} URL copied to clipboard` });
  };

  const handleReconnect = async (account: WhatsAppAccount) => {
    window.open('https://web.whatsapp.com/', '_blank');
    toast({ 
      title: "WhatsApp Web Opened", 
      description: `Reconnect ${account.account_name || account.phone_number} via WhatsApp Web` 
    });
    
    // Update account status to active
    await supabase
      .from("whatsapp_accounts")
      .update({ status: "active" })
      .eq("id", account.id);
    
    fetchAccounts();
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("whatsapp_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "WhatsApp account has been removed",
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
        .from("whatsapp_accounts")
        .update({ status: "disconnected", session_data: null })
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

  const activeAccounts = accounts.filter(a => a.status === "active");
  const totalMessagesSent = accounts.reduce((acc, a) => acc + (a.messages_sent_today || 0), 0);

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
                <span className="text-gradient">WhatsApp Accounts</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage multiple WhatsApp accounts with rotation
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
                      <ExternalLink className="h-5 w-5 text-[#25D366]" />
                      Link WhatsApp Account
                    </DialogTitle>
                    <DialogDescription>
                      Open WhatsApp Web to link your device, then save your account here
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4 space-y-6">
                    {/* WhatsApp Logo and Instructions */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-[#25D366]/20 flex items-center justify-center mb-4">
                        <Smartphone className="h-10 w-10 text-[#25D366]" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Click below to open WhatsApp Web in a new tab. Link your device there, then return here to save your account.
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 w-full">
                        <Button 
                          className="flex-1 bg-[#25D366] hover:bg-[#25D366]/90"
                          onClick={handleOpenWhatsAppWeb}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open WhatsApp Web
                        </Button>
                        <Button 
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyLink('https://web.whatsapp.com/', 'WhatsApp Web')}
                          title="Copy Link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleOpenWhatsAppDownload}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">How to link:</p>
                      <ol className="text-xs text-muted-foreground space-y-1">
                        <li>1. Open WhatsApp Web in the new tab</li>
                        <li>2. On your phone, open WhatsApp → Settings → Linked Devices</li>
                        <li>3. Tap "Link a Device" and scan the QR code</li>
                        <li>4. Return here and enter your phone number below</li>
                      </ol>
                    </div>

                    {/* Account Details Form */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <Input
                          id="phoneNumber"
                          placeholder="+1234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name (Optional)</Label>
                        <Input
                          id="accountName"
                          placeholder="e.g., Business Account"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        className="w-full bg-[#25D366] hover:bg-[#25D366]/90"
                        onClick={async () => {
                          if (!phoneNumber.trim()) {
                            toast({ 
                              title: "Error", 
                              description: "Please enter your phone number", 
                              variant: "destructive" 
                            });
                            return;
                          }
                          
                          setAdding(true);
                          try {
                            const { error } = await supabase
                              .from("whatsapp_accounts")
                              .insert({
                                user_id: user!.id,
                                phone_number: phoneNumber.trim(),
                                account_name: accountName.trim() || null,
                                status: "active",
                              });

                            if (error) throw error;

                            toast({
                              title: "Account Added!",
                              description: "WhatsApp account saved successfully",
                            });
                            
                            setAddDialogOpen(false);
                            resetForm();
                            fetchAccounts();
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message || "Failed to save account",
                              variant: "destructive",
                            });
                          } finally {
                            setAdding(false);
                          }
                        }}
                        disabled={adding}
                      >
                        {adding ? (
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
                <div className="p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20">
                  <Smartphone className="h-6 w-6 text-[#25D366]" />
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
                  <p className="text-2xl font-bold">{totalMessagesSent}</p>
                  <p className="text-sm text-muted-foreground">Messages Today</p>
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
                      Switch after {rotationSettings.switchAfter} messages • 
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
                <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No accounts yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add WhatsApp accounts to enable multi-account rotation
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
                            ? "bg-[#25D366]/10 border-[#25D366]/20" 
                            : "bg-secondary/50 border-border"
                        }`}>
                          <Smartphone className={`h-6 w-6 ${
                            account.status === "active" ? "text-[#25D366]" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              {account.account_name || account.phone_number}
                            </h3>
                            <Badge 
                              className={
                                account.status === "active" 
                                  ? "bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30" 
                                  : account.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {account.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{account.phone_number}</span>
                            <span>•</span>
                            <span>{account.messages_sent_today || 0} messages today</span>
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
                    <Label>Switch After (messages)</Label>
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
                      Switch to next account after this many messages
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

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
