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
import { useToast } from "@/hooks/use-toast";
import { Send, UserPlus, Users, MessageSquare, Loader2, Play } from "lucide-react";

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

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">LinkedIn Messaging Center</h1>
            <p className="text-muted-foreground mt-2">Send connection requests, messages, and publish to groups</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-lg">
              <TabsTrigger value="connections"><UserPlus className="h-4 w-4 mr-2" />Connections</TabsTrigger>
              <TabsTrigger value="messages"><MessageSquare className="h-4 w-4 mr-2" />Messages</TabsTrigger>
              <TabsTrigger value="groups"><Users className="h-4 w-4 mr-2" />Groups</TabsTrigger>
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
