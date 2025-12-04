import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserMinus, Clock, Shield, Loader2 } from "lucide-react";
import { SiPinterest } from "@icons-pack/react-simple-icons";

interface FollowAction {
  id: string;
  target_username: string;
  action_type: string;
  status: string;
  executed_at: string | null;
  created_at: string;
}

interface Account {
  id: string;
  username: string;
  account_name: string | null;
  daily_follow_count: number;
  daily_unfollow_count: number;
}

export default function PinterestFollow() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [usernames, setUsernames] = useState("");
  const [minInterval, setMinInterval] = useState(60);
  const [maxInterval, setMaxInterval] = useState(180);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["pinterest-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pinterest_accounts")
        .select("id, username, account_name, daily_follow_count, daily_unfollow_count")
        .eq("status", "active");
      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user
  });

  const { data: followActions = [], isLoading } = useQuery({
    queryKey: ["pinterest-follows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pinterest_follows")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as FollowAction[];
    },
    enabled: !!user
  });

  const followMutation = useMutation({
    mutationFn: async (actionType: "follow" | "unfollow") => {
      const usernameList = usernames.split("\n").filter(u => u.trim());
      const actions = usernameList.map(username => ({
        user_id: user?.id,
        account_id: selectedAccount || null,
        target_username: username.trim(),
        action_type: actionType,
        status: "pending"
      }));
      
      const { error } = await supabase.from("pinterest_follows").insert(actions);
      if (error) throw error;
    },
    onSuccess: (_, actionType) => {
      queryClient.invalidateQueries({ queryKey: ["pinterest-follows"] });
      setUsernames("");
      toast({ 
        title: `${actionType === "follow" ? "Follow" : "Unfollow"} actions queued`,
        description: "Actions will be executed with safe intervals"
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleAction = (actionType: "follow" | "unfollow") => {
    if (!usernames.trim()) {
      toast({ title: "Please enter usernames", variant: "destructive" });
      return;
    }
    followMutation.mutate(actionType);
  };

  const pendingCount = followActions.filter(a => a.status === "pending").length;
  const completedCount = followActions.filter(a => a.status === "completed").length;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <SiPinterest className="h-8 w-8" color="#E60023" />
              Pinterest Follow/Unfollow
            </h1>
            <p className="text-muted-foreground mt-1">Auto-follow and unfollow with anti-ban protection</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Actions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">{completedCount}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{accounts.reduce((sum, a) => sum + a.daily_follow_count, 0)}</p>
                  <p className="text-sm text-muted-foreground">Today's Follows</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{accounts.reduce((sum, a) => sum + a.daily_unfollow_count, 0)}</p>
                  <p className="text-sm text-muted-foreground">Today's Unfollows</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action Form */}
            <Card>
              <CardHeader>
                <CardTitle>Bulk Follow/Unfollow</CardTitle>
                <CardDescription>Add usernames to follow or unfollow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Account</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          @{account.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Usernames (one per line)</Label>
                  <Textarea
                    value={usernames}
                    onChange={(e) => setUsernames(e.target.value)}
                    placeholder="user1&#10;user2&#10;user3"
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {usernames.split("\n").filter(u => u.trim()).length} usernames
                  </p>
                </div>

                {/* Anti-Ban Settings */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#E60023]" />
                    <span className="font-medium">Anti-Ban Settings</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Interval (sec)</Label>
                      <Input
                        type="number"
                        value={minInterval}
                        onChange={(e) => setMinInterval(parseInt(e.target.value) || 60)}
                        min={30}
                      />
                    </div>
                    <div>
                      <Label>Max Interval (sec)</Label>
                      <Input
                        type="number"
                        value={maxInterval}
                        onChange={(e) => setMaxInterval(parseInt(e.target.value) || 180)}
                        min={60}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleAction("follow")}
                    disabled={followMutation.isPending}
                    className="bg-[#E60023] hover:bg-[#C50020]"
                  >
                    {followMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Follow All
                  </Button>
                  <Button 
                    onClick={() => handleAction("unfollow")}
                    disabled={followMutation.isPending}
                    variant="outline"
                  >
                    {followMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserMinus className="h-4 w-4 mr-2" />
                    )}
                    Unfollow All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Action History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="w-full">
                    <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                    <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
                    <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-4">
                    <ActionList actions={followActions} isLoading={isLoading} />
                  </TabsContent>
                  <TabsContent value="pending" className="mt-4">
                    <ActionList actions={followActions.filter(a => a.status === "pending")} isLoading={isLoading} />
                  </TabsContent>
                  <TabsContent value="completed" className="mt-4">
                    <ActionList actions={followActions.filter(a => a.status === "completed")} isLoading={isLoading} />
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

function ActionList({ actions, isLoading }: { actions: FollowAction[]; isLoading: boolean }) {
  if (isLoading) {
    return <p className="text-center text-muted-foreground py-4">Loading...</p>;
  }

  if (actions.length === 0) {
    return (
      <div className="text-center py-8">
        <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-muted-foreground">No actions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {actions.map((action) => (
        <div key={action.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
          <div className="flex items-center gap-2">
            {action.action_type === "follow" ? (
              <UserPlus className="h-4 w-4 text-green-500" />
            ) : (
              <UserMinus className="h-4 w-4 text-orange-500" />
            )}
            <span className="text-sm">@{action.target_username}</span>
          </div>
          <Badge variant={action.status === "completed" ? "default" : "secondary"} className="text-xs">
            {action.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}