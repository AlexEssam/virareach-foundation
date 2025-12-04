import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  Globe, 
  Loader2, 
  ExternalLink, 
  Cookie, 
  CheckCircle, 
  Shield, 
  Activity,
  Users,
  RefreshCw,
  MoreVertical,
  Edit2,
  Power
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SiFacebook } from "@icons-pack/react-simple-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  // Stats calculations
  const stats = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter(a => a.status === 'active').length,
    pending: accounts.filter(a => a.status === 'pending').length,
    withProxy: accounts.filter(a => a.proxy_host).length,
  }), [accounts]);

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

  const handleToggleStatus = async (account: FacebookAccount) => {
    const newStatus = account.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from("facebook_accounts")
        .update({ status: newStatus })
        .eq("id", account.id)
        .eq("user_id", user?.id);

      if (error) throw error;
      toast.success(`Account ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchAccounts();
    } catch (error: any) {
      toast.error("Failed to update status");
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#1877F2]/20 border-t-[#1877F2] animate-spin" />
            <SiFacebook className="absolute inset-0 m-auto h-6 w-6 text-[#1877F2]" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading accounts...</p>
        </div>
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
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1877F2] to-[#0D47A1] shadow-lg shadow-[#1877F2]/20">
                  <SiFacebook className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                    Facebook Accounts
                  </h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Manage your connected accounts and sessions
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={fetchAccounts}
                  className="border-border/50 hover:border-[#1877F2]/50 hover:bg-[#1877F2]/5"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1877F2] hover:bg-[#1877F2]/90 shadow-lg shadow-[#1877F2]/20">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg border-border/50 bg-card">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 rounded-xl bg-[#1877F2]/10">
                          <SiFacebook className="h-5 w-5 text-[#1877F2]" />
                        </div>
                        Add Facebook Account
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        {step === 'name' && "Enter your account details to get started"}
                        {step === 'login' && "Login to Facebook in the popup window"}
                        {step === 'cookies' && "Complete the setup with cookies and proxy"}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-2 py-4">
                      {['name', 'login', 'cookies'].map((s, i) => (
                        <div key={s} className="flex items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                            step === s 
                              ? 'bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/30' 
                              : i < ['name', 'login', 'cookies'].indexOf(step)
                                ? 'bg-[#1877F2]/20 text-[#1877F2]'
                                : 'bg-muted text-muted-foreground'
                          }`}>
                            {i + 1}
                          </div>
                          {i < 2 && (
                            <div className={`w-12 h-0.5 mx-1 ${
                              i < ['name', 'login', 'cookies'].indexOf(step)
                                ? 'bg-[#1877F2]'
                                : 'bg-muted'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 py-2">
                      {step === 'name' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="accountName" className="text-sm font-medium">Account Name *</Label>
                            <Input
                              id="accountName"
                              placeholder="e.g., Marketing Account"
                              value={accountName}
                              onChange={(e) => setAccountName(e.target.value)}
                              className="bg-background/50 border-border/50 focus:border-[#1877F2]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="accountEmail" className="text-sm font-medium">Account Email (Optional)</Label>
                            <Input
                              id="accountEmail"
                              type="email"
                              placeholder="email@example.com"
                              value={accountEmail}
                              onChange={(e) => setAccountEmail(e.target.value)}
                              className="bg-background/50 border-border/50 focus:border-[#1877F2]"
                            />
                          </div>
                        </div>
                      )}

                      {step === 'login' && (
                        <div className="text-center space-y-4">
                          <div className="p-8 rounded-2xl bg-gradient-to-br from-[#1877F2]/10 to-[#0D47A1]/10 border border-[#1877F2]/20">
                            <div className="w-20 h-20 rounded-full bg-[#1877F2]/10 flex items-center justify-center mx-auto mb-4">
                              <SiFacebook className="h-10 w-10 text-[#1877F2]" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Login to Facebook</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                              Open Facebook in a new window, log in to your account, then copy your session cookies.
                            </p>
                            <Button 
                              onClick={openFacebookLogin}
                              className="bg-[#1877F2] hover:bg-[#1877F2]/90 w-full"
                              size="lg"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Facebook Login
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            💡 Tip: Use a browser extension like "EditThisCookie" to export your cookies
                          </p>
                        </div>
                      )}

                      {step === 'cookies' && (
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="cookies" className="flex items-center gap-2 text-sm font-medium">
                              <Cookie className="h-4 w-4 text-[#1877F2]" />
                              Session Cookies
                            </Label>
                            <Textarea
                              id="cookies"
                              placeholder='Paste your Facebook cookies here (JSON format)...'
                              value={cookies}
                              onChange={(e) => setCookies(e.target.value)}
                              rows={3}
                              className="font-mono text-xs bg-background/50 border-border/50 focus:border-[#1877F2]"
                            />
                          </div>
                          
                          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                            <div className="flex items-center gap-2 mb-3">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Proxy Settings (Optional)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="Host"
                                value={proxyHost}
                                onChange={(e) => setProxyHost(e.target.value)}
                                className="bg-background/50 border-border/50 text-sm"
                              />
                              <Input
                                placeholder="Port"
                                value={proxyPort}
                                onChange={(e) => setProxyPort(e.target.value)}
                                className="bg-background/50 border-border/50 text-sm"
                              />
                              <Input
                                placeholder="Username"
                                value={proxyUsername}
                                onChange={(e) => setProxyUsername(e.target.value)}
                                className="bg-background/50 border-border/50 text-sm"
                              />
                              <Input
                                type="password"
                                placeholder="Password"
                                value={proxyPassword}
                                onChange={(e) => setProxyPassword(e.target.value)}
                                className="bg-background/50 border-border/50 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between gap-3 pt-4 border-t border-border/50">
                      {step !== 'name' ? (
                        <Button 
                          variant="ghost" 
                          onClick={() => setStep(step === 'cookies' ? 'login' : 'name')}
                        >
                          Back
                        </Button>
                      ) : (
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                      )}
                      
                      <div className="flex gap-2">
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
                            Continue
                          </Button>
                        )}
                        {step === 'login' && (
                          <Button 
                            variant="outline"
                            onClick={() => setStep('cookies')}
                            className="border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2]/10"
                          >
                            Next Step
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
              </div>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Card className="glass border-border/30 hover:border-[#1877F2]/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-bold mt-1">{stats.total}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1877F2]/10">
                    <Users className="h-5 w-5 text-[#1877F2]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass border-border/30 hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-500">{stats.active}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <Activity className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass border-border/30 hover:border-amber-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
                    <p className="text-2xl font-bold mt-1 text-amber-500">{stats.pending}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10">
                    <Loader2 className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass border-border/30 hover:border-purple-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">With Proxy</p>
                    <p className="text-2xl font-bold mt-1 text-purple-500">{stats.withProxy}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10">
                    <Shield className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accounts List */}
          {accounts.length === 0 ? (
            <Card className="glass border-border/30 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-[#1877F2]/20 rounded-full blur-2xl" />
                  <div className="relative p-6 rounded-full bg-gradient-to-br from-[#1877F2]/20 to-[#0D47A1]/20 border border-[#1877F2]/20">
                    <SiFacebook className="h-12 w-12 text-[#1877F2]" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">No accounts yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  Add your first Facebook account to start automating your marketing campaigns
                </p>
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="bg-[#1877F2] hover:bg-[#1877F2]/90 shadow-lg shadow-[#1877F2]/20"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {accounts.map((account, index) => (
                <Card 
                  key={account.id} 
                  className="glass border-border/30 hover:border-[#1877F2]/30 transition-all duration-300 animate-fade-in group"
                  style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`p-3 rounded-xl transition-colors ${
                            account.status === 'active' 
                              ? 'bg-gradient-to-br from-[#1877F2] to-[#0D47A1]' 
                              : 'bg-secondary'
                          }`}>
                            <SiFacebook className={`h-6 w-6 ${
                              account.status === 'active' ? 'text-white' : 'text-muted-foreground'
                            }`} />
                          </div>
                          {account.status === 'active' && (
                            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-card" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground truncate">{account.account_name}</h3>
                            <Badge 
                              className={`text-[10px] px-2 py-0 font-medium ${
                                account.status === "active" 
                                  ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" 
                                  : account.status === "banned"
                                  ? "bg-destructive/15 text-destructive border-destructive/30"
                                  : "bg-amber-500/15 text-amber-500 border-amber-500/30"
                              }`}
                            >
                              {account.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {account.account_email && (
                              <span className="text-sm text-muted-foreground truncate">
                                {account.account_email}
                              </span>
                            )}
                            {account.proxy_host && (
                              <div className="flex items-center gap-1 text-xs text-purple-400">
                                <Globe className="h-3 w-3" />
                                <span>{account.proxy_host}:{account.proxy_port}</span>
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Added {formatDate(account.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {account.cookies && (
                          <Badge variant="outline" className="hidden sm:flex text-xs gap-1 border-[#1877F2]/30 text-[#1877F2]">
                            <Cookie className="h-3 w-3" />
                            Session
                          </Badge>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2">
                              <Edit2 className="h-4 w-4" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => handleToggleStatus(account)}
                            >
                              <Power className="h-4 w-4" />
                              {account.status === 'active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="gap-2 text-destructive focus:text-destructive"
                              onClick={() => handleRemoveAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
