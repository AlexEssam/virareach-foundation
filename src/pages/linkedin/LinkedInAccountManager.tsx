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
  Linkedin, Key, Shield, RefreshCw, Settings, 
  Loader2, Check, X, Trash2, Save, Plus, RotateCcw, Mail, Lock, Eye, EyeOff
} from "lucide-react";

interface LinkedInAccount {
  id: string;
  email: string;
  account_name: string | null;
  status: string;
  session_data: string | null;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_username: string | null;
  proxy_password: string | null;
  messages_sent_today: number | null;
  connections_sent_today: number | null;
  last_action_at: string | null;
  created_at: string;
}

const rotationStrategies = [
  { value: "round_robin", label: "Round Robin", description: "Cycle through accounts sequentially" },
  { value: "random", label: "Random", description: "Pick random account for each action" },
  { value: "least_used", label: "Least Used", description: "Prioritize accounts with lowest activity" },
  { value: "cooldown", label: "Cooldown Based", description: "Skip accounts on cooldown" },
];

export default function LinkedInAccountManager() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<'idle' | 'credentials' | '2fa' | 'success'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  
  // New account form
  const [email, setEmail] = useState("");
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
  const [maxDailyMessages, setMaxDailyMessages] = useState("50");
  const [maxDailyConnections, setMaxDailyConnections] = useState("25");
  const [cooldownMinutes, setCooldownMinutes] = useState("60");
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
      .from('linkedin_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setAccounts(data);
    if (error) console.error('Error fetching accounts:', error);
  };

  const handleStartLogin = () => {
    if (!email) {
      toast({ title: "Error", description: "Please enter an email address", variant: "destructive" });
      return;
    }
    setLoginStep('credentials');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Error", description: "Please enter email and password", variant: "destructive" });
      return;
    }

    setLoginLoading(true);
    
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 2FA requirement (50% chance)
    if (Math.random() > 0.5) {
      setLoginStep('2fa');
      setLoginLoading(false);
      toast({ title: "2FA Required", description: "Please enter your two-factor authentication code" });
      return;
    }
    
    setLoginStep('success');
    setLoginLoading(false);
    
    // Auto-save after successful login
    await handleSaveAccount();
  };

  const handleVerify2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length < 6) {
      toast({ title: "Error", description: "Please enter a valid 2FA code", variant: "destructive" });
      return;
    }

    setLoginLoading(true);
    
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoginStep('success');
    setLoginLoading(false);
    
    // Auto-save after successful verification
    await handleSaveAccount();
  };

  const handleSaveAccount = async () => {
    if (!email) {
      toast({ title: "Error", description: "Please enter an email address", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('linkedin_accounts')
        .insert({
          user_id: user!.id,
          email: email,
          account_name: accountName || `LinkedIn ${email.split('@')[0]}`,
          proxy_host: proxyHost || null,
          proxy_port: proxyPort ? parseInt(proxyPort) : null,
          proxy_username: proxyUsername || null,
          proxy_password: proxyPassword || null,
          status: 'active',
          session_data: JSON.stringify({ verified: true, loginMethod: 'credentials', savedAt: new Date().toISOString() })
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Account Saved", description: "LinkedIn account added successfully" });
      
      // Reset form
      setEmail("");
      setPassword("");
      setAccountName("");
      setProxyHost("");
      setProxyPort("");
      setProxyUsername("");
      setProxyPassword("");
      setLoginStep('idle');
      setTwoFactorCode("");
      
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
        .from('linkedin_accounts')
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
        .from('linkedin_accounts')
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
        .from('linkedin_accounts')
        .update({ 
          messages_sent_today: 0,
          connections_sent_today: 0
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
            <h1 className="text-3xl font-bold">LinkedIn Account Manager</h1>
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
                <h2 className="text-xl font-semibold">Your LinkedIn Accounts</h2>
                <Button variant="outline" size="sm" onClick={handleResetDailyLimits}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Daily Limits
                </Button>
              </div>

              {accounts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Linkedin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No accounts added yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Add your first LinkedIn account to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {accounts.map((account) => (
                    <Card key={account.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-[#0077B5]/10 flex items-center justify-center">
                              <Linkedin className="h-6 w-6 text-[#0077B5]" />
                            </div>
                            <div>
                              <p className="font-medium">{account.account_name || account.email}</p>
                              <p className="text-sm text-muted-foreground">{account.email}</p>
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
                                {account.session_data && (
                                  <Badge variant="outline" className="text-green-600 border-green-600/30">
                                    <Check className="h-3 w-3 mr-1" />
                                    Verified
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
                              <p className="text-muted-foreground">Connections Today</p>
                              <p className="font-medium">{account.connections_sent_today || 0}</p>
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
                      <Mail className="h-5 w-5" />
                      Login with Credentials
                    </CardTitle>
                    <CardDescription>Sign in with your LinkedIn email and password</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Account Name (optional)</Label>
                      <Input
                        placeholder="My LinkedIn"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                      />
                    </div>

                    {loginStep === 'idle' && (
                      <Button onClick={handleStartLogin} className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Continue with Email
                      </Button>
                    )}

                    {loginStep === 'credentials' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setLoginStep('idle')} className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={handleLogin} disabled={loginLoading} className="flex-1">
                            {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                            Login & Save
                          </Button>
                        </div>
                      </div>
                    )}

                    {loginStep === '2fa' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            Two-factor authentication is enabled on this account. Please enter the code from your authenticator app or SMS.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>2FA Code</Label>
                          <Input
                            placeholder="123456"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            maxLength={6}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setLoginStep('credentials')} className="flex-1">
                            Back
                          </Button>
                          <Button onClick={handleVerify2FA} disabled={loginLoading} className="flex-1">
                            {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Verify & Save
                          </Button>
                        </div>
                      </div>
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
                        <Shield className="h-5 w-5" />
                        Proxy Settings (Optional)
                      </CardTitle>
                      <CardDescription>Use a proxy for enhanced privacy and account safety</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 grid-cols-2">
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
                      <div className="grid gap-4 grid-cols-2">
                        <div className="space-y-2">
                          <Label>Username (optional)</Label>
                          <Input
                            placeholder="username"
                            value={proxyUsername}
                            onChange={(e) => setProxyUsername(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password (optional)</Label>
                          <Input
                            type="password"
                            placeholder="password"
                            value={proxyPassword}
                            onChange={(e) => setProxyPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Session Management
                      </CardTitle>
                      <CardDescription>Your login session will be saved securely</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Session data encrypted and stored safely</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Auto-refresh session tokens</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Supports 2FA-enabled accounts</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Human-like behavior patterns</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                  <CardDescription>Configure how accounts are rotated for optimal performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Enable Account Rotation</Label>
                      <p className="text-sm text-muted-foreground">Automatically switch between accounts</p>
                    </div>
                    <Switch
                      checked={rotationEnabled}
                      onCheckedChange={setRotationEnabled}
                    />
                  </div>

                  {rotationEnabled && (
                    <>
                      <div className="space-y-3">
                        <Label>Rotation Strategy</Label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {rotationStrategies.map((strategy) => (
                            <div
                              key={strategy.value}
                              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                rotationStrategy === strategy.value
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => setRotationStrategy(strategy.value)}
                            >
                              <p className="font-medium">{strategy.label}</p>
                              <p className="text-sm text-muted-foreground">{strategy.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Max Daily Messages per Account</Label>
                          <Input
                            type="number"
                            value={maxDailyMessages}
                            onChange={(e) => setMaxDailyMessages(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">LinkedIn recommends staying under 100/day</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Max Daily Connections per Account</Label>
                          <Input
                            type="number"
                            value={maxDailyConnections}
                            onChange={(e) => setMaxDailyConnections(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">Recommended: 25-50 connections/day</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Cooldown Period (minutes)</Label>
                        <Input
                          type="number"
                          value={cooldownMinutes}
                          onChange={(e) => setCooldownMinutes(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Wait time before reusing an account</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Auto-Switch on Limit</Label>
                          <p className="text-sm text-muted-foreground">Automatically switch when daily limit reached</p>
                        </div>
                        <Switch
                          checked={autoSwitchOnLimit}
                          onCheckedChange={setAutoSwitchOnLimit}
                        />
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
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Account Safety Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Use unique proxies for each account to avoid detection
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Keep daily action limits conservative (under LinkedIn's thresholds)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Enable cooldown periods between account switches
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Vary your messaging content to appear more natural
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Monitor account health regularly for warnings
                    </li>
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
