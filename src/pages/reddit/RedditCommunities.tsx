import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, TrendingUp, Users, Loader2, UserPlus } from "lucide-react";
import { SiReddit } from "@icons-pack/react-simple-icons";

interface Community {
  id: string;
  subreddit_name: string;
  display_name: string | null;
  description: string | null;
  subscribers: number;
  active_users: number;
  category: string | null;
  is_nsfw: boolean;
  is_joined: boolean;
  status: string;
  created_at: string;
}

interface Account {
  id: string;
  username: string;
}

export default function RedditCommunities() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["reddit-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reddit_accounts")
        .select("id, username")
        .eq("status", "active");
      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user
  });

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["reddit-communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reddit_communities")
        .select("*")
        .order("subscribers", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Community[];
    },
    enabled: !!user
  });

  const extractTrendingMutation = useMutation({
    mutationFn: async () => {
      // Create extraction job
      const { data: job, error: jobError } = await supabase
        .from("reddit_extractions")
        .insert({
          user_id: user?.id,
          extraction_type: "trending_communities",
          status: "processing"
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Simulate extraction with mock data
      const mockCommunities = Array.from({ length: 20 }, (_, i) => ({
        user_id: user?.id,
        subreddit_name: `trending_sub_${i + 1}`,
        display_name: `Trending Subreddit ${i + 1}`,
        subscribers: Math.floor(Math.random() * 1000000) + 10000,
        active_users: Math.floor(Math.random() * 5000) + 100,
        category: ["Technology", "Gaming", "News", "Entertainment"][Math.floor(Math.random() * 4)],
        status: "discovered"
      }));

      const { error: insertError } = await supabase
        .from("reddit_communities")
        .insert(mockCommunities);

      if (insertError) throw insertError;

      await supabase
        .from("reddit_extractions")
        .update({ status: "completed", result_count: mockCommunities.length, completed_at: new Date().toISOString() })
        .eq("id", job.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reddit-communities"] });
      toast({ title: "Trending communities extracted!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const searchCommunitiesMutation = useMutation({
    mutationFn: async (searchKeyword: string) => {
      const { data: job, error: jobError } = await supabase
        .from("reddit_extractions")
        .insert({
          user_id: user?.id,
          extraction_type: "keyword_search",
          keyword: searchKeyword,
          status: "processing"
        })
        .select()
        .single();

      if (jobError) throw jobError;

      const mockResults = Array.from({ length: 15 }, (_, i) => ({
        user_id: user?.id,
        subreddit_name: `${searchKeyword.toLowerCase().replace(/\s/g, "")}_${i + 1}`,
        display_name: `${searchKeyword} Community ${i + 1}`,
        description: `A community about ${searchKeyword}`,
        subscribers: Math.floor(Math.random() * 500000) + 5000,
        active_users: Math.floor(Math.random() * 2000) + 50,
        category: searchKeyword,
        status: "discovered"
      }));

      await supabase.from("reddit_communities").insert(mockResults);
      await supabase
        .from("reddit_extractions")
        .update({ status: "completed", result_count: mockResults.length, completed_at: new Date().toISOString() })
        .eq("id", job.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reddit-communities"] });
      setKeyword("");
      toast({ title: "Communities found!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase
        .from("reddit_communities")
        .update({ 
          is_joined: true, 
          joined_at: new Date().toISOString(),
          account_id: selectedAccount || null 
        })
        .eq("id", communityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reddit-communities"] });
      toast({ title: "Joined community!" });
    }
  });

  const bulkJoinMutation = useMutation({
    mutationFn: async () => {
      const unjoinedIds = communities.filter(c => !c.is_joined).slice(0, 10).map(c => c.id);
      for (const id of unjoinedIds) {
        await supabase
          .from("reddit_communities")
          .update({ is_joined: true, joined_at: new Date().toISOString(), account_id: selectedAccount || null })
          .eq("id", id);
        // Random delay for anti-ban
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reddit-communities"] });
      toast({ title: "Auto-joined trending communities!" });
    }
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <SiReddit className="h-8 w-8" color="#FF4500" />
              Reddit Communities
            </h1>
            <p className="text-muted-foreground mt-1">Discover, extract, and auto-join subreddits</p>
          </div>

          <Tabs defaultValue="discover">
            <TabsList>
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="joined">Joined ({communities.filter(c => c.is_joined).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-6 mt-6">
              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#FF4500]" />
                      Extract Trending
                    </CardTitle>
                    <CardDescription>Get daily trending subreddits</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Account for Auto-Join</Label>
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>u/{a.username}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => extractTrendingMutation.mutate()}
                        disabled={extractTrendingMutation.isPending}
                        className="flex-1 bg-[#FF4500] hover:bg-[#E03D00]"
                      >
                        {extractTrendingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                        Extract Trending
                      </Button>
                      <Button 
                        onClick={() => bulkJoinMutation.mutate()}
                        disabled={bulkJoinMutation.isPending || !selectedAccount}
                        variant="outline"
                      >
                        {bulkJoinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-[#FF4500]" />
                      Search by Keyword
                    </CardTitle>
                    <CardDescription>Find communities by topic</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Keyword</Label>
                      <Input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="e.g., cryptocurrency, gaming, fitness"
                      />
                    </div>
                    <Button 
                      onClick={() => searchCommunitiesMutation.mutate(keyword)}
                      disabled={!keyword || searchCommunitiesMutation.isPending}
                      className="w-full bg-[#FF4500] hover:bg-[#E03D00]"
                    >
                      {searchCommunitiesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                      Search Communities
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Communities List */}
              <Card>
                <CardHeader>
                  <CardTitle>Discovered Communities</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-center py-8 text-muted-foreground">Loading...</p>
                  ) : communities.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No communities yet. Extract trending or search!</p>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {communities.map((community) => (
                        <div key={community.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#FF4500]/10 flex items-center justify-center">
                              <SiReddit className="h-5 w-5" color="#FF4500" />
                            </div>
                            <div>
                              <p className="font-medium">r/{community.subreddit_name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span><Users className="h-3 w-3 inline mr-1" />{community.subscribers.toLocaleString()}</span>
                                <span>•</span>
                                <span>{community.active_users.toLocaleString()} online</span>
                                {community.category && <Badge variant="outline" className="text-xs">{community.category}</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {community.is_joined ? (
                              <Badge className="bg-green-500">Joined</Badge>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => joinCommunityMutation.mutate(community.id)}
                                disabled={!selectedAccount}
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Join
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

            <TabsContent value="joined" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Joined Communities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {communities.filter(c => c.is_joined).map((community) => (
                      <div key={community.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <SiReddit className="h-5 w-5" color="#FF4500" />
                          <div>
                            <p className="font-medium">r/{community.subreddit_name}</p>
                            <p className="text-xs text-muted-foreground">{community.subscribers.toLocaleString()} members</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500">Joined</Badge>
                      </div>
                    ))}
                    {communities.filter(c => c.is_joined).length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">No joined communities yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}