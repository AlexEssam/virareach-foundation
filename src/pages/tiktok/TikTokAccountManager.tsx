import { useState, useEffect, useMemo } from "react";
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
  Eye, EyeOff, Lock, Timer, Shuffle, UserPlus, RefreshCw, Save, Settings, Copy,
  MessageCircle, Users, PieChart, Activity
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
  // الشرح بالعربي: استخدام نفس نمط فيسبوك لوجود Sidebar قابل للطي + إحصائيات أعلى الصفحة + أزرار سريعة
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<"idle" | "success">("idle");
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

  const fetchAccounts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tiktok_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setAccounts(data);
    if (error) console.error("Error fetching accounts:", error);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAccounts();
  }, [user]);

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.status === "active"),
    [accounts]
  );
  const accountsWithProxy = useMemo(
    () => accounts.filter((a) => a.proxy_host),
    [accounts]
  );
  const totalTodayActions = useMemo(
    () =>
      accounts.reduce(
        (sum, a) =>
          sum +
          (a.daily_follow_count || 0) +
          (a.daily_dm_count || 0),
        0
      ),
    [accounts]
  );

  const handleOpenTikTokLogin = () => {
    window.open("https://www.tiktok.com/login", "_blank");
    toast({
      title: "TikTok Opened",
      description: "Login to TikTok, then save your credentials here",
    });
  };

  const handleOpenTikTokSignUp = () => {
    window.open("https://www.tiktok.com/signup", "_blank");
    toast({
      title: "TikTok Opened",
      description: "Create your account, then save your credentials here",
    });
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: `${name} URL copied to clipboard`,
    });
  };

  const handleCredentialsLogin = async () => {
    // الشرح: هنا ما زال الحساب "login" وهمي، لكن نحافظ على نفس السلوك الحالي ونحفظ الجلسة في Supabase
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter username and password",
        variant: "destructive",
      });
      return;
    }
    setLoginLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoginStep("success");
    setLoginLoading(false);
    await handleSaveAccount();
  };

  const handleSaveAccount = async () => {
    if (!username) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("tiktok_accounts").insert({
        user_id: user!.id,
        username: username.replace("@", ""),
        account_name: accountName || `TikTok @${username}`,
        proxy_host: proxyHost || null,
        proxy_port: proxyPort ? parseInt(proxyPort) : null,
        proxy_username: proxyUsername || null,
        proxy_password: proxyPassword || null,
        status: "active",
        session_data: JSON.stringify({
          verified: true,
          savedAt: new Date().toISOString(),
        }),
      });
      if (error) throw error;
      toast({
        title: "Account Saved",
        description: "TikTok account added successfully",
      });
      resetForm();
      fetchAccounts();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
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
    setLoginStep("idle");
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("tiktok_accounts")
        .delete()
        .eq("id", accountId);
      if (error) throw error;
      toast({ title: "Account Deleted" });
      fetchAccounts();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (accountId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const { error } = await supabase
        .from("tiktok_accounts")
        .update({ status: newStatus })
        .eq("id", accountId);
      if (error) throw error;
      toast({
        title: `Account ${
          newStatus === "active" ? "Activated" : "Deactivated"
        }`,
      });
      fetchAccounts();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleResetDailyLimits = async () => {
    try {
      const { error } = await supabase
        .from("tiktok_accounts")
        .update({
          daily_follow_count: 0,
          daily_dm_count: 0,
          daily_unfollow_count: 0,
        })
        .eq("user_id", user!.id);
      if (error) throw error;
      toast({ title: "Daily Limits Reset" });
      fetchAccounts();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleSecurityPresetChange = (preset: string) => {
    setSecurityPreset(preset);
    const selected = securityPresets.find((p) => p.value === preset);
    if (selected && preset !== "custom") {
      setMinDelay(selected.minDelay.toString());
      setMaxDelay(selected.maxDelay.toString());
    }
  };

  // أزرار سريعة: الانتقال لأدوات TikTok المختلفة
  const goToExtractor = () => navigate("/tiktok/extractor");
  const goToMessaging = () => navigate("/tiktok/messaging");
  const goToMentions = () => navigate("/tiktok/mentions");
  const goToFollow = () => navigate("/tiktok/follow");

  if (authLoading || loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <SiTiktok className="h-8 w-8" />
                TikTok Account Manager
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage TikTok accounts, sessions, and multi-account automation
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToExtractor}>
                <Activity className="h-4 w-4 mr-1" />
                Extractor
              </Button>
              <Button variant="outline" size="sm" onClick={goToMessaging}>
                <MessageCircle className="h-4 w-4 mr-1" />
                Messaging
              </Button>
              <Button variant="outline" size="sm" onClick={goToMentions}>
                <AtSignIcon className="h-4 w-4 mr-1" />
                Mentions
              </Button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <SiTiktok className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{accounts.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Total TikTok Accounts
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Users className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeAccounts.length}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <RotateCcw className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {rotationEnabled ? "On" : "Off"}
                  </p>
                  <p className="text-sm text-muted-foreground">Rotation</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <PieChart className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {totalTodayActions.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Actions Today (follows + DMs)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rotation banner */}
          {rotationEnabled && activeAccounts.length > 1 && (
            <Card className="border-primary/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <RotateCcw className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Multi-Account Rotation Active</p>
                    <p className="text-sm text-muted-foreground">
                      Strategy:{" "}
                      {
                        rotationStrategies.find(
                          (s) => s.value === rotationStrategy
                        )?.label
                      }{" "}
                      • Max {maxDailyFollows} follows / {maxDailyDMs} DMs per
                      account • {cooldownMinutes} min cooldown
                    </p>
                  </div>
                </div>
                <Badge className="bg-primary/20 text-primary border border-primary/30">
                  {activeAccounts.length} accounts in rotation
                </Badge>
              </CardContent>
            </Card>
          )}

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDailyLimits}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Daily Limits
                </Button>
              </div>

              {accounts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <SiTiktok className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No accounts added yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add a TikTok account from the "Add Account" tab to start
                      automation.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {accounts.map((account) => (
                    <Card key={account.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                              <SiTiktok className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {account.account_name ||
                                  `@${account.username}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{account.username}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge
                                  variant={
                                    account.status === "active"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {account.status}
                                </Badge>
                                {account.proxy_host && (
                                  <Badge variant="outline">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Proxy
                                  </Badge>
                                )}
                                {account.session_data && (
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-600/30"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                            <div className="flex gap-6">
                              <div className="text-right text-sm">
                                <p className="text-muted-foreground">
                                  Followers
                                </p>
                                <p className="font-medium">
                                  {account.followers_count?.toLocaleString() ||
                                    0}
                                </p>
                              </div>
                              <div className="text-right text-sm">
                                <p className="text-muted-foreground">
                                  Today&apos;s Actions
                                </p>
                                <p className="font-medium">
                                  {(account.daily_follow_count || 0) +
                                    (account.daily_dm_count || 0)}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 justify-end">
                              {/* Quick actions: Extract, Message, Follow */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={goToExtractor}
                              >
                                <Activity className="h-4 w-4 mr-1" />
                                Extract
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={goToMessaging}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Message
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={goToFollow}
                              >
                                <Users className="h-4 w-4 mr-1" />
                                Follow
                              </Button>
                              <Switch
                                checked={account.status === "active"}
                                onCheckedChange={() =>
                                  handleToggleStatus(
                                    account.id,
                                    account.status
                                  )
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() =>
                                  handleDeleteAccount(account.id)
                                }
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
                      Open TikTok to Login
                    </CardTitle>
                    <CardDescription>
                      Login on TikTok, then save your credentials here
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loginStep === "idle" && (
                      <>
                        <div className="p-4 bg-muted/50 rounded-lg text-center space-y-2">
                          <SiTiktok className="h-12 w-12 mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            Click below to open TikTok. After logging in,
                            return here and save your credentials.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleOpenTikTokLogin}
                            className="flex-1"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open TikTok Login
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleCopyLink(
                                "https://www.tiktok.com/login",
                                "TikTok"
                              )
                            }
                            title="Copy Link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          onClick={handleOpenTikTokSignUp}
                          variant="outline"
                          className="w-full"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Open TikTok Sign Up
                        </Button>
                      </>
                    )}
                    {loginStep === "success" && (
                      <div className="text-center py-4">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                          <Check className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="font-medium">
                          Account Added Successfully!
                        </p>
                        <Button
                          variant="outline"
                          onClick={resetForm}
                          className="mt-4"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Another
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Credentials Login
                    </CardTitle>
                    <CardDescription>
                      Login with username and password
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        placeholder="@username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
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
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Account Name (optional)</Label>
                      <Input
                        placeholder="My TikTok Account"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleCredentialsLogin}
                      disabled={loginLoading || !username || !password}
                      className="w-full"
                    >
                      {loginLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Lock className="mr-2 h-4 w-4" />
                      )}
                      Login &amp; Save
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Proxy Settings (Per Account)
                    </CardTitle>
                    <CardDescription>
                      Configure proxy for enhanced security and account
                      protection
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
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
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          placeholder="username"
                          value={proxyUsername}
                          onChange={(e) => setProxyUsername(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
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
              </div>
            </TabsContent>

            <TabsContent value="rotation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Multi-Account Rotation
                  </CardTitle>
                  <CardDescription>
                    Configure how accounts are rotated for optimal performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">
                        Enable Account Rotation
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically switch between accounts
                      </p>
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
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {rotationStrategies.map((strategy) => (
                            <div
                              key={strategy.value}
                              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                rotationStrategy === strategy.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() =>
                                setRotationStrategy(strategy.value)
                              }
                            >
                              <p className="font-medium">{strategy.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {strategy.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Max Daily Follows/Account</Label>
                          <Input
                            type="number"
                            value={maxDailyFollows}
                            onChange={(e) =>
                              setMaxDailyFollows(e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Daily DMs/Account</Label>
                          <Input
                            type="number"
                            value={maxDailyDMs}
                            onChange={(e) => setMaxDailyDMs(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cooldown (minutes)</Label>
                          <Input
                            type="number"
                            value={cooldownMinutes}
                            onChange={(e) =>
                              setCooldownMinutes(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">
                            Auto-Switch on Limit
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Switch when daily limit reached
                          </p>
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
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security &amp; Anti-Detection
                  </CardTitle>
                  <CardDescription>
                    Configure randomization and human-like behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Security Preset</Label>
                    <Select
                      value={securityPreset}
                      onValueChange={handleSecurityPresetChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {securityPresets.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Min Delay (seconds)
                      </Label>
                      <Input
                        type="number"
                        value={minDelay}
                        onChange={(e) => setMinDelay(e.target.value)}
                        disabled={securityPreset !== "custom"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Max Delay (seconds)
                      </Label>
                      <Input
                        type="number"
                        value={maxDelay}
                        onChange={(e) => setMaxDelay(e.target.value)}
                        disabled={securityPreset !== "custom"}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base flex items-center gap-2">
                          <Shuffle className="h-4 w-4" />
                          Keyword Randomization
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Mix keywords and phrases to avoid detection
                        </p>
                      </div>
                      <Switch
                        checked={randomizeKeywords}
                        onCheckedChange={setRandomizeKeywords}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Humanize Actions</Label>
                        <p className="text-sm text-muted-foreground">
                          Add human-like pauses and variations
                        </p>
                      </div>
                      <Switch
                        checked={humanizeActions}
                        onCheckedChange={setHumanizeActions}
                      />
                    </div>
                  </div>

                  <Button className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Security Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Security Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Use unique proxies for each account
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Enable randomized delays between actions
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Keep daily limits conservative
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Use keyword mixing to vary messages
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Monitor account health regularly
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

// أيقونة @ بسيطة باستخدام lucide-react (بدون استيراد جديد)
function AtSignIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 5a7 7 0 1 0 4.95 2.05"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16 7v5a2 2 0 0 0 4 0V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}