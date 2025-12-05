import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  Globe, 
  Loader2, 
  ExternalLink, 
  RefreshCw,
  MoreVertical,
  Edit2,
  Power,
  Eye,
  EyeOff,
  LogIn,
  User,
  Shield,
  Wifi,
  Copy
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  
  const [formData, setFormData] = useState({
    accountName: "",
    email: "",
    password: "",
    proxyHost: "",
    proxyPort: "",
    proxyUsername: "",
    proxyPassword: ""
  });

  const stats = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter(a => a.status === 'active').length,
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
    toast.info("Login to Facebook, then save your credentials here");
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    toast.success(`${name} URL copied to clipboard`);
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
        toast.success("Account updated");
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
        toast.success("Account saved");
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
      toast.error("No credentials saved");
      return;
    }

    setLoggingIn(account.id);
    window.open("https://www.facebook.com/login", "_blank");
    
    toast.success(
      <div className="space-y-1">
        <p className="font-medium">Your credentials:</p>
        <p className="text-xs opacity-80">Email: {account.account_email}</p>
        <p className="text-xs opacity-80">Password: {account.account_password}</p>
      </div>,
      { duration: 10000 }
    );

    setTimeout(() => setLoggingIn(null), 2000);
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
      toast.error("Failed to delete");
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
      toast.success(`Account ${newStatus}`);
      fetchAccounts();
    } catch (error: any) {
      toast.error("Failed to update");
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <div className="p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#1877F2]/10">
                <SiFacebook className="h-6 w-6 text-[#1877F2]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
                <p className="text-sm text-muted-foreground">Manage your Facebook accounts</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={fetchAccounts}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAccount ? "Edit Account" : "Add Account"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 pt-4">
                    {!editingAccount && (
                      <>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={openFacebook}
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Facebook to Login
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleCopyLink('https://www.facebook.com/login', 'Facebook')}
                            title="Copy Link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
                          💡 <strong>Tip:</strong> If "Open" buttons launch ChromeDriver instead of your browser, use the Copy button and paste the URL manually into Chrome/Firefox.
                        </p>
                      </>
                    )}

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Account Name</Label>
                        <Input
                          placeholder="My Account"
                          value={formData.accountName}
                          onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Email / Phone</Label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Password</Label>
                        <div className="relative mt-1">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="pr-10"
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

                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Proxy (Optional)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Host"
                            value={formData.proxyHost}
                            onChange={(e) => setFormData({ ...formData, proxyHost: e.target.value })}
                            className="h-9 text-sm"
                          />
                          <Input
                            placeholder="Port"
                            value={formData.proxyPort}
                            onChange={(e) => setFormData({ ...formData, proxyPort: e.target.value })}
                            className="h-9 text-sm"
                          />
                          <Input
                            placeholder="Username"
                            value={formData.proxyUsername}
                            onChange={(e) => setFormData({ ...formData, proxyUsername: e.target.value })}
                            className="h-9 text-sm"
                          />
                          <Input
                            type="password"
                            placeholder="Password"
                            value={formData.proxyPassword}
                            onChange={(e) => setFormData({ ...formData, proxyPassword: e.target.value })}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSaveAccount} 
                      disabled={saving}
                      className="w-full"
                    >
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingAccount ? "Update" : "Save Account"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-card border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-card border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Shield className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-card border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Wifi className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.withProxy}</p>
                  <p className="text-xs text-muted-foreground">With Proxy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Accounts List */}
          {accounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <SiFacebook className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No accounts added yet</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <Card key={account.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-[#1877F2]/10">
                          <SiFacebook className="h-5 w-5 text-[#1877F2]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{account.account_name}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              account.status === 'active' 
                                ? 'bg-green-500/10 text-green-600' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {account.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {account.account_email || "No email"}
                            {account.proxy_host && (
                              <span className="ml-2 text-xs">• Proxy: {account.proxy_host}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAutoLogin(account)}
                          disabled={loggingIn === account.id}
                        >
                          {loggingIn === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <LogIn className="h-4 w-4 mr-1.5" />
                              Login
                            </>
                          )}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-popover">
                            <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
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
                              Delete
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
