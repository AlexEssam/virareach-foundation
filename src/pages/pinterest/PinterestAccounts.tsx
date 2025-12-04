import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Shield, RefreshCw, UserPlus } from "lucide-react";
import { SiPinterest } from "@icons-pack/react-simple-icons";

interface PinterestAccount {
  id: string;
  username: string;
  account_name: string | null;
  email: string | null;
  status: string;
  followers_count: number;
  following_count: number;
  boards_count: number;
  pins_count: number;
  proxy_host: string | null;
  proxy_port: number | null;
  daily_follow_count: number;
  daily_unfollow_count: number;
  daily_dm_count: number;
  created_at: string;
}

export default function PinterestAccounts() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    username: "",
    account_name: "",
    email: "",
    session_data: "",
    proxy_host: "",
    proxy_port: "",
    proxy_username: "",
    proxy_password: ""
  });
  const [bulkCount, setBulkCount] = useState(10);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["pinterest-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pinterest_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as PinterestAccount[];
    },
    enabled: !!user
  });

  const addAccountMutation = useMutation({
    mutationFn: async (accountData: typeof newAccount) => {
      const { error } = await supabase.from("pinterest_accounts").insert({
        user_id: user?.id,
        username: accountData.username,
        account_name: accountData.account_name || null,
        email: accountData.email || null,
        session_data: accountData.session_data || null,
        proxy_host: accountData.proxy_host || null,
        proxy_port: accountData.proxy_port ? parseInt(accountData.proxy_port) : null,
        proxy_username: accountData.proxy_username || null,
        proxy_password: accountData.proxy_password || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinterest-accounts"] });
      setIsAddDialogOpen(false);
      setNewAccount({ username: "", account_name: "", email: "", session_data: "", proxy_host: "", proxy_port: "", proxy_username: "", proxy_password: "" });
      toast({ title: "Account added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error adding account", description: error.message, variant: "destructive" });
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (count: number) => {
      const accounts = Array.from({ length: count }, (_, i) => ({
        user_id: user?.id,
        username: `pinterest_user_${Date.now()}_${i}`,
        account_name: `Auto Account ${i + 1}`,
        status: "pending"
      }));
      
      const { error } = await supabase.from("pinterest_accounts").insert(accounts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinterest-accounts"] });
      setIsBulkDialogOpen(false);
      toast({ title: `${bulkCount} accounts queued for creation` });
    },
    onError: (error) => {
      toast({ title: "Error creating accounts", description: error.message, variant: "destructive" });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pinterest_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinterest-accounts"] });
      toast({ title: "Account deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting account", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <SiPinterest className="h-8 w-8" color="#E60023" />
                Pinterest Account Manager
              </h1>
              <p className="text-muted-foreground mt-1">Manage multiple Pinterest accounts with proxy support</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Bulk Create
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Create Accounts</DialogTitle>
                    <DialogDescription>Auto-create multiple Pinterest accounts</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Number of Accounts</Label>
                      <Input
                        type="number"
                        value={bulkCount}
                        onChange={(e) => setBulkCount(parseInt(e.target.value) || 10)}
                        min={1}
                        max={1000}
                      />
                    </div>
                    <Button 
                      onClick={() => bulkCreateMutation.mutate(bulkCount)}
                      disabled={bulkCreateMutation.isPending}
                      className="w-full"
                    >
                      {bulkCreateMutation.isPending ? "Creating..." : `Create ${bulkCount} Accounts`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#E60023] hover:bg-[#C50020]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Pinterest Account</DialogTitle>
                    <DialogDescription>Add a new Pinterest account with optional proxy</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Username *</Label>
                        <Input
                          value={newAccount.username}
                          onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                          placeholder="username"
                        />
                      </div>
                      <div>
                        <Label>Display Name</Label>
                        <Input
                          value={newAccount.account_name}
                          onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                          placeholder="My Account"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newAccount.email}
                        onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label>Session/Cookies Data</Label>
                      <Input
                        value={newAccount.session_data}
                        onChange={(e) => setNewAccount({ ...newAccount, session_data: e.target.value })}
                        placeholder="Paste session cookies here"
                      />
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Proxy Settings (Anti-Ban)
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Proxy Host</Label>
                          <Input
                            value={newAccount.proxy_host}
                            onChange={(e) => setNewAccount({ ...newAccount, proxy_host: e.target.value })}
                            placeholder="proxy.example.com"
                          />
                        </div>
                        <div>
                          <Label>Proxy Port</Label>
                          <Input
                            value={newAccount.proxy_port}
                            onChange={(e) => setNewAccount({ ...newAccount, proxy_port: e.target.value })}
                            placeholder="8080"
                          />
                        </div>
                        <div>
                          <Label>Proxy Username</Label>
                          <Input
                            value={newAccount.proxy_username}
                            onChange={(e) => setNewAccount({ ...newAccount, proxy_username: e.target.value })}
                            placeholder="username"
                          />
                        </div>
                        <div>
                          <Label>Proxy Password</Label>
                          <Input
                            type="password"
                            value={newAccount.proxy_password}
                            onChange={(e) => setNewAccount({ ...newAccount, proxy_password: e.target.value })}
                            placeholder="password"
                          />
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => addAccountMutation.mutate(newAccount)}
                      disabled={!newAccount.username || addAccountMutation.isPending}
                      className="w-full bg-[#E60023] hover:bg-[#C50020]"
                    >
                      {addAccountMutation.isPending ? "Adding..." : "Add Account"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <p className="text-muted-foreground col-span-full text-center py-8">Loading accounts...</p>
            ) : accounts.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <SiPinterest className="h-12 w-12 mx-auto mb-4 opacity-50" color="#E60023" />
                  <p className="text-muted-foreground">No Pinterest accounts yet. Add your first account to get started.</p>
                </CardContent>
              </Card>
            ) : (
              accounts.map((account) => (
                <Card key={account.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#E60023]/10 flex items-center justify-center">
                          <SiPinterest className="h-5 w-5" color="#E60023" />
                        </div>
                        <div>
                          <CardTitle className="text-base">@{account.username}</CardTitle>
                          <CardDescription>{account.account_name || "No name"}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={account.status === "active" ? "default" : "secondary"}>
                        {account.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div className="bg-muted/50 rounded p-2 text-center">
                        <p className="font-semibold">{account.followers_count}</p>
                        <p className="text-xs text-muted-foreground">Followers</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2 text-center">
                        <p className="font-semibold">{account.following_count}</p>
                        <p className="text-xs text-muted-foreground">Following</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2 text-center">
                        <p className="font-semibold">{account.boards_count}</p>
                        <p className="text-xs text-muted-foreground">Boards</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2 text-center">
                        <p className="font-semibold">{account.pins_count}</p>
                        <p className="text-xs text-muted-foreground">Pins</p>
                      </div>
                    </div>
                    {account.proxy_host && (
                      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Proxy: {account.proxy_host}:{account.proxy_port}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteAccountMutation.mutate(account.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}