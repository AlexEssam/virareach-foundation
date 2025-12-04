import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, User, Globe, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FacebookAccount {
  id: string;
  account_name: string;
  account_email: string | null;
  proxy_host: string | null;
  proxy_port: number | null;
  status: string;
  created_at: string;
}

export default function FacebookAccounts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingAccount, setAddingAccount] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [proxyHost, setProxyHost] = useState("");
  const [proxyPort, setProxyPort] = useState("");
  const [proxyUsername, setProxyUsername] = useState("");
  const [proxyPassword, setProxyPassword] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchAccounts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("facebook_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const handleAddAccount = async () => {
    if (!accountName.trim()) {
      toast({
        title: "Error",
        description: "Account name is required",
        variant: "destructive",
      });
      return;
    }

    setAddingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("facebook-accounts", {
        body: {
          account_name: accountName,
          account_email: accountEmail || null,
          proxy_host: proxyHost || null,
          proxy_port: proxyPort ? parseInt(proxyPort) : null,
          proxy_username: proxyUsername || null,
          proxy_password: proxyPassword || null,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: "Account added successfully",
      });
      
      setDialogOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      console.error("Error adding account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add account",
        variant: "destructive",
      });
    } finally {
      setAddingAccount(false);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("facebook-accounts?action=remove", {
        body: { account_id: accountId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: "Account removed successfully",
      });
      
      fetchAccounts();
    } catch (error: any) {
      console.error("Error removing account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove account",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setAccountName("");
    setAccountEmail("");
    setProxyHost("");
    setProxyPort("");
    setProxyUsername("");
    setProxyPassword("");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <header className="mb-8 flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-gradient">Facebook Accounts</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your Facebook accounts and proxy settings
              </p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Facebook Account</DialogTitle>
                  <DialogDescription>
                    Add a new Facebook account with optional proxy configuration
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name *</Label>
                    <Input
                      id="accountName"
                      placeholder="My Facebook Account"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountEmail">Account Email</Label>
                    <Input
                      id="accountEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                    />
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Proxy Settings (Optional)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="proxyHost">Proxy Host</Label>
                        <Input
                          id="proxyHost"
                          placeholder="proxy.example.com"
                          value={proxyHost}
                          onChange={(e) => setProxyHost(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proxyPort">Proxy Port</Label>
                        <Input
                          id="proxyPort"
                          placeholder="8080"
                          value={proxyPort}
                          onChange={(e) => setProxyPort(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proxyUsername">Username</Label>
                        <Input
                          id="proxyUsername"
                          placeholder="username"
                          value={proxyUsername}
                          onChange={(e) => setProxyUsername(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proxyPassword">Password</Label>
                        <Input
                          id="proxyPassword"
                          type="password"
                          placeholder="••••••••"
                          value={proxyPassword}
                          onChange={(e) => setProxyPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAccount} disabled={addingAccount}>
                    {addingAccount && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Account
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </header>

          {accounts.length === 0 ? (
            <Card variant="glass" className="animate-fade-in">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No accounts yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add your first Facebook account to get started
                </p>
                <Button variant="glow" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account, index) => (
                <Card 
                  key={account.id} 
                  variant="glass" 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20">
                          <User className="h-6 w-6 text-[#1877F2]" />
                        </div>
                        <div>
                          <h3 className="font-medium">{account.account_name}</h3>
                          {account.account_email && (
                            <p className="text-sm text-muted-foreground">{account.account_email}</p>
                          )}
                          {account.proxy_host && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <span>{account.proxy_host}:{account.proxy_port}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={
                            account.status === "active" 
                              ? "bg-primary/20 text-primary border border-primary/30" 
                              : account.status === "banned"
                              ? "bg-destructive/20 text-destructive border border-destructive/30"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {account.status}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveAccount(account.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
