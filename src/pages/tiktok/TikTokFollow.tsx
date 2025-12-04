import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, UserMinus, Users, Play, Upload } from "lucide-react";
import { SiTiktok } from "@icons-pack/react-simple-icons";

interface Account {
  id: string;
  username: string;
  account_name: string | null;
  status: string;
}

interface FollowAction {
  id: string;
  target_username: string;
  action_type: string;
  status: string;
  created_at: string;
}

const TikTokFollow = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [actions, setActions] = useState<FollowAction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [bulkUsernames, setBulkUsernames] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadAccounts();
      loadActions();
    }
  }, [user]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const loadAccounts = async () => {
    try {
      const response = await supabase.functions.invoke('tiktok-accounts', { body: { action: 'get_accounts' } });
      if (response.data?.accounts) setAccounts(response.data.accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadActions = async () => {
    try {
      const response = await supabase.functions.invoke('tiktok-follow', { body: { action: 'get_follow_actions' } });
      if (response.data?.actions) setActions(response.data.actions);
    } catch (error) {
      console.error('Error loading actions:', error);
    }
  };

  const handleFollow = async (actionType: 'follow_user' | 'unfollow_user') => {
    if (!selectedAccount || !targetUsername) {
      toast({ title: "Please select account and enter username", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('tiktok-follow', {
        body: { action: actionType, account_id: selectedAccount, target_username: targetUsername }
      });
      if (response.error) throw response.error;
      toast({ title: `${actionType === 'follow_user' ? 'Follow' : 'Unfollow'} action queued` });
      setTargetUsername("");
      loadActions();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = async (actionType: 'bulk_follow' | 'bulk_unfollow') => {
    if (!selectedAccount || !bulkUsernames.trim()) {
      toast({ title: "Please select account and enter usernames", variant: "destructive" });
      return;
    }
    const usernames = bulkUsernames.split('\n').map(u => u.trim()).filter(u => u);
    if (usernames.length === 0) {
      toast({ title: "No valid usernames found", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('tiktok-follow', {
        body: { action: actionType, account_id: selectedAccount, usernames }
      });
      if (response.error) throw response.error;
      toast({ title: `${usernames.length} ${actionType === 'bulk_follow' ? 'follow' : 'unfollow'} actions queued` });
      setBulkUsernames("");
      loadActions();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary", completed: "outline", failed: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <SiTiktok className="h-8 w-8" />
              Follow/Unfollow Automation
            </h1>
            <p className="text-muted-foreground mt-2">Automate following and unfollowing users</p>
          </div>

          <div className="mb-6">
            <Label>Select Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.filter(a => a.status === 'active').map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>@{acc.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="single" className="space-y-6">
            <TabsList>
              <TabsTrigger value="single">Single User</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
              <TabsTrigger value="history">Action History</TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <Card>
                <CardHeader>
                  <CardTitle>Single User Action</CardTitle>
                  <CardDescription>Follow or unfollow a specific user</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Username</Label>
                    <Input value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} placeholder="@username" />
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => handleFollow('follow_user')} disabled={isLoading} className="flex-1">
                      <UserPlus className="h-4 w-4 mr-2" />Follow
                    </Button>
                    <Button onClick={() => handleFollow('unfollow_user')} disabled={isLoading} variant="outline" className="flex-1">
                      <UserMinus className="h-4 w-4 mr-2" />Unfollow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Actions</CardTitle>
                  <CardDescription>Follow or unfollow multiple users at once</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Usernames (one per line)</Label>
                    <Textarea
                      value={bulkUsernames}
                      onChange={(e) => setBulkUsernames(e.target.value)}
                      placeholder="@user1&#10;@user2&#10;@user3"
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => handleBulkAction('bulk_follow')} disabled={isLoading} className="flex-1">
                      <UserPlus className="h-4 w-4 mr-2" />Bulk Follow
                    </Button>
                    <Button onClick={() => handleBulkAction('bulk_unfollow')} disabled={isLoading} variant="outline" className="flex-1">
                      <UserMinus className="h-4 w-4 mr-2" />Bulk Unfollow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Action History</CardTitle>
                  <CardDescription>Recent follow/unfollow actions</CardDescription>
                </CardHeader>
                <CardContent>
                  {actions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No actions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {actions.map((action) => (
                        <div key={action.id} className="border rounded-lg p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {action.action_type === 'follow' ? <UserPlus className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}
                            <div>
                              <p className="font-medium">@{action.target_username}</p>
                              <p className="text-sm text-muted-foreground capitalize">{action.action_type}</p>
                            </div>
                          </div>
                          {getStatusBadge(action.status)}
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

export default TikTokFollow;
