import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Send, UserPlus, Users, MessageSquare, Loader2, Play, Crown, Building2, GraduationCap, Clock, Shield } from "lucide-react";

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  status: string;
  total_recipients: number | null;
  sent_count: number | null;
  failed_count: number | null;
  created_at: string;
}

interface LinkedInAccount {
  id: string;
  email: string;
  account_name: string | null;
  status: string;
}

const sendingModes = [
  { value: "5_per_day", label: "Safe (5/day)", description: "Best for new accounts" },
  { value: "10_per_day", label: "Normal (10/day)", description: "Balanced approach" },
  { value: "25_per_day", label: "Active (25/day)", description: "For established accounts" },
  { value: "50_per_day", label: "Aggressive (50/day)", description: "Premium accounts only" },
];

export default function LinkedInMessaging() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("connections");
  
  // Connection request form
  const [connectionProfiles, setConnectionProfiles] = useState("");
  const [connectionNote, setConnectionNote] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  
  // Message campaign form
  const [campaignName, setCampaignName] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [recipients, setRecipients] = useState("");
  const [sendingMode, setSendingMode] = useState("10_per_day");
  
  // Group publish form
  const [groupUrls, setGroupUrls] = useState("");
  const [postContent, setPostContent] = useState("");

  // Auto-follow states
  const [companyUrls, setCompanyUrls] = useState("");
  const [universityUrls, setUniversityUrls] = useState("");
  const [followIntervalMin, setFollowIntervalMin] = useState("30");
  const [followIntervalMax, setFollowIntervalMax] = useState("90");
  const [followDailyLimit, setFollowDailyLimit] = useState("50");

  // Safe interval messaging states
  const [safeCampaignName, setSafeCampaignName] = useState("");
  const [safeMessageContent, setSafeMessageContent] = useState("");
  const [safeRecipients, setSafeRecipients] = useState("");
  const [minDelay, setMinDelay] = useState("60");
  const [maxDelay, setMaxDelay] = useState("180");
  const [dailyLimit, setDailyLimit] = useState("50");
  const [hourlyLimit, setHourlyLimit] = useState("10");
  const [activeHoursStart, setActiveHoursStart] = useState("9");
  const [activeHoursEnd, setActiveHoursEnd] = useState("18");
  const [pauseWeekends, setPauseWeekends] = useState(false);
  const [randomizeContent, setRandomizeContent] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [campaignsRes, accountsRes] = await Promise.all([
      supabase.functions.invoke('linkedin-send', { body: { action: 'list_campaigns' } }),
      supabase.from('linkedin_accounts').select('*').eq('status', 'active')
    ]);

    if (campaignsRes.data?.campaigns) setCampaigns(campaignsRes.data.campaigns);
    if (accountsRes.data) setAccounts(accountsRes.data);
  };

  const handleSendConnections = async () => {
    if (!connectionProfiles || !selectedAccount) {
      toast({ title: "Error", description: "Please enter profile URLs and select an account", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-send', {
        body: { 
          action: 'connection_request',
          account_id: selectedAccount,
          profile_urls: connectionProfiles,
          note: connectionNote
        }
      });

      if (error) throw error;
      toast({ title: "Success", description: data.message });
      setConnectionProfiles("");
      setConnectionNote("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !messageContent || !recipients) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-send', {
        body: { 
          action: 'create_campaign',
          campaign_name: campaignName,
          campaign_type: 'message',
          content: messageContent,
          recipients,
          sending_mode: sendingMode,
          account_id: selectedAccount
        }
      });

      if (error) throw error;
      toast({ title: "Campaign Created", description: data.message });
      setCampaignName("");
      setMessageContent("");
      setRecipients("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToGroups = async () => {
    if (!groupUrls || !postContent) {
      toast({ title: "Error", description: "Please enter group URLs and post content", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-send', {
        body: { 
          action: 'publish_to_group',
          account_id: selectedAccount,
          group_urls: groupUrls,
          content: postContent
        }
      });

      if (error) throw error;
      toast({ title: "Success", description: data.message });
      setGroupUrls("");
      setPostContent("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-send', {
        body: { action: 'start_campaign', campaign_id: campaignId }
      });

      if (error) throw error;
      toast({ title: "Campaign Started", description: `Sent: ${data.sent_count}, Failed: ${data.failed_count}` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAutoFollowCompanies = async () => {
    if (!companyUrls || !selectedAccount) {
      toast({ title: "Error", description: "Please enter company URLs and select an account", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-send', {
        body: { action: 'auto_follow_companies', account_id: selectedAccount, company_urls: companyUrls, interval_min: parseInt(followIntervalMin), interval_max: parseInt(followIntervalMax), daily_limit: parseInt(followDailyLimit) }
      });
      if (error) throw error;
      toast({ title: "Success", description: data.message });
      setCompanyUrls("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFollowUniversities = async () => {
    if (!universityUrls || !selectedAccount) {
      toast({ title: "Error", description: "Please enter university URLs and select an account", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-send', {
        body: { action: 'auto_follow_universities', account_id: selectedAccount, university_urls: universityUrls, interval_min: parseInt(followIntervalMin), interval_max: parseInt(followIntervalMax), daily_limit: parseInt(followDailyLimit) }
      });
      if (error) throw error;
      toast({ title: "Success", description: data.message });
      setUniversityUrls("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSafeCampaign = async () => {
    if (!safeCampaignName || !safeMessageContent || !safeRecipients) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-send', {
        body: { action: 'create_safe_campaign', campaign_name: safeCampaignName, content: safeMessageContent, recipients: safeRecipients, account_id: selectedAccount, interval_settings: { min_delay: parseInt(minDelay), max_delay: parseInt(maxDelay), daily_limit: parseInt(dailyLimit), hourly_limit: parseInt(hourlyLimit), active_start: parseInt(activeHoursStart), active_end: parseInt(activeHoursEnd), pause_weekends: pauseWeekends, randomize: randomizeContent } }
      });
      if (error) throw error;
      toast({ title: "Safe Campaign Created", description: data.message });
      setSafeCampaignName("");
      setSafeMessageContent("");
      setSafeRecipients("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
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
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">LinkedIn Messaging Center</h1>
            <Badge variant="secondary" className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30">
              <Crown className="h-3 w-3 mr-1" />Premium
            </Badge>
          </div>
          <p className="text-muted-foreground">Send connections, messages, auto-follow, and safe-interval messaging</p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0">
              <TabsTrigger value="connections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><UserPlus className="h-4 w-4 mr-2" />Connections</TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><MessageSquare className="h-4 w-4 mr-2" />Messages</TabsTrigger>
              <TabsTrigger value="groups" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Users className="h-4 w-4 mr-2" />Groups</TabsTrigger>
              <TabsTrigger value="auto-follow" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"><Building2 className="h-4 w-4 mr-2" />Auto-Follow</TabsTrigger>
              <TabsTrigger value="safe-messaging" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"><Shield className="h-4 w-4 mr-2" />Safe Messaging</TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Send Connection Requests
                  </CardTitle>
                  <CardDescription>Send personalized connection requests with safe intervals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Account</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name || account.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Profile URLs (one per line)</Label>
                    <Textarea
                      placeholder="https://linkedin.com/in/profile1&#10;https://linkedin.com/in/profile2"
                      rows={5}
                      value={connectionProfiles}
                      onChange={(e) => setConnectionProfiles(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      {connectionProfiles.split('\n').filter(p => p.trim()).length} profiles
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Connection Note (optional, max 300 chars)</Label>
                    <Textarea
                      placeholder="Hi, I'd love to connect with you..."
                      rows={3}
                      maxLength={300}
                      value={connectionNote}
                      onChange={(e) => setConnectionNote(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">{connectionNote.length}/300</p>
                  </div>
                  <Button onClick={handleSendConnections} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Send Connection Requests
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Create Message Campaign
                  </CardTitle>
                  <CardDescription>Send messages to your connections with safe intervals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Campaign Name</Label>
                      <Input
                        placeholder="My Campaign"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Select Account</Label>
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_name || account.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Message Content</Label>
                    <Textarea
                      placeholder="Hi {first_name}, I wanted to reach out..."
                      rows={4}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">Use {"{first_name}"}, {"{last_name}"}, {"{company}"} for personalization</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Recipients (profile URLs, one per line)</Label>
                    <Textarea
                      placeholder="https://linkedin.com/in/user1&#10;https://linkedin.com/in/user2"
                      rows={5}
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      {recipients.split('\n').filter(r => r.trim()).length} recipients
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Sending Mode</Label>
                    <Select value={sendingMode} onValueChange={setSendingMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sendingModes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label} - {mode.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateCampaign} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Publish to Groups
                  </CardTitle>
                  <CardDescription>Post content to multiple LinkedIn groups</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Account</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name || account.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Group URLs (one per line)</Label>
                    <Textarea
                      placeholder="https://linkedin.com/groups/123&#10;https://linkedin.com/groups/456"
                      rows={5}
                      value={groupUrls}
                      onChange={(e) => setGroupUrls(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      {groupUrls.split('\n').filter(g => g.trim()).length} groups
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Post Content</Label>
                    <Textarea
                      placeholder="Write your post content here..."
                      rows={5}
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                    />
                  </div>
                  <Button onClick={handlePublishToGroups} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Publish to Groups
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PREMIUM: Auto-Follow */}
            <TabsContent value="auto-follow" className="space-y-6">
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-amber-500" />Auto-Follow Companies</CardTitle>
                  <CardDescription>Automatically follow companies with safe intervals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_name || a.email}</SelectItem>)}</SelectContent>
                  </Select>
                  <Textarea placeholder="https://linkedin.com/company/company1&#10;https://linkedin.com/company/company2" rows={5} value={companyUrls} onChange={(e) => setCompanyUrls(e.target.value)} />
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Min Interval (s)</Label><Input type="number" value={followIntervalMin} onChange={(e) => setFollowIntervalMin(e.target.value)} /></div>
                    <div><Label>Max Interval (s)</Label><Input type="number" value={followIntervalMax} onChange={(e) => setFollowIntervalMax(e.target.value)} /></div>
                    <div><Label>Daily Limit</Label><Input type="number" value={followDailyLimit} onChange={(e) => setFollowDailyLimit(e.target.value)} /></div>
                  </div>
                  <Button onClick={handleAutoFollowCompanies} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}Follow Companies
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-amber-500" />Auto-Follow Universities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea placeholder="https://linkedin.com/school/university1&#10;https://linkedin.com/school/university2" rows={5} value={universityUrls} onChange={(e) => setUniversityUrls(e.target.value)} />
                  <Button onClick={handleAutoFollowUniversities} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}Follow Universities
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PREMIUM: Safe Interval Messaging */}
            <TabsContent value="safe-messaging" className="space-y-6">
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-amber-500" />Safe-Interval Messaging</CardTitle>
                  <CardDescription>Send messages with advanced time control to avoid rate limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label>Campaign Name</Label><Input value={safeCampaignName} onChange={(e) => setSafeCampaignName(e.target.value)} /></div>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}><SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger><SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_name || a.email}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><Label>Message</Label><Textarea rows={4} value={safeMessageContent} onChange={(e) => setSafeMessageContent(e.target.value)} placeholder="Hi {first_name}..." /></div>
                  <div><Label>Recipients (one per line)</Label><Textarea rows={4} value={safeRecipients} onChange={(e) => setSafeRecipients(e.target.value)} /></div>
                  <div className="grid grid-cols-4 gap-3">
                    <div><Label>Min Delay (s)</Label><Input type="number" value={minDelay} onChange={(e) => setMinDelay(e.target.value)} /></div>
                    <div><Label>Max Delay (s)</Label><Input type="number" value={maxDelay} onChange={(e) => setMaxDelay(e.target.value)} /></div>
                    <div><Label>Daily Limit</Label><Input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} /></div>
                    <div><Label>Hourly Limit</Label><Input type="number" value={hourlyLimit} onChange={(e) => setHourlyLimit(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Active Hours Start</Label><Input type="number" value={activeHoursStart} onChange={(e) => setActiveHoursStart(e.target.value)} /></div>
                    <div><Label>Active Hours End</Label><Input type="number" value={activeHoursEnd} onChange={(e) => setActiveHoursEnd(e.target.value)} /></div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2"><Switch checked={pauseWeekends} onCheckedChange={setPauseWeekends} /><Label>Pause on weekends</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={randomizeContent} onCheckedChange={setRandomizeContent} /><Label>Randomize content</Label></div>
                  </div>
                  <Button onClick={handleCreateSafeCampaign} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}Create Safe Campaign
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Your messaging campaign history</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No campaigns yet</p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">{campaign.campaign_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.campaign_type} • {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          campaign.status === 'completed' ? 'default' : 
                          campaign.status === 'running' ? 'secondary' : 
                          'outline'
                        }>
                          {campaign.status}
                        </Badge>
                        <span className="text-sm">
                          {campaign.sent_count || 0}/{campaign.total_recipients || 0}
                        </span>
                        {campaign.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => handleStartCampaign(campaign.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
