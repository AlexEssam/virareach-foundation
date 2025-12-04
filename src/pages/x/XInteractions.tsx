import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Repeat2, UserPlus, AlertCircle } from "lucide-react";
import { SiX } from "@icons-pack/react-simple-icons";

export default function XInteractions() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [limits, setLimits] = useState<any>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    tweet_ids: "",
    target_usernames: "",
    comment_template: "",
  });

  const fetchAccounts = async () => {
    const { data } = await supabase.functions.invoke("x-publish", {
      body: { action: "list_accounts" },
    });
    setAccounts(data?.accounts || []);
    if (data?.accounts?.length > 0) {
      setSelectedAccount(data.accounts[0].id);
    }
  };

  const fetchLimits = async () => {
    if (!selectedAccount) return;
    const { data } = await supabase.functions.invoke("x-interact", {
      body: { action: "get_limits", account_id: selectedAccount },
    });
    setLimits(data?.limits);
  };

  const fetchInteractions = async () => {
    const { data } = await supabase.functions.invoke("x-interact", {
      body: { action: "list_interactions" },
    });
    setInteractions(data?.interactions || []);
  };

  useEffect(() => {
    fetchAccounts();
    fetchInteractions();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchLimits();
    }
  }, [selectedAccount]);

  const handleAutoLike = async () => {
    setLoading(true);
    try {
      const tweetIds = formData.tweet_ids.split("\n").map((s) => s.trim()).filter(Boolean);
      
      const { data, error } = await supabase.functions.invoke("x-interact", {
        body: {
          action: "auto_like",
          account_id: selectedAccount,
          tweet_ids: tweetIds,
        },
      });

      if (error) throw error;

      toast({ title: "Like Actions Queued", description: data.message });
      setFormData({ ...formData, tweet_ids: "" });
      fetchLimits();
      fetchInteractions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRetweet = async () => {
    setLoading(true);
    try {
      const tweetIds = formData.tweet_ids.split("\n").map((s) => s.trim()).filter(Boolean);
      
      const { data, error } = await supabase.functions.invoke("x-interact", {
        body: {
          action: "auto_retweet",
          account_id: selectedAccount,
          tweet_ids: tweetIds,
        },
      });

      if (error) throw error;

      toast({ title: "Retweet Actions Queued", description: data.message });
      setFormData({ ...formData, tweet_ids: "" });
      fetchInteractions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFollow = async () => {
    setLoading(true);
    try {
      const usernames = formData.target_usernames.split("\n").map((s) => s.trim()).filter(Boolean);
      
      const { data, error } = await supabase.functions.invoke("x-interact", {
        body: {
          action: "auto_follow",
          account_id: selectedAccount,
          target_usernames: usernames,
        },
      });

      if (error) throw error;

      toast({ title: "Follow Actions Queued", description: data.message });
      setFormData({ ...formData, target_usernames: "" });
      fetchLimits();
      fetchInteractions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <SiX className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Auto-Interaction Center</h1>
              <p className="text-muted-foreground">Automate likes, retweets, comments, and follows</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Select Account</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        @{account.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {limits && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Daily Likes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(limits.daily_like.used / limits.daily_like.max) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {limits.daily_like.used} / {limits.daily_like.max}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Daily Follows
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(limits.daily_follow.used / limits.daily_follow.max) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {limits.daily_follow.used} / {limits.daily_follow.max}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Repeat2 className="h-4 w-4" />
                      Daily Retweets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Max: {limits.daily_retweet.max}</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="text-sm">
                <p className="font-medium">Anti-Ban Protection Active</p>
                <p className="text-muted-foreground">
                  15 second delay between actions. Daily limits enforced.
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="like">
            <TabsList>
              <TabsTrigger value="like">Auto-Like</TabsTrigger>
              <TabsTrigger value="retweet">Auto-Retweet</TabsTrigger>
              <TabsTrigger value="follow">Auto-Follow</TabsTrigger>
            </TabsList>

            <TabsContent value="like">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Auto-Like Tweets
                  </CardTitle>
                  <CardDescription>Automatically like multiple tweets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tweet IDs or URLs (one per line)</Label>
                    <textarea
                      className="w-full h-40 p-3 border rounded-md bg-background resize-none"
                      value={formData.tweet_ids}
                      onChange={(e) => setFormData({ ...formData, tweet_ids: e.target.value })}
                      placeholder="1234567890&#10;https://x.com/user/status/1234567890"
                    />
                  </div>
                  <Button onClick={handleAutoLike} disabled={loading || !selectedAccount}>
                    <Heart className="h-4 w-4 mr-2" />
                    {loading ? "Processing..." : "Queue Likes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="retweet">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Repeat2 className="h-5 w-5" />
                    Auto-Retweet
                  </CardTitle>
                  <CardDescription>Automatically retweet multiple posts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tweet IDs or URLs (one per line)</Label>
                    <textarea
                      className="w-full h-40 p-3 border rounded-md bg-background resize-none"
                      value={formData.tweet_ids}
                      onChange={(e) => setFormData({ ...formData, tweet_ids: e.target.value })}
                      placeholder="1234567890&#10;https://x.com/user/status/1234567890"
                    />
                  </div>
                  <Button onClick={handleAutoRetweet} disabled={loading || !selectedAccount}>
                    <Repeat2 className="h-4 w-4 mr-2" />
                    {loading ? "Processing..." : "Queue Retweets"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="follow">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Auto-Follow Users
                  </CardTitle>
                  <CardDescription>Automatically follow multiple users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Usernames (one per line)</Label>
                    <textarea
                      className="w-full h-40 p-3 border rounded-md bg-background resize-none"
                      value={formData.target_usernames}
                      onChange={(e) => setFormData({ ...formData, target_usernames: e.target.value })}
                      placeholder="username1&#10;username2&#10;username3"
                    />
                  </div>
                  <Button onClick={handleAutoFollow} disabled={loading || !selectedAccount}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {loading ? "Processing..." : "Queue Follows"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Recent Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No interactions yet</p>
              ) : (
                <div className="space-y-2">
                  {interactions.slice(0, 20).map((interaction) => (
                    <div
                      key={interaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {interaction.interaction_type === "like" && <Heart className="h-4 w-4 text-red-500" />}
                        {interaction.interaction_type === "retweet" && <Repeat2 className="h-4 w-4 text-green-500" />}
                        {interaction.interaction_type === "follow" && <UserPlus className="h-4 w-4 text-blue-500" />}
                        {interaction.interaction_type === "comment" && <MessageCircle className="h-4 w-4 text-purple-500" />}
                        <span className="capitalize">{interaction.interaction_type}</span>
                        <span className="text-sm text-muted-foreground">
                          {interaction.target_username || interaction.target_tweet_id}
                        </span>
                      </div>
                      <Badge variant={interaction.status === "completed" ? "default" : "secondary"}>
                        {interaction.status}
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
}
