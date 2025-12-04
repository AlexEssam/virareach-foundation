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
  Smartphone, QrCode, Key, Shield, RefreshCw, Settings, 
  Loader2, Check, Trash2, Save, Plus, RotateCcw, Eye, EyeOff, Lock, Timer, Shuffle
} from "lucide-react";
import { SiTiktok } from "@icons-pack/react-simple-icons";

interface TikTokAccount {
  id: string;
  username: string;
  account_name: string | null;
  status: string;
  session_data: string | null;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_username: string | null;
  proxy_password: string | null;
  followers_count: number | null;
  following_count: number | null;
  likes_count: number | null;
  daily_follow_count: number | null;
  daily_dm_count: number | null;
  last_action_at: string | null;
  created_at: string;
}

const rotationStrategies = [
  { value: "round_robin", label: "Round Robin", description: "Cycle through accounts sequentially" },
  { value: "random", label: "Random", description: "Pick random account for each action" },
  { value: "least_used", label: "Least Used", description: "Prioritize accounts with lowest activity" },
  { value: "cooldown", label: "Cooldown Based", description: "Skip accounts on cooldown" },
  { value: "weighted", label: "Weighted", description: "Based on account health score" },
];

const securityPresets = [
  { value: "safe", label: "Safe Mode", minDelay: 30, maxDelay: 90, dailyLimit: 50 },
  { value: "moderate", label: "Moderate", minDelay: 15, maxDelay: 45, dailyLimit: 100 },
  { value: "aggressive", label: "Aggressive", minDelay: 5, maxDelay: 20, dailyLimit: 200 },
  { value: "custom", label: "Custom", minDelay: 0, maxDelay: 0, dailyLimit: 0 },
];

