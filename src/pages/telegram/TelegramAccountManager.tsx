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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Smartphone, Key, Shield, RefreshCw, Settings, 
  Loader2, Check, X, Trash2, Save, Plus, RotateCcw, ExternalLink, Copy, Download, Pencil, Bot, Timer
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
  const [loginStep, setLoginStep] = useState<'idle' | 'opened' | 'success'>('idle');
  
  // Global API settings
  const [globalApiId, setGlobalApiId] = useState("");
  const [globalApiHash, setGlobalApiHash] = useState("");
  const [globalSettingsLoaded, setGlobalSettingsLoaded] = useState(false);
  const [savingGlobalSettings, setSavingGlobalSettings] = useState(false);
  
  // New account form
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [sessionString, setSessionString] = useState("");
  
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

  // Edit account dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TelegramAccount | null>(null);
  const [editApiId, setEditApiId] = useState("");
  const [editApiHash, setEditApiHash] = useState("");
  const [editSessionString, setEditSessionString] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Bot verification code
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchGlobalApiSettings();
    }
  }, [user]);

  // Auto-fill API credentials when global settings are loaded
  useEffect(() => {
    if (globalSettingsLoaded && !apiId && !apiHash) {
      setApiId(globalApiId);
      setApiHash(globalApiHash);
    }
  }, [globalSettingsLoaded, globalApiId, globalApiHash]);

  // Timer for verification code expiry
  useEffect(() => {
    if (!codeExpiresAt) {
      setTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((codeExpiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setVerificationCode(null);
        setCodeExpiresAt(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  // Poll for credential updates when verification code is active
  useEffect(() => {
    if (!verificationCode) return;

    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('telegram_api_id, telegram_api_hash')
        .eq('id', user!.id)
        .single();

      if (data?.telegram_api_id && data?.telegram_api_hash) {
        if (data.telegram_api_id !== globalApiId || data.telegram_api_hash !== globalApiHash) {
          setGlobalApiId(data.telegram_api_id);
          setGlobalApiHash(data.telegram_api_hash);
          setApiId(data.telegram_api_id);
          setApiHash(data.telegram_api_hash);
          setVerificationCode(null);
          setCodeExpiresAt(null);
          toast({ 
            title: "Credentials Updated!", 
            description: "Your Telegram API credentials have been saved via the bot" 
          });
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [verificationCode, globalApiId, globalApiHash, user]);

  const fetchGlobalApiSettings = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('telegram_api_id, telegram_api_hash')
      .eq('id', user!.id)
      .single();

    if (data) {
      setGlobalApiId(data.telegram_api_id || "");
      setGlobalApiHash(data.telegram_api_hash || "");
      // Auto-fill form fields
      if (data.telegram_api_id) setApiId(data.telegram_api_id);
      if (data.telegram_api_hash) setApiHash(data.telegram_api_hash);
    }
    setGlobalSettingsLoaded(true);
    if (error && error.code !== 'PGRST116') console.error('Error fetching global settings:', error);
  };

  const handleSaveGlobalApiSettings = async () => {
    // Validate both fields are filled
    const trimmedApiId = globalApiId.trim();
    const trimmedApiHash = globalApiHash.trim();

    if (!trimmedApiId || !trimmedApiHash) {
      toast({ 
        title: "Validation Error", 
        description: "Both API ID and API Hash are required", 
        variant: "destructive" 
      });
      return;
    }

    // Validate API ID is numeric and reasonable length
    if (!/^\d{5,12}$/.test(trimmedApiId)) {
      toast({ 
        title: "Invalid API ID", 
        description: "API ID should be a numeric value (5-12 digits) from my.telegram.org", 
        variant: "destructive" 
      });
      return;
    }

    // Validate API Hash is 32 characters hex
    if (!/^[a-f0-9]{32}$/i.test(trimmedApiHash)) {
      toast({ 
        title: "Invalid API Hash", 
        description: "API Hash should be a 32-character hexadecimal string from my.telegram.org", 
        variant: "destructive" 
      });
      return;
    }

    setSavingGlobalSettings(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          telegram_api_id: trimmedApiId,
          telegram_api_hash: trimmedApiHash
        })
        .eq('id', user!.id);

      if (error) throw error;

      // Update state with trimmed values
      setGlobalApiId(trimmedApiId);
      setGlobalApiHash(trimmedApiHash);

      // Auto-fill form with new global settings
      setApiId(trimmedApiId);
      setApiHash(trimmedApiHash);

      toast({ title: "Global API Settings Saved", description: "These credentials will auto-fill for new accounts" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSavingGlobalSettings(false);
    }
  };

  const generateVerificationCode = async () => {
    setGeneratingCode(true);
    try {
      // Generate a random code like VR-A1B2C3
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const code = `VR-${randomPart}`;
      
      // Set expiry to 5 minutes from now
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // Delete any existing unused codes for this user
      await supabase
        .from('telegram_verification_codes')
        .delete()
        .eq('user_id', user!.id)
        .eq('used', false);

      // Insert new code
      const { error } = await supabase
        .from('telegram_verification_codes')
        .insert({
          user_id: user!.id,
          code,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (error) throw error;

      setVerificationCode(code);
      setCodeExpiresAt(expiresAt);
      setTimeRemaining(300); // 5 minutes in seconds
      
      toast({ 
        title: "Verification Code Generated", 
        description: "Send this code to the bot within 5 minutes" 
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setGeneratingCode(false);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
    setLoginStep('opened');
    toast({ title: "Telegram Web Opened", description: "Login to Telegram, then click 'I'm Logged In' below" });
  };

  const handleOpenTelegramDesktop = () => {
    window.open('https://desktop.telegram.org/', '_blank');
    setLoginStep('opened');
    toast({ title: "Telegram Download Opened", description: "After installing and logging in, click 'I'm Logged In' below" });
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
          session_data: sessionString || null
        })
        .select()
        .single();

      if (error) throw error;

      setLoginStep('success');
      toast({ title: "Account Saved", description: "Telegram account added successfully" });
      
      // Reset form
      setPhoneNumber("");
      setAccountName("");
      setApiId("");
      setApiHash("");
      setSessionString("");
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

  const openEditDialog = (account: TelegramAccount) => {
    setEditingAccount(account);
    setEditApiId(account.api_id || "");
    setEditApiHash(account.api_hash || "");
    setEditSessionString((account as any).session_data || "");
    setEditDialogOpen(true);
  };

  const handleSaveApiCredentials = async () => {
    if (!editingAccount) return;

    setEditSaving(true);
    try {
      const { error } = await supabase
        .from('telegram_accounts')
        .update({
          api_id: editApiId || null,
          api_hash: editApiHash || null,
          session_data: editSessionString || null
        })
        .eq('id', editingAccount.id);

      if (error) throw error;

      toast({ title: "API Credentials Updated", description: "Account credentials saved successfully" });
      setEditDialogOpen(false);
      setEditingAccount(null);
      fetchAccounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setEditSaving(false);
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="add">Add Account</TabsTrigger>
              <TabsTrigger value="api-settings">
                API Settings
                {globalApiId && globalApiHash && (
                  <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1">
                    <Check className="h-2 w-2" />
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rotation">Rotation</TabsTrigger>
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
                                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                    <Key className="h-3 w-3 mr-1" />
                                    API ✓
                                  </Badge>
                                )}
                                {(account as any).session_data && !((account as any).session_data?.trim()?.startsWith('{')) && (account as any).session_data?.length > 100 ? (
                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                    <Check className="h-3 w-3 mr-1" />
                                    Session ✓
                                  </Badge>
                                ) : (account as any).session_data ? (
                                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                                    <X className="h-3 w-3 mr-1" />
                                    Invalid Session
                                  </Badge>
                                ) : null}
                                {(!account.api_id || !(account as any).session_data || ((account as any).session_data?.trim()?.startsWith('{'))) && (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                    Mock Data Only
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(account)}
                                title="Edit API Credentials"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
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
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">1</div>
                            <p className="text-sm">Enter your phone number above</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">2</div>
                            <p className="text-sm text-muted-foreground">Open Telegram and login</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">3</div>
                            <p className="text-sm text-muted-foreground">Click "I'm Logged In" then Save</p>
                          </div>
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
                      </>
                    )}

                    {loginStep === 'opened' && (
                      <>
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                              <Check className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-sm">Phone number entered</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">2</div>
                            <p className="text-sm font-medium">Login to Telegram in the opened tab</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">3</div>
                            <p className="text-sm text-muted-foreground">Click "I'm Logged In" when done</p>
                          </div>
                        </div>
                        <Button onClick={handleSaveAccount} disabled={loading || !phoneNumber} className="w-full" size="lg">
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                          I'm Logged In - Save Account
                        </Button>
                        <Button variant="ghost" onClick={() => setLoginStep('idle')} className="w-full">
                          Start Over
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
                        API Credentials
                        {globalApiId && globalApiHash && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                            Auto-filled from Global Settings
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {globalApiId && globalApiHash 
                          ? "Pre-filled from your saved global API settings" 
                          : "Configure in API Settings tab for auto-fill"}
                      </CardDescription>
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
                          placeholder="0123456789abcdef0123456789abcdef"
                          value={apiHash}
                          onChange={(e) => setApiHash(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Session String</Label>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Paste your Telegram session string here..."
                          value={sessionString}
                          onChange={(e) => setSessionString(e.target.value)}
                        />
                      </div>
                      {!globalApiId && !globalApiHash && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs space-y-2">
                          <p className="font-medium text-amber-600">Tip: Save credentials globally</p>
                          <p className="text-muted-foreground">Go to the <strong>API Settings</strong> tab to save your API credentials once. They'll auto-fill for all new accounts!</p>
                        </div>
                      )}
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

            {/* Global API Settings Tab */}
            <TabsContent value="api-settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Global Telegram API Credentials
                    {globalApiId && globalApiHash && (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/20">
                        <Check className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Save your Telegram API credentials once and they'll auto-fill for all new accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">1</div>
                      <div>
                        <p className="font-medium">Get your API credentials</p>
                        <p className="text-sm text-muted-foreground">Visit <a href="https://my.telegram.org/apps" target="_blank" rel="noopener" className="text-primary underline">my.telegram.org/apps</a> and create an application to get your API ID and Hash</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">2</div>
                      <div>
                        <p className="font-medium">Enter them below</p>
                        <p className="text-sm text-muted-foreground">These will be saved securely and used for all your Telegram accounts</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">3</div>
                      <div>
                        <p className="font-medium">Auto-fill enabled</p>
                        <p className="text-sm text-muted-foreground">When adding new accounts, API credentials will be pre-filled automatically</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>API ID</Label>
                      <Input
                        placeholder="12345678"
                        value={globalApiId}
                        onChange={(e) => setGlobalApiId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Your Telegram API ID (numbers only)</p>
                    </div>
                    <div className="space-y-2">
                      <Label>API Hash</Label>
                      <Input
                        type="password"
                        placeholder="0123456789abcdef0123456789abcdef"
                        value={globalApiHash}
                        onChange={(e) => setGlobalApiHash(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Your Telegram API Hash (32 characters)</p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveGlobalApiSettings} 
                    disabled={savingGlobalSettings}
                    className="w-full"
                    size="lg"
                  >
                    {savingGlobalSettings ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Global API Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Bot Registration Card */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Link via Telegram Bot
                    <Badge variant="outline" className="ml-2">Recommended</Badge>
                  </CardTitle>
                  <CardDescription>
                    Securely register your API credentials by sending them to our Telegram bot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!verificationCode ? (
                    <>
                      <div className="p-4 bg-background/50 border rounded-lg space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">1</div>
                          <p className="text-sm">Generate a verification code below</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">2</div>
                          <p className="text-sm">Open the ViraReach bot in Telegram</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">3</div>
                          <p className="text-sm">Send: <code className="bg-muted px-1 rounded">/register CODE API_ID API_HASH</code></p>
                        </div>
                      </div>
                      <Button 
                        onClick={generateVerificationCode} 
                        disabled={generatingCode}
                        className="w-full"
                        size="lg"
                      >
                        {generatingCode ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="mr-2 h-4 w-4" />
                        )}
                        Generate Verification Code
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="p-6 bg-background border rounded-lg text-center space-y-4">
                        <p className="text-sm text-muted-foreground">Your verification code:</p>
                        <div className="flex items-center justify-center gap-2">
                          <code className="text-3xl font-mono font-bold tracking-wider bg-muted px-4 py-2 rounded-lg">
                            {verificationCode}
                          </code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(verificationCode);
                              toast({ title: "Copied!", description: "Verification code copied to clipboard" });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-amber-600">
                          <Timer className="h-4 w-4" />
                          <span className="text-sm font-medium">Expires in {formatTimeRemaining(timeRemaining)}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <p className="text-sm font-medium">Send this command to the bot:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-background p-2 rounded border overflow-x-auto">
                            /register {verificationCode} YOUR_API_ID YOUR_API_HASH
                          </code>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`/register ${verificationCode} YOUR_API_ID YOUR_API_HASH`);
                              toast({ title: "Copied!", description: "Command template copied to clipboard" });
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => window.open('https://t.me/ViraReachBot', '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Bot in Telegram
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            setVerificationCode(null);
                            setCodeExpiresAt(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Session Status Card */}
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Session String Status
                  </CardTitle>
                  <CardDescription>
                    Each account needs a valid session string for real data extraction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-background border rounded-lg space-y-3">
                    <p className="text-sm font-medium">Why are extractions returning 0 results?</p>
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                      <li>Your accounts have <strong>login metadata</strong> stored, not a valid <strong>GramJS session string</strong></li>
                      <li>A valid session string is a long (200+ characters) base64-encoded string</li>
                      <li>Without it, the app falls back to <strong>mock data</strong> (currently returning empty results due to API issues)</li>
                    </ul>
                  </div>
                  
                  <div className="grid gap-2">
                    <p className="text-sm font-medium">Your Accounts:</p>
                    {accounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No accounts added yet</p>
                    ) : (
                      accounts.map((account) => {
                        const sessionData = (account as any).session_data;
                        const isValidSession = sessionData && typeof sessionData === 'string' && !sessionData.trim().startsWith('{') && sessionData.length > 100;
                        return (
                          <div key={account.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{account.account_name || account.phone_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isValidSession ? (
                                <Badge className="bg-green-500/20 text-green-600 border-green-500/20">
                                  <Check className="h-3 w-3 mr-1" />
                                  Valid Session
                                </Badge>
                              ) : sessionData ? (
                                <Badge className="bg-red-500/20 text-red-600 border-red-500/20">
                                  <X className="h-3 w-3 mr-1" />
                                  Invalid (Metadata Only)
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/20">
                                  No Session
                                </Badge>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(account)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How to Get a Valid Session String</CardTitle>
                  <CardDescription>Required for each account to enable real API extraction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm font-medium mb-2">What is a session string?</p>
                    <p className="text-sm text-muted-foreground">
                      A session string is a long base64-encoded token (200+ characters) that authenticates your Telegram account via the MTProto API. 
                      It's generated when you login using the Telethon library. The "login metadata" stored when you click "I'm Logged In" is NOT a session string.
                    </p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    After saving your global API credentials, generate a session string for each Telegram account using this Python script:
                  </p>
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`pip install telethon

python -c "
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

api_id = ${globalApiId || 'YOUR_API_ID'}
api_hash = '${globalApiHash || 'YOUR_API_HASH'}'

with TelegramClient(StringSession(), api_id, api_hash) as client:
    print('Your session string:')
    print(client.session.save())
"`}
                  </pre>
                  <p className="text-sm text-muted-foreground">
                    Run this script, login with your phone number when prompted, and copy the output session string. 
                    Then click the <strong>Edit</strong> button on your account above and paste it into the Session String field.
                  </p>
                </CardContent>
              </Card>
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

      {/* Edit API Credentials Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Edit API Credentials
            </DialogTitle>
            <DialogDescription>
              Update API credentials for {editingAccount?.account_name || editingAccount?.phone_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>API ID</Label>
              <Input
                placeholder="12345678"
                value={editApiId}
                onChange={(e) => setEditApiId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>API Hash</Label>
              <Input
                type="password"
                placeholder="0123456789abcdef0123456789abcdef"
                value={editApiHash}
                onChange={(e) => setEditApiHash(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Session String</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Paste your Telegram session string here..."
                value={editSessionString}
                onChange={(e) => setEditSessionString(e.target.value)}
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-xs">
              <p className="font-medium mb-1">Need credentials?</p>
              <a 
                href="https://my.telegram.org/apps" 
                target="_blank" 
                rel="noopener" 
                className="text-primary underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Get API ID & Hash from my.telegram.org
              </a>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiCredentials} disabled={editSaving}>
              {editSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
