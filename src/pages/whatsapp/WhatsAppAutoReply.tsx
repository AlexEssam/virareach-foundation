import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Plus, Trash2, Loader2, Zap, Clock, Hash } from "lucide-react";

interface AutoReply {
  id: string;
  name: string;
  trigger_type: string;
  trigger_keywords: string[] | null;
  response_content: string;
  response_media_url: string | null;
  is_active: boolean;
  trigger_count: number;
  created_at: string;
}

const triggerTypes = [
  { value: "keyword", label: "Keyword Match", icon: Hash },
  { value: "any_message", label: "Any Message", icon: MessageSquare },
  { value: "time_based", label: "Time-Based", icon: Clock },
];

export default function WhatsAppAutoReply() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rules, setRules] = useState<AutoReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("keyword");
  const [keywords, setKeywords] = useState("");
  const [responseContent, setResponseContent] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (user) {
      fetchRules();
    }
  }, [user, authLoading, navigate]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("whatsapp-autoreply", {
        body: { action: "list" },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to load auto-reply rules";

        const friendlyMessage =
          rawMessage === "Edge Function returned a non-2xx status code"
            ? "Unable to load auto-reply rules from the server right now. Please try again later."
            : rawMessage;

        throw new Error(friendlyMessage);
      }

      if (response.data?.rules) {
        setRules(response.data.rules);
      } else {
        setRules([]);
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load auto-reply rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!name.trim() || !responseContent.trim()) {
      toast({ title: "Error", description: "Name and response are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await supabase.functions.invoke("whatsapp-autoreply", {
        body: {
          action: "create",
          name,
          trigger_type: triggerType,
          trigger_keywords: triggerType === "keyword" ? keywords.split(",").map(k => k.trim()).filter(k => k) : [],
          response_content: responseContent,
        },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to create auto-reply rule";

        throw new Error(rawMessage);
      }

      toast({ title: "Auto-reply rule created" });
      setDialogOpen(false);
      setName("");
      setKeywords("");
      setResponseContent("");
      fetchRules();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create rule", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = async (id: string, isActive: boolean) => {
    try {
      const response = await supabase.functions.invoke("whatsapp-autoreply", {
        body: { action: "update", id, is_active: isActive },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to update rule";

        throw new Error(rawMessage);
      }

      fetchRules();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update rule", variant: "destructive" });
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const response = await supabase.functions.invoke("whatsapp-autoreply", {
        body: { action: "delete", id },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to delete rule";

        throw new Error(rawMessage);
      }

      toast({ title: "Rule deleted" });
      fetchRules();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete rule", variant: "destructive" });
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Auto-Reply System</h1>
              <p className="text-muted-foreground mt-1">
                Set up automatic responses to incoming messages
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Auto-Reply Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium">Rule Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Welcome Message"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Trigger Type</label>
                    <Select value={triggerType} onValueChange={setTriggerType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {triggerTypes.map((type) => (
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

                  {triggerType === "keyword" && (
                    <div>
                      <label className="text-sm font-medium">Keywords (comma separated)</label>
                      <Input
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="hello, hi, hey, info"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Response Message</label>
                    <Textarea
                      value={responseContent}
                      onChange={(e) => setResponseContent(e.target.value)}
                      placeholder="Enter the automatic response..."
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleCreateRule} disabled={saving} className="w-full">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rules.length}</p>
                  <p className="text-sm text-muted-foreground">Total Rules</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <MessageSquare className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">Active Rules</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Hash className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {rules.reduce((acc, r) => acc + r.trigger_count, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Triggers</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Reply Rules</CardTitle>
              <CardDescription>Manage your automatic response rules</CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No auto-reply rules yet. Create your first rule.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{rule.name}</span>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{rule.trigger_type}</Badge>
                        </div>
                        {rule.trigger_keywords && rule.trigger_keywords.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Keywords: {rule.trigger_keywords.join(", ")}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          Response: {rule.response_content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Triggered {rule.trigger_count} times
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}