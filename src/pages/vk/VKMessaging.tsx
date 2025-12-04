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
import { Send, MessageSquare, UserPlus, Shield, Clock, Users } from "lucide-react";

interface Account {
  id: string;
  vk_id: string;
  username: string | null;
}

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
}

interface FriendRequest {
  id: string;
  target_vk_id: string;
  target_name: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
}

const VKMessaging = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState("message");
  const [content, setContent] = useState("");
  const [recipients, setRecipients] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [randomIntervals, setRandomIntervals] = useState(true);
  const [minInterval, setMinInterval] = useState("30");
  const [maxInterval, setMaxInterval] = useState("120");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery({
    queryKey: ["vk-accounts-select"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("vk_accounts")
        .select("id, vk_id, username")
        .eq("user_id", user.id)
        .eq("status", "active");
      
      if (error) throw error;
      return data as Account[];
    },
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["vk-campaigns"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("vk_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const { data: friendRequests } = useQuery({
    queryKey: ["vk-friend-requests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("vk_friend_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as FriendRequest[];
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("vk-send", {
        body: {
          action: "create_campaign",
          params: {
            campaign_name: campaignName,
            campaign_type: campaignType,
            content,
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
      queryClient.invalidateQueries({ queryKey: ["vk-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["vk-friend-requests"] });
      setCampaignName("");
      setContent("");
      setRecipients("");
      toast({ title: "Campaign Started", description: `Processing ${data.total_recipients} recipients` });
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
    if (!content.trim() && campaignType === "message") {
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
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">VK</div>
            <div>
              <h1 className="text-3xl font-bold">VK Messaging</h1>
              <p className="text-muted-foreground">Send messages and friend requests with multi-account rotation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Send className="h-8 w-8 text-blue-600" />
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
                  <UserPlus className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {friendRequests?.filter(f => f.status === "sent").length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Friend Requests Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-orange-500" />
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
              <TabsTrigger value="friend-requests">Friend Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Settings</CardTitle>
                    <CardDescription>Configure your messaging or friend request campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Campaign Name</Label>
                      <Input
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="My VK Campaign"
                      />
                    </div>
                    <div>
                      <Label>Campaign Type</Label>
                      <Select value={campaignType} onValueChange={setCampaignType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="message">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" /> Send Messages
                            </div>
                          </SelectItem>
                          <SelectItem value="friend_request">
                            <div className="flex items-center gap-2">
                              <UserPlus className="h-4 w-4" /> Friend Requests
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Select Account</Label>
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account or rotate all" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rotate">Rotate All Accounts</SelectItem>
                          {accounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.username || `ID: ${account.vk_id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content & Recipients</CardTitle>
                    <CardDescription>Write your message and add recipients</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaignType === "message" && (
                      <div>
                        <Label>Message Content</Label>
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Enter your message..."
                          rows={4}
                        />
                      </div>
                    )}
                    {campaignType === "friend_request" && (
                      <div>
                        <Label>Friend Request Message (optional)</Label>
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Optional message to send with friend request..."
                          rows={3}
                        />
                      </div>
                    )}
                    <div>
                      <Label>Recipients (VK IDs, one per line)</Label>
                      <Textarea
                        value={recipients}
                        onChange={(e) => setRecipients(e.target.value)}
                        placeholder="123456789&#10;987654321&#10;555555555"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" /> Security Settings
                    </CardTitle>
                    <CardDescription>Configure anti-ban settings with proxy and random intervals</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Randomized Time Intervals</Label>
                        <p className="text-sm text-muted-foreground">Add random delays between actions</p>
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
                  <CardDescription>View past campaigns and their results</CardDescription>
                </CardHeader>
                <CardContent>
                  {campaignsLoading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : campaigns?.length === 0 ? (
                    <p className="text-muted-foreground">No campaigns yet</p>
                  ) : (
                    <div className="space-y-3">
                      {campaigns?.map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{campaign.campaign_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Type: {campaign.campaign_type} • Recipients: {campaign.total_recipients}
                            </p>
                            <div className="flex gap-4 mt-1 text-sm">
                              <span className="text-green-600">Sent: {campaign.sent_count}</span>
                              <span className="text-red-600">Failed: {campaign.failed_count}</span>
                            </div>
                          </div>
                          <Badge variant={campaign.status === "completed" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="friend-requests">
              <Card>
                <CardHeader>
                  <CardTitle>Friend Request History</CardTitle>
                  <CardDescription>View sent friend requests and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {friendRequests?.length === 0 ? (
                    <p className="text-muted-foreground">No friend requests sent yet</p>
                  ) : (
                    <div className="space-y-3">
                      {friendRequests?.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{request.target_name || `ID: ${request.target_vk_id}`}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant={request.status === "sent" ? "default" : "secondary"}>
                            {request.status}
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

export default VKMessaging;
