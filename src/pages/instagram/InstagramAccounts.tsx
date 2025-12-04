import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, LogIn, FolderOpen, Eye, EyeOff, UserPlus, ChevronDown, Settings } from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface InstagramAccount {
  id: string;
  username: string;
  account_name: string | null;
  account_email: string | null;
  account_password: string | null;
  status: string;
  followers_count: number;
  following_count: number;
  daily_follow_count: number;
  daily_unfollow_count: number;
  daily_dm_count: number;
  proxy_host: string | null;
  session_data: string | null;
  profile_path: string | null;
  created_at: string;
}

export default function InstagramAccounts() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [proxyOpen, setProxyOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    account_name: "",
    account_email: "",
    account_password: "",
    profile_path: "",
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

  const handleBrowseFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'documents'
        });
        setFormData({ ...formData, profile_path: dirHandle.name });
        toast({
          title: "Folder Selected",
          description: `Selected folder: ${dirHandle.name}`,
        });
      } else {
        toast({
          title: "Not Supported",
          description: "Please enter the folder path manually",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: "Error",
          description: "Failed to select folder",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddAccount = async () => {
    if (!formData.username) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("instagram-accounts", {
        body: {
          action: "add",
          username: formData.username,
          account_name: formData.account_name || formData.username,
          account_email: formData.account_email || null,
          account_password: formData.account_password || null,
          profile_path: formData.profile_path || null,
          proxy_host: formData.proxy_host || null,
          proxy_port: formData.proxy_port ? parseInt(formData.proxy_port) : null,
          proxy_username: formData.proxy_username || null,
          proxy_password: formData.proxy_password || null,
        },
      });

      if (error) throw error;

      toast({ title: "Success", description: "Channel created successfully" });
      setDialogOpen(false);
      setFormData({
        username: "",
        account_name: "",
        account_email: "",
        account_password: "",
        profile_path: "",
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

      toast({ title: "Success", description: "Channel deleted successfully" });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogin = (account: InstagramAccount) => {
    window.open("https://www.instagram.com/accounts/login/", "_blank");
    
    if (account.account_email && account.account_password) {
      toast({
        title: "Login Credentials",
        description: (
          <div className="space-y-2 mt-2">
            <p><strong>Email/Phone:</strong> {account.account_email}</p>
            <p><strong>Password:</strong> {account.account_password}</p>
          </div>
        ) as any,
        duration: 10000,
      });
    } else {
      toast({
        title: "Login to Instagram",
        description: `Please login with account: ${account.username}`,
      });
    }
  };

  const handleOpenSignUp = () => {
    window.open("https://www.instagram.com/accounts/emailsignup/", "_blank");
    toast({
      title: "Sign Up",
      description: "Instagram signup page opened. Create your account and save credentials here.",
    });
  };

  const handleOpenLogin = () => {
    window.open("https://www.instagram.com/accounts/login/", "_blank");
    toast({
      title: "Login",
      description: "Instagram login page opened. Log in and save your credentials here.",
    });
  };

  const getStatusLabel = (account: InstagramAccount) => {
    if (account.account_email && account.account_password) {
      return <Badge className="bg-green-500 hover:bg-green-600">Logged</Badge>;
    }
    return <Badge variant="secondary">Not_logged</Badge>;
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
                <p className="text-muted-foreground">Manage your Instagram channels</p>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-[hsl(346,84%,46%)] hover:bg-[hsl(346,84%,40%)] text-white">
                  <Plus className="h-4 w-4" />
                  Create Channel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Instagram Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Open Instagram Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleOpenSignUp}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Sign Up
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleOpenLogin}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      After logging into Instagram, save your credentials below:
                    </p>
                  </div>

                  <div>
                    <Label>Instagram Username *</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="@username"
                    />
                  </div>

                  <div>
                    <Label>Email / Phone Number</Label>
                    <Input
                      value={formData.account_email}
                      onChange={(e) => setFormData({ ...formData, account_email: e.target.value })}
                      placeholder="email@example.com or phone"
                    />
                  </div>

                  <div>
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.account_password}
                        onChange={(e) => setFormData({ ...formData, account_password: e.target.value })}
                        placeholder="Enter password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Channel Name</Label>
                    <Input
                      value={formData.account_name}
                      onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                      placeholder="My Business Channel"
                    />
                  </div>

                  <div>
                    <Label>Profile Folder</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.profile_path}
                        onChange={(e) => setFormData({ ...formData, profile_path: e.target.value })}
                        placeholder="C:\Users\Instagram\Profile1"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleBrowseFolder}
                        className="shrink-0"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Proxy Settings (Collapsible) */}
                  <Collapsible open={proxyOpen} onOpenChange={setProxyOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Settings className="h-4 w-4" />
                          Proxy Settings (Optional)
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${proxyOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
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
                    </CollapsibleContent>
                  </Collapsible>

                  <Button 
                    onClick={handleAddAccount} 
                    className="w-full bg-[hsl(346,84%,46%)] hover:bg-[hsl(346,84%,40%)] text-white"
                  >
                    Save Channel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16 font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Channels</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Path</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Login</TableHead>
                  <TableHead className="font-semibold">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading channels...
                    </TableCell>
                  </TableRow>
                ) : accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <SiInstagram className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No Instagram channels added yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account, index) => (
                    <TableRow 
                      key={account.id}
                      className={`cursor-pointer transition-colors ${selectedId === account.id ? 'bg-primary/20' : 'hover:bg-muted/50'}`}
                      onClick={() => setSelectedId(account.id)}
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {account.account_name || account.username}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {account.account_email || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {account.profile_path || "N/A"}
                      </TableCell>
                      <TableCell>
                        {getStatusLabel(account)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLogin(account);
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          <LogIn className="h-4 w-4 mr-1" />
                          login
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAccount(account.id);
                          }}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
