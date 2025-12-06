import { useEffect, useState, useRef, useCallback } from "react";
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
  QrCode, AlertCircle
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
  wa_session_id: string | null;
  created_at: string;
}

interface RotationSettings {
  enabled: boolean;
  mode: "sequential" | "random" | "least_used";
  switchAfter: number;
  cooldownMinutes: number;
}

type ConnectionState = "idle" | "generating" | "qr_ready" | "scanning" | "connected" | "failed";

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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // QR code connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  
  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingCountRef = useRef(0);
  
  // Reconnection state
  const [reconnectingAccountId, setReconnectingAccountId] = useState<string | null>(null);
  const [reconnectDialogOpen, setReconnectDialogOpen] = useState(false);
  
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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollingCountRef.current = 0;
  }, []);

  const resetConnectionState = useCallback(() => {
    stopPolling();
    setConnectionState("idle");
    setQrCode(null);
    setSessionId(null);
    setConnectedPhone(null);
    setConnectedName(null);
    setConnectionError(null);
    setAccountName("");
    setReconnectingAccountId(null);
  }, [stopPolling]);

  const generateQRCode = async () => {
    setConnectionState("generating");
    setConnectionError(null);
    setQrCode(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-accounts", {
        body: { action: "generate_qr" }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setQrCode(data.qrCode);
      setSessionId(data.sessionId);
      setConnectionState("qr_ready");
      
      // Start polling for status
      startStatusPolling(data.sessionId);
    } catch (error: any) {
      console.error("Error generating QR:", error);
      setConnectionError(error.message || "Failed to generate QR code");
      setConnectionState("failed");
    }
  };

  const startStatusPolling = (sid: string) => {
    stopPolling();
    pollingCountRef.current = 0;
    
    pollingRef.current = setInterval(async () => {
      pollingCountRef.current++;
      
      // Stop after 60 seconds (30 polls at 2s interval)
      if (pollingCountRef.current > 30) {
        stopPolling();
        setConnectionError("QR code expired. Click 'Refresh QR' to try again.");
        setConnectionState("failed");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("whatsapp-accounts", {
          body: { action: "check_status", sessionId: sid }
        });

        if (error) throw error;

        if (data.state === "connected") {
          stopPolling();
          setConnectedPhone(data.phoneNumber);
          setConnectedName(data.pushName);
          setConnectionState("connected");
        } else if (data.state === "scanning") {
          setConnectionState("scanning");
        } else if (data.state === "failed") {
          stopPolling();
          setConnectionError(data.error || "Connection failed");
          setConnectionState("failed");
        }
      } catch (error: any) {
        console.error("Polling error:", error);
      }
    }, 2000);
  };

  const saveConnectedAccount = async () => {
    if (!sessionId || !connectedPhone) return;

    try {
      if (reconnectingAccountId) {
        // Update existing account
        const { error } = await supabase.functions.invoke("whatsapp-accounts", {
          body: { 
            action: "update_status", 
            accountId: reconnectingAccountId,
            status: "connected",
            sessionId: sessionId
          }
        });

        if (error) throw error;

        toast({
          title: "Reconnected!",
          description: `${connectedName || connectedPhone} is now connected`,
        });
      } else {
        // Save new account
        const { data, error } = await supabase.functions.invoke("whatsapp-accounts", {
          body: { 
            action: "save_session", 
            sessionId: sessionId,
            phoneNumber: connectedPhone,
            accountName: accountName.trim() || connectedName || connectedPhone
          }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        toast({
          title: "Account Added!",
          description: `${connectedName || connectedPhone} connected successfully`,
        });
      }

      resetConnectionState();
      setAddDialogOpen(false);
      setReconnectDialogOpen(false);
      fetchAccounts();
    } catch (error: any) {
      console.error("Error saving account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save account",
        variant: "destructive",
      });
    }
  };

  const handleReconnect = async (account: WhatsAppAccount) => {
    setReconnectingAccountId(account.id);
    setReconnectDialogOpen(true);
    
    // Generate QR for reconnection
    setConnectionState("generating");
    setConnectionError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-accounts", {
        body: { action: "reconnect", accountId: account.id }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setQrCode(data.qrCode);
      setSessionId(data.sessionId);
      setConnectionState("qr_ready");
      
      startStatusPolling(data.sessionId);
    } catch (error: any) {
      console.error("Error reconnecting:", error);
      setConnectionError(error.message || "Failed to start reconnection");
      setConnectionState("failed");
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const { error } = await supabase.functions.invoke("whatsapp-accounts", {
        body: { action: "disconnect", accountId }
      });

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

  const handleDeleteAccount = async (accountId: string) => {
    try {
      // Disconnect first if connected
      await supabase.functions.invoke("whatsapp-accounts", {
        body: { action: "disconnect", accountId }
      });

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

  const activeAccounts = accounts.filter(a => a.status === "connected" || a.status === "active");
  const totalMessagesSent = accounts.reduce((acc, a) => acc + (a.messages_sent_today || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // QR Code Dialog Content Component
  const QRCodeDialogContent = () => (
    <div className="py-4 space-y-6">
      {connectionState === "idle" && (
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[#25D366]/20 flex items-center justify-center mb-4">
            <QrCode className="h-10 w-10 text-[#25D366]" />
          </div>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Generate a QR code to connect your WhatsApp account. You'll need to scan it with WhatsApp on your phone.
          </p>
          <Button 
            className="bg-[#25D366] hover:bg-[#25D366]/90"
            onClick={generateQRCode}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Generate QR Code
          </Button>
        </div>
      )}

      {connectionState === "generating" && (
        <div className="flex flex-col items-center py-8">
          <Loader2 className="h-12 w-12 text-[#25D366] animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Generating QR code...</p>
        </div>
      )}

      {(connectionState === "qr_ready" || connectionState === "scanning") && qrCode && (
        <div className="flex flex-col items-center">
          <div className="relative">
            <img 
              src={qrCode} 
              alt="WhatsApp QR Code" 
              className="w-64 h-64 rounded-lg border border-border"
            />
            {connectionState === "scanning" && (
              <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-[#25D366] animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium">Authenticating...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm font-medium mb-1">
              {connectionState === "scanning" ? "QR Code Scanned!" : "Scan with WhatsApp"}
            </p>
            <p className="text-xs text-muted-foreground">
              {connectionState === "scanning" 
                ? "Please wait while we connect..." 
                : "Open WhatsApp → Settings → Linked Devices → Link a Device"}
            </p>
          </div>

          {connectionState === "qr_ready" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={generateQRCode}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh QR
            </Button>
          )}
        </div>
      )}

      {connectionState === "connected" && (
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[#25D366]/20 flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-[#25D366]" />
          </div>
          <h3 className="text-lg font-medium mb-1">Connected!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {connectedName && `${connectedName} • `}{connectedPhone}
          </p>
          
          {!reconnectingAccountId && (
            <div className="w-full space-y-3 mb-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name (Optional)</Label>
                <Input
                  id="accountName"
                  placeholder={connectedName || "e.g., Business Account"}
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <Button 
            className="w-full bg-[#25D366] hover:bg-[#25D366]/90"
            onClick={saveConnectedAccount}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {reconnectingAccountId ? "Confirm Reconnection" : "Save Account"}
          </Button>
        </div>
      )}

      {connectionState === "failed" && (
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h3 className="text-lg font-medium mb-1">Connection Failed</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            {connectionError || "Unable to connect. Please try again."}
          </p>
          <Button 
            className="bg-[#25D366] hover:bg-[#25D366]/90"
            onClick={generateQRCode}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Instructions */}
      {(connectionState === "idle" || connectionState === "qr_ready") && (
        <div className="bg-secondary/50 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">How to connect:</p>
          <ol className="text-xs text-muted-foreground space-y-1">
            <li>1. Open WhatsApp on your phone</li>
            <li>2. Go to Settings → Linked Devices</li>
            <li>3. Tap "Link a Device"</li>
            <li>4. Scan the QR code above</li>
          </ol>
        </div>
      )}
    </div>
  );

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
                if (!open) resetConnectionState();
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
                      <QrCode className="h-5 w-5 text-[#25D366]" />
                      Connect WhatsApp Account
                    </DialogTitle>
                    <DialogDescription>
                      Scan the QR code with WhatsApp to link your account
                    </DialogDescription>
                  </DialogHeader>
                  <QRCodeDialogContent />
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
                  <p className="text-sm text-muted-foreground">Connected</p>
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
                          account.status === "connected" || account.status === "active"
                            ? "bg-[#25D366]/10 border-[#25D366]/20" 
                            : "bg-secondary/50 border-border"
                        }`}>
                          <Smartphone className={`h-6 w-6 ${
                            account.status === "connected" || account.status === "active"
                              ? "text-[#25D366]" 
                              : "text-muted-foreground"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              {account.account_name || account.phone_number}
                            </h3>
                            <Badge 
                              className={
                                account.status === "connected" || account.status === "active"
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
                        {account.status === "connected" || account.status === "active" ? (
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
                            <QrCode className="h-4 w-4 mr-1" />
                            {account.status === "pending" ? "Connect" : "Reconnect"}
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

          {/* Reconnect Dialog */}
          <Dialog open={reconnectDialogOpen} onOpenChange={(open) => {
            setReconnectDialogOpen(open);
            if (!open) resetConnectionState();
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-[#25D366]" />
                  Reconnect WhatsApp Account
                </DialogTitle>
                <DialogDescription>
                  Scan the QR code with WhatsApp to reconnect
                </DialogDescription>
              </DialogHeader>
              <QRCodeDialogContent />
            </DialogContent>
          </Dialog>

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
    </div>
  );
}
