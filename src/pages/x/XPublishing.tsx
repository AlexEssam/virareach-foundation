import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Calendar, Trash2, Plus, Play } from "lucide-react";
import { SiX } from "@icons-pack/react-simple-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function XPublishing() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [tweets, setTweets] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const { toast } = useToast();

  const [tweetForm, setTweetForm] = useState({
    content: "",
    scheduled_at: "",
  });

  const [accountForm, setAccountForm] = useState({
    username: "",
    account_name: "",
    api_key: "",
    api_secret: "",
    access_token: "",
    access_token_secret: "",
  });

  const fetchAccounts = async () => {
    const { data } = await supabase.functions.invoke("x-publish", {
      body: { action: "list_accounts" },
    });
    setAccounts(data?.accounts || []);
    if (data?.accounts?.length > 0 && !selectedAccount) {
      setSelectedAccount(data.accounts[0].id);
    }
  };

  const fetchTweets = async () => {
    const { data } = await supabase.functions.invoke("x-publish", {
      body: { action: "list_tweets" },
    });
    setTweets(data?.tweets || []);
  };

  useEffect(() => {
    fetchAccounts();
    fetchTweets();
  }, []);

  const handleCreateTweet = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("x-publish", {
        body: {
          action: "create_tweet",
          account_id: selectedAccount,
          content: tweetForm.content,
          scheduled_at: tweetForm.scheduled_at || null,
        },
      });

      if (error) throw error;

      toast({ title: "Success", description: "Tweet created" });
      setDialogOpen(false);
      setTweetForm({ content: "", scheduled_at: "" });
      fetchTweets();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNow = async (tweetId: string) => {
    try {
      const { error } = await supabase.functions.invoke("x-publish", {
        body: { action: "publish_now", tweet_id: tweetId },
      });

      if (error) throw error;

      toast({ title: "Tweet Published" });
      fetchTweets();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTweet = async (tweetId: string) => {
    try {
      const { error } = await supabase.functions.invoke("x-publish", {
        body: { action: "delete_tweet", tweet_id: tweetId },
      });

      if (error) throw error;

      toast({ title: "Tweet Deleted" });
      fetchTweets();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAddAccount = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("x-publish", {
        body: {
          action: "add_account",
          ...accountForm,
        },
      });

      if (error) throw error;

      toast({ title: "Success", description: "Account added" });
      setAccountDialogOpen(false);
      setAccountForm({ username: "", account_name: "", api_key: "", api_secret: "", access_token: "", access_token_secret: "" });
      fetchAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("x-publish", {
        body: { action: "delete_account", id },
      });

      if (error) throw error;

      toast({ title: "Account Deleted" });
      fetchAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
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
                <h1 className="text-3xl font-bold">X Publishing Center</h1>
                <p className="text-muted-foreground">Schedule and publish tweets</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add X Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Username</Label>
                        <Input
                          value={accountForm.username}
                          onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                          placeholder="@username"
                        />
                      </div>
                      <div>
                        <Label>Account Name</Label>
                        <Input
                          value={accountForm.account_name}
                          onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                          placeholder="My Business"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>API Key</Label>
                        <Input
                          value={accountForm.api_key}
                          onChange={(e) => setAccountForm({ ...accountForm, api_key: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>API Secret</Label>
                        <Input
                          type="password"
                          value={accountForm.api_secret}
                          onChange={(e) => setAccountForm({ ...accountForm, api_secret: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Access Token</Label>
                        <Input
                          value={accountForm.access_token}
                          onChange={(e) => setAccountForm({ ...accountForm, access_token: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Access Token Secret</Label>
                        <Input
                          type="password"
                          value={accountForm.access_token_secret}
                          onChange={(e) => setAccountForm({ ...accountForm, access_token_secret: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddAccount} disabled={loading} className="w-full">
                      Add Account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Tweet
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Tweet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Content</Label>
                      <textarea
                        className="w-full h-32 p-3 border rounded-md bg-background resize-none"
                        value={tweetForm.content}
                        onChange={(e) => setTweetForm({ ...tweetForm, content: e.target.value })}
                        placeholder="What's happening?"
                        maxLength={280}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {tweetForm.content.length}/280
                      </p>
                    </div>
                    <div>
                      <Label>Schedule (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={tweetForm.scheduled_at}
                        onChange={(e) => setTweetForm({ ...tweetForm, scheduled_at: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleCreateTweet} disabled={loading} className="w-full">
                      {tweetForm.scheduled_at ? "Schedule Tweet" : "Save as Draft"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Select Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer ${
                      selectedAccount === account.id ? "border-primary bg-primary/10" : ""
                    }`}
                    onClick={() => setSelectedAccount(account.id)}
                  >
                    <SiX className="h-4 w-4" />
                    <span>@{account.username}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(account.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>All Tweets</CardTitle>
                </CardHeader>
                <CardContent>
                  {tweets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No tweets yet</p>
                  ) : (
                    <div className="space-y-3">
                      {tweets.map((tweet) => (
                        <div
                          key={tweet.id}
                          className="flex items-start justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="whitespace-pre-wrap">{tweet.content}</p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              {tweet.scheduled_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(tweet.scheduled_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                tweet.status === "published"
                                  ? "default"
                                  : tweet.status === "scheduled"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {tweet.status}
                            </Badge>
                            {tweet.status !== "published" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePublishNow(tweet.id)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTweet(tweet.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
