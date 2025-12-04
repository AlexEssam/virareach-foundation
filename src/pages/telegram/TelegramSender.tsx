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
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, Image, FileText, Phone, AtSign, Hash, Loader2, Play, Pause } from "lucide-react";

interface Campaign {
  id: string;
  campaign_name: string;
  message_type: string;
  target_type: string;
  status: string;
  total_recipients: number | null;
  sent_count: number | null;
  failed_count: number | null;
  created_at: string;
}

interface TelegramAccount {
  id: string;
  phone_number: string;
  account_name: string | null;
  status: string;
}

const messageTypes = [
  { value: "text", label: "Text Message", icon: MessageSquare },
  { value: "image", label: "Image + Caption", icon: Image },
  { value: "document", label: "Document", icon: FileText },
];

const targetTypes = [
  { value: "phone", label: "Phone Numbers", icon: Phone, description: "Send using phone numbers" },
  { value: "username", label: "Usernames", icon: AtSign, description: "Send using @usernames" },
  { value: "user_id", label: "User IDs", icon: Hash, description: "Send using Telegram user IDs" },
];

const sendingModes = [
  { value: "5_per_min", label: "Safe (5/min)", description: "Best for new accounts" },
  { value: "10_per_min", label: "Normal (10/min)", description: "Balanced speed and safety" },
  { value: "20_per_min", label: "Fast (20/min)", description: "For aged accounts only" },
  { value: "50_per_min", label: "Turbo (50/min)", description: "Premium accounts with rotation" },
];

export default function TelegramSender() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [campaignName, setCampaignName] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [targetType, setTargetType] = useState("phone");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [recipients, setRecipients] = useState("");
  const [sendingMode, setSendingMode] = useState("10_per_min");
  const [selectedAccount, setSelectedAccount] = useState("");

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
      supabase.from('telegram_campaigns').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('telegram_accounts').select('*').eq('status', 'active')
    ]);

    if (campaignsRes.data) setCampaigns(campaignsRes.data);
    if (accountsRes.data) setAccounts(accountsRes.data);
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !content || !recipients) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-send', {
        body: { 
          action: 'create_campaign',
          campaign_name: campaignName,
          message_type: messageType,
          target_type: targetType,
          content,
          media_url: mediaUrl,
          recipients,
          sending_mode: sendingMode,
          account_id: selectedAccount
        }
      });

      if (error) throw error;

      toast({ title: "Campaign Created", description: data.message });
      setCampaignName("");
      setContent("");
      setMediaUrl("");
      setRecipients("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('telegram-send', {
        body: { action: 'start_campaign', campaign_id: campaignId }
      });

      if (error) throw error;

      toast({ title: "Campaign Started", description: `Sent: ${data.sent_count}, Failed: ${data.failed_count}` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase.functions.invoke('telegram-send', {
        body: { action: 'pause_campaign', campaign_id: campaignId }
      });

      if (error) throw error;

      toast({ title: "Campaign Paused" });
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
            <h1 className="text-3xl font-bold">Telegram Sender</h1>
            <p className="text-muted-foreground mt-2">Send bulk messages via phone, username, or user ID</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  New Campaign
                </CardTitle>
                <CardDescription>Create a new messaging campaign</CardDescription>
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
                            {account.account_name || account.phone_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Message Type</Label>
                    <Select value={messageType} onValueChange={setMessageType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {messageTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Type</Label>
                    <Select value={targetType} onValueChange={setTargetType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {targetTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Message Content</Label>
                  <Textarea
                    placeholder="Enter your message..."
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                {messageType !== "text" && (
                  <div className="space-y-2">
                    <Label>Media URL</Label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Recipients (one per line)</Label>
                  <Textarea
                    placeholder={targetType === 'phone' ? "+1234567890\n+0987654321" : targetType === 'username' ? "@user1\n@user2" : "123456789\n987654321"}
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
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Campaign"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Target Options</CardTitle>
                <CardDescription>Ways to reach your audience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {targetTypes.map((type) => (
                  <div key={type.value} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <type.icon className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

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
                          {campaign.target_type} • {campaign.message_type} • {new Date(campaign.created_at).toLocaleDateString()}
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
                        {campaign.status === 'running' && (
                          <Button size="sm" variant="outline" onClick={() => handlePauseCampaign(campaign.id)}>
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
