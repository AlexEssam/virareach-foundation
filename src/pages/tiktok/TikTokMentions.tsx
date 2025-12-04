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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  AtSign, Users, Upload, Play, Loader2, MessageCircle, 
  Target, Shuffle, Clock, Crown, FileText
} from "lucide-react";
import { SiTiktok } from "@icons-pack/react-simple-icons";

interface Account {
  id: string;
  username: string;
  account_name: string | null;
  status: string;
}

interface MentionCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  total_mentions: number;
  completed_mentions: number;
  failed_mentions: number;
  status: string;
  created_at: string;
}

export default function TikTokMentions() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [campaigns, setCampaigns] = useState<MentionCampaign[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Targeted mentions form
  const [campaignName, setCampaignName] = useState("");
  const [videoUrls, setVideoUrls] = useState("");
  const [targetUsernames, setTargetUsernames] = useState("");
  const [mentionText, setMentionText] = useState("");
  const [mentionsPerComment, setMentionsPerComment] = useState("3");
  
  // Custom list form
  const [customList, setCustomList] = useState("");
  const [customVideoUrl, setCustomVideoUrl] = useState("");
  
  // Settings
  const [randomizeOrder, setRandomizeOrder] = useState(true);
  const [useMultiAccounts, setUseMultiAccounts] = useState(true);
  const [delayMin, setDelayMin] = useState("30");
  const [delayMax, setDelayMax] = useState("90");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchCampaigns();
    }
  }, [user]);

  const fetchAccounts = async () => {
    const { data } = await supabase.from('tiktok_accounts').select('*').eq('status', 'active');
    if (data) setAccounts(data);
  };

  const fetchCampaigns = async () => {
    try {
      const response = await supabase.functions.invoke('tiktok-mentions', { body: { action: 'get_campaigns' } });
      if (response.data?.campaigns) setCampaigns(response.data.campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const createTargetedCampaign = async () => {
    if (!campaignName || !videoUrls.trim() || !targetUsernames.trim() || selectedAccounts.length === 0) {
      toast({ title: "Please fill all required fields and select accounts", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const videos = videoUrls.split('\n').filter(v => v.trim());
      const targets = targetUsernames.split('\n').filter(u => u.trim());
      
      const response = await supabase.functions.invoke('tiktok-mentions', {
        body: {
          action: 'create_targeted_campaign',
          campaign_name: campaignName,
          account_ids: selectedAccounts,
          video_urls: videos,
          target_usernames: targets,
          mention_text: mentionText,
          mentions_per_comment: parseInt(mentionsPerComment),
          randomize_order: randomizeOrder,
          delay_min: parseInt(delayMin),
          delay_max: parseInt(delayMax)
        }
      });
      
      if (response.error) throw response.error;
      toast({ title: "Campaign Created", description: `Targeting ${targets.length} users on ${videos.length} videos` });
      resetForm();
      fetchCampaigns();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createCustomListCampaign = async () => {
    if (!campaignName || !customList.trim() || !customVideoUrl.trim() || selectedAccounts.length === 0) {
      toast({ title: "Please fill all required fields and select accounts", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const users = customList.split('\n').filter(u => u.trim());
      
      const response = await supabase.functions.invoke('tiktok-mentions', {
        body: {
          action: 'create_custom_list_campaign',
          campaign_name: campaignName,
          account_ids: selectedAccounts,
          video_url: customVideoUrl,
          custom_usernames: users,
          mention_text: mentionText,
          mentions_per_comment: parseInt(mentionsPerComment),
          randomize_order: randomizeOrder,
          delay_min: parseInt(delayMin),
          delay_max: parseInt(delayMax)
        }
      });
      
      if (response.error) throw response.error;
      toast({ title: "Campaign Created", description: `Mentioning ${users.length} users from custom list` });
      resetForm();
      fetchCampaigns();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCampaignName("");
    setVideoUrls("");
    setTargetUsernames("");
    setMentionText("");
    setCustomList("");
    setCustomVideoUrl("");
  };

  const startCampaign = async (campaignId: string) => {
    try {
      const response = await supabase.functions.invoke('tiktok-mentions', {
        body: { action: 'start_campaign', campaign_id: campaignId }
      });
      if (response.error) throw response.error;
      toast({ title: "Campaign Started" });
      fetchCampaigns();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary", running: "default", completed: "outline", failed: "destructive", paused: "secondary"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
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
            <SiTiktok className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">TikTok Mentions</h1>
              <p className="text-muted-foreground">Mention customers in comments using multiple accounts</p>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30 ml-2">
              <Crown className="h-3 w-3 mr-1" />Premium
            </Badge>
          </div>

          {/* Account Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Select Accounts</CardTitle>
              <CardDescription>Choose which accounts to use for mentioning (multi-account rotation)</CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <p className="text-muted-foreground">No active accounts. Add accounts first.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {accounts.map(account => (
                    <Badge 
                      key={account.id}
                      variant={selectedAccounts.includes(account.id) ? "default" : "outline"}
                      className="cursor-pointer py-2 px-3"
                      onClick={() => handleAccountSelect(account.id)}
                    >
                      @{account.username}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">{selectedAccounts.length} account(s) selected</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="targeted" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="targeted"><Target className="h-4 w-4 mr-2" />Targeted Mentions</TabsTrigger>
              <TabsTrigger value="custom"><FileText className="h-4 w-4 mr-2" />Custom List</TabsTrigger>
              <TabsTrigger value="campaigns"><MessageCircle className="h-4 w-4 mr-2" />Campaigns</TabsTrigger>
            </TabsList>

            <TabsContent value="targeted" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Targeted Mention Campaign</CardTitle>
                  <CardDescription>Mention specific customers in video comments across multiple videos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Campaign Name *</Label>
                      <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="My Mention Campaign" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mentions Per Comment</Label>
                      <Select value={mentionsPerComment} onValueChange={setMentionsPerComment}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 mention</SelectItem>
                          <SelectItem value="2">2 mentions</SelectItem>
                          <SelectItem value="3">3 mentions</SelectItem>
                          <SelectItem value="5">5 mentions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Video URLs * (one per line)</Label>
                    <Textarea 
                      value={videoUrls} 
                      onChange={(e) => setVideoUrls(e.target.value)} 
                      placeholder="https://tiktok.com/@user/video/123&#10;https://tiktok.com/@user/video/456"
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Target Usernames * (one per line)</Label>
                    <Textarea 
                      value={targetUsernames} 
                      onChange={(e) => setTargetUsernames(e.target.value)} 
                      placeholder="@user1&#10;@user2&#10;@user3"
                      className="min-h-[150px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Comment Text (optional - usernames will be added)</Label>
                    <Textarea 
                      value={mentionText} 
                      onChange={(e) => setMentionText(e.target.value)} 
                      placeholder="Check this out! 🔥"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2"><Shuffle className="h-4 w-4" />Randomize Order</Label>
                      <Switch checked={randomizeOrder} onCheckedChange={setRandomizeOrder} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Clock className="h-4 w-4" />Min Delay (sec)</Label>
                      <Input type="number" value={delayMin} onChange={(e) => setDelayMin(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Clock className="h-4 w-4" />Max Delay (sec)</Label>
                      <Input type="number" value={delayMax} onChange={(e) => setDelayMax(e.target.value)} />
                    </div>
                  </div>
                  
                  <Button onClick={createTargetedCampaign} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Custom List Campaign</CardTitle>
                  <CardDescription>Mention customers from your custom list on a specific video</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Campaign Name *</Label>
                    <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Custom List Campaign" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Video URL *</Label>
                    <Input value={customVideoUrl} onChange={(e) => setCustomVideoUrl(e.target.value)} placeholder="https://tiktok.com/@user/video/123" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Custom Username List * (one per line or paste from file)</Label>
                    <Textarea 
                      value={customList} 
                      onChange={(e) => setCustomList(e.target.value)} 
                      placeholder="@customer1&#10;@customer2&#10;@customer3&#10;..."
                      className="min-h-[200px]"
                    />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />Import from File
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {customList.split('\n').filter(l => l.trim()).length} usernames
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Comment Text (optional)</Label>
                    <Textarea 
                      value={mentionText} 
                      onChange={(e) => setMentionText(e.target.value)} 
                      placeholder="Hey check this out! 👀"
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <Button onClick={createCustomListCampaign} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Create Custom List Campaign
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mention Campaigns</CardTitle>
                  <CardDescription>Manage your mention campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No campaigns yet</p>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium flex items-center gap-2">
                                <AtSign className="h-4 w-4" />
                                {campaign.campaign_name}
                                <Badge variant="outline" className="capitalize">{campaign.campaign_type}</Badge>
                              </h4>
                              <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                <span>Total: {campaign.total_mentions}</span>
                                <span className="text-green-600">Done: {campaign.completed_mentions}</span>
                                <span className="text-red-600">Failed: {campaign.failed_mentions}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(campaign.status)}
                              {campaign.status === 'pending' && (
                                <Button size="sm" onClick={() => startCampaign(campaign.id)}>
                                  <Play className="h-4 w-4 mr-1" />Start
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 mt-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${(campaign.completed_mentions / campaign.total_mentions) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
