import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, History, CheckCircle, XCircle, Clock, Image, Video, FileText, Link as LinkIcon, MessageSquare } from "lucide-react";

interface Campaign {
  id: string;
  campaign_name: string;
  message_type: string;
  sending_mode: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

interface WhatsAppAccount {
  id: string;
  phone_number: string;
  account_name: string | null;
  status: string;
}

const messageTypes = [
  { value: "text", label: "Text Message", icon: MessageSquare },
  { value: "image", label: "Image", icon: Image },
  { value: "video", label: "Video", icon: Video },
  { value: "file", label: "File", icon: FileText },
  { value: "link", label: "Link", icon: LinkIcon },
];

const sendingModes = [
  { value: "10_per_min", label: "10 messages/min", description: "Safe mode" },
  { value: "20_per_min", label: "20 messages/min", description: "Normal mode" },
  { value: "35_per_min", label: "35 messages/min", description: "Fast mode" },
  { value: "group_add", label: "250 users/3 min", description: "Group add mode" },
];

export default function WhatsAppSending() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [recipients, setRecipients] = useState("");
  const [sendingMode, setSendingMode] = useState("10_per_min");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [campResult, accResult] = await Promise.all([
        supabase
          .from("whatsapp_campaigns")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("whatsapp_accounts")
          .select("id, phone_number, account_name, status")
          .eq("user_id", user.id)
          .eq("status", "active"),
      ]);

      if (campResult.error) throw campResult.error;
      if (accResult.error) throw accResult.error;

      setCampaigns(campResult.data || []);
      setAccounts(accResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSend = async () => {
    if (!campaignName.trim()) {
      toast({ title: "Error", description: "Please enter campaign name", variant: "destructive" });
      return;
    }

    if (!content.trim() && messageType === "text") {
      toast({ title: "Error", description: "Please enter message content", variant: "destructive" });
      return;
    }

    const recipientList = recipients.split("\n").map(r => r.trim()).filter(r => r.length > 0);
    if (recipientList.length === 0) {
      toast({ title: "Error", description: "Please enter at least one recipient", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("whatsapp-send", {
        body: {
          campaign_name: campaignName,
          account_id: selectedAccount || null,
          message_type: messageType,
          content,
          media_url: mediaUrl || null,
          recipients: recipientList,
          sending_mode: sendingMode,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Campaign Completed",
        description: response.data.message,
      });
      
      setCampaignName("");
      setContent("");
      setMediaUrl("");
      setRecipients("");
      fetchData();
    } catch (error: any) {
      console.error("Error sending:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send campaign",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <header className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">WhatsApp Sending</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Send bulk messages with anti-ban controls
            </p>
          </header>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Campaign Form */}
            <Card variant="glow" className="animate-fade-in">
              <CardHeader>
                <CardTitle>New Campaign</CardTitle>
                <CardDescription>
                  Create and send a bulk messaging campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    placeholder="My Campaign"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                {accounts.length > 0 && (
                  <div className="space-y-2">
                    <Label>Account (Optional)</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account..." />
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
                )}

                <div className="grid grid-cols-2 gap-4">
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
                    <Label>Sending Mode</Label>
                    <Select value={sendingMode} onValueChange={setSendingMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sendingModes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Message Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your message... (supports emojis 😀)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                  />
                </div>

                {(messageType === "image" || messageType === "video" || messageType === "file") && (
                  <div className="space-y-2">
                    <Label htmlFor="mediaUrl">Media URL</Label>
                    <Input
                      id="mediaUrl"
                      placeholder="https://example.com/media.jpg"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="recipients">Recipients (one per line)</Label>
                  <Textarea
                    id="recipients"
                    placeholder="+1234567890&#10;+0987654321&#10;..."
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {recipients.split("\n").filter(r => r.trim()).length} recipients
                  </p>
                </div>

                <Button 
                  onClick={handleSend} 
                  disabled={sending}
                  className="w-full"
                  variant="hero"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
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

            {/* Rate Limits Info */}
            <div className="space-y-4">
              <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Sending Modes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sendingModes.map((mode) => (
                    <div 
                      key={mode.value}
                      className={`p-3 rounded-lg border transition-colors ${
                        sendingMode === mode.value 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-secondary/30 border-border/50"
                      }`}
                    >
                      <p className="font-medium">{mode.label}</p>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {accounts.length === 0 && (
                <Card variant="glass" className="animate-fade-in border-yellow-500/30">
                  <CardContent className="p-4">
                    <p className="text-sm text-yellow-500">
                      No WhatsApp accounts configured. Add an account to enable number rotation.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Campaigns */}
          <section className="mt-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Recent Campaigns</h2>
            </div>

            {campaigns.length === 0 ? (
              <Card variant="glass">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Send className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No campaigns yet</p>
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
                            <Badge variant="outline">{campaign.message_type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Mode: {sendingModes.find(m => m.value === campaign.sending_mode)?.label}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{campaign.total_recipients} recipients</p>
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
