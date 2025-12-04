import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, LogIn, FolderOpen } from "lucide-react";
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
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    account_name: "",
    session_data: "",
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
      // Use File System Access API if available
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
        // Fallback for browsers that don't support showDirectoryPicker
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
    if (!formData.profile_path) {
      toast({
        title: "Error",
        description: "Please select or enter a folder path",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("instagram-accounts", {
        body: {
          action: "add",
          username: formData.username || formData.account_name,
          account_name: formData.account_name,
          session_data: formData.session_data,
          profile_path: formData.profile_path,
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
        session_data: "",
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
    toast({
      title: "Login to Instagram",
      description: `Please login with account: ${account.username}`,
    });
  };

  const getStatusLabel = (account: InstagramAccount) => {
    if (account.session_data) {
      return "Logged";
    }
    return "Not_logged";
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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Instagram Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Select or create a folder for this channel's profile data
                    </p>
                  </div>
                  <div>
                    <Label>Username (optional)</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <Label>Session Data (optional)</Label>
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
                  <Button onClick={handleAddAccount} className="w-full bg-[hsl(346,84%,46%)] hover:bg-[hsl(346,84%,40%)] text-white">
                    Create Channel
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
                  <TableHead className="font-semibold">Active</TableHead>
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
                      <TableCell>
                        <span className={account.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}>
                          {account.status === 'active' ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {account.profile_path || "N/A"}
                      </TableCell>
                      <TableCell>
                        <span className={account.session_data ? 'text-green-500' : 'text-orange-500'}>
                          {getStatusLabel(account)}
                        </span>
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
