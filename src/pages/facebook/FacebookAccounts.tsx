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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, User, Globe, Loader2, ExternalLink, LogIn, Cookie, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SiFacebook } from "@icons-pack/react-simple-icons";

interface FacebookAccount {
  id: string;
  account_name: string;
  account_email: string | null;
  proxy_host: string | null;
  proxy_port: number | null;
  status: string;
  created_at: string;
  cookies: string | null;
}

export default function FacebookAccounts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingAccount, setAddingAccount] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<'name' | 'login' | 'cookies'>('name');
  
  // Form state
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [cookies, setCookies] = useState("");
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
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const openFacebookLogin = () => {
    window.open('https://www.facebook.com/login', '_blank', 'width=600,height=700');
    setStep('cookies');
  };

  const handleAddAccount = async () => {
    if (!accountName.trim()) {
      toast.error("Account name is required");
      return;
    }

    setAddingAccount(true);
    try {
      const { error } = await supabase
        .from("facebook_accounts")
        .insert({
          user_id: user?.id,
          account_name: accountName,
          account_email: accountEmail || null,
          cookies: cookies || null,
          proxy_host: proxyHost || null,
          proxy_port: proxyPort ? parseInt(proxyPort) : null,
          proxy_username: proxyUsername || null,
          proxy_password: proxyPassword || null,
          status: cookies ? 'active' : 'pending'
        });

      if (error) throw error;

      toast.success("Account added successfully!");
      
      setDialogOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      console.error("Error adding account:", error);
      toast.error(error.message || "Failed to add account");
    } finally {
      setAddingAccount(false);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("facebook_accounts")
        .delete()
        .eq("id", accountId)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast.success("Account removed successfully");
      fetchAccounts();
    } catch (error: any) {
      console.error("Error removing account:", error);
      toast.error(error.message || "Failed to remove account");
    }
  };

  const resetForm = () => {
    setAccountName("");
    setAccountEmail("");
    setCookies("");
    setProxyHost("");
    setProxyPort("");
    setProxyUsername("");
    setProxyPassword("");
    setStep('name');
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
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#1877F2] hover:bg-[#1877F2]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <SiFacebook className="h-5 w-5 text-[#1877F2]" />
                    Add Facebook Account
                  </DialogTitle>
                  <DialogDescription>
                    {step === 'name' && "Enter your account name to get started"}
                    {step === 'login' && "Login to Facebook in the popup window"}
                    {step === 'cookies' && "Paste your Facebook cookies to complete setup"}
                  </DialogDescription>
                </DialogHeader>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className={`h-2 w-2 rounded-full ${step === 'name' ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`h-2 w-2 rounded-full ${step === 'login' ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`h-2 w-2 rounded-full ${step === 'cookies' ? 'bg-primary' : 'bg-muted'}`} />
                </div>

                <div className="space-y-4 py-4">
                  {step === 'name' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name *</Label>
                        <Input
                          id="accountName"
                          placeholder="e.g., My Facebook Account"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountEmail">Account Email (Optional)</Label>
                        <Input
                          id="accountEmail"
                          type="email"
                          placeholder="email@example.com"
                          value={accountEmail}
                          onChange={(e) => setAccountEmail(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {step === 'login' && (
                    <div className="text-center space-y-4">
                      <div className="p-6 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20">
                        <SiFacebook className="h-16 w-16 text-[#1877F2] mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Click the button below to open Facebook login in a new window. 
                          After logging in, you'll need to copy your session cookies.
                        </p>
                        <Button 
                          onClick={openFacebookLogin}
                          className="bg-[#1877F2] hover:bg-[#1877F2]/90 w-full"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Facebook Login
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use a browser extension like "EditThisCookie" to export your cookies after logging in
                      </p>
                    </div>
                  )}

                  {step === 'cookies' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="cookies" className="flex items-center gap-2">
                          <Cookie className="h-4 w-4" />
                          Session Cookies (Optional)
                        </Label>
                        <Textarea
                          id="cookies"
                          placeholder="Paste your Facebook cookies here (JSON format)..."
                          value={cookies}
                          onChange={(e) => setCookies(e.target.value)}
                          rows={4}
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Export cookies using a browser extension after logging in to Facebook
                        </p>
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
                    </>
                  )}
                </div>

                <div className="flex justify-between gap-3">
                  {step !== 'name' && (
                    <Button 
                      variant="outline" 
                      onClick={() => setStep(step === 'cookies' ? 'login' : 'name')}
                    >
                      Back
                    </Button>
                  )}
                  {step === 'name' && (
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                  )}
                  
                  <div className="flex gap-2 ml-auto">
                    {step === 'name' && (
                      <Button 
                        onClick={() => {
                          if (!accountName.trim()) {
                            toast.error("Please enter an account name");
                            return;
                          }
                          setStep('login');
                        }}
                        className="bg-[#1877F2] hover:bg-[#1877F2]/90"
                      >
                        Next
                        <LogIn className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                    {step === 'login' && (
                      <Button 
                        variant="outline"
                        onClick={() => setStep('cookies')}
                      >
                        Skip to Cookies
                      </Button>
                    )}
                    {step === 'cookies' && (
                      <Button 
                        onClick={handleAddAccount} 
                        disabled={addingAccount}
                        className="bg-[#1877F2] hover:bg-[#1877F2]/90"
                      >
                        {addingAccount ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Save Account
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </header>

          {accounts.length === 0 ? (
            <Card className="glass animate-fade-in">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-[#1877F2]/10 mb-4">
                  <SiFacebook className="h-12 w-12 text-[#1877F2]" />
                </div>
                <h3 className="text-lg font-medium mb-2">No accounts yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add your first Facebook account to get started
                </p>
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="bg-[#1877F2] hover:bg-[#1877F2]/90"
                >
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
                  className="glass animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20">
                          <SiFacebook className="h-6 w-6 text-[#1877F2]" />
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
                              ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" 
                              : account.status === "banned"
                              ? "bg-destructive/20 text-destructive border border-destructive/30"
                              : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
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
