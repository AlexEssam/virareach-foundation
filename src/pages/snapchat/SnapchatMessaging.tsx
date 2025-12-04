import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Ghost, Send, MessageSquare, Image, Video, Link, Shield, Clock } from "lucide-react";

interface Account {
  id: string;
  username: string;
  account_name: string | null;
}

interface Campaign {
  id: string;
  campaign_name: string;
  message_type: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
}

const SnapchatMessaging = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [recipients, setRecipients] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [randomIntervals, setRandomIntervals] = useState(true);
  const [minInterval, setMinInterval] = useState("30");
  const [maxInterval, setMaxInterval] = useState("120");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery({
    queryKey: ["snapchat-accounts-select"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("snapchat_accounts")
        .select("id, username, account_name")
        .eq("user_id", user.id)
        .eq("status", "active");
      
      if (error) throw error;
      return data as Account[];
    },
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["snapchat-campaigns"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("snapchat_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("snapchat-send", {
        body: {
          action: "create_campaign",
          params: {
            campaign_name: campaignName,
            message_type: messageType,
            content,
            media_url: mediaUrl || null,
            whatsapp_link: whatsappLink || null,
            recipients: recipients.split("\n").filter(r => r.trim()),
            account_id: selectedAccount || null,
            min_interval: parseInt(minInterval),
            max_interval: parseInt(maxInterval),
          },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["snapchat-campaigns"] });
      setCampaignName("");
      setContent("");
      setMediaUrl("");
      setWhatsappLink("");
      setRecipients("");
      toast({ title: "Campaign Started", description: `Sending to ${data.total_recipients} recipients` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const startCampaign = () => {
    if (!campaignName.trim()) {
      toast({ title: "Error", description: "Enter a campaign name", variant: "destructive" });
      return;
    }
    if (!content.trim() && messageType === "text") {
      toast({ title: "Error", description: "Enter message content", variant: "destructive" });
      return;
    }
    if (!recipients.trim()) {
      toast({ title: "Error", description: "Enter at least one recipient", variant: "destructive" });
      return;
    }
    sendCampaignMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Ghost className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold">Snapchat Messaging</h1>
              <p className="text-muted-foreground">Send promotional messages with multi-account support</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Send className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{campaigns?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Campaigns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Messages Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {campaigns?.filter(c => c.status === "running").length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Campaigns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{accounts?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Active Accounts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="create" className="space-y-4">
            <TabsList>
              <TabsTrigger value="create">Create Campaign</TabsTrigger>
              <TabsTrigger value="history">Campaign History</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Settings</CardTitle>
                    <CardDescription>Configure your messaging campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Campaign Name</Label>
                      <Input
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="My Campaign"
                      />
                    </div>
                    <div>
                      <Label>Message Type</Label>
                      <Select value={messageType} onValueChange={setMessageType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" /> Text
                            </div>
                          </SelectItem>
                          <SelectItem value="image">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4" /> Image
                            </div>
                          </SelectItem>
                          <SelectItem value="video">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4" /> Video
                            </div>
                          </SelectItem>
                          <SelectItem value="whatsapp_link">
                            <div className="flex items-center gap-2">
                              <Link className="h-4 w-4" /> WhatsApp Link
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Select Account</Label>
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rotate">Rotate All Accounts</SelectItem>
                          {accounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              @{account.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Message Content</CardTitle>
                    <CardDescription>Write your promotional message</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Message</Label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Enter your message..."
                        rows={4}
                      />
                    </div>
                    {(messageType === "image" || messageType === "video") && (
                      <div>
                        <Label>Media URL</Label>
                        <Input
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="https://example.com/media.jpg"
                        />
                      </div>
                    )}
                    {messageType === "whatsapp_link" && (
                      <div>
                        <Label>WhatsApp Contact Link</Label>
                        <Input
                          value={whatsappLink}
                          onChange={(e) => setWhatsappLink(e.target.value)}
                          placeholder="https://wa.me/1234567890"
                        />
                      </div>
                    )}
                    <div>
                      <Label>Recipients (one username per line)</Label>
                      <Textarea
                        value={recipients}
                        onChange={(e) => setRecipients(e.target.value)}
                        placeholder="username1&#10;username2&#10;username3"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" /> Anti-Ban Settings
                    </CardTitle>
                    <CardDescription>Configure safety settings to avoid account bans</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Randomized Time Intervals</Label>
                        <p className="text-sm text-muted-foreground">
                          Add random delays between messages
                        </p>
                      </div>
                      <Switch checked={randomIntervals} onCheckedChange={setRandomIntervals} />
                    </div>
                    {randomIntervals && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Min Interval (seconds)</Label>
                          <Input
                            type="number"
                            value={minInterval}
                            onChange={(e) => setMinInterval(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Max Interval (seconds)</Label>
                          <Input
                            type="number"
                            value={maxInterval}
                            onChange={(e) => setMaxInterval(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={startCampaign}
                      disabled={sendCampaignMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Start Campaign
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign History</CardTitle>
                  <CardDescription>View past messaging campaigns and reports</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : campaigns?.length === 0 ? (
                    <p className="text-muted-foreground">No campaigns yet</p>
                  ) : (
                    <div className="space-y-3">
                      {campaigns?.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{campaign.campaign_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Type: {campaign.message_type} • Recipients: {campaign.total_recipients}
                            </p>
                            <div className="flex gap-4 mt-1 text-sm">
                              <span className="text-green-600">Sent: {campaign.sent_count}</span>
                              <span className="text-red-600">Failed: {campaign.failed_count}</span>
                            </div>
                          </div>
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

export default SnapchatMessaging;
