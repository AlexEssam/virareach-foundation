import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageCircle, AtSign, Play, Pause, Image, Video, Link } from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";

export default function InstagramMessaging() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    campaign_name: "",
    campaign_type: "dm",
    message_type: "text",
    content: "",
    media_url: "",
    recipients: "",
    post_url: "",
    comment_template: "",
  });

  const fetchAccounts = async () => {
    const { data } = await supabase.functions.invoke("instagram-accounts", {
      body: { action: "list" },
    });
    setAccounts(data?.accounts || []);
    if (data?.accounts?.length > 0) {
      setSelectedAccount(data.accounts[0].id);
    }
  };

  const fetchCampaigns = async () => {
    const { data } = await supabase.functions.invoke("instagram-send", {
      body: { action: "list_campaigns" },
    });
    setCampaigns(data?.campaigns || []);
  };

  useEffect(() => {
    fetchAccounts();
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async () => {
    setLoading(true);
    try {
      const recipients = formData.recipients.split("\n").map((s) => s.trim()).filter(Boolean);

      const { data, error } = await supabase.functions.invoke("instagram-send", {
        body: {
          action: "create_campaign",
          account_id: selectedAccount,
          campaign_name: formData.campaign_name,
          campaign_type: formData.campaign_type,
          message_type: formData.message_type,
          content: formData.content,
          media_url: formData.media_url || null,
          recipients,
        },
      });

      if (error) throw error;

      toast({
        title: "Campaign Created",
        description: `Campaign "${formData.campaign_name}" created with ${recipients.length} recipients`,
      });
      setFormData({
        campaign_name: "",
        campaign_type: "dm",
        message_type: "text",
        content: "",
        media_url: "",
        recipients: "",
        post_url: "",
        comment_template: "",
      });
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMentionCampaign = async () => {
    setLoading(true);
    try {
      const usernames = formData.recipients.split("\n").map((s) => s.trim()).filter(Boolean);

      const { data, error } = await supabase.functions.invoke("instagram-send", {
        body: {
          action: "mention_in_comment",
          account_id: selectedAccount,
          post_url: formData.post_url,
          usernames,
          comment_template: formData.comment_template,
        },
      });

      if (error) throw error;

      toast({
        title: "Mention Campaign Created",
        description: data.message,
      });
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase.functions.invoke("instagram-send", {
        body: { action: "start_campaign", campaign_id: campaignId },
      });

      if (error) throw error;

      toast({ title: "Campaign Started" });
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase.functions.invoke("instagram-send", {
        body: { action: "pause_campaign", campaign_id: campaignId },
      });

      if (error) throw error;

      toast({ title: "Campaign Paused" });
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const messageTypes = [
    { value: "text", label: "Text", icon: MessageCircle },
    { value: "image", label: "Image", icon: Image },
    { value: "video", label: "Video", icon: Video },
    { value: "link", label: "Link", icon: Link },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <SiInstagram className="h-8 w-8" color="#E4405F" />
            <div>
              <h1 className="text-3xl font-bold">Instagram Messaging</h1>
              <p className="text-muted-foreground">Send DMs and mention users in comments</p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Select Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      @{account.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Tabs defaultValue="dm">
            <TabsList>
              <TabsTrigger value="dm">Direct Messages</TabsTrigger>
              <TabsTrigger value="mention">Comment Mentions</TabsTrigger>
            </TabsList>

            <TabsContent value="dm">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Create DM Campaign
                  </CardTitle>
                  <CardDescription>Send direct messages to multiple users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Campaign Name</Label>
                      <Input
                        value={formData.campaign_name}
                        onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                        placeholder="My DM Campaign"
                      />
                    </div>
                    <div>
                      <Label>Message Type</Label>
                      <Select
                        value={formData.message_type}
                        onValueChange={(value) => setFormData({ ...formData, message_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {messageTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Message Content</Label>
                    <textarea
                      className="w-full h-24 p-3 border rounded-md bg-background resize-none"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Your message here... Use {username} for personalization"
                    />
                  </div>

                  {(formData.message_type === "image" || formData.message_type === "video") && (
                    <div>
                      <Label>Media URL</Label>
                      <Input
                        value={formData.media_url}
                        onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  )}

                  <div>
                    <Label>Recipients (one username per line)</Label>
                    <textarea
                      className="w-full h-32 p-3 border rounded-md bg-background resize-none"
                      value={formData.recipients}
                      onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                      placeholder="username1&#10;username2&#10;username3"
                    />
                  </div>

                  <Button onClick={handleCreateCampaign} disabled={loading || !selectedAccount}>
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? "Creating..." : "Create Campaign"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mention">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AtSign className="h-5 w-5" />
                    Comment Mention Campaign
                  </CardTitle>
                  <CardDescription>Mention users in a comment on a post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Post URL</Label>
                    <Input
                      value={formData.post_url}
                      onChange={(e) => setFormData({ ...formData, post_url: e.target.value })}
                      placeholder="https://instagram.com/p/..."
                    />
                  </div>

                  <div>
                    <Label>Comment Template</Label>
                    <textarea
                      className="w-full h-20 p-3 border rounded-md bg-background resize-none"
                      value={formData.comment_template}
                      onChange={(e) => setFormData({ ...formData, comment_template: e.target.value })}
                      placeholder="Check this out @{username}! 🔥"
                    />
                  </div>

                  <div>
                    <Label>Usernames to Mention (one per line)</Label>
                    <textarea
                      className="w-full h-32 p-3 border rounded-md bg-background resize-none"
                      value={formData.recipients}
                      onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                      placeholder="username1&#10;username2&#10;username3"
                    />
                  </div>

                  <Button onClick={handleMentionCampaign} disabled={loading || !selectedAccount}>
                    <AtSign className="h-4 w-4 mr-2" />
                    {loading ? "Creating..." : "Create Mention Campaign"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No campaigns yet</p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{campaign.campaign_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.sent_count}/{campaign.total_recipients} sent •{" "}
                          {campaign.campaign_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            campaign.status === "completed"
                              ? "default"
                              : campaign.status === "running"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {campaign.status}
                        </Badge>
                        {campaign.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartCampaign(campaign.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {campaign.status === "running" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePauseCampaign(campaign.id)}
                          >
                            <Pause className="h-4 w-4" />
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
