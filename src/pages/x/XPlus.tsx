import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Brain, Activity, Tag, MessageCircle, TrendingUp, Users, 
  AtSign, Sparkles, Play, Loader2, BarChart3, Zap, Globe,
  Coins, Key, Settings, CheckCircle, XCircle, Plus, Trash2
} from "lucide-react";
import { SiX } from "@icons-pack/react-simple-icons";

interface SiteCampaign {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'paused' | 'completed';
  visits: number;
  conversions: number;
  created_at: string;
}

interface UserSettings {
  notifications: boolean;
  autoBackup: boolean;
  darkMode: boolean;
  language: string;
}

export default function XPlus() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Points & License state
  const [points, setPoints] = useState<number>(0);
  const [license, setLicense] = useState<any>(null);
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseLoading, setLicenseLoading] = useState(false);

  // Sites Campaigns state
  const [campaigns, setCampaigns] = useState<SiteCampaign[]>([]);
  const [newCampaign, setNewCampaign] = useState({ name: "", url: "" });
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    autoBackup: true,
    darkMode: false,
    language: "en"
  });

  const [activityForm, setActivityForm] = useState({ account_username: "" });
  const [tagForm, setTagForm] = useState({ comments: "", keywords: "" });
  const [engageForm, setEngageForm] = useState({ users: "", niche: "", tone: "friendly" });
  const [trendForm, setTrendForm] = useState({ topic: "", volume: "1000", style: "casual" });
  const [demoForm, setDemoForm] = useState({ users_data: "" });
  const [mentionForm, setMentionForm] = useState({ context: "", users: "", goal: "" });

  // Fetch user data on mount
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    // Fetch points
    const { data: pointsData } = await supabase
      .from("points")
      .select("balance")
      .eq("user_id", user.id)
      .single();
    if (pointsData) setPoints(pointsData.balance);

    // Fetch license
    const { data: licenseData } = await supabase
      .from("licenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    if (licenseData) setLicense(licenseData);

    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem("virareach_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Load campaigns from localStorage (simulated)
    const savedCampaigns = localStorage.getItem("virareach_campaigns");
    if (savedCampaigns) {
      setCampaigns(JSON.parse(savedCampaigns));
    }
  };

  const activateLicense = async () => {
    if (!licenseKey.trim() || !user) {
      toast({ title: "Error", description: "Please enter a license key", variant: "destructive" });
      return;
    }

    setLicenseLoading(true);
    try {
      const { data: licenseData, error: findError } = await supabase
        .from("licenses")
        .select("*")
        .eq("license_key", licenseKey.trim())
        .single();

      if (findError || !licenseData) {
        toast({ title: "Invalid License", description: "License key not found", variant: "destructive" });
        return;
      }

      if (licenseData.status === "active" && licenseData.user_id !== user.id) {
        toast({ title: "Already Active", description: "This license is already in use", variant: "destructive" });
        return;
      }

      const { error: updateError } = await supabase
        .from("licenses")
        .update({
          user_id: user.id,
          status: "active" as const,
          activated_at: new Date().toISOString(),
          device_fingerprint: navigator.userAgent,
        })
        .eq("id", licenseData.id);

      if (updateError) throw updateError;

      toast({ title: "Success", description: "License activated successfully" });
      setLicenseKey("");
      fetchUserData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLicenseLoading(false);
    }
  };

  const addCampaign = () => {
    if (!newCampaign.name || !newCampaign.url) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const campaign: SiteCampaign = {
      id: crypto.randomUUID(),
      name: newCampaign.name,
      url: newCampaign.url,
      status: "active",
      visits: 0,
      conversions: 0,
      created_at: new Date().toISOString(),
    };

    const updated = [...campaigns, campaign];
    setCampaigns(updated);
    localStorage.setItem("virareach_campaigns", JSON.stringify(updated));
    setNewCampaign({ name: "", url: "" });
    toast({ title: "Campaign Created", description: "New campaign added successfully" });
  };

  const toggleCampaignStatus = (id: string) => {
    const updated = campaigns.map(c => 
      c.id === id ? { ...c, status: c.status === "active" ? "paused" as const : "active" as const } : c
    );
    setCampaigns(updated);
    localStorage.setItem("virareach_campaigns", JSON.stringify(updated));
  };

  const deleteCampaign = (id: string) => {
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    localStorage.setItem("virareach_campaigns", JSON.stringify(updated));
    toast({ title: "Deleted", description: "Campaign removed" });
  };

  const updateSettings = (key: keyof UserSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem("virareach_settings", JSON.stringify(updated));
    toast({ title: "Settings Updated", description: `${key} setting changed` });
  };

  const callAI = async (action: string, params: any) => {
    setLoading(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("x-plus-ai", {
        body: { action, ...params },
      });

      if (error) throw error;
      setResults(data);
      toast({ title: "AI Analysis Complete", description: "Results are ready" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleActivityAnalysis = () => {
    callAI("analyze_activity", {
      account_username: activityForm.account_username,
      recent_tweets: [
        { text: "Sample tweet 1", likes: 100, retweets: 20 },
        { text: "Sample tweet 2", likes: 50, retweets: 10 },
      ],
    });
  };

  const handleTagCustomers = () => {
    const comments = tagForm.comments.split("\n").filter(Boolean).map((c, i) => ({
      id: i,
      username: `user_${i}`,
      text: c,
    }));
    callAI("tag_interested_customers", {
      comments,
      product_keywords: tagForm.keywords.split(",").map((k) => k.trim()),
    });
  };

  const handleAutoEngage = () => {
    const users = engageForm.users.split("\n").filter(Boolean).map((u) => ({
      username: u.trim(),
      bio: "Sample bio",
      followers: Math.floor(Math.random() * 10000),
    }));
    callAI("auto_engage_first_tweet", {
      target_users: users,
      niche: engageForm.niche,
      tone: engageForm.tone,
    });
  };

  const handleTrendBooster = () => {
    callAI("trend_booster_generate", {
      topic: trendForm.topic,
      target_volume: parseInt(trendForm.volume),
      style: trendForm.style,
    });
  };

  const handleDemographicAnalysis = () => {
    const users = demoForm.users_data.split("\n").filter(Boolean).map((u, i) => ({
      username: u.trim(),
      bio: "Tech enthusiast | Startup founder",
      location: ["USA", "UK", "Canada", "Germany"][i % 4],
      followers: Math.floor(Math.random() * 50000),
    }));
    callAI("demographic_analysis", { users_data: users });
  };

  const handleSmartMention = () => {
    const users = mentionForm.users.split(",").map((u) => u.trim()).filter(Boolean);
    callAI("smart_mention_generator", {
      tweet_context: mentionForm.context,
      target_users: users,
      goal: mentionForm.goal,
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <SiX className="h-8 w-8" />
              <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">X Plus AI</h1>
              <p className="text-muted-foreground">Advanced AI-powered automation features</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">6</p>
                <p className="text-xs text-muted-foreground">Advanced tools</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  AI Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>Gemini 2.5 Flash</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="campaigns">
            <TabsList className="grid grid-cols-5 md:grid-cols-10 h-auto gap-1">
              <TabsTrigger value="campaigns" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Sites
              </TabsTrigger>
              <TabsTrigger value="points" className="text-xs">
                <Coins className="h-3 w-3 mr-1" />
                Points
              </TabsTrigger>
              <TabsTrigger value="license" className="text-xs">
                <Key className="h-3 w-3 mr-1" />
                License
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Monitor
              </TabsTrigger>
              <TabsTrigger value="tag" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                Tag
              </TabsTrigger>
              <TabsTrigger value="engage" className="text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                Engage
              </TabsTrigger>
              <TabsTrigger value="trend" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trend
              </TabsTrigger>
              <TabsTrigger value="demo" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Demo
              </TabsTrigger>
              <TabsTrigger value="mention" className="text-xs">
                <AtSign className="h-3 w-3 mr-1" />
                Mention
              </TabsTrigger>
            </TabsList>

            {/* Sites Campaigns Tab */}
            <TabsContent value="campaigns">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Create New Campaign
                    </CardTitle>
                    <CardDescription>Add a new site campaign to track</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Campaign Name</Label>
                        <Input
                          value={newCampaign.name}
                          onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                          placeholder="My Campaign"
                        />
                      </div>
                      <div>
                        <Label>Target URL</Label>
                        <Input
                          value={newCampaign.url}
                          onChange={(e) => setNewCampaign({ ...newCampaign, url: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <Button onClick={addCampaign}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Campaign
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Campaigns</CardTitle>
                    <CardDescription>{campaigns.length} campaigns total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {campaigns.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No campaigns yet. Create one above.</p>
                    ) : (
                      <div className="space-y-3">
                        {campaigns.map((campaign) => (
                          <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                            <div className="flex-1">
                              <h4 className="font-medium">{campaign.name}</h4>
                              <p className="text-sm text-muted-foreground">{campaign.url}</p>
                              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Visits: {campaign.visits}</span>
                                <span>Conversions: {campaign.conversions}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                                {campaign.status}
                              </Badge>
                              <Button size="sm" variant="outline" onClick={() => toggleCampaignStatus(campaign.id)}>
                                {campaign.status === "active" ? "Pause" : "Resume"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteCampaign(campaign.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Points Tab */}
            <TabsContent value="points">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-primary" />
                      Points Balance
                    </CardTitle>
                    <CardDescription>Your current ViraReach points</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-5xl font-bold text-primary">{points.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-2">Points can be used for premium features</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Points Usage</CardTitle>
                    <CardDescription>How points are consumed</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span>AI Analysis</span>
                      <Badge variant="outline">10 pts/request</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span>Data Extraction</span>
                      <Badge variant="outline">5 pts/100 records</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span>Bulk Messaging</span>
                      <Badge variant="outline">1 pt/message</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span>Campaign Creation</span>
                      <Badge variant="outline">20 pts/campaign</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* License Tab */}
            <TabsContent value="license">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                          <Key className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>License Status</CardTitle>
                          <CardDescription>Manage your ViraReach license</CardDescription>
                        </div>
                      </div>
                      {license ? (
                        <Badge className="bg-primary/20 text-primary border border-primary/30">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="border-destructive/50 text-destructive">No License</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {license ? (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">License Active</p>
                          <p className="text-sm text-muted-foreground">
                            Key: {license.license_key.slice(0, 8)}...{license.license_key.slice(-4)}
                          </p>
                          {license.expires_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Expires: {new Date(license.expires_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                          <XCircle className="h-5 w-5 text-destructive" />
                          <p className="text-sm">No active license. Enter your license key to activate.</p>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter license key..."
                            value={licenseKey}
                            onChange={(e) => setLicenseKey(e.target.value)}
                            disabled={licenseLoading}
                          />
                          <Button onClick={activateLicense} disabled={licenseLoading}>
                            {licenseLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Activate
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>License Benefits</CardTitle>
                    <CardDescription>Features unlocked with an active license</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      "Unlimited AI features",
                      "Priority support",
                      "Advanced analytics",
                      "Bulk operations",
                      "API access",
                      "Custom integrations"
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${license ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={license ? "" : "text-muted-foreground"}>{benefit}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      General Settings
                    </CardTitle>
                    <CardDescription>Configure your preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive alerts for campaigns</p>
                      </div>
                      <Switch
                        checked={settings.notifications}
                        onCheckedChange={(v) => updateSettings("notifications", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto Backup</p>
                        <p className="text-sm text-muted-foreground">Automatically backup data</p>
                      </div>
                      <Switch
                        checked={settings.autoBackup}
                        onCheckedChange={(v) => updateSettings("autoBackup", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">Toggle dark theme</p>
                      </div>
                      <Switch
                        checked={settings.darkMode}
                        onCheckedChange={(v) => updateSettings("darkMode", v)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Language & Region</CardTitle>
                    <CardDescription>Localization settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Language</Label>
                      <Select 
                        value={settings.language} 
                        onValueChange={(v) => updateSettings("language", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-3">Account Info</p>
                      <p className="text-sm">Email: {user?.email || "Not logged in"}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ID: {user?.id?.slice(0, 8)}...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Real-time Activity Monitor
                    </CardTitle>
                    <CardDescription>AI monitors account health and activity patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Account Username</Label>
                      <Input
                        value={activityForm.account_username}
                        onChange={(e) => setActivityForm({ account_username: e.target.value })}
                        placeholder="@username"
                      />
                    </div>
                    <Button onClick={handleActivityAnalysis} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                      Analyze Activity
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results?.analysis ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.analysis}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Run analysis to see results</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tag">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      AI Customer Tagging
                    </CardTitle>
                    <CardDescription>Identify interested customers from comments</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Comments (one per line)</Label>
                      <Textarea
                        value={tagForm.comments}
                        onChange={(e) => setTagForm({ ...tagForm, comments: e.target.value })}
                        placeholder="I love this product!&#10;Where can I buy this?&#10;This looks amazing!"
                        className="h-32"
                      />
                    </div>
                    <div>
                      <Label>Product Keywords (comma separated)</Label>
                      <Input
                        value={tagForm.keywords}
                        onChange={(e) => setTagForm({ ...tagForm, keywords: e.target.value })}
                        placeholder="SaaS, marketing tool, automation"
                      />
                    </div>
                    <Button onClick={handleTagCustomers} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Tag className="h-4 w-4 mr-2" />}
                      Tag Interested Customers
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tagged Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results?.tagged_customers ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.tagged_customers}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Analyze comments to see tagged customers</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="engage">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      AI Auto-Engage
                    </CardTitle>
                    <CardDescription>Generate personalized first-tweet engagement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Target Users (one per line)</Label>
                      <Textarea
                        value={engageForm.users}
                        onChange={(e) => setEngageForm({ ...engageForm, users: e.target.value })}
                        placeholder="elonmusk&#10;sama&#10;OpenAI"
                        className="h-24"
                      />
                    </div>
                    <div>
                      <Label>Niche/Industry</Label>
                      <Input
                        value={engageForm.niche}
                        onChange={(e) => setEngageForm({ ...engageForm, niche: e.target.value })}
                        placeholder="AI, Tech, Startup"
                      />
                    </div>
                    <div>
                      <Label>Tone</Label>
                      <Select value={engageForm.tone} onValueChange={(v) => setEngageForm({ ...engageForm, tone: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="witty">Witty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAutoEngage} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                      Generate Engagement Plan
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results?.engagement_plan ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.engagement_plan}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Generate plan to see engagement strategies</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trend">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Trend Booster
                    </CardTitle>
                    <CardDescription>Generate mass tweet templates (500-1M accounts)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Topic / Hashtag</Label>
                      <Input
                        value={trendForm.topic}
                        onChange={(e) => setTrendForm({ ...trendForm, topic: e.target.value })}
                        placeholder="#YourTrend or topic description"
                      />
                    </div>
                    <div>
                      <Label>Target Volume</Label>
                      <Select value={trendForm.volume} onValueChange={(v) => setTrendForm({ ...trendForm, volume: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">500 tweets</SelectItem>
                          <SelectItem value="1000">1,000 tweets</SelectItem>
                          <SelectItem value="10000">10,000 tweets</SelectItem>
                          <SelectItem value="100000">100,000 tweets</SelectItem>
                          <SelectItem value="500000">500,000 tweets</SelectItem>
                          <SelectItem value="1000000">1,000,000 tweets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Style</Label>
                      <Select value={trendForm.style} onValueChange={(v) => setTrendForm({ ...trendForm, style: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="viral">Viral/Meme</SelectItem>
                          <SelectItem value="news">News Style</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleTrendBooster} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                      Generate Tweet Templates
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tweet Templates</CardTitle>
                    {results?.estimated_reach && (
                      <Badge variant="secondary">Est. Reach: {results.estimated_reach.toLocaleString()}</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    {results?.templates ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.templates}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Generate templates to see results</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="demo">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      AI Demographic Analyzer
                    </CardTitle>
                    <CardDescription>Analyze customer demographics and interests</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>User List (one username per line)</Label>
                      <Textarea
                        value={demoForm.users_data}
                        onChange={(e) => setDemoForm({ users_data: e.target.value })}
                        placeholder="user1&#10;user2&#10;user3"
                        className="h-32"
                      />
                    </div>
                    <Button onClick={handleDemographicAnalysis} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
                      Analyze Demographics
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Demographic Insights</CardTitle>
                    {results?.confidence_score && (
                      <Badge variant="secondary">Confidence: {(results.confidence_score * 100).toFixed(0)}%</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    {results?.demographics ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.demographics}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Analyze users to see demographics</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="mention">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AtSign className="h-5 w-5" />
                      AI Smart Mentions
                    </CardTitle>
                    <CardDescription>Generate strategic mention tweets</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Tweet Context / Topic</Label>
                      <Textarea
                        value={mentionForm.context}
                        onChange={(e) => setMentionForm({ ...mentionForm, context: e.target.value })}
                        placeholder="Describe the tweet topic or context..."
                        className="h-20"
                      />
                    </div>
                    <div>
                      <Label>Users to Mention (comma separated)</Label>
                      <Input
                        value={mentionForm.users}
                        onChange={(e) => setMentionForm({ ...mentionForm, users: e.target.value })}
                        placeholder="@user1, @user2, @user3"
                      />
                    </div>
                    <div>
                      <Label>Goal</Label>
                      <Select value={mentionForm.goal} onValueChange={(v) => setMentionForm({ ...mentionForm, goal: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engagement">Get Engagement</SelectItem>
                          <SelectItem value="collaboration">Propose Collaboration</SelectItem>
                          <SelectItem value="awareness">Brand Awareness</SelectItem>
                          <SelectItem value="conversation">Start Conversation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSmartMention} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AtSign className="h-4 w-4 mr-2" />}
                      Generate Mention Tweets
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Generated Mentions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results?.mention_tweets ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.mention_tweets}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Generate mentions to see results</p>
                    )}
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
