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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserPlus, BarChart3, Link, Loader2, LogIn, LogOut, Crown, Download, MessageSquare, ArrowRightLeft, Zap } from "lucide-react";

interface TelegramGroup {
  id: string;
  group_id: string | null;
  group_name: string;
  group_type: string | null;
  member_count: number | null;
  is_public: boolean | null;
  status: string;
  invite_link: string | null;
  created_at: string;
}

interface TelegramAccount {
  id: string;
  phone_number: string;
  account_name: string | null;
  status: string;
}

interface GroupAnalysis {
  group_name: string;
  group_type: string;
  member_count: number;
  online_count: number;
  admins_count: number;
  messages_per_day: number;
  is_public: boolean;
  engagement_rate: string;
  growth_rate: string;
  description: string;
}

export default function TelegramGroups() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [foundGroups, setFoundGroups] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<GroupAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [selectedAccount, setSelectedAccount] = useState("");
  const [joinLink, setJoinLink] = useState("");
  const [bulkLinks, setBulkLinks] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchLimit, setSearchLimit] = useState("100");
  const [analyzeLink, setAnalyzeLink] = useState("");
  const [addMembersGroupId, setAddMembersGroupId] = useState("");
  const [membersToAdd, setMembersToAdd] = useState("");

  // Premium features state
  const [extractGroupId, setExtractGroupId] = useState("");
  const [extractedMembers, setExtractedMembers] = useState<any[]>([]);
  const [includePhones, setIncludePhones] = useState(true);
  const [includeIds, setIncludeIds] = useState(true);
  
  const [advancedSearchType, setAdvancedSearchType] = useState("all");
  const [advancedSearchResults, setAdvancedSearchResults] = useState<any[]>([]);
  const [minMembers, setMinMembers] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  
  const [usernamesToAdd, setUsernamesToAdd] = useState("");
  const [phonesToAdd, setPhonesToAdd] = useState("");
  
  const [sourceGroupId, setSourceGroupId] = useState("");
  const [targetGroupId, setTargetGroupId] = useState("");
  const [membersToMove, setMembersToMove] = useState("");
  
  const [autoInteractGroupId, setAutoInteractGroupId] = useState("");
  const [interactionType, setInteractionType] = useState("react");
  const [autoInteractKeywords, setAutoInteractKeywords] = useState("");
  const [replyTemplate, setReplyTemplate] = useState("");
  const [autoInteractStatus, setAutoInteractStatus] = useState<any>(null);

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
    const [groupsRes, accountsRes] = await Promise.all([
      supabase.from('telegram_groups').select('*').order('created_at', { ascending: false }),
      supabase.from('telegram_accounts').select('*').eq('status', 'active')
    ]);

    if (groupsRes.data) setGroups(groupsRes.data);
    if (accountsRes.data) setAccounts(accountsRes.data);
  };

  const handleJoinGroup = async () => {
    if (!joinLink || !selectedAccount) {
      toast({ title: "Error", description: "Please enter a group link and select an account", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-groups', {
        body: { action: 'join', invite_link: joinLink, account_id: selectedAccount }
      });

      if (error) throw error;
      toast({ title: "Success", description: data.message });
      setJoinLink("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkJoin = async () => {
    if (!bulkLinks || !selectedAccount) {
      toast({ title: "Error", description: "Please enter group links and select an account", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-groups', {
        body: { action: 'bulk_join', group_links: bulkLinks, account_id: selectedAccount, delay_seconds: 30 }
      });

      if (error) throw error;
      toast({ title: "Bulk Join Complete", description: data.message });
      setBulkLinks("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchGroups = async () => {
    if (!searchKeyword) {
      toast({ title: "Error", description: "Please enter a search keyword", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-groups', {
        body: { action: 'load_groups', keyword: searchKeyword, limit: parseInt(searchLimit) }
      });

      if (error) throw error;
      setFoundGroups(data.groups);
      toast({ title: "Search Complete", description: `Found ${data.count} groups` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeGroup = async () => {
    if (!analyzeLink) {
      toast({ title: "Error", description: "Please enter a group link", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-groups', {
        body: { action: 'analyze', group_link: analyzeLink }
      });

      if (error) throw error;
      setAnalysis(data.analysis);
      toast({ title: "Analysis Complete" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (!addMembersGroupId || !membersToAdd) {
      toast({ title: "Error", description: "Please select a group and enter members", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-groups', {
        body: { 
          action: 'add_members', 
          group_id: addMembersGroupId, 
          members: membersToAdd,
          account_ids: accounts.map(a => a.id)
        }
      });

      if (error) throw error;
      toast({ title: "Members Added", description: data.message });
      setMembersToAdd("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const { error } = await supabase.functions.invoke('telegram-groups', {
        body: { action: 'leave', group_id: groupId }
      });

      if (error) throw error;
      toast({ title: "Left Group" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Premium: Extract hidden group members
  const handleExtractHiddenMembers = async () => {
    if (!extractGroupId) {
      toast({ title: "Error", description: "Please select a group", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-groups', {
        body: { 
          action: 'extract_hidden_members', 
          group_id: extractGroupId,
          include_phones: includePhones,
          include_ids: includeIds
        }
      });

      if (error) throw error;
      setExtractedMembers(data.members);
      toast({ title: "Extraction Complete", description: `Extracted ${data.count} members` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Premium: Advanced search
  const handleAdvancedSearch = async () => {
    if (!searchKeyword) {
      toast({ title: "Error", description: "Please enter a search keyword", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-groups', {
        body: { 
          action: 'advanced_search', 
          keyword: searchKeyword,
          search_type: advancedSearchType,
          limit: parseInt(searchLimit),
          filters: {
            min_members: minMembers ? parseInt(minMembers) : undefined,
            verified_only: verifiedOnly
          }
        }
      });

      if (error) throw error;
      setAdvancedSearchResults(data.results);
      toast({ title: "Search Complete", description: `Found ${data.count} results` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Premium: Add members by username/phone
  const handleAddMembersAdvanced = async () => {
    if (!addMembersGroupId || (!usernamesToAdd && !phonesToAdd)) {
      toast({ title: "Error", description: "Please select a group and enter usernames or phone numbers", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-groups', {
        body: { 
          action: 'add_members_advanced', 
          group_id: addMembersGroupId,
          usernames: usernamesToAdd,
          phone_numbers: phonesToAdd,
          account_ids: accounts.map(a => a.id),
          delay_ms: 3000
        }
      });

      if (error) throw error;
      toast({ title: "Members Added", description: data.message });
      setUsernamesToAdd("");
      setPhonesToAdd("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Premium: Move members between groups
  const handleMoveMembers = async () => {
    if (!sourceGroupId || !targetGroupId || !membersToMove) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-groups', {
        body: { 
          action: 'move_members', 
          source_group_id: sourceGroupId,
          target_group_id: targetGroupId,
          member_ids: membersToMove,
          account_ids: accounts.map(a => a.id)
        }
      });

      if (error) throw error;
      toast({ title: "Members Moved", description: data.message });
      setMembersToMove("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Premium: Setup auto-interact
  const handleSetupAutoInteract = async () => {
    if (!autoInteractGroupId || !selectedAccount) {
      toast({ title: "Error", description: "Please select a group and account", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-groups', {
        body: { 
          action: 'auto_interact', 
          group_id: autoInteractGroupId,
          interaction_type: interactionType,
          keywords: autoInteractKeywords,
          reply_template: replyTemplate,
          account_id: selectedAccount,
          settings: {
            delay_min: 5,
            delay_max: 30,
            max_interactions_per_hour: 20
          }
        }
      });

      if (error) throw error;
      setAutoInteractStatus(data.config);
      toast({ title: "Auto-Interact Configured", description: data.message });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Premium: Stop auto-interact
  const handleStopAutoInteract = async () => {
    if (!autoInteractGroupId) return;

    try {
      const { data, error } = await supabase.functions.invoke('telegram-groups', {
        body: { action: 'stop_auto_interact', group_id: autoInteractGroupId }
      });

      if (error) throw error;
      setAutoInteractStatus(null);
      toast({ title: "Auto-Interact Stopped" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Export extracted members
  const exportMembers = () => {
    const csv = extractedMembers.map(m => 
      `${m.user_id},${m.username || ''},${m.first_name},${m.last_name || ''},${m.phone || ''},${m.status}`
    ).join('\n');
    const blob = new Blob([`user_id,username,first_name,last_name,phone,status\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegram_members_${Date.now()}.csv`;
    a.click();
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
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Telegram Group Manager</h1>
            <Badge variant="secondary" className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">Join groups, add members, search, analyze and auto-interact</p>
        </div>

          <Tabs defaultValue="join" className="space-y-6">
            <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0">
              <TabsTrigger value="join" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><LogIn className="h-4 w-4 mr-2" />Join</TabsTrigger>
              <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Search className="h-4 w-4 mr-2" />Search</TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><UserPlus className="h-4 w-4 mr-2" />Add Members</TabsTrigger>
              <TabsTrigger value="analyze" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><BarChart3 className="h-4 w-4 mr-2" />Analyze</TabsTrigger>
              <TabsTrigger value="extract" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"><Download className="h-4 w-4 mr-2" />Extract Members</TabsTrigger>
              <TabsTrigger value="move" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"><ArrowRightLeft className="h-4 w-4 mr-2" />Move</TabsTrigger>
              <TabsTrigger value="auto-interact" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"><Zap className="h-4 w-4 mr-2" />Auto-Interact</TabsTrigger>
            </TabsList>

            <TabsContent value="join" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Join Single Group</CardTitle>
                    <CardDescription>Join a group using invite link</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Account</Label>
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
                    <div className="space-y-2">
                      <Label>Group Link</Label>
                      <Input
                        placeholder="https://t.me/joinchat/xxx or https://t.me/groupname"
                        value={joinLink}
                        onChange={(e) => setJoinLink(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleJoinGroup} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                      Join Group
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bulk Join Groups</CardTitle>
                    <CardDescription>Join multiple groups at once</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Group Links (one per line)</Label>
                      <Textarea
                        placeholder="https://t.me/group1&#10;https://t.me/group2&#10;https://t.me/joinchat/xxx"
                        rows={6}
                        value={bulkLinks}
                        onChange={(e) => setBulkLinks(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        {bulkLinks.split('\n').filter(l => l.trim()).length} groups
                      </p>
                    </div>
                    <Button onClick={handleBulkJoin} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Bulk Join
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search Groups
                  </CardTitle>
                  <CardDescription>Find groups by keyword (load up to 20k+ groups)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Search Keyword</Label>
                      <Input
                        placeholder="Enter keyword (e.g., crypto, marketing, tech)"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Limit</Label>
                      <Select value={searchLimit} onValueChange={setSearchLimit}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100 groups</SelectItem>
                          <SelectItem value="500">500 groups</SelectItem>
                          <SelectItem value="1000">1,000 groups</SelectItem>
                          <SelectItem value="5000">5,000 groups</SelectItem>
                          <SelectItem value="20000">20,000 groups</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleSearchGroups} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Search Groups
                  </Button>

                  {foundGroups.length > 0 && (
                    <div className="mt-6 space-y-3 max-h-96 overflow-y-auto">
                      {foundGroups.slice(0, 50).map((group, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{group.group_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {group.member_count?.toLocaleString()} members • {group.group_type}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={group.is_public ? 'default' : 'secondary'}>
                              {group.is_public ? 'Public' : 'Private'}
                            </Badge>
                            <Button size="sm" variant="outline" asChild>
                              <a href={group.invite_link} target="_blank" rel="noopener noreferrer">
                                <Link className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                      {foundGroups.length > 50 && (
                        <p className="text-sm text-muted-foreground text-center">
                          Showing 50 of {foundGroups.length} groups
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Add Members to Group
                  </CardTitle>
                  <CardDescription>Add customers to groups with multi-number rotation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Group</Label>
                    <Select value={addMembersGroupId} onValueChange={setAddMembersGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.filter(g => g.status === 'joined').map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.group_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Members to Add (usernames or phone numbers, one per line)</Label>
                    <Textarea
                      placeholder="@username1&#10;@username2&#10;+1234567890"
                      rows={6}
                      value={membersToAdd}
                      onChange={(e) => setMembersToAdd(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      {membersToAdd.split('\n').filter(m => m.trim()).length} members • Using {accounts.length} accounts for rotation
                    </p>
                  </div>
                  <Button onClick={handleAddMembers} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Add Members
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analyze" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Group Analyzer
                  </CardTitle>
                  <CardDescription>Analyze group statistics and engagement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Enter group link or username"
                      value={analyzeLink}
                      onChange={(e) => setAnalyzeLink(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAnalyzeGroup} disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                      Analyze
                    </Button>
                  </div>

                  {analysis && (
                    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Group Name</p>
                        <p className="text-lg font-medium">{analysis.group_name}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="text-lg font-medium capitalize">{analysis.group_type}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Members</p>
                        <p className="text-lg font-medium">{analysis.member_count.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Online Now</p>
                        <p className="text-lg font-medium">{analysis.online_count.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Admins</p>
                        <p className="text-lg font-medium">{analysis.admins_count}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Messages/Day</p>
                        <p className="text-lg font-medium">{analysis.messages_per_day}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Engagement Rate</p>
                        <p className="text-lg font-medium">{analysis.engagement_rate}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Growth Rate</p>
                        <p className="text-lg font-medium">{analysis.growth_rate}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Visibility</p>
                        <p className="text-lg font-medium">{analysis.is_public ? 'Public' : 'Private'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PREMIUM: Extract Hidden Members */}
            <TabsContent value="extract" className="space-y-6">
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    Extract Hidden Group Members
                  </CardTitle>
                  <CardDescription>Extract full member data including phones, IDs, and hidden info from secret groups</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Group</Label>
                    <Select value={extractGroupId} onValueChange={setExtractGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group to extract members from" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.filter(g => g.status === 'joined').map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.group_name} ({group.member_count?.toLocaleString() || 0} members)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch checked={includePhones} onCheckedChange={setIncludePhones} />
                      <Label>Include Phone Numbers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={includeIds} onCheckedChange={setIncludeIds} />
                      <Label>Include User IDs & Access Hashes</Label>
                    </div>
                  </div>

                  <Button onClick={handleExtractHiddenMembers} disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Extract Members
                  </Button>

                  {extractedMembers.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{extractedMembers.length} members extracted</p>
                        <Button size="sm" variant="outline" onClick={exportMembers}>
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {extractedMembers.slice(0, 50).map((member, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                            <div>
                              <p className="font-medium">{member.first_name} {member.last_name || ''}</p>
                              <p className="text-muted-foreground">
                                {member.username ? `@${member.username}` : 'No username'} • {member.phone || 'No phone'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={member.status === 'online' ? 'default' : 'secondary'}>
                                {member.status}
                              </Badge>
                              {member.is_premium && <Badge className="bg-amber-500">Premium</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Advanced Add Members */}
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-amber-500" />
                    Add Members by Username/Phone
                  </CardTitle>
                  <CardDescription>Add members using usernames or phone numbers with multi-account rotation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Group</Label>
                    <Select value={addMembersGroupId} onValueChange={setAddMembersGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.filter(g => g.status === 'joined').map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.group_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Usernames (one per line)</Label>
                      <Textarea
                        placeholder="@username1&#10;@username2&#10;username3"
                        rows={6}
                        value={usernamesToAdd}
                        onChange={(e) => setUsernamesToAdd(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {usernamesToAdd.split('\n').filter(u => u.trim()).length} usernames
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Numbers (one per line)</Label>
                      <Textarea
                        placeholder="+1234567890&#10;+9876543210"
                        rows={6}
                        value={phonesToAdd}
                        onChange={(e) => setPhonesToAdd(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {phonesToAdd.split('\n').filter(p => p.trim()).length} phone numbers
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleAddMembersAdvanced} disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Add Members ({accounts.length} accounts for rotation)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PREMIUM: Move Members */}
            <TabsContent value="move" className="space-y-6">
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-amber-500" />
                    Move Members Between Groups
                  </CardTitle>
                  <CardDescription>Transfer members from one group to another</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Source Group</Label>
                      <Select value={sourceGroupId} onValueChange={setSourceGroupId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source group" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.filter(g => g.status === 'joined').map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.group_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Group</Label>
                      <Select value={targetGroupId} onValueChange={setTargetGroupId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target group" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.filter(g => g.status === 'joined').map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.group_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Members to Move (user IDs or usernames, one per line)</Label>
                    <Textarea
                      placeholder="@username1&#10;user_id_123&#10;@username2"
                      rows={6}
                      value={membersToMove}
                      onChange={(e) => setMembersToMove(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      {membersToMove.split('\n').filter(m => m.trim()).length} members to move
                    </p>
                  </div>

                  <Button onClick={handleMoveMembers} disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                    Move Members
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PREMIUM: Auto-Interact */}
            <TabsContent value="auto-interact" className="space-y-6">
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Auto-Interact with Messages
                  </CardTitle>
                  <CardDescription>Automatically react, reply, or engage with messages in groups and channels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Select Group/Channel</Label>
                      <Select value={autoInteractGroupId} onValueChange={setAutoInteractGroupId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select group or channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.filter(g => g.status === 'joined').map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.group_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Account</Label>
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

                  <div className="space-y-2">
                    <Label>Interaction Type</Label>
                    <Select value={interactionType} onValueChange={setInteractionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="react">React with Emoji</SelectItem>
                        <SelectItem value="reply">Auto-Reply</SelectItem>
                        <SelectItem value="like">Like Messages</SelectItem>
                        <SelectItem value="forward">Forward to Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Trigger Keywords (comma-separated, leave empty for all messages)</Label>
                    <Input
                      placeholder="crypto, marketing, business, offer"
                      value={autoInteractKeywords}
                      onChange={(e) => setAutoInteractKeywords(e.target.value)}
                    />
                  </div>

                  {interactionType === 'reply' && (
                    <div className="space-y-2">
                      <Label>Reply Template</Label>
                      <Textarea
                        placeholder="Thanks for sharing! 🙏&#10;&#10;Use {name} for sender's name"
                        rows={4}
                        value={replyTemplate}
                        onChange={(e) => setReplyTemplate(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleSetupAutoInteract} disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      Start Auto-Interact
                    </Button>
                    {autoInteractStatus && (
                      <Button variant="destructive" onClick={handleStopAutoInteract}>
                        Stop
                      </Button>
                    )}
                  </div>

                  {autoInteractStatus && (
                    <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="text-sm font-medium text-amber-600 mb-2">Auto-Interact Active</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Type: <span className="font-medium">{autoInteractStatus.interaction_type}</span></div>
                        <div>Status: <span className="font-medium text-green-500">{autoInteractStatus.status}</span></div>
                        <div>Delay: <span className="font-medium">{autoInteractStatus.settings?.delay_min}-{autoInteractStatus.settings?.delay_max}s</span></div>
                        <div>Max/Hour: <span className="font-medium">{autoInteractStatus.settings?.max_interactions_per_hour}</span></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Advanced Search */}
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-amber-500" />
                    Advanced Search
                  </CardTitle>
                  <CardDescription>Search groups, channels, and chats with advanced filters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Keyword</Label>
                      <Input
                        placeholder="Search keyword..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={advancedSearchType} onValueChange={setAdvancedSearchType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="group">Groups</SelectItem>
                          <SelectItem value="supergroup">Supergroups</SelectItem>
                          <SelectItem value="channel">Channels</SelectItem>
                          <SelectItem value="chat">Chats</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Limit</Label>
                      <Select value={searchLimit} onValueChange={setSearchLimit}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                          <SelectItem value="1000">1,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="space-y-2">
                      <Label>Min Members</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 1000"
                        value={minMembers}
                        onChange={(e) => setMinMembers(e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                      <Label>Verified Only</Label>
                    </div>
                  </div>

                  <Button onClick={handleAdvancedSearch} disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Search
                  </Button>

                  {advancedSearchResults.length > 0 && (
                    <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
                      {advancedSearchResults.slice(0, 50).map((result, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{result.title}</p>
                              {result.is_verified && <Badge className="bg-blue-500">Verified</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {result.member_count?.toLocaleString()} members • {result.type}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{result.type}</Badge>
                            {result.username && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={`https://t.me/${result.username}`} target="_blank" rel="noopener noreferrer">
                                  <Link className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Your Groups</CardTitle>
              <CardDescription>Groups you've joined</CardDescription>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No groups yet</p>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">{group.group_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.member_count?.toLocaleString() || 0} members • {group.group_type || 'group'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={group.status === 'joined' ? 'default' : 'secondary'}>
                          {group.status}
                        </Badge>
                        {group.status === 'joined' && (
                          <Button size="sm" variant="outline" onClick={() => handleLeaveGroup(group.id)}>
                            <LogOut className="h-4 w-4" />
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
