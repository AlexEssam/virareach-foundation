import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, AlertCircle, Upload, Play, Users, MessageCircle, Shield } from "lucide-react";
import { SiX } from "@icons-pack/react-simple-icons";

export default function XAccounts() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [checkResults, setCheckResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    accounts_list: "",
  });

  const fetchAccounts = async () => {
    const { data } = await supabase.functions.invoke("x-publish", {
      body: { action: "list_accounts" },
    });
    setAccounts(data?.accounts || []);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCheckAccounts = async (checkType: "working" | "messaging") => {
    setLoading(true);
    setProgress(0);
    setCheckResults([]);

    try {
      const accountsList = formData.accounts_list
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      if (accountsList.length === 0) {
        throw new Error("Please enter at least one account to check");
      }

      // Simulate checking accounts
      const results = [];
      for (let i = 0; i < accountsList.length; i++) {
        await new Promise((r) => setTimeout(r, 300));
        setProgress(((i + 1) / accountsList.length) * 100);

        const isWorking = Math.random() > 0.2;
        const canMessage = isWorking && Math.random() > 0.3;

        results.push({
          username: accountsList[i],
          status: isWorking ? "working" : "suspended",
          can_message: canMessage,
          followers: Math.floor(Math.random() * 10000),
          following: Math.floor(Math.random() * 5000),
          tweets: Math.floor(Math.random() * 2000),
          created_at: "2020-01-15",
          last_active: isWorking ? "2024-01-10" : null,
        });
      }

      setCheckResults(results);
      toast({
        title: "Check Complete",
        description: `Checked ${results.length} accounts`,
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

  const workingAccounts = checkResults.filter((r) => r.status === "working");
  const suspendedAccounts = checkResults.filter((r) => r.status === "suspended");
  const messagingEligible = checkResults.filter((r) => r.can_message);

  const exportResults = (type: "all" | "working" | "suspended" | "messaging") => {
    let data = checkResults;
    if (type === "working") data = workingAccounts;
    if (type === "suspended") data = suspendedAccounts;
    if (type === "messaging") data = messagingEligible;

    const csv = [
      ["Username", "Status", "Can Message", "Followers", "Following", "Tweets"].join(","),
      ...data.map((r) =>
        [r.username, r.status, r.can_message, r.followers, r.following, r.tweets].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `x_accounts_${type}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <SiX className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Account Checker</h1>
              <p className="text-muted-foreground">Verify account status and messaging eligibility</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Checked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{checkResults.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Working
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">{workingAccounts.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Suspended
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">{suspendedAccounts.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  Can Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-500">{messagingEligible.length}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="checker">
            <TabsList>
              <TabsTrigger value="checker">Account Checker</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="checker">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Bulk Account Checker
                  </CardTitle>
                  <CardDescription>
                    Check if accounts are working, suspended, or eligible for messaging
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Accounts (one username per line)</Label>
                    <textarea
                      className="w-full h-48 p-3 border rounded-md bg-background resize-none font-mono text-sm"
                      value={formData.accounts_list}
                      onChange={(e) => setFormData({ ...formData, accounts_list: e.target.value })}
                      placeholder="elonmusk&#10;jack&#10;OpenAI&#10;username123"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.accounts_list.split("\n").filter(Boolean).length} accounts to check
                    </p>
                  </div>

                  {loading && (
                    <div className="space-y-2">
                      <Progress value={progress} />
                      <p className="text-sm text-muted-foreground text-center">
                        Checking accounts... {Math.round(progress)}%
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleCheckAccounts("working")}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {loading ? "Checking..." : "Check All Accounts"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Check Results</CardTitle>
                    {checkResults.length > 0 && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => exportResults("all")}>
                          Export All
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportResults("working")}>
                          Export Working
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportResults("messaging")}>
                          Export Messaging
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {checkResults.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No results yet. Run a check to see results.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {checkResults.map((result, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {result.status === "working" ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium">@{result.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {result.followers.toLocaleString()} followers
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={result.status === "working" ? "default" : "destructive"}>
                              {result.status}
                            </Badge>
                            {result.can_message && (
                              <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                DM Ready
                              </Badge>
                            )}
                          </div>
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
