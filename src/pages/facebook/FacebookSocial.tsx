import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  UserPlus, Heart, Users, MessageSquare, Trash2, Share2, 
  Loader2, AlertTriangle 
} from "lucide-react";

interface SocialAction {
  id: string;
  action_type: string;
  target_name: string;
  target_url: string;
  status: string;
  executed_at: string;
  created_at: string;
}

interface FacebookAccount {
  id: string;
  account_name: string;
  account_email: string;
  status: string;
}

const actionTypes = [
  { value: "friend_request", label: "Send Friend Requests", icon: UserPlus, description: "Send friend requests to targeted users" },
  { value: "like_page", label: "Like Pages", icon: Heart, description: "Auto-like public Facebook pages" },
  { value: "join_group", label: "Join Groups", icon: Users, description: "Automatically join Facebook groups" },
  { value: "comment", label: "Auto-Comment", icon: MessageSquare, description: "Comment on business pages" },
  { value: "invite_to_page", label: "Invite to Page", icon: Share2, description: "Invite friends to like your page" },
  { value: "invite_to_group", label: "Invite to Group", icon: Share2, description: "Invite friends to join groups" },
  { value: "mention_in_post", label: "Mention in Posts", icon: MessageSquare, description: "Mention customers in your posts" },
  { value: "delete_friends", label: "Delete All Friends", icon: Trash2, description: "Remove all friends at once", danger: true },
  { value: "delete_posts", label: "Delete All Posts", icon: Trash2, description: "Delete all posts from account", danger: true },
];

export default function FacebookSocial() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [actions, setActions] = useState<SocialAction[]>([]);
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [actionType, setActionType] = useState("friend_request");
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);
  const [targets, setTargets] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actionsRes, accountsRes] = await Promise.all([
        supabase.functions.invoke("facebook-social", { method: "GET" }),
        supabase.from("facebook_accounts").select("*").eq("status", "active"),
      ]);

      if (actionsRes.data?.actions) {
        setActions(actionsRes.data.actions);
      }
      if (accountsRes.data) {
        setAccounts(accountsRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    const isBulkDelete = ["delete_friends", "delete_posts"].includes(actionType);
    
    if (!isBulkDelete) {
      const targetList = targets.split("\n").filter(t => t.trim());
      if (targetList.length === 0) {
        toast({ title: "Error", description: "Please enter at least one target", variant: "destructive" });
        return;
      }
    }

    setExecuting(true);
    try {
      const targetList = targets.split("\n").filter(t => t.trim()).map(t => {
        const parts = t.split("|");
        return {
          url: parts[0]?.trim(),
          name: parts[1]?.trim() || parts[0]?.trim(),
        };
      });

      const { data, error } = await supabase.functions.invoke("facebook-social", {
        body: {
          action_type: actionType,
          targets: isBulkDelete ? undefined : targetList,
          account_id: selectedAccount || null,
          content: content || null,
        },
      });

      if (error) throw error;

      toast({
        title: "Action Completed",
        description: data.message,
      });

      setTargets("");
      setContent("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to execute action",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  const selectedActionInfo = actionTypes.find(a => a.value === actionType);
  const needsContent = ["comment", "mention_in_post"].includes(actionType);
  const isBulkDelete = ["delete_friends", "delete_posts"].includes(actionType);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Facebook Social Automation</h1>
            <p className="text-muted-foreground mt-1">
              Automate friend requests, page likes, group joins, and more
            </p>
          </div>

          <Tabs defaultValue="execute" className="space-y-6">
            <TabsList>
              <TabsTrigger value="execute">Execute Actions</TabsTrigger>
              <TabsTrigger value="history">Action History</TabsTrigger>
            </TabsList>

            <TabsContent value="execute" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Action Settings</CardTitle>
                    <CardDescription>Select the automation action to perform</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Action Type</label>
                      <Select value={actionType} onValueChange={setActionType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              <span className={action.danger ? "text-destructive" : ""}>
                                {action.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedActionInfo && (
                      <div className={`p-4 rounded-lg border ${selectedActionInfo.danger ? "border-destructive/50 bg-destructive/10" : "border-border"}`}>
                        <div className="flex items-start gap-3">
                          {selectedActionInfo.danger ? (
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                          ) : (
                            <selectedActionInfo.icon className="h-5 w-5 text-primary mt-0.5" />
                          )}
                          <div>
                            <h4 className="font-medium">{selectedActionInfo.label}</h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedActionInfo.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Facebook Account</label>
                      <Select
                        value={selectedAccount}
                        onValueChange={(val) =>
                          setSelectedAccount(val === "none" ? undefined : val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No account selected</SelectItem>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_name || account.account_email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Targets</CardTitle>
                    <CardDescription>
                      {isBulkDelete 
                        ? "This action will affect all items" 
                        : "Enter target URLs or IDs (one per line)"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isBulkDelete && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Target URLs/IDs (one per line)
                        </label>
                        <Textarea
                          value={targets}
                          onChange={(e) => setTargets(e.target.value)}
                          placeholder="https://facebook.com/profile|Name&#10;https://facebook.com/page|Page Name"
                          rows={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          Format: URL|Name (name is optional)
                        </p>
                      </div>
                    )}

                    {needsContent && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Content</label>
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Enter comment or post content..."
                          rows={3}
                        />
                      </div>
                    )}

                    {isBulkDelete && (
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50">
                        <p className="text-sm text-destructive font-medium">
                          ⚠️ Warning: This action cannot be undone!
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {actionType === "delete_friends" 
                            ? "All friends will be removed from your account."
                            : "All posts will be permanently deleted."
                          }
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleExecuteAction}
                      disabled={executing}
                      variant={selectedActionInfo?.danger ? "destructive" : "default"}
                      className="w-full"
                    >
                      {executing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : selectedActionInfo?.icon ? (
                        <selectedActionInfo.icon className="h-4 w-4 mr-2" />
                      ) : null}
                      Execute {selectedActionInfo?.label || "Action"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Available Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3">
                    {actionTypes.filter(a => !a.danger).map((action) => (
                      <div
                        key={action.value}
                        className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setActionType(action.value)}
                      >
                        <action.icon className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium">{action.label}</h4>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Action History</CardTitle>
                  <CardDescription>View your past social automation actions</CardDescription>
                </CardHeader>
                <CardContent>
                  {actions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No actions executed yet. Start automating above.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {actions.map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">
                                {action.action_type.replace(/_/g, " ")}
                              </span>
                              <Badge variant={action.status === "completed" ? "default" : action.status === "failed" ? "destructive" : "secondary"}>
                                {action.status}
                              </Badge>
                            </div>
                            {action.target_name && (
                              <p className="text-sm text-muted-foreground">
                                Target: {action.target_name}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(action.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}