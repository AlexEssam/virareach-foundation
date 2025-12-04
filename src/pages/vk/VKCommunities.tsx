import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Search, Download, UserPlus } from "lucide-react";

interface Community {
  id: string;
  community_vk_id: string;
  community_name: string;
  community_type: string | null;
  member_count: number;
  description: string | null;
  is_joined: boolean;
  status: string;
  created_at: string;
}

const VKCommunities = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [communityUrl, setCommunityUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: communities, isLoading } = useQuery({
    queryKey: ["vk-communities"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("vk_communities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Community[];
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const { data, error } = await supabase.functions.invoke("vk-communities", {
        body: { action: "search", params: { query } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vk-communities"] });
      toast({ title: "Search Complete", description: `Found ${data.count} communities` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke("vk-communities", {
        body: { action: "analyze", params: { community_url: url } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vk-communities"] });
      toast({ title: "Analysis Complete", description: `Community has ${data.member_count} members` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { data, error } = await supabase.functions.invoke("vk-communities", {
        body: { action: "join", params: { community_id: communityId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vk-communities"] });
      toast({ title: "Success", description: "Joined community" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">VK</div>
            <div>
              <h1 className="text-3xl font-bold">VK Communities</h1>
              <p className="text-muted-foreground">Search, analyze, and manage VK communities</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{communities?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Communities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {communities?.filter(c => c.is_joined).length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Joined</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {communities?.reduce((sum, c) => sum + (c.member_count || 0), 0).toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Download className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {communities?.filter(c => c.status === "analyzed").length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Analyzed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="search" className="space-y-4">
            <TabsList>
              <TabsTrigger value="search">Search Communities</TabsTrigger>
              <TabsTrigger value="analyze">Analyze Community</TabsTrigger>
              <TabsTrigger value="list">My Communities</TabsTrigger>
            </TabsList>

            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" /> Search Communities
                  </CardTitle>
                  <CardDescription>Find VK communities by keyword</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Search Query</Label>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., crypto, fitness, marketing"
                    />
                  </div>
                  <Button
                    onClick={() => searchMutation.mutate(searchQuery)}
                    disabled={!searchQuery.trim() || searchMutation.isPending}
                    className="w-full"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Communities
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analyze">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" /> Analyze Community
                  </CardTitle>
                  <CardDescription>Get complete analysis of a VK community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Community URL or ID</Label>
                    <Input
                      value={communityUrl}
                      onChange={(e) => setCommunityUrl(e.target.value)}
                      placeholder="https://vk.com/community_name or club123456789"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Analysis includes: member count, activity stats, post frequency, demographics, and engagement metrics
                  </p>
                  <Button
                    onClick={() => analyzeMutation.mutate(communityUrl)}
                    disabled={!communityUrl.trim() || analyzeMutation.isPending}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Analyze Community
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle>My Communities</CardTitle>
                  <CardDescription>Communities you've discovered and analyzed</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : communities?.length === 0 ? (
                    <p className="text-muted-foreground">No communities found yet. Search or analyze some!</p>
                  ) : (
                    <div className="space-y-3">
                      {communities?.map((community) => (
                        <div key={community.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-10 w-10 text-blue-600" />
                            <div>
                              <p className="font-medium">{community.community_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {community.member_count?.toLocaleString()} members
                                {community.community_type && ` • ${community.community_type}`}
                              </p>
                              {community.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-md">
                                  {community.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={community.is_joined ? "default" : "secondary"}>
                              {community.is_joined ? "Joined" : community.status}
                            </Badge>
                            {!community.is_joined && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => joinMutation.mutate(community.community_vk_id)}
                                disabled={joinMutation.isPending}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
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
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default VKCommunities;
