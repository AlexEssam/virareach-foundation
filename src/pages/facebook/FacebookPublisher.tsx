import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Users, FileText, Share, Loader2, History, CheckCircle, XCircle } from "lucide-react";

interface Publication {
  id: string;
  publication_type: string;
  content: string | null;
  status: string;
  success_count: number;
  failure_count: number;
  created_at: string;
}

interface FacebookAccount {
  id: string;
  account_name: string;
}

const publicationTypes = [
  { value: "group_post", label: "Post to My Groups", icon: Users },
  { value: "page_wall", label: "Publish to Page Walls", icon: FileText },
  { value: "public_page", label: "Publish to Public Pages", icon: FileText },
  { value: "share_to_groups", label: "Share Posts to Groups", icon: Share },
];

export default function FacebookPublisher() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  
  // Form state
  const [publicationType, setPublicationType] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [content, setContent] = useState("");
  const [targetIds, setTargetIds] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [pubResult, accResult] = await Promise.all([
        supabase
          .from("facebook_publications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("facebook_accounts")
          .select("id, account_name")
          .eq("user_id", user.id)
          .eq("status", "active"),
      ]);

      if (pubResult.error) throw pubResult.error;
      if (accResult.error) throw accResult.error;

      setPublications(pubResult.data || []);
      setAccounts(accResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handlePublish = async () => {
    if (!publicationType) {
      toast({
        title: "Error",
        description: "Please select publication type",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter content to publish",
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const targetIdsArray = targetIds
        .split("\n")
        .map(id => id.trim())
        .filter(id => id.length > 0);

      const response = await supabase.functions.invoke("facebook-publish", {
        body: {
          publication_type: publicationType,
          account_id: selectedAccount || null,
          content,
          target_ids: targetIdsArray.length > 0 ? targetIdsArray : null,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Publication Complete",
        description: response.data.message,
      });
      
      setContent("");
      setTargetIds("");
      setPublicationType("");
      fetchData();
    } catch (error: any) {
      console.error("Error publishing:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to publish",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const found = publicationTypes.find(t => t.value === type);
    return found?.label || type;
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
          <header className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Facebook Publisher</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Publish content to groups, pages, and walls
            </p>
          </header>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Publishing Form */}
            <Card variant="glow" className="animate-fade-in">
              <CardHeader>
                <CardTitle>New Publication</CardTitle>
                <CardDescription>
                  Create and publish content to Facebook
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Publication Type</Label>
                  <Select value={publicationType} onValueChange={setPublicationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {publicationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {accounts.length > 0 && (
                  <div className="space-y-2">
                    <Label>Account (Optional)</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your post content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetIds">Target IDs (one per line)</Label>
                  <Textarea
                    id="targetIds"
                    placeholder="Group ID or Page ID&#10;Another ID&#10;..."
                    value={targetIds}
                    onChange={(e) => setTargetIds(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter target group or page IDs, one per line
                  </p>
                </div>

                <Button 
                  onClick={handlePublish} 
                  disabled={publishing}
                  className="w-full"
                  variant="hero"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publish Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <CardHeader>
                  <CardTitle>Publication Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {publicationTypes.map((type) => (
                      <div 
                        key={type.value}
                        className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center gap-3"
                      >
                        <type.icon className="h-5 w-5 text-primary" />
                        <span className="text-sm">{type.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {accounts.length === 0 && (
                <Card variant="glass" className="animate-fade-in border-yellow-500/30" style={{ animationDelay: "0.15s" }}>
                  <CardContent className="p-4">
                    <p className="text-sm text-yellow-500">
                      No active Facebook accounts. Add an account in the Accounts Manager to enable publishing.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Publications */}
          <section className="mt-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Recent Publications</h2>
            </div>

            {publications.length === 0 ? (
              <Card variant="glass">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Send className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No publications yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {publications.map((pub) => (
                  <Card key={pub.id} variant="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{getTypeLabel(pub.publication_type)}</p>
                            <Badge 
                              className={
                                pub.status === "completed" 
                                  ? "bg-primary/20 text-primary border border-primary/30" 
                                  : pub.status === "failed"
                                  ? "bg-destructive/20 text-destructive border border-destructive/30"
                                  : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                              }
                            >
                              {pub.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {pub.content || "No content"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span>{pub.success_count}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span>{pub.failure_count}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
