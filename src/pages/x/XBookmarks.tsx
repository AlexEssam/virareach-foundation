import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, Play, Pause, Settings, Clock, Hash, User } from "lucide-react";
import { SiX } from "@icons-pack/react-simple-icons";

export default function XBookmarks() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [automationActive, setAutomationActive] = useState(false);
  const [bookmarkRules, setBookmarkRules] = useState<any[]>([]);
  const [recentBookmarks, setRecentBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    rule_name: "",
    keywords: "",
    from_users: "",
    min_likes: "100",
    min_retweets: "10",
    auto_bookmark: true,
  });

  const fetchAccounts = async () => {
    const { data } = await supabase.functions.invoke("x-publish", {
      body: { action: "list_accounts" },
    });
    setAccounts(data?.accounts || []);
    if (data?.accounts?.length > 0) {
      setSelectedAccount(data.accounts[0].id);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // Mock bookmark rules
    setBookmarkRules([
      { id: 1, name: "AI News", keywords: ["AI", "machine learning"], active: true, bookmarked: 156 },
      { id: 2, name: "Tech Updates", keywords: ["tech", "startup"], active: false, bookmarked: 89 },
    ]);
    // Mock recent bookmarks
    setRecentBookmarks([
      { id: 1, author: "@elonmusk", content: "Exciting AI developments...", likes: 45000, bookmarked_at: "2024-01-10" },
      { id: 2, author: "@OpenAI", content: "New model release...", likes: 32000, bookmarked_at: "2024-01-09" },
    ]);
  }, []);

  const handleCreateRule = async () => {
    setLoading(true);
    try {
      const newRule = {
        id: bookmarkRules.length + 1,
        name: formData.rule_name,
        keywords: formData.keywords.split(",").map((s) => s.trim()),
        from_users: formData.from_users.split(",").map((s) => s.trim()).filter(Boolean),
        min_likes: parseInt(formData.min_likes),
        min_retweets: parseInt(formData.min_retweets),
        active: formData.auto_bookmark,
        bookmarked: 0,
      };

      setBookmarkRules([...bookmarkRules, newRule]);
      setFormData({
        rule_name: "",
        keywords: "",
        from_users: "",
        min_likes: "100",
        min_retweets: "10",
        auto_bookmark: true,
      });

      toast({
        title: "Rule Created",
        description: `Bookmark rule "${newRule.name}" has been created`,
      });
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

  const toggleRuleActive = (ruleId: number) => {
    setBookmarkRules(
      bookmarkRules.map((rule) =>
        rule.id === ruleId ? { ...rule, active: !rule.active } : rule
      )
    );
  };

  const deleteRule = (ruleId: number) => {
    setBookmarkRules(bookmarkRules.filter((rule) => rule.id !== ruleId));
    toast({ title: "Rule Deleted" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SiX className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Bookmark Automation</h1>
                <p className="text-muted-foreground">Auto-save tweets matching your criteria</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      @{account.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={automationActive ? "destructive" : "default"}
                onClick={() => setAutomationActive(!automationActive)}
              >
                {automationActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Automation
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Automation
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  Active Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{bookmarkRules.filter((r) => r.active).length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Total Bookmarked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {bookmarkRules.reduce((sum, r) => sum + r.bookmarked, 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={automationActive ? "default" : "secondary"}>
                  {automationActive ? "Running" : "Stopped"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Create Bookmark Rule
                </CardTitle>
                <CardDescription>Define criteria for auto-bookmarking tweets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Rule Name</Label>
                  <Input
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g., AI News"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Keywords (comma separated)
                  </Label>
                  <Input
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="AI, machine learning, GPT"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    From Users (optional, comma separated)
                  </Label>
                  <Input
                    value={formData.from_users}
                    onChange={(e) => setFormData({ ...formData, from_users: e.target.value })}
                    placeholder="@elonmusk, @OpenAI"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Likes</Label>
                    <Input
                      type="number"
                      value={formData.min_likes}
                      onChange={(e) => setFormData({ ...formData, min_likes: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Min Retweets</Label>
                    <Input
                      type="number"
                      value={formData.min_retweets}
                      onChange={(e) => setFormData({ ...formData, min_retweets: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Auto-bookmark when found</Label>
                  <Switch
                    checked={formData.auto_bookmark}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_bookmark: checked })}
                  />
                </div>

                <Button onClick={handleCreateRule} disabled={loading || !formData.rule_name} className="w-full">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Rules</CardTitle>
              </CardHeader>
              <CardContent>
                {bookmarkRules.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No rules created yet</p>
                ) : (
                  <div className="space-y-3">
                    {bookmarkRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Keywords: {rule.keywords.join(", ")} • {rule.bookmarked} bookmarked
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.active}
                            onCheckedChange={() => toggleRuleActive(rule.id)}
                          />
                          <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Bookmarks</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookmarks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No bookmarks yet</p>
              ) : (
                <div className="space-y-3">
                  {recentBookmarks.map((bookmark) => (
                    <div key={bookmark.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{bookmark.author}</span>
                        <span className="text-xs text-muted-foreground">{bookmark.bookmarked_at}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{bookmark.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {bookmark.likes.toLocaleString()} likes
                      </p>
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
