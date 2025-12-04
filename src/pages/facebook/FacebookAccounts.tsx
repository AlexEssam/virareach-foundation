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
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  Globe, 
  Loader2, 
  ExternalLink, 
  CheckCircle, 
  Shield, 
  Activity,
  Users,
  RefreshCw,
  MoreVertical,
  Edit2,
  Power,
  Eye,
  EyeOff,
  LogIn,
  Save,
  Play
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
  account_password: string | null;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_username: string | null;
  proxy_password: string | null;
  status: string;
  created_at: string;
}

export default function FacebookAccounts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FacebookAccount | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    accountName: "",
    email: "",
    password: "",
    proxyHost: "",
    proxyPort: "",
    proxyUsername: "",
    proxyPassword: ""
  });

  // Stats calculations
  const stats = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter(a => a.status === 'active').length,
    inactive: accounts.filter(a => a.status === 'inactive').length,
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

  const openFacebook = () => {
    window.open('https://www.facebook.com', '_blank');
    toast.info("Login to Facebook in the new window, then come back here to save your credentials");
  };

  const handleSaveAccount = async () => {
    if (!formData.accountName.trim()) {
      toast.error("Account name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!formData.password.trim()) {
      toast.error("Password is required");
      return;
    }

    setSaving(true);
    try {
      if (editingAccount) {
        const { error } = await supabase
          .from("facebook_accounts")
          .update({
            account_name: formData.accountName,
            account_email: formData.email,
            account_password: formData.password,
            proxy_host: formData.proxyHost || null,
            proxy_port: formData.proxyPort ? parseInt(formData.proxyPort) : null,
            proxy_username: formData.proxyUsername || null,
            proxy_password: formData.proxyPassword || null
          })
          .eq("id", editingAccount.id);

        if (error) throw error;
        toast.success("Account updated successfully");
      } else {
        const { error } = await supabase
          .from("facebook_accounts")
          .insert({
            user_id: user?.id,
            account_name: formData.accountName,
            account_email: formData.email,
            account_password: formData.password,
            proxy_host: formData.proxyHost || null,
            proxy_port: formData.proxyPort ? parseInt(formData.proxyPort) : null,
            proxy_username: formData.proxyUsername || null,
            proxy_password: formData.proxyPassword || null,
            status: 'active'
          });

        if (error) throw error;
        toast.success("Account saved successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      console.error("Error saving account:", error);
      toast.error(error.message || "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const handleAutoLogin = async (account: FacebookAccount) => {
    if (!account.account_email || !account.account_password) {
      toast.error("No credentials saved for this account");
      return;
    }

    setLoggingIn(account.id);
    
    // Open Facebook login page
    window.open("https://www.facebook.com/login", "_blank");
    
    // Show credentials to user for easy copy
    toast.success(
      <div className="space-y-2">
        <p className="font-medium">Facebook opened! Your credentials:</p>
        <div className="text-xs bg-background/50 p-2 rounded space-y-1">
          <p><span className="text-muted-foreground">Email:</span> {account.account_email}</p>
          <p><span className="text-muted-foreground">Password:</span> {account.account_password}</p>
        </div>
      </div>,
      { duration: 10000 }
    );

    setTimeout(() => {
      setLoggingIn(null);
    }, 2000);
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("facebook_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
      toast.success("Account deleted");
      fetchAccounts();
    } catch (error: any) {
      toast.error("Failed to delete account");
    }
  };

  const handleEditAccount = (account: FacebookAccount) => {
    setEditingAccount(account);
    setFormData({
      accountName: account.account_name,
      email: account.account_email || "",
      password: account.account_password || "",
      proxyHost: account.proxy_host || "",
      proxyPort: account.proxy_port?.toString() || "",
      proxyUsername: account.proxy_username || "",
      proxyPassword: account.proxy_password || ""
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = async (account: FacebookAccount) => {
    const newStatus = account.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from("facebook_accounts")
        .update({ status: newStatus })
        .eq("id", account.id);

      if (error) throw error;
      toast.success(`Account ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchAccounts();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      accountName: "",
      email: "",
      password: "",
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: ""
    });
    setEditingAccount(null);
    setShowPassword(false);
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
                    Save login credentials for auto-login
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
                        {editingAccount ? "Edit Account" : "Add Facebook Account"}
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        {editingAccount 
                          ? "Update your login credentials" 
                          : "Login to Facebook first, then save your credentials for auto-login"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                      {/* Step 1: Open Facebook */}
                      {!editingAccount && (
                        <div className="p-4 rounded-xl bg-[#1877F2]/5 border border-[#1877F2]/20">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-[#1877F2] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                            <span className="font-medium text-[#1877F2]">Open Facebook & Login</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Click below to open Facebook. Login with your account, then come back here.
                          </p>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={openFacebook}
                            className="w-full border-[#1877F2]/30 hover:bg-[#1877F2]/10"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Facebook Login
                          </Button>
                        </div>
                      )}

                      {/* Step 2: Save Credentials */}
                      <div className={!editingAccount ? "p-4 rounded-xl bg-muted/30 border border-border/50" : ""}>
                        {!editingAccount && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                            <span className="font-medium">Save Your Credentials</span>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="accountName">Account Name *</Label>
                            <Input
                              id="accountName"
                              placeholder="e.g., My Facebook Account"
                              value={formData.accountName}
                              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                              className="bg-background/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email / Phone *</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="bg-background/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your Facebook password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="bg-background/50 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Proxy Settings */}
                          <div className="pt-4 border-t border-border/50">
                            <div className="flex items-center gap-2 mb-3">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">Proxy Settings (Optional)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="Host"
                                value={formData.proxyHost}
                                onChange={(e) => setFormData({ ...formData, proxyHost: e.target.value })}
                                className="bg-background/50 h-9 text-sm"
                              />
                              <Input
                                placeholder="Port"
                                value={formData.proxyPort}
                                onChange={(e) => setFormData({ ...formData, proxyPort: e.target.value })}
                                className="bg-background/50 h-9 text-sm"
                              />
                              <Input
                                placeholder="Username"
                                value={formData.proxyUsername}
                                onChange={(e) => setFormData({ ...formData, proxyUsername: e.target.value })}
                                className="bg-background/50 h-9 text-sm"
                              />
                              <Input
                                type="password"
                                placeholder="Password"
                                value={formData.proxyPassword}
                                onChange={(e) => setFormData({ ...formData, proxyPassword: e.target.value })}
                                className="bg-background/50 h-9 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handleSaveAccount} 
                        disabled={saving}
                        className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingAccount ? "Update Account" : "Save Account"}
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in animation-delay-100">
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-[#1877F2]/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#1877F2]/10">
                    <Users className="h-5 w-5 text-[#1877F2]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Accounts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-green-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-orange-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/10">
                    <Activity className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
                    <p className="text-xs text-muted-foreground">Inactive</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-purple-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10">
                    <Shield className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.withProxy}</p>
                    <p className="text-xs text-muted-foreground">With Proxy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accounts Grid */}
          {accounts.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50 bg-card/30 animate-fade-in animation-delay-200">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-6 rounded-full bg-[#1877F2]/10 mb-6">
                  <SiFacebook className="h-12 w-12 text-[#1877F2]" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Accounts Added</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Add your first Facebook account to enable auto-login and manage multiple accounts.
                </p>
                <Button 
                  onClick={() => setDialogOpen(true)} 
                  className="bg-[#1877F2] hover:bg-[#1877F2]/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in animation-delay-200">
              {accounts.map((account, index) => (
                <Card 
                  key={account.id} 
                  className="group bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-[#1877F2]/30 hover:shadow-lg hover:shadow-[#1877F2]/5 transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          account.status === 'active' 
                            ? 'bg-[#1877F2]/10' 
                            : 'bg-muted'
                        }`}>
                          <SiFacebook className={`h-6 w-6 ${
                            account.status === 'active' 
                              ? 'text-[#1877F2]' 
                              : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{account.account_name}</h3>
                          <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                            {account.account_email || "No email saved"}
                          </p>
                        </div>
                      </div>
                      
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
                          <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Credentials
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(account)}>
                            <Power className="h-4 w-4 mr-2" />
                            {account.status === 'active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAccount(account.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge 
                        variant="secondary"
                        className={account.status === 'active' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-muted text-muted-foreground'
                        }
                      >
                        {account.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                      {account.proxy_host && (
                        <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                          <Shield className="h-3 w-3 mr-1" />
                          Proxy
                        </Badge>
                      )}
                      {account.account_password && (
                        <Badge variant="outline" className="text-[#1877F2] border-[#1877F2]/30">
                          <LogIn className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground mb-4">
                      Added {formatDate(account.created_at)}
                    </div>

                    <Button 
                      onClick={() => handleAutoLogin(account)}
                      disabled={loggingIn === account.id || !account.account_password}
                      className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 disabled:opacity-50"
                    >
                      {loggingIn === account.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Login to Facebook
                        </>
                      )}
                    </Button>
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
