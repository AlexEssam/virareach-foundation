import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, Clock, Shield, Loader2 } from "lucide-react";
import { SiPinterest } from "@icons-pack/react-simple-icons";

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  content: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: string;
  min_interval: number;
  max_interval: number;
  created_at: string;
}

interface Account {
  id: string;
  username: string;
  account_name: string | null;
}

export default function PinterestMessaging() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [minInterval, setMinInterval] = useState(30);
  const [maxInterval, setMaxInterval] = useState(120);
  const [useRandomInterval, setUseRandomInterval] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["pinterest-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pinterest_accounts")
        .select("id, username, account_name")
        .eq("status", "active");
      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["pinterest-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pinterest_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      const recipientList = recipients.split("\n").filter(r => r.trim());
      const { error } = await supabase.from("pinterest_campaigns").insert({
        user_id: user?.id,
        account_id: selectedAccount || null,
        campaign_name: campaignName,
        campaign_type: "dm",
        content: message,
        recipients: recipientList,
        total_recipients: recipientList.length,
        min_interval: minInterval,
        max_interval: maxInterval,
        status: "pending"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinterest-campaigns"] });
      setCampaignName("");
      setMessage("");
      setRecipients("");
      toast({ title: "Campaign created", description: "Messages will be sent with safe intervals" });
    },
    onError: (error) => {
      toast({ title: "Error creating campaign", description: error.message, variant: "destructive" });
    }
  });

  const startCampaign = () => {
    if (!campaignName.trim() || !message.trim() || !recipients.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createCampaignMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <SiPinterest className="h-8 w-8" color="#E60023" />
              Pinterest Messaging
            </h1>
            <p className="text-muted-foreground mt-1">Send DMs with safe time intervals and anti-ban protection</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New Campaign Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Create DM Campaign
                </CardTitle>
                <CardDescription>Send messages to multiple users safely</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Campaign Name *</Label>
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="My Pinterest Campaign"
                  />
                </div>

                <div>
                  <Label>Select Account</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose account to send from" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          @{account.username} {account.account_name && `(${account.account_name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Message Content *</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi {name}, I noticed you're interested in..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {"{name}"} to personalize with recipient's name
                  </p>
                </div>

                <div>
                  <Label>Recipients (one username per line) *</Label>
                  <Textarea
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    placeholder="user1&#10;user2&#10;user3"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {recipients.split("\n").filter(r => r.trim()).length} recipients
                  </p>
                </div>

                {/* Anti-Ban Settings */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#E60023]" />
                    <span className="font-medium">Anti-Ban Settings</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Use Random Intervals</Label>
                    <Switch
                      checked={useRandomInterval}
                      onCheckedChange={setUseRandomInterval}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Interval (seconds)</Label>
                      <Input
                        type="number"
                        value={minInterval}
                        onChange={(e) => setMinInterval(parseInt(e.target.value) || 30)}
                        min={10}
                      />
                    </div>
                    <div>
                      <Label>Max Interval (seconds)</Label>
                      <Input
                        type="number"
                        value={maxInterval}
                        onChange={(e) => setMaxInterval(parseInt(e.target.value) || 120)}
                        min={30}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Messages will be sent with {useRandomInterval ? `random delays between ${minInterval}-${maxInterval}` : `${minInterval}`} seconds
                  </p>
                </div>

                <Button 
                  onClick={startCampaign}
                  disabled={createCampaignMutation.isPending}
                  className="w-full bg-[#E60023] hover:bg-[#C50020]"
                >
                  {createCampaignMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Start Campaign</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Campaign History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Campaign History
                </CardTitle>
                <CardDescription>Your messaging campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center text-muted-foreground py-4">Loading...</p>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-muted-foreground">No campaigns yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{campaign.campaign_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(campaign.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={
                            campaign.status === "completed" ? "default" :
                            campaign.status === "processing" ? "secondary" : "outline"
                          }>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center p-2 bg-background rounded">
                            <p className="font-semibold">{campaign.total_recipients}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          <div className="text-center p-2 bg-background rounded">
                            <p className="font-semibold text-green-500">{campaign.sent_count}</p>
                            <p className="text-xs text-muted-foreground">Sent</p>
                          </div>
                          <div className="text-center p-2 bg-background rounded">
                            <p className="font-semibold text-red-500">{campaign.failed_count}</p>
                            <p className="text-xs text-muted-foreground">Failed</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}