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
  ExternalLink, Shield, Loader2, Check, Trash2, Plus, RotateCcw, 
  Eye, EyeOff, Lock, Timer, Shuffle, FolderOpen, UserPlus, Copy
} from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";

interface InstagramAccount {
  id: string;
  username: string;
  account_name: string | null;
  account_email: string | null;
  account_password: string | null;
  status: string;
  session_data: string | null;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_username: string | null;
  proxy_password: string | null;
  followers_count: number | null;
  following_count: number | null;
  daily_follow_count: number | null;
  daily_unfollow_count: number | null;
  daily_dm_count: number | null;
  profile_path: string | null;
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

export default function InstagramAccounts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<'idle' | 'success'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  
  // Account form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [profilePath, setProfilePath] = useState("");
  
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
  const [maxDailyUnfollows, setMaxDailyUnfollows] = useState("50");
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
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("instagram-accounts", {
        body: { action: "list" },
      });
      if (error) throw error;
      setAccounts(data.accounts || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInstagramLogin = () => {
    window.open('https://www.instagram.com/accounts/login/', '_blank');
    toast({ title: "Instagram Opened", description: "Login to Instagram, then save your credentials here" });
  };

  const handleOpenInstagramSignUp = () => {
    window.open('https://www.instagram.com/accounts/emailsignup/', '_blank');
    toast({ title: "Instagram Opened", description: "Create your account, then save your credentials here" });
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: `${name} URL copied to clipboard` });
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
      const { error } = await supabase.functions.invoke("instagram-accounts", {
        body: {
          action: "add",
          username: username.replace('@', ''),
          account_name: accountName || `Instagram @${username}`,
          account_email: accountEmail || null,
          account_password: password || null,
          profile_path: profilePath || null,
          proxy_host: proxyHost || null,
          proxy_port: proxyPort ? parseInt(proxyPort) : null,
          proxy_username: proxyUsername || null,
          proxy_password: proxyPassword || null,
        },
      });
      if (error) throw error;
      toast({ title: "Account Saved", description: "Instagram account added successfully" });
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setAccountName("");
    setAccountEmail("");
    setProfilePath("");
    setProxyHost("");
    setProxyPort("");
    setProxyUsername("");
    setProxyPassword("");
    setLoginStep('idle');
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase.functions.invoke("instagram-accounts", {
        body: { action: "delete", id: accountId },
      });
      if (error) throw error;
      toast({ title: "Account Deleted" });
      fetchAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (accountId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase.functions.invoke("instagram-accounts", {
        body: { action: "update", id: accountId, status: newStatus },
      });
      if (error) throw error;
      toast({ title: `Account ${newStatus === 'active' ? 'Activated' : 'Deactivated'}` });
      fetchAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleResetDailyLimits = async () => {
    try {
      for (const account of accounts) {
        await supabase.functions.invoke("instagram-accounts", {
          body: { action: "reset_daily_counts", id: account.id },
        });
      }
      toast({ title: "Daily Limits Reset" });
      fetchAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleBrowseFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite', startIn: 'documents' });
        setProfilePath(dirHandle.name);
        toast({ title: "Folder Selected", description: `Selected folder: ${dirHandle.name}` });
      } else {
        toast({ title: "Not Supported", description: "Please enter the folder path manually", variant: "destructive" });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({ title: "Error", description: "Failed to select folder", variant: "destructive" });
      }
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
              <SiInstagram className="h-8 w-8" color="#E4405F" />
              Instagram Account Manager
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

            {/* ACCOUNTS TAB */}
            <TabsContent value="accounts" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Instagram Accounts</h2>
                <Button variant="outline" size="sm" onClick={handleResetDailyLimits}>
                  <RotateCcw className="h-4 w-4 mr-2" />Reset Daily Limits
                </Button>
              </div>

              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading accounts...</p>
                  </CardContent>
                </Card>
              ) : accounts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <SiInstagram className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                              <SiInstagram className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{account.account_name || `@${account.username}`}</p>
                              <p className="text-sm text-muted-foreground">@{account.username}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>{account.status}</Badge>
                                {account.proxy_host && <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />Proxy</Badge>}
                                {account.account_email && account.account_password && (
                                  <Badge variant="outline" className="text-green-600 border-green-600/30"><Check className="h-3 w-3 mr-1" />Logged</Badge>
                                )}
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

            {/* ADD ACCOUNT TAB */}
            <TabsContent value="add" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ExternalLink className="h-5 w-5" />Open Instagram to Login</CardTitle>
                    <CardDescription>Login on Instagram, then save your credentials here</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loginStep === 'idle' && (
                      <>
                        <div className="p-4 bg-muted/50 rounded-lg text-center space-y-2">
                          <SiInstagram className="h-12 w-12 mx-auto" color="#E4405F" />
                          <p className="text-sm text-muted-foreground">
                            Click below to open Instagram. After logging in, return here and save your credentials.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleOpenInstagramLogin} className="flex-1">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Instagram Login
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleCopyLink('https://www.instagram.com/accounts/login/', 'Instagram')}
                            title="Copy Link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button onClick={handleOpenInstagramSignUp} variant="outline" className="w-full">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Open Instagram Sign Up
                        </Button>
                      </>
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
                      <Label>Email / Phone (optional)</Label>
                      <Input placeholder="email@example.com" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Name (optional)</Label>
                      <Input placeholder="My Instagram Account" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Profile Folder (optional)</Label>
                      <div className="flex gap-2">
                        <Input placeholder="C:\Users\Instagram\Profile1" value={profilePath} onChange={(e) => setProfilePath(e.target.value)} className="flex-1" />
                        <Button type="button" variant="outline" onClick={handleBrowseFolder}><FolderOpen className="h-4 w-4" /></Button>
                      </div>
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
                        <Label>Proxy Port</Label>
                        <Input placeholder="8080" value={proxyPort} onChange={(e) => setProxyPort(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Proxy Username</Label>
                        <Input placeholder="username" value={proxyUsername} onChange={(e) => setProxyUsername(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Proxy Password</Label>
                        <Input type="password" placeholder="password" value={proxyPassword} onChange={(e) => setProxyPassword(e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ROTATION TAB */}
            <TabsContent value="rotation" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shuffle className="h-5 w-5" />Rotation Settings</CardTitle>
                    <CardDescription>Configure how accounts are rotated during automation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable Rotation</p>
                        <p className="text-sm text-muted-foreground">Automatically switch between accounts</p>
                      </div>
                      <Switch checked={rotationEnabled} onCheckedChange={setRotationEnabled} />
                    </div>
                    <div className="space-y-2">
                      <Label>Rotation Strategy</Label>
                      <Select value={rotationStrategy} onValueChange={setRotationStrategy}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <div className="space-y-2">
                      <Label>Cooldown (minutes)</Label>
                      <Input type="number" value={cooldownMinutes} onChange={(e) => setCooldownMinutes(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-switch on Limit</p>
                        <p className="text-sm text-muted-foreground">Switch account when daily limit reached</p>
                      </div>
                      <Switch checked={autoSwitchOnLimit} onCheckedChange={setAutoSwitchOnLimit} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5" />Daily Limits</CardTitle>
                    <CardDescription>Set maximum actions per day per account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Max Daily Follows</Label>
                      <Input type="number" value={maxDailyFollows} onChange={(e) => setMaxDailyFollows(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Daily Unfollows</Label>
                      <Input type="number" value={maxDailyUnfollows} onChange={(e) => setMaxDailyUnfollows(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Daily DMs</Label>
                      <Input type="number" value={maxDailyDMs} onChange={(e) => setMaxDailyDMs(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Account Status Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {accounts.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No accounts to display</p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-3">
                        {accounts.map((account) => (
                          <div key={account.id} className="p-4 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                                <SiInstagram className="h-4 w-4 text-white" />
                              </div>
                              <span className="font-medium">@{account.username}</span>
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Follows Today</span>
                                <span>{account.daily_follow_count || 0}/{maxDailyFollows}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">DMs Today</span>
                                <span>{account.daily_dm_count || 0}/{maxDailyDMs}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={account.status === 'active' ? 'default' : 'secondary'} className="h-5">{account.status}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SECURITY TAB */}
            <TabsContent value="security" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Security Presets</CardTitle>
                    <CardDescription>Choose a security level or customize your own</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Security Preset</Label>
                      <Select value={securityPreset} onValueChange={handleSecurityPresetChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {securityPresets.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value}>{preset.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Min Delay (seconds)</Label>
                        <Input type="number" value={minDelay} onChange={(e) => setMinDelay(e.target.value)} disabled={securityPreset !== 'custom'} />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Delay (seconds)</Label>
                        <Input type="number" value={maxDelay} onChange={(e) => setMaxDelay(e.target.value)} disabled={securityPreset !== 'custom'} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Anti-Detection</CardTitle>
                    <CardDescription>Features to avoid Instagram detection</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Randomize Keywords</p>
                        <p className="text-sm text-muted-foreground">Vary message content slightly</p>
                      </div>
                      <Switch checked={randomizeKeywords} onCheckedChange={setRandomizeKeywords} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Humanize Actions</p>
                        <p className="text-sm text-muted-foreground">Add natural delays and patterns</p>
                      </div>
                      <Switch checked={humanizeActions} onCheckedChange={setHumanizeActions} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Security Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="p-4 rounded-lg border text-center">
                        <p className="text-2xl font-bold text-green-500">{accounts.filter(a => a.proxy_host).length}</p>
                        <p className="text-sm text-muted-foreground">Accounts with Proxy</p>
                      </div>
                      <div className="p-4 rounded-lg border text-center">
                        <p className="text-2xl font-bold">{accounts.filter(a => a.status === 'active').length}</p>
                        <p className="text-sm text-muted-foreground">Active Accounts</p>
                      </div>
                      <div className="p-4 rounded-lg border text-center">
                        <p className="text-2xl font-bold">{minDelay}s - {maxDelay}s</p>
                        <p className="text-sm text-muted-foreground">Delay Range</p>
                      </div>
                      <div className="p-4 rounded-lg border text-center">
                        <p className="text-2xl font-bold capitalize">{securityPreset}</p>
                        <p className="text-sm text-muted-foreground">Security Level</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