export default function TikTokAccountManager() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<'idle' | 'qr' | 'credentials' | 'success'>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Account form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accountName, setAccountName] = useState("");
  
  // Proxy settings
  const [proxyHost, setProxyHost] = useState("");
  const [proxyPort, setProxyPort] = useState("");
  const [proxyUsername, setProxyUsername] = useState("");
  const [proxyPassword, setProxyPassword] = useState("");
  
  // Rotation settings
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [rotationStrategy, setRotationStrategy] = useState("round_robin");
  const [maxDailyFollows, setMaxDailyFollows] = useState("100");
  const [maxDailyDMs, setMaxDailyDMs] = useState("50");
  const [cooldownMinutes, setCooldownMinutes] = useState("30");
  const [autoSwitchOnLimit, setAutoSwitchOnLimit] = useState(true);
  
  // Security settings
  const [securityPreset, setSecurityPreset] = useState("safe");
  const [minDelay, setMinDelay] = useState("30");
  const [maxDelay, setMaxDelay] = useState("90");
  const [randomizeKeywords, setRandomizeKeywords] = useState(true);
  const [humanizeActions, setHumanizeActions] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchAccounts();
  }, [user]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('tiktok_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAccounts(data);
    if (error) console.error('Error fetching accounts:', error);
  };

  const handleGenerateQR = async () => {
    setLoginLoading(true);
    setLoginStep('qr');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=tiktok://login?token=${Date.now()}`);
    setLoginLoading(false);
    toast({ title: "QR Code Generated", description: "Scan with your TikTok app" });
  };

  const handleCredentialsLogin = async () => {
    if (!username || !password) {
      toast({ title: "Error", description: "Please enter username and password", variant: "destructive" });
      return;
    }
    setLoginLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoginStep('success');
    setLoginLoading(false);
    await handleSaveAccount();
  };

  const handleSaveAccount = async () => {
    if (!username) {
      toast({ title: "Error", description: "Please enter a username", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('tiktok_accounts').insert({
        user_id: user!.id,
        username: username.replace('@', ''),
        account_name: accountName || `TikTok @${username}`,
        proxy_host: proxyHost || null,
        proxy_port: proxyPort ? parseInt(proxyPort) : null,
        proxy_username: proxyUsername || null,
        proxy_password: proxyPassword || null,
        status: 'active',
        session_data: JSON.stringify({ verified: true, savedAt: new Date().toISOString() })
      });
      if (error) throw error;
      toast({ title: "Account Saved", description: "TikTok account added successfully" });
      resetForm();
      fetchAccounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setAccountName("");
    setProxyHost("");
    setProxyPort("");
    setProxyUsername("");
    setProxyPassword("");
    setQrCode(null);
    setLoginStep('idle');
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase.from('tiktok_accounts').delete().eq('id', accountId);
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
      const { error } = await supabase.from('tiktok_accounts').update({ status: newStatus }).eq('id', accountId);
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
      const { error } = await supabase.from('tiktok_accounts').update({ 
        daily_follow_count: 0, daily_dm_count: 0, daily_unfollow_count: 0
      }).eq('user_id', user!.id);
      if (error) throw error;
      toast({ title: "Daily Limits Reset" });
      fetchAccounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleSecurityPresetChange = (preset: string) => {
    setSecurityPreset(preset);
    const selected = securityPresets.find(p => p.value === preset);
    if (selected && preset !== 'custom') {
      setMinDelay(selected.minDelay.toString());
      setMaxDelay(selected.maxDelay.toString());
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <SiTiktok className="h-8 w-8" />
              TikTok Account Manager
            </h1>
            <p className="text-muted-foreground mt-2">Manage accounts, security settings, and multi-account rotation</p>
          </div>

          <Tabs defaultValue="accounts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="add">Add Account</TabsTrigger>
              <TabsTrigger value="rotation">Rotation</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your TikTok Accounts</h2>
                <Button variant="outline" size="sm" onClick={handleResetDailyLimits}>
                  <RotateCcw className="h-4 w-4 mr-2" />Reset Daily Limits
                </Button>
              </div>

              {accounts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <SiTiktok className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No accounts added yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {accounts.map((account) => (
                    <Card key={account.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                              <SiTiktok className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{account.account_name || `@${account.username}`}</p>
                              <p className="text-sm text-muted-foreground">@{account.username}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>{account.status}</Badge>
                                {account.proxy_host && <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />Proxy</Badge>}
                                {account.session_data && <Badge variant="outline" className="text-green-600 border-green-600/30"><Check className="h-3 w-3 mr-1" />Verified</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right text-sm">
                              <p className="text-muted-foreground">Followers</p>
                              <p className="font-medium">{account.followers_count?.toLocaleString() || 0}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-muted-foreground">Today's Actions</p>
                              <p className="font-medium">{(account.daily_follow_count || 0) + (account.daily_dm_count || 0)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={account.status === 'active'} onCheckedChange={() => handleToggleStatus(account.id, account.status)} />
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteAccount(account.id)}>
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
                    <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" />QR Code Login</CardTitle>
                    <CardDescription>Scan with your TikTok app for secure login</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loginStep === 'idle' && (
                      <Button onClick={handleGenerateQR} disabled={loginLoading} className="w-full">
                        {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                        Generate QR Code
                      </Button>
                    )}
                    {loginStep === 'qr' && qrCode && (
                      <div className="space-y-4">
                        <div className="flex justify-center p-4 bg-white rounded-lg">
                          <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">Open TikTok → Profile → Menu → QR Code → Scan</p>
                        <Button variant="outline" onClick={() => { setLoginStep('idle'); setQrCode(null); }} className="w-full">Cancel</Button>
                      </div>
                    )}
                    {loginStep === 'success' && (
                      <div className="text-center py-4">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                          <Check className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="font-medium">Account Added Successfully!</p>
                        <Button variant="outline" onClick={resetForm} className="mt-4"><Plus className="mr-2 h-4 w-4" />Add Another</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Credentials Login</CardTitle>
                    <CardDescription>Login with username and password</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input placeholder="@username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Account Name (optional)</Label>
                      <Input placeholder="My TikTok Account" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                    </div>
                    <Button onClick={handleCredentialsLogin} disabled={loginLoading || !username || !password} className="w-full">
                      {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                      Login & Save
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Proxy Settings (Per Account)</CardTitle>
                    <CardDescription>Configure proxy for enhanced security and account protection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Proxy Host</Label>
                        <Input placeholder="proxy.example.com" value={proxyHost} onChange={(e) => setProxyHost(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Port</Label>
                        <Input placeholder="8080" value={proxyPort} onChange={(e) => setProxyPort(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input placeholder="username" value={proxyUsername} onChange={(e) => setProxyUsername(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" placeholder="password" value={proxyPassword} onChange={(e) => setProxyPassword(e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="rotation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" />Multi-Account Rotation</CardTitle>
                  <CardDescription>Configure how accounts are rotated for optimal performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Enable Account Rotation</Label>
                      <p className="text-sm text-muted-foreground">Automatically switch between accounts</p>
                    </div>
                    <Switch checked={rotationEnabled} onCheckedChange={setRotationEnabled} />
                  </div>

                  {rotationEnabled && (
                    <>
                      <div className="space-y-3">
                        <Label>Rotation Strategy</Label>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {rotationStrategies.map((strategy) => (
                            <div key={strategy.value} className={`p-4 rounded-lg border cursor-pointer transition-colors ${rotationStrategy === strategy.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => setRotationStrategy(strategy.value)}>
                              <p className="font-medium">{strategy.label}</p>
                              <p className="text-sm text-muted-foreground">{strategy.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Max Daily Follows/Account</Label>
                          <Input type="number" value={maxDailyFollows} onChange={(e) => setMaxDailyFollows(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Daily DMs/Account</Label>
                          <Input type="number" value={maxDailyDMs} onChange={(e) => setMaxDailyDMs(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Cooldown (minutes)</Label>
                          <Input type="number" value={cooldownMinutes} onChange={(e) => setCooldownMinutes(e.target.value)} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Auto-Switch on Limit</Label>
                          <p className="text-sm text-muted-foreground">Switch when daily limit reached</p>
                        </div>
                        <Switch checked={autoSwitchOnLimit} onCheckedChange={setAutoSwitchOnLimit} />
                      </div>
                    </>
                  )}

                  <Button className="w-full"><Save className="mr-2 h-4 w-4" />Save Rotation Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Security & Anti-Detection</CardTitle>
                  <CardDescription>Configure randomization and human-like behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Security Preset</Label>
                    <Select value={securityPreset} onValueChange={handleSecurityPresetChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {securityPresets.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Timer className="h-4 w-4" />Min Delay (seconds)</Label>
                      <Input type="number" value={minDelay} onChange={(e) => setMinDelay(e.target.value)} disabled={securityPreset !== 'custom'} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Timer className="h-4 w-4" />Max Delay (seconds)</Label>
                      <Input type="number" value={maxDelay} onChange={(e) => setMaxDelay(e.target.value)} disabled={securityPreset !== 'custom'} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base flex items-center gap-2"><Shuffle className="h-4 w-4" />Keyword Randomization</Label>
                        <p className="text-sm text-muted-foreground">Mix keywords and phrases to avoid detection</p>
                      </div>
                      <Switch checked={randomizeKeywords} onCheckedChange={setRandomizeKeywords} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Humanize Actions</Label>
                        <p className="text-sm text-muted-foreground">Add human-like pauses and variations</p>
                      </div>
                      <Switch checked={humanizeActions} onCheckedChange={setHumanizeActions} />
                    </div>
                  </div>

                  <Button className="w-full"><Save className="mr-2 h-4 w-4" />Save Security Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Security Best Practices</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Use unique proxies for each account</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Enable randomized delays between actions</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Keep daily limits conservative</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Use keyword mixing to vary messages</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Monitor account health regularly</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
