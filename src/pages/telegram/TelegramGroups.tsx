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
import { Users, Search, UserPlus, BarChart3, Link, Loader2, LogIn, LogOut } from "lucide-react";

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

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Telegram Group Manager</h1>
            <p className="text-muted-foreground mt-2">Join groups, add members, search and analyze groups</p>
          </div>

          <Tabs defaultValue="join" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="join"><LogIn className="h-4 w-4 mr-2" />Join Groups</TabsTrigger>
              <TabsTrigger value="search"><Search className="h-4 w-4 mr-2" />Search</TabsTrigger>
              <TabsTrigger value="members"><UserPlus className="h-4 w-4 mr-2" />Add Members</TabsTrigger>
              <TabsTrigger value="analyze"><BarChart3 className="h-4 w-4 mr-2" />Analyze</TabsTrigger>
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
