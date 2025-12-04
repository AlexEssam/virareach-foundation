import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Search, Users, LayoutGrid, BarChart3, Loader2 } from "lucide-react";
import { SiPinterest } from "@icons-pack/react-simple-icons";

interface Extraction {
  id: string;
  extraction_type: string;
  niche: string | null;
  board_url: string | null;
  source_username: string | null;
  status: string;
  result_count: number;
  analytics: any;
  created_at: string;
  completed_at: string | null;
}

export default function PinterestExtractor() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [niche, setNiche] = useState("");
  const [boardUrl, setBoardUrl] = useState("");
  const [username, setUsername] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: extractions = [], isLoading } = useQuery({
    queryKey: ["pinterest-extractions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pinterest_extractions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Extraction[];
    },
    enabled: !!user
  });

  const startExtractionMutation = useMutation({
    mutationFn: async (params: { type: string; niche?: string; boardUrl?: string; username?: string }) => {
      const { error } = await supabase.from("pinterest_extractions").insert({
        user_id: user?.id,
        extraction_type: params.type,
        niche: params.niche || null,
        board_url: params.boardUrl || null,
        source_username: params.username || null,
        status: "processing"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinterest-extractions"] });
      setNiche("");
      setBoardUrl("");
      setUsername("");
      toast({ title: "Extraction started", description: "Results will appear shortly" });
    },
    onError: (error) => {
      toast({ title: "Error starting extraction", description: error.message, variant: "destructive" });
    }
  });

  const extractUsers = () => {
    if (!niche.trim()) {
      toast({ title: "Please enter a niche", variant: "destructive" });
      return;
    }
    startExtractionMutation.mutate({ type: "niche_users", niche });
  };

  const extractBoards = () => {
    if (!niche.trim()) {
      toast({ title: "Please enter a niche", variant: "destructive" });
      return;
    }
    startExtractionMutation.mutate({ type: "niche_boards", niche });
  };

  const extractBoardCustomers = () => {
    if (!boardUrl.trim()) {
      toast({ title: "Please enter a board URL", variant: "destructive" });
      return;
    }
    startExtractionMutation.mutate({ type: "board_followers", boardUrl });
  };

  const extractUserFollowers = () => {
    if (!username.trim()) {
      toast({ title: "Please enter a username", variant: "destructive" });
      return;
    }
    startExtractionMutation.mutate({ type: "user_followers", username });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <SiPinterest className="h-8 w-8" color="#E60023" />
              Pinterest Extractor
            </h1>
            <p className="text-muted-foreground mt-1">Extract users, boards, and analytics from Pinterest</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Extract Users
              </TabsTrigger>
              <TabsTrigger value="boards" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Extract Boards
              </TabsTrigger>
              <TabsTrigger value="board-customers" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Board Customers
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Extract Users by Niche</CardTitle>
                  <CardDescription>Find Pinterest users interested in a specific niche with full profile data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Niche / Interest</Label>
                    <Input
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g., home decor, fitness, recipes"
                    />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    <p className="font-medium mb-2">Data extracted per user:</p>
                    <ul className="grid grid-cols-2 gap-1 text-muted-foreground">
                      <li>• Name</li>
                      <li>• Username</li>
                      <li>• Followers count</li>
                      <li>• Following count</li>
                      <li>• Posts/Pins count</li>
                      <li>• Profile URL</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={extractUsers}
                    disabled={startExtractionMutation.isPending}
                    className="w-full bg-[#E60023] hover:bg-[#C50020]"
                  >
                    {startExtractionMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extracting...</>
                    ) : (
                      <><Download className="h-4 w-4 mr-2" /> Extract Users</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="boards" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Extract Boards by Niche</CardTitle>
                  <CardDescription>Find and analyze Pinterest boards in your niche</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Niche / Interest</Label>
                    <Input
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g., wedding ideas, travel destinations"
                    />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    <p className="font-medium mb-2">Data extracted per board:</p>
                    <ul className="grid grid-cols-2 gap-1 text-muted-foreground">
                      <li>• Board name</li>
                      <li>• Board URL</li>
                      <li>• Owner username</li>
                      <li>• Pins count</li>
                      <li>• Followers count</li>
                      <li>• Description</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={extractBoards}
                    disabled={startExtractionMutation.isPending}
                    className="w-full bg-[#E60023] hover:bg-[#C50020]"
                  >
                    {startExtractionMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extracting...</>
                    ) : (
                      <><LayoutGrid className="h-4 w-4 mr-2" /> Extract Boards</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="board-customers" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Extract Board Followers</CardTitle>
                  <CardDescription>Get all followers of a specific Pinterest board with analytics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Board URL</Label>
                    <Input
                      value={boardUrl}
                      onChange={(e) => setBoardUrl(e.target.value)}
                      placeholder="https://pinterest.com/username/board-name"
                    />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    <p className="font-medium mb-2">Analytics generated:</p>
                    <ul className="grid grid-cols-2 gap-1 text-muted-foreground">
                      <li>• Follower demographics</li>
                      <li>• Engagement patterns</li>
                      <li>• Top interests</li>
                      <li>• Activity levels</li>
                      <li>• Geographic distribution</li>
                      <li>• Best posting times</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={extractBoardCustomers}
                    disabled={startExtractionMutation.isPending}
                    className="w-full bg-[#E60023] hover:bg-[#C50020]"
                  >
                    {startExtractionMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extracting...</>
                    ) : (
                      <><Users className="h-4 w-4 mr-2" /> Extract Board Customers</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Analytics</CardTitle>
                  <CardDescription>Deep analysis of any Pinterest user profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Username</Label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="pinterest_username"
                    />
                  </div>
                  <Button 
                    onClick={extractUserFollowers}
                    disabled={startExtractionMutation.isPending}
                    className="w-full bg-[#E60023] hover:bg-[#C50020]"
                  >
                    {startExtractionMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                      <><BarChart3 className="h-4 w-4 mr-2" /> Analyze User</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recent Extractions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Extractions</CardTitle>
              <CardDescription>Your extraction history and results</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">Loading...</p>
              ) : extractions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No extractions yet. Start your first extraction above.</p>
              ) : (
                <div className="space-y-3">
                  {extractions.map((extraction) => (
                    <div key={extraction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-[#E60023]/10 flex items-center justify-center">
                          {extraction.extraction_type.includes("user") ? (
                            <Users className="h-5 w-5 text-[#E60023]" />
                          ) : (
                            <LayoutGrid className="h-5 w-5 text-[#E60023]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{extraction.extraction_type.replace(/_/g, " ").toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            {extraction.niche || extraction.board_url || extraction.source_username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          extraction.status === "completed" ? "default" :
                          extraction.status === "processing" ? "secondary" : "outline"
                        }>
                          {extraction.status}
                        </Badge>
                        <span className="text-sm font-medium">{extraction.result_count} results</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
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