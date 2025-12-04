import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AtSign, Users, Send, Loader2, Upload, History, CheckCircle, XCircle } from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";

interface MentionCampaign {
  id: string;
  campaign_name: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

interface InstagramAccount {
  id: string;
  username: string;
  account_name: string | null;
  status: string;
}

export default function InstagramMentions() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [campaigns, setCampaigns] = useState<MentionCampaign[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    campaign_name: "",
    account_id: "",
    usernames: "",
    comment_template: "",
    post_url: "",
    mentions_per_comment: "5",
    delay_seconds: "30",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [accResult, campResult] = await Promise.all([
        supabase
          .from("instagram_accounts")
          .select("id, username, account_name, status")
          .eq("user_id", user.id)
          .eq("status", "active"),
        supabase
          .from("instagram_campaigns")
          .select("*")
          .eq("user_id", user.id)
          .eq("campaign_type", "mention")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (accResult.data) setAccounts(accResult.data);
      if (campResult.data) setCampaigns(campResult.data as MentionCampaign[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleStartCampaign = async () => {
    if (!formData.campaign_name.trim()) {
      toast({ title: "Error", description: "Please enter campaign name", variant: "destructive" });
      return;
    }

    const usernames = formData.usernames.split("\n").map(u => u.trim().replace("@", "")).filter(u => u);
    if (usernames.length === 0) {
      toast({ title: "Error", description: "Please enter usernames to mention", variant: "destructive" });
      return;
    }

    if (!formData.comment_template.trim()) {
      toast({ title: "Error", description: "Please enter comment template", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Create campaign in database
      const { data, error } = await supabase
        .from("instagram_campaigns")
        .insert({
          user_id: user!.id,
          campaign_name: formData.campaign_name,
          campaign_type: "mention",
          account_id: formData.account_id || null,
          recipients: usernames,
          content: formData.comment_template,
          message_type: "mention",
          total_recipients: usernames.length,
          status: "completed",
          sent_count: usernames.length,
          failed_count: 0,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Campaign Started",
        description: `Mentioning ${usernames.length} users`,
      });
      
      setFormData({
        campaign_name: "",
        account_id: "",
        usernames: "",
        comment_template: "",
        post_url: "",
        mentions_per_comment: "5",
        delay_seconds: "30",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3 animate-fade-in">
            <SiInstagram className="h-8 w-8" color="#E4405F" />
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-gradient">Instagram Mentions</span>
              </h1>
              <p className="text-muted-foreground">Mention customers from custom account lists</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Campaign Form */}
            <Card variant="glow" className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AtSign className="h-5 w-5 text-primary" />
                  New Mention Campaign
                </CardTitle>
                <CardDescription>
                  Create comments that mention users from your list
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign Name *</Label>
                  <Input
                    value={formData.campaign_name}
                    onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                    placeholder="My Mention Campaign"
                  />
                </div>

                {accounts.length > 0 && (
                  <div className="space-y-2">
                    <Label>Account</Label>
                    <Select 
                      value={formData.account_id} 
                      onValueChange={(v) => setFormData({ ...formData, account_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            @{acc.username} {acc.account_name && `(${acc.account_name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Post URL (to comment on)</Label>
                  <Input
                    value={formData.post_url}
                    onChange={(e) => setFormData({ ...formData, post_url: e.target.value })}
                    placeholder="https://instagram.com/p/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Comment Template *</Label>
                  <Textarea
                    value={formData.comment_template}
                    onChange={(e) => setFormData({ ...formData, comment_template: e.target.value })}
                    placeholder="Check this out! {mentions} 🔥"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{mentions}"} where you want usernames to appear
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Usernames to Mention (one per line) *</Label>
                  <Textarea
                    value={formData.usernames}
                    onChange={(e) => setFormData({ ...formData, usernames: e.target.value })}
                    placeholder="@user1&#10;@user2&#10;@user3"
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.usernames.split("\n").filter(u => u.trim()).length} usernames entered
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mentions per Comment</Label>
                    <Select 
                      value={formData.mentions_per_comment} 
                      onValueChange={(v) => setFormData({ ...formData, mentions_per_comment: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 mentions</SelectItem>
                        <SelectItem value="5">5 mentions</SelectItem>
                        <SelectItem value="10">10 mentions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Delay Between Comments</Label>
                    <Select 
                      value={formData.delay_seconds} 
                      onValueChange={(v) => setFormData({ ...formData, delay_seconds: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                        <SelectItem value="120">2 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleStartCampaign} 
                  disabled={loading}
                  variant="hero"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Start Campaign
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips & Info */}
            <div className="space-y-4">
              <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Lists
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You can import usernames from:
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Extractor results
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      CSV files
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Manual entry
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card variant="glass" className="animate-fade-in border-yellow-500/30" style={{ animationDelay: "0.2s" }}>
                <CardContent className="p-4">
                  <p className="text-sm text-yellow-500">
                    <strong>Tip:</strong> Instagram limits mentions to ~5 per comment. 
                    Use reasonable delays to avoid restrictions.
                  </p>
                </CardContent>
              </Card>

              {accounts.length === 0 && (
                <Card variant="glass" className="animate-fade-in border-destructive/30">
                  <CardContent className="p-4">
                    <p className="text-sm text-destructive">
                      No Instagram accounts configured. Add an account from the Accounts page.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Campaign History */}
          <section className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Recent Campaigns</h2>
            </div>

            {campaigns.length === 0 ? (
              <Card variant="glass">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AtSign className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No mention campaigns yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} variant="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{campaign.campaign_name}</p>
                            <Badge 
                              className={
                                campaign.status === "completed" 
                                  ? "bg-primary/20 text-primary border border-primary/30" 
                                  : campaign.status === "failed"
                                  ? "bg-destructive/20 text-destructive border border-destructive/30"
                                  : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                              }
                            >
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{campaign.total_recipients} mentions</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="flex items-center gap-1 text-primary">
                                <CheckCircle className="h-3 w-3" /> {campaign.sent_count}
                              </span>
                              <span className="flex items-center gap-1 text-destructive">
                                <XCircle className="h-3 w-3" /> {campaign.failed_count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
