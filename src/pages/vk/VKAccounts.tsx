import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, RefreshCw, Users, MessageSquare, UserPlus, ExternalLink, Copy } from "lucide-react";

interface Account {
  id: string;
  vk_id: string;
  username: string | null;
  account_name: string | null;
  friends_count: number;
  daily_message_count: number;
  daily_friend_request_count: number;
  status: string;
  proxy_host: string | null;
  created_at: string;
}

const VKAccounts = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bulkAccounts, setBulkAccounts] = useState("");
  const [proxyHost, setProxyHost] = useState("");
  const [proxyPort, setProxyPort] = useState("");
  const [proxyUsername, setProxyUsername] = useState("");
  const [proxyPassword, setProxyPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleOpenVK = () => {
    window.open('https://vk.com/login', '_blank');
    toast({ title: "VK Opened", description: "Login to VK, then save your credentials here" });
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: `${name} URL copied to clipboard` });
  };

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["vk-accounts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("vk_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Account[];
    },
  });

  const addAccountsMutation = useMutation({
    mutationFn: async (accountsData: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const lines = accountsData.split("\n").filter(line => line.trim());
      const accountsToInsert = lines.map(line => {
        const [vkId, username] = line.split(":").map(s => s.trim());
        return {
          user_id: user.id,
          vk_id: vkId || line.trim(),
          username: username || null,
          proxy_host: proxyHost || null,
          proxy_port: proxyPort ? parseInt(proxyPort) : null,
          proxy_username: proxyUsername || null,
          proxy_password: proxyPassword || null,
        };
      });

      const { error } = await supabase
        .from("vk_accounts")
        .insert(accountsToInsert);
      
      if (error) throw error;
      return accountsToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["vk-accounts"] });
      setBulkAccounts("");
      toast({ title: "Success", description: `Added ${count} account(s)` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("vk_accounts")
        .delete()
        .eq("id", accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vk-accounts"] });
      toast({ title: "Account deleted" });
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
              <h1 className="text-3xl font-bold">VK Accounts</h1>
              <p className="text-muted-foreground">Manage your VKontakte accounts with proxy support</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{accounts?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Accounts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {accounts?.filter(a => a.status === "active").length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {accounts?.reduce((sum, a) => sum + (a.daily_message_count || 0), 0) || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Messages Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {accounts?.reduce((sum, a) => sum + (a.daily_friend_request_count || 0), 0) || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Friend Requests Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Accounts</CardTitle>
                <CardDescription>
                  Add accounts in bulk (one per line, format: vk_id or vk_id:username)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleOpenVK} variant="outline" className="flex-1">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open VK to Login
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleCopyLink('https://vk.com/login', 'VK')}
                    title="Copy Link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
                  💡 <strong>Tip:</strong> If "Open" buttons launch ChromeDriver instead of your browser, use the Copy button and paste the URL manually into Chrome/Firefox.
                </p>
                <div>
                  <Label>Accounts (one per line)</Label>
                  <Textarea
                    value={bulkAccounts}
                    onChange={(e) => setBulkAccounts(e.target.value)}
                    placeholder="123456789&#10;987654321:username&#10;555555555"
                    rows={5}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Proxy Host</Label>
                    <Input
                      value={proxyHost}
                      onChange={(e) => setProxyHost(e.target.value)}
                      placeholder="proxy.example.com"
                    />
                  </div>
                  <div>
                    <Label>Proxy Port</Label>
                    <Input
                      value={proxyPort}
                      onChange={(e) => setProxyPort(e.target.value)}
                      placeholder="8080"
                      type="number"
                    />
                  </div>
                  <div>
                    <Label>Proxy Username</Label>
                    <Input
                      value={proxyUsername}
                      onChange={(e) => setProxyUsername(e.target.value)}
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <Label>Proxy Password</Label>
                    <Input
                      value={proxyPassword}
                      onChange={(e) => setProxyPassword(e.target.value)}
                      placeholder="password"
                      type="password"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => addAccountsMutation.mutate(bulkAccounts)}
                  disabled={!bulkAccounts.trim() || addAccountsMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Accounts
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Accounts</CardTitle>
                <CardDescription>Manage connected VK accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading accounts...</p>
                ) : accounts?.length === 0 ? (
                  <p className="text-muted-foreground">No accounts added yet</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {accounts?.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">VK</div>
                          <div>
                            <p className="font-medium">{account.username || `ID: ${account.vk_id}`}</p>
                            <p className="text-sm text-muted-foreground">
                              {account.friends_count} friends • {account.daily_message_count} msgs today
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={account.status === "active" ? "default" : "secondary"}>
                            {account.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAccountMutation.mutate(account.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VKAccounts;
