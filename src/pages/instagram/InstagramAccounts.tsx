import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, RefreshCw, Users, UserCheck } from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InstagramAccount {
  id: string;
  username: string;
  account_name: string | null;
  status: string;
  followers_count: number;
  following_count: number;
  daily_follow_count: number;
  daily_unfollow_count: number;
  daily_dm_count: number;
  proxy_host: string | null;
  created_at: string;
}

export default function InstagramAccounts() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    account_name: "",
    session_data: "",
    proxy_host: "",
    proxy_port: "",
    proxy_username: "",
    proxy_password: "",
  });

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("instagram-accounts", {
        body: { action: "list" },
      });

      if (error) throw error;
      setAccounts(data.accounts || []);
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

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("instagram-accounts", {
        body: {
          action: "add",
          username: formData.username,
          account_name: formData.account_name,
          session_data: formData.session_data,
          proxy_host: formData.proxy_host || null,
          proxy_port: formData.proxy_port ? parseInt(formData.proxy_port) : null,
          proxy_username: formData.proxy_username || null,
          proxy_password: formData.proxy_password || null,
        },
      });

      if (error) throw error;

      toast({ title: "Success", description: "Account added successfully" });
      setDialogOpen(false);
      setFormData({
        username: "",
        account_name: "",
        session_data: "",
        proxy_host: "",
        proxy_port: "",
        proxy_username: "",
        proxy_password: "",
      });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("instagram-accounts", {
        body: { action: "delete", id },
      });

      if (error) throw error;

      toast({ title: "Success", description: "Account deleted successfully" });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResetCounts = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("instagram-accounts", {
        body: { action: "reset_daily_counts", id },
      });

      if (error) throw error;

      toast({ title: "Success", description: "Daily counts reset" });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SiInstagram className="h-8 w-8" color="#E4405F" />
              <div>
                <h1 className="text-3xl font-bold">Instagram Accounts</h1>
                <p className="text-muted-foreground">Manage your Instagram accounts</p>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Instagram Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Username</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <Label>Account Name (optional)</Label>
                    <Input
                      value={formData.account_name}
                      onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                      placeholder="My Business Account"
                    />
                  </div>
                  <div>
                    <Label>Session Data</Label>
                    <Input
                      value={formData.session_data}
                      onChange={(e) => setFormData({ ...formData, session_data: e.target.value })}
                      placeholder="Session cookies or token"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Proxy Host</Label>
                      <Input
                        value={formData.proxy_host}
                        onChange={(e) => setFormData({ ...formData, proxy_host: e.target.value })}
                        placeholder="proxy.example.com"
                      />
                    </div>
                    <div>
                      <Label>Proxy Port</Label>
                      <Input
                        value={formData.proxy_port}
                        onChange={(e) => setFormData({ ...formData, proxy_port: e.target.value })}
                        placeholder="8080"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Proxy Username</Label>
                      <Input
                        value={formData.proxy_username}
                        onChange={(e) => setFormData({ ...formData, proxy_username: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Proxy Password</Label>
                      <Input
                        type="password"
                        value={formData.proxy_password}
                        onChange={(e) => setFormData({ ...formData, proxy_password: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddAccount} className="w-full">
                    Add Account
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <SiInstagram className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No Instagram accounts added yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <SiInstagram className="h-5 w-5" color="#E4405F" />
                        @{account.username}
                      </CardTitle>
                      <Badge variant={account.status === "active" ? "default" : "secondary"}>
                        {account.status}
                      </Badge>
                    </div>
                    {account.account_name && (
                      <p className="text-sm text-muted-foreground">{account.account_name}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{account.followers_count} followers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span>{account.following_count} following</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p>Daily follows: {account.daily_follow_count}/100</p>
                      <p>Daily unfollows: {account.daily_unfollow_count}/100</p>
                      <p>Daily DMs: {account.daily_dm_count}/50</p>
                    </div>

                    {account.proxy_host && (
                      <p className="text-xs text-muted-foreground">
                        Proxy: {account.proxy_host}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetCounts(account.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reset Counts
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
