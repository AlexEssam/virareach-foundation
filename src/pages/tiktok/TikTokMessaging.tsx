import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageCircle, Image, Video, Link, Smile, Play } from "lucide-react";
import { SiTiktok } from "@icons-pack/react-simple-icons";

interface Account {
  id: string;
  username: string;
  account_name: string | null;
  status: string;
}

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  message_type: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
}

const TikTokMessaging = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [recipients, setRecipients] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [videoUrls, setVideoUrls] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadAccounts();
      loadCampaigns();
    }
  }, [user]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const loadAccounts = async () => {
    try {
      const response = await supabase.functions.invoke('tiktok-accounts', { body: { action: 'get_accounts' } });
      if (response.data?.accounts) setAccounts(response.data.accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await supabase.functions.invoke('tiktok-send', { body: { action: 'get_campaigns' } });
      if (response.data?.campaigns) setCampaigns(response.data.campaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const createDMCampaign = async () => {
    if (!selectedAccount || !campaignName || !content || !recipients.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const recipientList = recipients.split('\n').map(r => r.trim()).filter(r => r);
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('tiktok-send', {
        body: {
          action: 'create_dm_campaign',
          account_id: selectedAccount,
          campaign_name: campaignName,
          message_type: messageType,
          content,
          media_url: mediaUrl || undefined,
          recipients: recipientList
        }
      });
      if (response.error) throw response.error;
      toast({ title: "DM Campaign created" });
      resetForm();
      loadCampaigns();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const createCommentCampaign = async () => {
    if (!selectedAccount || !campaignName || !commentContent || !videoUrls.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const urls = videoUrls.split('\n').map(u => u.trim()).filter(u => u);
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('tiktok-send', {
        body: {
          action: 'create_comment_campaign',
          account_id: selectedAccount,
          campaign_name: campaignName,
          content: commentContent,
          video_urls: urls
        }
      });
      if (response.error) throw response.error;
      toast({ title: "Comment Campaign created" });
      resetForm();
      loadCampaigns();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCampaignName("");
    setContent("");
    setMediaUrl("");
    setRecipients("");
    setCommentContent("");
    setVideoUrls("");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary", running: "default", completed: "outline", failed: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getMessageTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      text: <MessageCircle className="h-4 w-4" />,
      image: <Image className="h-4 w-4" />,
      video: <Video className="h-4 w-4" />,
      link: <Link className="h-4 w-4" />
    };
    return icons[type] || <Send className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <SiTiktok className="h-8 w-8" />
              TikTok Messaging
            </h1>
            <p className="text-muted-foreground mt-2">Send DMs and comments with multi-account support</p>
          </div>

          <div className="mb-6">
            <Label>Select Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.filter(a => a.status === 'active').map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>@{acc.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="dm" className="space-y-6">
            <TabsList>
              <TabsTrigger value="dm">Direct Messages</TabsTrigger>
              <TabsTrigger value="comments">Comment Mentions</TabsTrigger>
              <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
            </TabsList>

            <TabsContent value="dm">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" />DM Campaign</CardTitle>
                  <CardDescription>Send messages with text, images, videos, emojis, and links</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Campaign Name *</Label>
                      <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="My DM Campaign" />
                    </div>
                    <div className="space-y-2">
                      <Label>Message Type</Label>
                      <Select value={messageType} onValueChange={setMessageType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />Text</div></SelectItem>
                          <SelectItem value="image"><div className="flex items-center gap-2"><Image className="h-4 w-4" />Image</div></SelectItem>
                          <SelectItem value="video"><div className="flex items-center gap-2"><Video className="h-4 w-4" />Video</div></SelectItem>
                          <SelectItem value="link"><div className="flex items-center gap-2"><Link className="h-4 w-4" />Link</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Message Content * <Smile className="h-4 w-4 inline ml-1" /></Label>
                    <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Your message with emojis 🎉 and links https://..." className="min-h-[100px]" />
                  </div>
                  {(messageType === 'image' || messageType === 'video') && (
                    <div className="space-y-2">
                      <Label>Media URL</Label>
                      <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Recipients * (one username per line)</Label>
                    <Textarea value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="@user1&#10;@user2&#10;@user3" className="min-h-[150px]" />
                  </div>
                  <Button onClick={createDMCampaign} disabled={isLoading} className="w-full">
                    <Play className="h-4 w-4 mr-2" />{isLoading ? "Creating..." : "Create DM Campaign"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" />Comment Mentions</CardTitle>
                  <CardDescription>Mention users from lists in video comments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Campaign Name *</Label>
                    <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Comment Campaign" />
                  </div>
                  <div className="space-y-2">
                    <Label>Comment Content * (use @username for mentions)</Label>
                    <Textarea value={commentContent} onChange={(e) => setCommentContent(e.target.value)} placeholder="Check this out @user1 @user2! 🔥" className="min-h-[100px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Video URLs * (one per line)</Label>
                    <Textarea value={videoUrls} onChange={(e) => setVideoUrls(e.target.value)} placeholder="https://tiktok.com/@user/video/123&#10;https://tiktok.com/@user/video/456" className="min-h-[150px]" />
                  </div>
                  <Button onClick={createCommentCampaign} disabled={isLoading} className="w-full">
                    <Play className="h-4 w-4 mr-2" />{isLoading ? "Creating..." : "Create Comment Campaign"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign History</CardTitle>
                  <CardDescription>View and manage your messaging campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No campaigns yet</p>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="border rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getMessageTypeIcon(campaign.message_type)}
                              <h4 className="font-medium">{campaign.campaign_name}</h4>
                              <Badge variant="outline" className="capitalize">{campaign.campaign_type}</Badge>
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>Total: {campaign.total_recipients}</span>
                              <span className="text-green-600">Sent: {campaign.sent_count}</span>
                              <span className="text-red-600">Failed: {campaign.failed_count}</span>
                            </div>
                          </div>
                          {getStatusBadge(campaign.status)}
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
};

export default TikTokMessaging;
