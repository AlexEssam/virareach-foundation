import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, Bookmark, Clock, Shield, Loader2 } from "lucide-react";
import { SiReddit } from "@icons-pack/react-simple-icons";

interface UpvoteAction {
  id: string;
  target_post_url: string;
  action_type: string;
  status: string;
  executed_at: string | null;
  created_at: string;
}

interface SavedPost {
  id: string;
  post_url: string;
  post_title: string | null;
  subreddit: string | null;
  status: string;
  saved_at: string | null;
  created_at: string;
}

interface Account {
  id: string;
  username: string;
}

export default function RedditUpvotes() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [postUrls, setPostUrls] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [minDelay, setMinDelay] = useState(30);
  const [maxDelay, setMaxDelay] = useState(120);
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

  const { data: upvotes = [], isLoading: upvotesLoading } = useQuery({
    queryKey: ["reddit-upvotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reddit_upvotes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as UpvoteAction[];
    },
    enabled: !!user
  });

  const { data: savedPosts = [], isLoading: savedLoading } = useQuery({
    queryKey: ["reddit-saved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reddit_saved")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as SavedPost[];
    },
    enabled: !!user
  });

  const upvoteMutation = useMutation({
    mutationFn: async (actionType: "upvote" | "save") => {
      const urls = postUrls.split("\n").filter(u => u.trim());
      const actions: any[] = [];

      for (const url of urls) {
        for (const accountId of selectedAccounts) {
          if (actionType === "upvote") {
            actions.push({
              user_id: user?.id,
              account_id: accountId,
              target_post_url: url.trim(),
              action_type: "upvote",
              status: "pending"
            });
          } else {
            actions.push({
              user_id: user?.id,
              account_id: accountId,
              post_url: url.trim(),
              status: "pending"
            });
          }
        }
      }

      const table = actionType === "upvote" ? "reddit_upvotes" : "reddit_saved";
      const { data, error } = await supabase.from(table).insert(actions).select();
      if (error) throw error;

      // Simulate execution with random delays
      for (const action of data) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * (maxDelay - minDelay) * 1000 + minDelay * 1000));
        await supabase
          .from(table)
          .update({ 
            status: "completed", 
            [actionType === "upvote" ? "executed_at" : "saved_at"]: new Date().toISOString() 
          })
          .eq("id", action.id);
      }

      return data.length;
    },
    onSuccess: (count, actionType) => {
      queryClient.invalidateQueries({ queryKey: ["reddit-upvotes"] });
      queryClient.invalidateQueries({ queryKey: ["reddit-saved"] });
      setPostUrls("");
      toast({ title: `${count} ${actionType} actions completed` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const pendingUpvotes = upvotes.filter(u => u.status === "pending").length;
  const completedUpvotes = upvotes.filter(u => u.status === "completed").length;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <SiReddit className="h-8 w-8" color="#FF4500" />
              Reddit Upvotes & Saves
            </h1>
            <p className="text-muted-foreground mt-1">Auto-upvote and save posts with multiple accounts</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{selectedAccounts.length}</p>
                <p className="text-sm text-muted-foreground">Selected Accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{pendingUpvotes}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-500">{completedUpvotes}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{savedPosts.length}</p>
                <p className="text-sm text-muted-foreground">Saved Posts</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action Form */}
            <Card>
              <CardHeader>
                <CardTitle>Bulk Actions</CardTitle>
                <CardDescription>Upvote or save posts with multiple accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Account Selection */}
                <div>
                  <Label>Select Accounts (Multi-Account)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {accounts.map(account => (
                      <Button
                        key={account.id}
                        variant={selectedAccounts.includes(account.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAccount(account.id)}
                        className={selectedAccounts.includes(account.id) ? "bg-[#FF4500] hover:bg-[#E03D00]" : ""}
                      >
                        u/{account.username}
                      </Button>
                    ))}
                  </div>
                  {accounts.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">No accounts available</p>
                  )}
                </div>

                <div>
                  <Label>Post URLs (one per line)</Label>
                  <Textarea
                    value={postUrls}
                    onChange={(e) => setPostUrls(e.target.value)}
                    placeholder="https://reddit.com/r/subreddit/comments/..."
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {postUrls.split("\n").filter(u => u.trim()).length} posts × {selectedAccounts.length} accounts = {postUrls.split("\n").filter(u => u.trim()).length * selectedAccounts.length} actions
                  </p>
                </div>

                {/* Anti-Ban Settings */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#FF4500]" />
                    <span className="font-medium">Anti-Ban Delays</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Delay (sec)</Label>
                      <Input
                        type="number"
                        value={minDelay}
                        onChange={(e) => setMinDelay(parseInt(e.target.value) || 30)}
                        min={10}
                      />
                    </div>
                    <div>
                      <Label>Max Delay (sec)</Label>
                      <Input
                        type="number"
                        value={maxDelay}
                        onChange={(e) => setMaxDelay(parseInt(e.target.value) || 120)}
                        min={30}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => upvoteMutation.mutate("upvote")}
                    disabled={upvoteMutation.isPending || !postUrls.trim() || selectedAccounts.length === 0}
                    className="bg-[#FF4500] hover:bg-[#E03D00]"
                  >
                    {upvoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
                    Upvote All
                  </Button>
                  <Button 
                    onClick={() => upvoteMutation.mutate("save")}
                    disabled={upvoteMutation.isPending || !postUrls.trim() || selectedAccounts.length === 0}
                    variant="outline"
                  >
                    {upvoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
                    Save All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Action History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upvotes">
                  <TabsList className="w-full">
                    <TabsTrigger value="upvotes" className="flex-1">Upvotes</TabsTrigger>
                    <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upvotes" className="mt-4">
                    {upvotesLoading ? (
                      <p className="text-center py-4 text-muted-foreground">Loading...</p>
                    ) : upvotes.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No upvotes yet</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {upvotes.map((upvote) => (
                          <div key={upvote.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <ThumbsUp className="h-4 w-4 text-[#FF4500] shrink-0" />
                              <span className="text-sm truncate">{upvote.target_post_url}</span>
                            </div>
                            <Badge variant={upvote.status === "completed" ? "default" : "secondary"} className="ml-2">
                              {upvote.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="saved" className="mt-4">
                    {savedLoading ? (
                      <p className="text-center py-4 text-muted-foreground">Loading...</p>
                    ) : savedPosts.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No saved posts yet</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {savedPosts.map((post) => (
                          <div key={post.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Bookmark className="h-4 w-4 text-[#FF4500] shrink-0" />
                              <span className="text-sm truncate">{post.post_title || post.post_url}</span>
                            </div>
                            <Badge variant={post.status === "completed" ? "default" : "secondary"} className="ml-2">
                              {post.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}