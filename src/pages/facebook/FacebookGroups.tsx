import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, Search, Plus, CheckCircle, XCircle, 
  Loader2, RefreshCw, Trash2, BarChart3 
} from "lucide-react";

interface FacebookGroup {
  id: string;
  group_id: string;
  group_name: string;
  group_url: string;
  member_count: number;
  can_post: boolean;
  has_rules: boolean;
  post_restrictions: string | null;
  interests: string[];
  status: string;
  joined_at: string;
  created_at: string;
}

export default function FacebookGroups() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<FacebookGroup[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [searching, setSearching] = useState(false);
  const [groupUrls, setGroupUrls] = useState("");
  const [searchInterests, setSearchInterests] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (user) {
      fetchGroups();
    }
  }, [user, authLoading, navigate]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("facebook-groups", {
        body: { action: "list" },
      });
      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to load groups";

        throw new Error(rawMessage);
      }
      if (response.data?.groups) {
        setGroups(response.data.groups);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroups = async () => {
    const urls = groupUrls.split("\n").filter(u => u.trim());
    if (urls.length === 0) {
      toast({ title: "Error", description: "Please enter at least one group URL", variant: "destructive" });
      return;
    }

    setJoining(true);
    try {
      const response = await supabase.functions.invoke("facebook-groups", {
        body: { action: "join", group_urls: urls },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to join groups";

        throw new Error(rawMessage);
      }

      toast({
        title: "Groups Joined",
        description: response.data?.message || "Groups joined (simulation mode).",
      });

      setGroupUrls("");
      fetchGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join groups",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleSearchGroups = async () => {
    if (!searchInterests.trim()) {
      toast({ title: "Error", description: "Please enter interests to search", variant: "destructive" });
      return;
    }

    setSearching(true);
    try {
      const interests = searchInterests.split(",").map(i => i.trim()).filter(i => i);
      const response = await supabase.functions.invoke("facebook-groups", {
        body: { action: "extract", interests, limit: 20 },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to search groups";

        throw new Error(rawMessage);
      }

      setSearchResults(response.data?.groups || []);
      toast({
        title: "Search Complete",
        description: response.data?.message || "Groups search completed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search groups",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleAnalyzeGroup = async (groupId: string) => {
    try {
      const response = await supabase.functions.invoke("facebook-groups", {
        body: { action: "analyze", group_id: groupId },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to analyze group";

        throw new Error(rawMessage);
      }

      const analysis = response.data?.analysis;
      toast({
        title: "Analysis Complete",
        description: analysis
          ? `Can post: ${analysis.can_post ? "Yes" : "No"}. Activity: ${analysis.member_activity}`
          : "Analysis completed.",
      });

      fetchGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze group",
        variant: "destructive",
      });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await supabase.functions.invoke("facebook-groups", {
        body: { action: "remove", group_id: groupId },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to leave group";

        throw new Error(rawMessage);
      }

      toast({ title: "Left group successfully" });
      fetchGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to leave group",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Facebook Groups Manager</h1>
            <p className="text-muted-foreground mt-1">
              Join groups, analyze posting availability, and manage your group memberships
            </p>
          </div>

          <Tabs defaultValue="joined" className="space-y-6">
            <TabsList>
              <TabsTrigger value="joined">Joined Groups</TabsTrigger>
              <TabsTrigger value="join">Join Groups</TabsTrigger>
              <TabsTrigger value="search">Search Groups</TabsTrigger>
            </TabsList>

            <TabsContent value="joined">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Your Joined Groups</CardTitle>
                      <CardDescription>{groups.length} groups</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchGroups}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {groups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No groups joined yet. Start by joining groups in the "Join Groups" tab.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{group.group_name}</span>
                              {group.can_post ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Can Post
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Restricted
                                </Badge>
                              )}
                              {group.has_rules && (
                                <Badge variant="outline">Has Rules</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {group.member_count?.toLocaleString()} members
                              {group.post_restrictions && ` • ${group.post_restrictions}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAnalyzeGroup(group.id)}
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLeaveGroup(group.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="join">
              <Card>
                <CardHeader>
                  <CardTitle>Join Facebook Groups</CardTitle>
                  <CardDescription>Enter group URLs to automatically join them</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Group URLs (one per line)</label>
                    <Textarea
                      value={groupUrls}
                      onChange={(e) => setGroupUrls(e.target.value)}
                      placeholder="https://facebook.com/groups/example1&#10;https://facebook.com/groups/example2"
                      rows={6}
                    />
                  </div>
                  <Button onClick={handleJoinGroups} disabled={joining}>
                    {joining ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Join Groups
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search Groups by Interest</CardTitle>
                  <CardDescription>Find groups matching your target audience interests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interests (comma separated)</label>
                    <Input
                      value={searchInterests}
                      onChange={(e) => setSearchInterests(e.target.value)}
                      placeholder="marketing, business, entrepreneurship"
                    />
                  </div>
                  <Button onClick={handleSearchGroups} disabled={searching}>
                    {searching ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search Groups
                  </Button>
                </CardContent>
              </Card>

              {searchResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Search Results</CardTitle>
                    <CardDescription>{searchResults.length} groups found</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {searchResults.map((group, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <span className="font-medium">{group.group_name}</span>
                            <p className="text-sm text-muted-foreground">
                              {group.member_count?.toLocaleString()} members
                              {group.can_post && " • Can post"}
                              {group.is_public && " • Public"}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setGroupUrls(prev => prev + (prev ? "\n" : "") + group.group_url);
                              toast({ title: "Added to join list" });
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}