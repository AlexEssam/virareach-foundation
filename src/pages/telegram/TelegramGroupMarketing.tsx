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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, MessageSquare, Image, FileText, Clock, Loader2, Play, Pause, RefreshCw } from "lucide-react";

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

interface TelegramGroup {
  id: string;
  group_name: string;
  group_id: string | null;
  member_count: number | null;
  status: string;
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

const sendingModes = [
  { value: "1_per_min", label: "Very Safe (1/min)", description: "Best for new accounts" },
  { value: "3_per_min", label: "Safe (3/min)", description: "Recommended for most groups" },
  { value: "5_per_min", label: "Normal (5/min)", description: "For aged accounts" },
  { value: "10_per_min", label: "Fast (10/min)", description: "Premium accounts only" },
];

const scheduleIntervals = [
  { value: "0", label: "Send immediately" },
  { value: "30", label: "Every 30 minutes" },
  { value: "60", label: "Every hour" },
  { value: "120", label: "Every 2 hours" },
  { value: "360", label: "Every 6 hours" },
  { value: "1440", label: "Daily" },
];

export default function TelegramGroupMarketing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [campaignName, setCampaignName] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [sendingMode, setSendingMode] = useState("3_per_min");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [scheduleInterval, setScheduleInterval] = useState("0");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [manualGroupIds, setManualGroupIds] = useState("");
  const [useManualInput, setUseManualInput] = useState(false);
  const [rotateAccounts, setRotateAccounts] = useState(false);

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
    const [campaignsRes, groupsRes, accountsRes] = await Promise.all([
      supabase.from('telegram_campaigns').select('*').eq('target_type', 'group').order('created_at', { ascending: false }).limit(20),
      supabase.from('telegram_groups').select('*').eq('status', 'active'),
      supabase.from('telegram_accounts').select('*').eq('status', 'active')
    ]);

    if (campaignsRes.data) setCampaigns(campaignsRes.data);
    if (groupsRes.data) setGroups(groupsRes.data);
    if (accountsRes.data) setAccounts(accountsRes.data);
  };

  const handleRefreshGroups = async () => {
    if (!selectedAccount) {
      toast({ title: "Error", description: "Please select an account first", variant: "destructive" });
      return;
    }

    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-send', {
        body: { action: 'get_joined_groups', account_id: selectedAccount }
      });

      if (error) throw error;

      toast({ title: "Groups Refreshed", description: `Found ${data.groups?.length || 0} groups` });
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectAllGroups = () => {
    if (selectedGroups.length === groups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(groups.map(g => g.id));
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !content) {
      toast({ title: "Error", description: "Please fill in campaign name and content", variant: "destructive" });
      return;
    }

    const targetGroups = useManualInput 
      ? manualGroupIds.split('\n').filter(g => g.trim())
      : selectedGroups;

    if (targetGroups.length === 0) {
      toast({ title: "Error", description: "Please select at least one group", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-send', {
        body: { 
          action: 'create_group_campaign',
          campaign_name: campaignName,
          message_type: messageType,
          content,
          media_url: mediaUrl,
          group_ids: targetGroups,
          sending_mode: sendingMode,
          account_id: selectedAccount,
          schedule_interval: parseInt(scheduleInterval),
          rotate_accounts: rotateAccounts
        }
      });

      if (error) throw error;

      toast({ title: "Campaign Created", description: data.message });
      setCampaignName("");
      setContent("");
      setMediaUrl("");
      setSelectedGroups([]);
      setManualGroupIds("");
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('telegram-send', {
        body: { action: 'start_group_campaign', campaign_id: campaignId }
      });

      if (error) throw error;

      toast({ title: "Campaign Started", description: data.message });
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
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
            <h1 className="text-3xl font-bold">Group Marketing</h1>
            <p className="text-muted-foreground mt-2">Send marketing messages directly to Telegram groups</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  New Group Campaign
                </CardTitle>
                <CardDescription>Create a marketing campaign for groups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Campaign Name</Label>
                    <Input
                      placeholder="My Group Campaign"
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
                    <Label>Sending Speed</Label>
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
                  <Label>Message Content</Label>
                  <Textarea
                    placeholder="Enter your marketing message..."
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
                  <Label>Schedule Interval</Label>
                  <Select value={scheduleInterval} onValueChange={setScheduleInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleIntervals.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {interval.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Rotate Accounts (use multiple accounts)</Label>
                  <Switch checked={rotateAccounts} onCheckedChange={setRotateAccounts} />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Enter Group IDs Manually</Label>
                  <Switch checked={useManualInput} onCheckedChange={setUseManualInput} />
                </div>

                {useManualInput ? (
                  <div className="space-y-2">
                    <Label>Group IDs/Links (one per line)</Label>
                    <Textarea
                      placeholder="@groupname&#10;https://t.me/joinchat/xxx&#10;-1001234567890"
                      rows={5}
                      value={manualGroupIds}
                      onChange={(e) => setManualGroupIds(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      {manualGroupIds.split('\n').filter(g => g.trim()).length} groups
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Select Target Groups</Label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleSelectAllGroups}>
                          {selectedGroups.length === groups.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRefreshGroups} disabled={refreshing}>
                          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                      {groups.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No groups found. Add groups or refresh.
                        </p>
                      ) : (
                        groups.map((group) => (
                          <div key={group.id} className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedGroups.includes(group.id)}
                              onCheckedChange={() => handleGroupToggle(group.id)}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{group.group_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.member_count || 0} members
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedGroups.length} groups selected
                    </p>
                  </div>
                )}

                <Button onClick={handleCreateCampaign} disabled={loading} className="w-full">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Group Campaign"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips for Group Marketing</CardTitle>
                <CardDescription>Best practices for success</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">Safe Sending</p>
                  <p className="text-xs text-muted-foreground">Use slower speeds for new accounts to avoid bans</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">Content Quality</p>
                  <p className="text-xs text-muted-foreground">Avoid spammy content. Provide value to group members</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">Scheduling</p>
                  <p className="text-xs text-muted-foreground">Schedule messages during peak activity hours</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">Account Rotation</p>
                  <p className="text-xs text-muted-foreground">Use multiple accounts to reduce risk</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Group Campaigns</CardTitle>
              <CardDescription>Your group marketing campaign history</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No group campaigns yet</p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">{campaign.campaign_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.message_type} • {new Date(campaign.created_at).toLocaleDateString()}
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
                          {campaign.sent_count || 0}/{campaign.total_recipients || 0} groups
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
