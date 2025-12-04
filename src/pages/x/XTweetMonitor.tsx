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
import { Eye, Play, Pause, Bell, User, Hash, Clock, Zap } from "lucide-react";
import { SiX } from "@icons-pack/react-simple-icons";

export default function XTweetMonitor() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [recentTweets, setRecentTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    monitor_name: "",
    target_users: "",
    keywords: "",
    notify_on_tweet: true,
    auto_like: false,
    auto_retweet: false,
    auto_comment: false,
    comment_template: "",
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
    // Mock monitors
    setMonitors([
      { id: 1, name: "Tech Leaders", users: ["@elonmusk", "@sama"], active: true, tweets_caught: 234 },
      { id: 2, name: "Crypto Influencers", users: ["@VitalikButerin"], active: false, tweets_caught: 89 },
    ]);
    // Mock recent tweets
    setRecentTweets([
      { id: 1, author: "@elonmusk", content: "Just shipped new feature...", time: "2 min ago", actions: ["liked", "retweeted"] },
      { id: 2, author: "@sama", content: "AI is changing everything...", time: "15 min ago", actions: ["liked"] },
    ]);
  }, []);

  const handleCreateMonitor = async () => {
    setLoading(true);
    try {
      const newMonitor = {
        id: monitors.length + 1,
        name: formData.monitor_name,
        users: formData.target_users.split(",").map((s) => s.trim()).filter(Boolean),
        keywords: formData.keywords.split(",").map((s) => s.trim()).filter(Boolean),
        notify: formData.notify_on_tweet,
        auto_like: formData.auto_like,
        auto_retweet: formData.auto_retweet,
        auto_comment: formData.auto_comment,
        comment_template: formData.comment_template,
        active: true,
        tweets_caught: 0,
      };

      setMonitors([...monitors, newMonitor]);
      setFormData({
        monitor_name: "",
        target_users: "",
        keywords: "",
        notify_on_tweet: true,
        auto_like: false,
        auto_retweet: false,
        auto_comment: false,
        comment_template: "",
      });

      toast({
        title: "Monitor Created",
        description: `Now monitoring "${newMonitor.name}"`,
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

  const toggleMonitorActive = (monitorId: number) => {
    setMonitors(
      monitors.map((m) => (m.id === monitorId ? { ...m, active: !m.active } : m))
    );
  };

  const deleteMonitor = (monitorId: number) => {
    setMonitors(monitors.filter((m) => m.id !== monitorId));
    toast({ title: "Monitor Deleted" });
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
                <h1 className="text-3xl font-bold">Tweet Monitor</h1>
                <p className="text-muted-foreground">Track and auto-engage with new tweets</p>
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
                variant={monitoringActive ? "destructive" : "default"}
                onClick={() => setMonitoringActive(!monitoringActive)}
              >
                {monitoringActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Monitoring
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Monitoring
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Active Monitors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{monitors.filter((m) => m.active).length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Users Tracked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {monitors.reduce((sum, m) => sum + m.users.length, 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Tweets Caught
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {monitors.reduce((sum, m) => sum + m.tweets_caught, 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={monitoringActive ? "default" : "secondary"}>
                  {monitoringActive ? "Live" : "Paused"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Create Monitor
                </CardTitle>
                <CardDescription>Set up a new tweet monitoring rule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Monitor Name</Label>
                  <Input
                    value={formData.monitor_name}
                    onChange={(e) => setFormData({ ...formData, monitor_name: e.target.value })}
                    placeholder="e.g., Tech Leaders"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Target Users (comma separated)
                  </Label>
                  <Input
                    value={formData.target_users}
                    onChange={(e) => setFormData({ ...formData, target_users: e.target.value })}
                    placeholder="@elonmusk, @sama, @OpenAI"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Keywords Filter (optional)
                  </Label>
                  <Input
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="AI, startup, launch"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label>Notify on new tweet</Label>
                    <Switch
                      checked={formData.notify_on_tweet}
                      onCheckedChange={(checked) => setFormData({ ...formData, notify_on_tweet: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-like tweets</Label>
                    <Switch
                      checked={formData.auto_like}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_like: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-retweet</Label>
                    <Switch
                      checked={formData.auto_retweet}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_retweet: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-comment</Label>
                    <Switch
                      checked={formData.auto_comment}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_comment: checked })}
                    />
                  </div>
                </div>

                {formData.auto_comment && (
                  <div>
                    <Label>Comment Template</Label>
                    <textarea
                      className="w-full h-20 p-3 border rounded-md bg-background resize-none text-sm"
                      value={formData.comment_template}
                      onChange={(e) => setFormData({ ...formData, comment_template: e.target.value })}
                      placeholder="Great insight! 🔥 {random_emoji}"
                    />
                  </div>
                )}

                <Button onClick={handleCreateMonitor} disabled={loading || !formData.monitor_name} className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Create Monitor
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Monitors</CardTitle>
              </CardHeader>
              <CardContent>
                {monitors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No monitors created yet</p>
                ) : (
                  <div className="space-y-3">
                    {monitors.map((monitor) => (
                      <div
                        key={monitor.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{monitor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {monitor.users.join(", ")} • {monitor.tweets_caught} tweets caught
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={monitor.active}
                            onCheckedChange={() => toggleMonitorActive(monitor.id)}
                          />
                          <Button variant="ghost" size="sm" onClick={() => deleteMonitor(monitor.id)}>
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
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTweets.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentTweets.map((tweet) => (
                    <div key={tweet.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{tweet.author}</span>
                        <span className="text-xs text-muted-foreground">{tweet.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{tweet.content}</p>
                      <div className="flex gap-2">
                        {tweet.actions.map((action: string) => (
                          <Badge key={action} variant="secondary" className="text-xs">
                            {action}
                          </Badge>
                        ))}
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
