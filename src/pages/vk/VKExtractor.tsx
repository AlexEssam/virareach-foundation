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
import { Download, Users, Target, Clock, UserCheck, Building2, Heart } from "lucide-react";

interface Extraction {
  id: string;
  extraction_type: string;
  interests: string | null;
  source_user_id: string | null;
  community_id: string | null;
  city: string | null;
  status: string;
  result_count: number;
  created_at: string;
}

const VKExtractor = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [interests, setInterests] = useState("");
  const [city, setCity] = useState("");
  const [sourceUserId, setSourceUserId] = useState("");
  const [communityId, setCommunityId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: extractions, isLoading } = useQuery({
    queryKey: ["vk-extractions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("vk_extractions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Extraction[];
    },
  });

  const extractMutation = useMutation({
    mutationFn: async ({ type, params }: { type: string; params: Record<string, string> }) => {
      const { data, error } = await supabase.functions.invoke("vk-extract", {
        body: { extraction_type: type, ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vk-extractions"] });
      toast({ title: "Extraction Complete", description: `Extracted ${data.result_count} users` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const extractByInterests = () => {
    if (!interests.trim()) {
      toast({ title: "Error", description: "Enter interests to search", variant: "destructive" });
      return;
    }
    extractMutation.mutate({ type: "interests", params: { interests, city } });
  };

  const extractFriends = () => {
    if (!sourceUserId.trim()) {
      toast({ title: "Error", description: "Enter a VK user ID", variant: "destructive" });
      return;
    }
    extractMutation.mutate({ type: "friends", params: { source_user_id: sourceUserId } });
  };

  const extractFriendsOfFriends = () => {
    if (!sourceUserId.trim()) {
      toast({ title: "Error", description: "Enter a VK user ID", variant: "destructive" });
      return;
    }
    extractMutation.mutate({ type: "friends_of_friends", params: { source_user_id: sourceUserId } });
  };

  const extractCommunityMembers = () => {
    if (!communityId.trim()) {
      toast({ title: "Error", description: "Enter a community ID or URL", variant: "destructive" });
      return;
    }
    extractMutation.mutate({ type: "community_members", params: { community_id: communityId } });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">VK</div>
            <div>
              <h1 className="text-3xl font-bold">VK Extractor</h1>
              <p className="text-muted-foreground">Extract detailed customer data from VKontakte</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Download className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{extractions?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Extractions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {extractions?.reduce((sum, e) => sum + (e.result_count || 0), 0) || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Users Extracted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {extractions?.filter(e => e.extraction_type === "interests").length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Interest Searches</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {extractions?.filter(e => e.extraction_type === "community_members").length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Community Extractions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="interests" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="interests">By Interests</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="fof">Friends of Friends</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="interests">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" /> Search by Interests
                  </CardTitle>
                  <CardDescription>
                    Find customers based on their interests and location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Interests (comma separated)</Label>
                    <Input
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      placeholder="music, travel, photography, fitness"
                    />
                  </div>
                  <div>
                    <Label>City (optional)</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Moscow, Saint Petersburg, etc."
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Extracts: name, ID, phone, address, education, work, marital status, gender, interests, city, place of origin
                  </p>
                  <Button onClick={extractByInterests} disabled={extractMutation.isPending} className="w-full">
                    <Target className="h-4 w-4 mr-2" />
                    Search by Interests
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="friends">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Extract Friends
                  </CardTitle>
                  <CardDescription>
                    Extract all friends from a specific VK user
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>VK User ID or Profile URL</Label>
                    <Input
                      value={sourceUserId}
                      onChange={(e) => setSourceUserId(e.target.value)}
                      placeholder="123456789 or https://vk.com/username"
                    />
                  </div>
                  <Button onClick={extractFriends} disabled={extractMutation.isPending} className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Extract Friends
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fof">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" /> Extract Friends of Friends
                  </CardTitle>
                  <CardDescription>
                    Extract second-level connections for deeper reach
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>VK User ID or Profile URL</Label>
                    <Input
                      value={sourceUserId}
                      onChange={(e) => setSourceUserId(e.target.value)}
                      placeholder="123456789 or https://vk.com/username"
                    />
                  </div>
                  <Button onClick={extractFriendsOfFriends} disabled={extractMutation.isPending} className="w-full">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Extract Friends of Friends
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="community">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> Extract Community Members
                  </CardTitle>
                  <CardDescription>
                    Extract all members from a VK community with full analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Community ID or URL</Label>
                    <Input
                      value={communityId}
                      onChange={(e) => setCommunityId(e.target.value)}
                      placeholder="club123456789 or https://vk.com/community_name"
                    />
                  </div>
                  <Button onClick={extractCommunityMembers} disabled={extractMutation.isPending} className="w-full">
                    <Building2 className="h-4 w-4 mr-2" />
                    Extract Community Members
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Extraction History</CardTitle>
              <CardDescription>Recent extraction jobs with detailed user data</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : extractions?.length === 0 ? (
                <p className="text-muted-foreground">No extractions yet</p>
              ) : (
                <div className="space-y-3">
                  {extractions?.map((extraction) => (
                    <div key={extraction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium capitalize">
                            {extraction.extraction_type.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {extraction.interests || extraction.source_user_id || extraction.community_id || "N/A"} 
                            {extraction.city && ` • ${extraction.city}`} • {extraction.result_count} users
                          </p>
                        </div>
                      </div>
                      <Badge variant={extraction.status === "completed" ? "default" : "secondary"}>
                        {extraction.status}
                      </Badge>
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
};

export default VKExtractor;
