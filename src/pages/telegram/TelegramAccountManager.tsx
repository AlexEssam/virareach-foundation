import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Smartphone, Key, Shield, RefreshCw, Settings, 
  Loader2, Check, X, Trash2, Save, Plus, RotateCcw, ExternalLink, Copy, Download
} from "lucide-react";

interface TelegramAccount {
  id: string;
  phone_number: string;
  account_name: string | null;
  status: string;
  api_id: string | null;
  api_hash: string | null;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_username: string | null;
  proxy_password: string | null;
  messages_sent_today: number | null;
  groups_joined_today: number | null;
  last_action_at: string | null;
  created_at: string;
}

const rotationStrategies = [
  { value: "round_robin", label: "Round Robin", description: "Cycle through accounts sequentially" },
  { value: "random", label: "Random", description: "Pick random account for each action" },
  { value: "least_used", label: "Least Used", description: "Prioritize accounts with lowest activity" },
  { value: "cooldown", label: "Cooldown Based", description: "Skip accounts on cooldown" },
];

export default function TelegramAccountManager() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<'idle' | 'success'>('idle');
  
  // New account form
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  
  // Proxy settings
  const [proxyHost, setProxyHost] = useState("");
  const [proxyPort, setProxyPort] = useState("");
  const [proxyUsername, setProxyUsername] = useState("");
  const [proxyPassword, setProxyPassword] = useState("");
  
  // Rotation settings
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [rotationStrategy, setRotationStrategy] = useState("round_robin");
  const [maxDailyMessages, setMaxDailyMessages] = useState("100");
  const [maxDailyGroups, setMaxDailyGroups] = useState("10");
  const [cooldownMinutes, setCooldownMinutes] = useState("30");
  const [autoSwitchOnLimit, setAutoSwitchOnLimit] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('telegram_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setAccounts(data);
    if (error) console.error('Error fetching accounts:', error);
  };

  const handleOpenTelegramWeb = () => {
    window.open('https://web.telegram.org/', '_blank');
    toast({ title: "Telegram Web Opened", description: "Login to Telegram Web, then save your account here" });
  };

  const handleOpenTelegramDesktop = () => {
    window.open('https://desktop.telegram.org/', '_blank');
    toast({ title: "Telegram Download Opened", description: "Download Telegram Desktop" });
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: `${name} URL copied to clipboard` });
  };

  const handleSaveAccount = async () => {
    if (!phoneNumber) {
      toast({ title: "Error", description: "Please enter a phone number", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('telegram_accounts')
        .insert({
          user_id: user!.id,
          phone_number: phoneNumber,
          account_name: accountName || `Account ${phoneNumber.slice(-4)}`,
          api_id: apiId || null,
          api_hash: apiHash || null,
          proxy_host: proxyHost || null,
          proxy_port: proxyPort ? parseInt(proxyPort) : null,
          proxy_username: proxyUsername || null,
          proxy_password: proxyPassword || null,
          status: 'active',
          session_data: JSON.stringify({ verified: true, loginMethod: 'qr' })
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Account Saved", description: "Telegram account added successfully" });
      
      // Reset form
      setPhoneNumber("");
      setAccountName("");
      setApiId("");
      setApiHash("");
      setProxyHost("");
      setProxyPort("");
      setProxyUsername("");
      setProxyPassword("");
      setLoginStep('idle');
      
      fetchAccounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('telegram_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast({ title: "Account Deleted" });
      fetchAccounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (accountId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('telegram_accounts')
        .update({ status: newStatus })
        .eq('id', accountId);

      if (error) throw error;

      toast({ title: `Account ${newStatus === 'active' ? 'Activated' : 'Deactivated'}` });
      fetchAccounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleResetDailyLimits = async () => {
    try {
      const { error } = await supabase
        .from('telegram_accounts')
        .update({ 
          messages_sent_today: 0,
          groups_joined_today: 0
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      toast({ title: "Daily Limits Reset", description: "All account counters have been reset" });
      fetchAccounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Telegram Account Manager</h1>
            <p className="text-muted-foreground mt-2">Manage accounts, login sessions, and multi-account rotation</p>
          </div>

          <Tabs defaultValue="accounts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="add">Add Account</TabsTrigger>
              <TabsTrigger value="rotation">Rotation Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Telegram Accounts</h2>
                <Button variant="outline" size="sm" onClick={handleResetDailyLimits}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Daily Limits
                </Button>
              </div>

              {accounts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No accounts added yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Add your first Telegram account to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {accounts.map((account) => (
                    <Card key={account.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Smartphone className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{account.account_name || account.phone_number}</p>
                              <p className="text-sm text-muted-foreground">{account.phone_number}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                                  {account.status}
                                </Badge>
                                {account.proxy_host && (
                                  <Badge variant="outline">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Proxy
                                  </Badge>
                                )}
                                {account.api_id && (
                                  <Badge variant="outline">
                                    <Key className="h-3 w-3 mr-1" />
                                    API
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right text-sm">
                              <p className="text-muted-foreground">Messages Today</p>
                              <p className="font-medium">{account.messages_sent_today || 0}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-muted-foreground">Groups Today</p>
                              <p className="font-medium">{account.groups_joined_today || 0}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={account.status === 'active'}
                                onCheckedChange={() => handleToggleStatus(account.id, account.status)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteAccount(account.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="add" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      Open Telegram to Login
                    </CardTitle>
                    <CardDescription>Login on Telegram Web or Desktop, then save your account here</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="+1234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Account Name (optional)</Label>
                      <Input
                        placeholder="My Telegram"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                      />
                    </div>

                    {loginStep === 'idle' && (
                      <>
                        <div className="p-4 bg-muted/50 rounded-lg text-center space-y-2">
                          <Smartphone className="h-12 w-12 mx-auto text-primary" />
                          <p className="text-sm text-muted-foreground">
                            Click below to open Telegram. After logging in, return here and save your account.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleOpenTelegramWeb} className="flex-1">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Telegram Web
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleCopyLink('https://web.telegram.org/', 'Telegram Web')}
                            title="Copy Link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleOpenTelegramDesktop} variant="outline" className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Download Telegram Desktop
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleCopyLink('https://desktop.telegram.org/', 'Telegram Desktop')}
                            title="Copy Link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button onClick={handleSaveAccount} disabled={loading || !phoneNumber} className="w-full">
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Save Account
                        </Button>
                      </>
                    )}

                    {loginStep === 'success' && (
                      <div className="text-center py-4">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                          <Check className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="font-medium">Account Added Successfully!</p>
                        <Button variant="outline" onClick={() => setLoginStep('idle')} className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Another Account
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        API Credentials (Optional)
                      </CardTitle>
                      <CardDescription>For advanced automation features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>API ID</Label>
                        <Input
                          placeholder="12345678"
                          value={apiId}
                          onChange={(e) => setApiId(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>API Hash</Label>
                        <Input
                          type="password"
                          placeholder="••••••••••••••••"
                          value={apiHash}
                          onChange={(e) => setApiHash(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Get credentials from my.telegram.org
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Proxy Settings (Optional)
                      </CardTitle>
                      <CardDescription>Route traffic through a proxy</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Proxy Host</Label>
                          <Input
                            placeholder="proxy.example.com"
                            value={proxyHost}
                            onChange={(e) => setProxyHost(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Port</Label>
                          <Input
                            placeholder="8080"
                            value={proxyPort}
                            onChange={(e) => setProxyPort(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input
                            placeholder="Optional"
                            value={proxyUsername}
                            onChange={(e) => setProxyUsername(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input
                            type="password"
                            placeholder="Optional"
                            value={proxyPassword}
                            onChange={(e) => setProxyPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {loginStep === 'idle' && (
                    <Button onClick={handleSaveAccount} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Account Manually
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rotation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Multi-Account Rotation
                  </CardTitle>
                  <CardDescription>Configure how accounts are rotated during automation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Account Rotation</Label>
                      <p className="text-sm text-muted-foreground">Automatically switch between accounts</p>
                    </div>
                    <Switch checked={rotationEnabled} onCheckedChange={setRotationEnabled} />
                  </div>

                  {rotationEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Rotation Strategy</Label>
                        <Select value={rotationStrategy} onValueChange={setRotationStrategy}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {rotationStrategies.map((strategy) => (
                              <SelectItem key={strategy.value} value={strategy.value}>
                                <div>
                                  <p>{strategy.label}</p>
                                  <p className="text-xs text-muted-foreground">{strategy.description}</p>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Max Daily Messages</Label>
                          <Input
                            type="number"
                            value={maxDailyMessages}
                            onChange={(e) => setMaxDailyMessages(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">Per account limit</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Max Daily Groups</Label>
                          <Input
                            type="number"
                            value={maxDailyGroups}
                            onChange={(e) => setMaxDailyGroups(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">Groups to join per day</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Cooldown (minutes)</Label>
                          <Input
                            type="number"
                            value={cooldownMinutes}
                            onChange={(e) => setCooldownMinutes(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">Between switches</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-Switch on Limit</Label>
                          <p className="text-sm text-muted-foreground">Switch when account reaches daily limit</p>
                        </div>
                        <Switch checked={autoSwitchOnLimit} onCheckedChange={setAutoSwitchOnLimit} />
                      </div>
                    </>
                  )}

                  <Button className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Rotation Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Status Overview</CardTitle>
                  <CardDescription>Current state of your accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{accounts.length}</p>
                      <p className="text-sm text-muted-foreground">Total Accounts</p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-500/10 text-center">
                      <p className="text-2xl font-bold text-green-500">
                        {accounts.filter(a => a.status === 'active').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">
                        {accounts.reduce((sum, a) => sum + (a.messages_sent_today || 0), 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Messages Today</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">
                        {accounts.reduce((sum, a) => sum + (a.groups_joined_today || 0), 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Groups Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
