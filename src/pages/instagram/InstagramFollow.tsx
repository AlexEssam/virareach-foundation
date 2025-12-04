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
import { UserPlus, UserMinus, Users, AlertCircle } from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";

export default function InstagramFollow() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [limits, setLimits] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    target_usernames: "",
  });

  const fetchAccounts = async () => {
    const { data } = await supabase.functions.invoke("instagram-accounts", {
      body: { action: "list" },
    });
    setAccounts(data?.accounts || []);
    if (data?.accounts?.length > 0) {
      setSelectedAccount(data.accounts[0].id);
    }
  };

  const fetchLimits = async () => {
    if (!selectedAccount) return;
    const { data } = await supabase.functions.invoke("instagram-follow", {
      body: { action: "get_limits", account_id: selectedAccount },
    });
    setLimits(data?.limits);
  };

  const fetchActions = async () => {
    const { data } = await supabase.functions.invoke("instagram-follow", {
      body: { action: "list_actions" },
    });
    setActions(data?.actions || []);
  };

  useEffect(() => {
    fetchAccounts();
    fetchActions();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchLimits();
    }
  }, [selectedAccount]);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const usernames = formData.target_usernames.split("\n").map((s) => s.trim()).filter(Boolean);
      
      const { data, error } = await supabase.functions.invoke("instagram-follow", {
        body: {
          action: "follow",
          account_id: selectedAccount,
          target_usernames: usernames,
        },
      });

      if (error) throw error;

      toast({
        title: "Follow Actions Queued",
        description: data.message,
      });
      setFormData({ target_usernames: "" });
      fetchLimits();
      fetchActions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      const usernames = formData.target_usernames.split("\n").map((s) => s.trim()).filter(Boolean);
      
      const { data, error } = await supabase.functions.invoke("instagram-follow", {
        body: {
          action: "unfollow",
          account_id: selectedAccount,
          target_usernames: usernames,
        },
      });

      if (error) throw error;

      toast({
        title: "Unfollow Actions Queued",
        description: data.message,
      });
      setFormData({ target_usernames: "" });
      fetchLimits();
      fetchActions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetNonFollowers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("instagram-follow", {
        body: {
          action: "get_non_followers",
          account_id: selectedAccount,
        },
      });

      if (error) throw error;

      const usernames = data.non_followers.map((u: any) => u.username).join("\n");
      setFormData({ target_usernames: usernames });
      
      toast({
        title: "Non-Followers Found",
        description: `Found ${data.non_followers.length} users who don't follow back`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
            <SiInstagram className="h-8 w-8" color="#E4405F" />
            <div>
              <h1 className="text-3xl font-bold">Follow / Unfollow Center</h1>
              <p className="text-muted-foreground">Manage your Instagram following with anti-ban controls</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
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
                      <UserMinus className="h-4 w-4" />
                      Daily Unfollows
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(limits.daily_unfollow.used / limits.daily_unfollow.max) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {limits.daily_unfollow.used} / {limits.daily_unfollow.max}
                    </p>
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
                  30s delay between follows, 45s between unfollows. Max 100 actions per day.
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="follow">
            <TabsList>
              <TabsTrigger value="follow">Follow</TabsTrigger>
              <TabsTrigger value="unfollow">Unfollow</TabsTrigger>
            </TabsList>

            <TabsContent value="follow">
              <Card>
                <CardHeader>
                  <CardTitle>Follow Users</CardTitle>
                  <CardDescription>Enter usernames to follow (one per line)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Target Usernames</Label>
                    <textarea
                      className="w-full h-40 p-3 border rounded-md bg-background resize-none"
                      value={formData.target_usernames}
                      onChange={(e) => setFormData({ ...formData, target_usernames: e.target.value })}
                      placeholder="username1&#10;username2&#10;username3"
                    />
                  </div>
                  <Button onClick={handleFollow} disabled={loading || !selectedAccount}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {loading ? "Processing..." : "Queue Follow Actions"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="unfollow">
              <Card>
                <CardHeader>
                  <CardTitle>Unfollow Users</CardTitle>
                  <CardDescription>Enter usernames to unfollow or find non-followers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" onClick={handleGetNonFollowers} disabled={loading}>
                    <Users className="h-4 w-4 mr-2" />
                    Find Non-Followers
                  </Button>
                  <div>
                    <Label>Target Usernames</Label>
                    <textarea
                      className="w-full h-40 p-3 border rounded-md bg-background resize-none"
                      value={formData.target_usernames}
                      onChange={(e) => setFormData({ ...formData, target_usernames: e.target.value })}
                      placeholder="username1&#10;username2&#10;username3"
                    />
                  </div>
                  <Button onClick={handleUnfollow} disabled={loading || !selectedAccount} variant="destructive">
                    <UserMinus className="h-4 w-4 mr-2" />
                    {loading ? "Processing..." : "Queue Unfollow Actions"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Recent Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No actions yet</p>
              ) : (
                <div className="space-y-2">
                  {actions.slice(0, 20).map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {action.action_type === "follow" ? (
                          <UserPlus className="h-4 w-4 text-green-500" />
                        ) : (
                          <UserMinus className="h-4 w-4 text-red-500" />
                        )}
                        <span>@{action.target_username}</span>
                      </div>
                      <Badge variant={action.status === "completed" ? "default" : "secondary"}>
                        {action.status}
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
