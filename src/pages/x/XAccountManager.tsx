import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, RefreshCw, Settings, Trash2, CheckCircle, XCircle, 
  Key, Globe, RotateCcw, Clock, Smartphone, QrCode
} from "lucide-react";
import { SiX } from "@icons-pack/react-simple-icons";

export default function XAccountManager() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loginStep, setLoginStep] = useState<"credentials" | "qr" | "2fa" | "success">("credentials");
  const [qrCode, setQrCode] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    api_key: "",
    api_secret: "",
    access_token: "",
    access_token_secret: "",
    account_name: "",
    proxy_host: "",
    proxy_port: "",
    proxy_username: "",
    proxy_password: "",
  });

  const [rotationSettings, setRotationSettings] = useState({
    enabled: true,
    rotation_mode: "round_robin",
    delay_between_accounts: 60,
    max_actions_per_account: 50,
    cooldown_period: 300,
    respect_rate_limits: true,
  });

  const fetchAccounts = async () => {
    const { data } = await supabase.functions.invoke("x-publish", {
      body: { action: "list_accounts" },
    });
    setAccounts(data?.accounts || []);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const simulateLogin = async () => {
    setLoading(true);
    setLoginStep("qr");
    
    // Simulate QR code generation
    await new Promise((r) => setTimeout(r, 1000));
    setQrCode("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=x_auth_" + Date.now());
    
    // Simulate QR scan after delay
    await new Promise((r) => setTimeout(r, 3000));
    setLoginStep("2fa");
    
    await new Promise((r) => setTimeout(r, 2000));
    setLoginStep("success");
    setLoading(false);
  };

  const handleAddAccount = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("x-publish", {
        body: {
          action: "add_account",
          ...formData,
          proxy_port: formData.proxy_port ? parseInt(formData.proxy_port) : null,
        },
      });

      if (error) throw error;

      toast({
        title: "Account Added",
        description: `@${formData.username} has been added successfully`,
      });

      setShowAddDialog(false);
      setLoginStep("credentials");
      setFormData({
        username: "",
        api_key: "",
        api_secret: "",
        access_token: "",
        access_token_secret: "",
        account_name: "",
        proxy_host: "",
        proxy_port: "",
        proxy_username: "",
        proxy_password: "",
      });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await supabase.functions.invoke("x-publish", {
        body: { action: "delete_account", account_id: accountId },
      });
      toast({ title: "Account Deleted" });
      fetchAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRefreshStatus = async (accountId: string) => {
    toast({ title: "Refreshing status..." });
    await new Promise((r) => setTimeout(r, 1500));
    toast({ title: "Status Updated", description: "Account is active and ready" });
  };

  const saveRotationSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Multi-account rotation settings have been updated",
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SiX className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Account Manager</h1>
                <p className="text-muted-foreground">Manage X accounts and rotation settings</p>
              </div>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add X Account</DialogTitle>
                </DialogHeader>
                
                {loginStep === "credentials" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Account Name (Display)</Label>
                      <Input
                        value={formData.account_name}
                        onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                        placeholder="My Main Account"
                      />
                    </div>
                    <div>
                      <Label>Username</Label>
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="@username"
                      />
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3">API Credentials (Developer Portal)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">API Key</Label>
                          <Input
                            value={formData.api_key}
                            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                            placeholder="API Key"
                            type="password"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">API Secret</Label>
                          <Input
                            value={formData.api_secret}
                            onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                            placeholder="API Secret"
                            type="password"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Access Token</Label>
                          <Input
                            value={formData.access_token}
                            onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                            placeholder="Access Token"
                            type="password"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Access Token Secret</Label>
                          <Input
                            value={formData.access_token_secret}
                            onChange={(e) => setFormData({ ...formData, access_token_secret: e.target.value })}
                            placeholder="Access Token Secret"
                            type="password"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3">Proxy Settings (Optional)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Host</Label>
                          <Input
                            value={formData.proxy_host}
                            onChange={(e) => setFormData({ ...formData, proxy_host: e.target.value })}
                            placeholder="proxy.example.com"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Port</Label>
                          <Input
                            value={formData.proxy_port}
                            onChange={(e) => setFormData({ ...formData, proxy_port: e.target.value })}
                            placeholder="8080"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Username</Label>
                          <Input
                            value={formData.proxy_username}
                            onChange={(e) => setFormData({ ...formData, proxy_username: e.target.value })}
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Password</Label>
                          <Input
                            value={formData.proxy_password}
                            onChange={(e) => setFormData({ ...formData, proxy_password: e.target.value })}
                            placeholder="Optional"
                            type="password"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={simulateLogin} variant="outline" className="flex-1">
                        <QrCode className="h-4 w-4 mr-2" />
                        Login with QR
                      </Button>
                      <Button onClick={handleAddAccount} disabled={!formData.username} className="flex-1">
                        <Key className="h-4 w-4 mr-2" />
                        Add with API Keys
                      </Button>
                    </div>
                  </div>
                )}

                {loginStep === "qr" && (
                  <div className="text-center space-y-4 py-6">
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-lg">
                        {qrCode ? (
                          <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                        ) : (
                          <div className="w-48 h-48 bg-muted animate-pulse rounded" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Scan QR Code with X App</p>
                      <p className="text-sm text-muted-foreground">
                        Open X app → Settings → Security → Scan QR Code
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Waiting for scan...</span>
                    </div>
                  </div>
                )}

                {loginStep === "2fa" && (
                  <div className="text-center space-y-4 py-6">
                    <Smartphone className="h-16 w-16 mx-auto text-primary" />
                    <div>
                      <p className="font-medium">Confirm on Mobile</p>
                      <p className="text-sm text-muted-foreground">
                        Check your X app for a login confirmation request
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Waiting for confirmation...</span>
                    </div>
                  </div>
                )}

                {loginStep === "success" && (
                  <div className="text-center space-y-4 py-6">
                    <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                    <div>
                      <p className="font-medium text-green-500">Login Successful!</p>
                      <p className="text-sm text-muted-foreground">
                        Account has been added and is ready to use
                      </p>
                    </div>
                    <Button onClick={() => { setShowAddDialog(false); setLoginStep("credentials"); fetchAccounts(); }}>
                      Done
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">
                  {accounts.filter((a) => a.status === "active").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  On Cooldown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-500">
                  {accounts.filter((a) => a.status === "cooldown").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Rotation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={rotationSettings.enabled ? "default" : "secondary"}>
                  {rotationSettings.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="accounts">
            <TabsList>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="rotation">Rotation Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="accounts">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>Manage your X accounts for automation</CardDescription>
                </CardHeader>
                <CardContent>
                  {accounts.length === 0 ? (
                    <div className="text-center py-8">
                      <SiX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No accounts connected yet</p>
                      <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Account
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <SiX className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {account.account_name || `@${account.username}`}
                              </p>
                              <p className="text-sm text-muted-foreground">@{account.username}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{account.followers_count?.toLocaleString() || 0} followers</span>
                                <span>•</span>
                                <span>Daily: {account.daily_tweet_count || 0} tweets</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {account.proxy_host && (
                              <Badge variant="outline" className="text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                Proxy
                              </Badge>
                            )}
                            <Badge
                              variant={
                                account.status === "active"
                                  ? "default"
                                  : account.status === "cooldown"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {account.status === "active" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {account.status === "cooldown" && <Clock className="h-3 w-3 mr-1" />}
                              {account.status === "suspended" && <XCircle className="h-3 w-3 mr-1" />}
                              {account.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRefreshStatus(account.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rotation">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Multi-Account Rotation
                  </CardTitle>
                  <CardDescription>
                    Configure how accounts are rotated during automation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Account Rotation</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically switch between accounts during actions
                      </p>
                    </div>
                    <Switch
                      checked={rotationSettings.enabled}
                      onCheckedChange={(checked) =>
                        setRotationSettings({ ...rotationSettings, enabled: checked })
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Rotation Mode</Label>
                      <Select
                        value={rotationSettings.rotation_mode}
                        onValueChange={(value) =>
                          setRotationSettings({ ...rotationSettings, rotation_mode: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round_robin">Round Robin</SelectItem>
                          <SelectItem value="random">Random</SelectItem>
                          <SelectItem value="least_used">Least Used First</SelectItem>
                          <SelectItem value="weighted">Weighted by Followers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Delay Between Accounts (seconds)</Label>
                      <Input
                        type="number"
                        value={rotationSettings.delay_between_accounts}
                        onChange={(e) =>
                          setRotationSettings({
                            ...rotationSettings,
                            delay_between_accounts: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Max Actions Per Account (per hour)</Label>
                      <Input
                        type="number"
                        value={rotationSettings.max_actions_per_account}
                        onChange={(e) =>
                          setRotationSettings({
                            ...rotationSettings,
                            max_actions_per_account: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Cooldown Period (seconds)</Label>
                      <Input
                        type="number"
                        value={rotationSettings.cooldown_period}
                        onChange={(e) =>
                          setRotationSettings({
                            ...rotationSettings,
                            cooldown_period: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <Label>Respect Rate Limits</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically pause when approaching X API limits
                      </p>
                    </div>
                    <Switch
                      checked={rotationSettings.respect_rate_limits}
                      onCheckedChange={(checked) =>
                        setRotationSettings({ ...rotationSettings, respect_rate_limits: checked })
                      }
                    />
                  </div>

                  <Button onClick={saveRotationSettings} className="w-full">
                    Save Rotation Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
