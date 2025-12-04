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
import { Ghost, Download, Users, Target, Clock } from "lucide-react";

interface Extraction {
  id: string;
  extraction_type: string;
  niche: string | null;
  source: string | null;
  status: string;
  result_count: number;
  created_at: string;
}

const SnapchatExtractor = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [niche, setNiche] = useState("");
  const [sourceUsername, setSourceUsername] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: extractions, isLoading } = useQuery({
    queryKey: ["snapchat-extractions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("snapchat_extractions")
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
      const { data, error } = await supabase.functions.invoke("snapchat-extract", {
        body: { extraction_type: type, ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["snapchat-extractions"] });
      toast({ title: "Extraction Complete", description: `Extracted ${data.result_count} contacts` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const extractFriends = () => {
    if (!sourceUsername.trim()) {
      toast({ title: "Error", description: "Enter a username to extract friends from", variant: "destructive" });
      return;
    }
    extractMutation.mutate({ type: "friends", params: { source: sourceUsername } });
  };

  const extractNiche = () => {
    if (!niche.trim()) {
      toast({ title: "Error", description: "Enter a niche keyword", variant: "destructive" });
      return;
    }
    extractMutation.mutate({ type: "niche_customers", params: { niche } });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Ghost className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold">Snapchat Extractor</h1>
              <p className="text-muted-foreground">Extract friends and niche customers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Download className="h-8 w-8 text-yellow-500" />
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
                    <p className="text-sm text-muted-foreground">Total Contacts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {extractions?.filter(e => e.extraction_type === "niche_customers").length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Niche Extractions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="friends" className="space-y-4">
            <TabsList>
              <TabsTrigger value="friends">Extract Friends</TabsTrigger>
              <TabsTrigger value="niche">Extract by Niche</TabsTrigger>
            </TabsList>

            <TabsContent value="friends">
              <Card>
                <CardHeader>
                  <CardTitle>Extract All Friends</CardTitle>
                  <CardDescription>
                    Extract all friends from a Snapchat account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Source Username</Label>
                    <Input
                      value={sourceUsername}
                      onChange={(e) => setSourceUsername(e.target.value)}
                      placeholder="Enter Snapchat username"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter the username to extract friends from
                    </p>
                  </div>
                  <Button
                    onClick={extractFriends}
                    disabled={extractMutation.isPending}
                    className="w-full"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Extract Friends
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="niche">
              <Card>
                <CardHeader>
                  <CardTitle>Extract Niche Customers</CardTitle>
                  <CardDescription>
                    Find customers interested in a specific niche
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Niche Keyword</Label>
                    <Input
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g., fitness, crypto, fashion"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter a niche to find interested customers
                    </p>
                  </div>
                  <Button
                    onClick={extractNiche}
                    disabled={extractMutation.isPending}
                    className="w-full"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Extract Niche Customers
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Extraction History</CardTitle>
              <CardDescription>Recent extraction jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : extractions?.length === 0 ? (
                <p className="text-muted-foreground">No extractions yet</p>
              ) : (
                <div className="space-y-3">
                  {extractions?.map((extraction) => (
                    <div
                      key={extraction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium capitalize">
                            {extraction.extraction_type.replace("_", " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {extraction.niche || extraction.source || "N/A"} • {extraction.result_count} results
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

export default SnapchatExtractor;
