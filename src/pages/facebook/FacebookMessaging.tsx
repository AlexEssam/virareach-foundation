import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Users, MessageSquare, RefreshCw, Loader2 } from "lucide-react";

interface MessageCampaign {
  id: string;
  message_type: string;
  target_type: string;
  content: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
}

interface FacebookAccount {
  id: string;
  account_name: string;
  account_email: string;
  status: string;
}

const messageTypes = [
  { value: "dm", label: "Direct Messages", icon: MessageSquare },
  { value: "group_chat", label: "Add to Chat Group", icon: Users },
  { value: "inbox_automation", label: "Re-message Inbox", icon: RefreshCw },
];

const targetTypes = [
  { value: "friends", label: "Friends List" },
  { value: "customers", label: "Customer List" },
  { value: "group_members", label: "Group Members" },
];

export default function FacebookMessaging() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<MessageCampaign[]>([]);
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageType, setMessageType] = useState("dm");
  const [targetType, setTargetType] = useState("friends");
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);
  const [content, setContent] = useState("");
  const [recipients, setRecipients] = useState("");

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
      const [campaignsRes, accountsRes] = await Promise.all([
        supabase.functions.invoke("facebook-messaging", { method: "GET" }),
        supabase.from("facebook_accounts").select("*").eq("status", "active"),
      ]);

      if (campaignsRes.data?.campaigns) {
        setCampaigns(campaignsRes.data.campaigns);
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

  const handleSendMessages = async () => {
    if (!content.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }

    const recipientList = recipients.split("\n").filter(r => r.trim());
    if (recipientList.length === 0) {
      toast({ title: "Error", description: "Please enter at least one recipient", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("facebook-messaging", {
        body: {
          message_type: messageType,
          target_type: targetType,
          content,
          recipients: recipientList,
          account_id: selectedAccount || null,
        },
      });

      if (error) throw error;

      toast({
        title: "Messages Sent",
        description: data.message,
      });

      setContent("");
      setRecipients("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send messages",
        variant: "destructive",
      });
    } finally {
      setSending(false);
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
          <div>
            <h1 className="text-3xl font-bold">Facebook Messaging</h1>
            <p className="text-muted-foreground mt-1">
              Send direct messages, manage chat groups, and automate inbox responses
            </p>
          </div>

          <Tabs defaultValue="send" className="space-y-6">
            <TabsList>
              <TabsTrigger value="send">Send Messages</TabsTrigger>
              <TabsTrigger value="history">Campaign History</TabsTrigger>
            </TabsList>

            <TabsContent value="send" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Message Settings</CardTitle>
                    <CardDescription>Configure your messaging campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message Type</label>
                      <Select value={messageType} onValueChange={setMessageType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select message type" />
                        </SelectTrigger>
                        <SelectContent>
                          {messageTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Audience</label>
                      <Select value={targetType} onValueChange={setTargetType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target type" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Facebook Account</label>
                      <Select
                        value={selectedAccount}
                        onValueChange={(val) =>
                          setSelectedAccount(val === "none" ? undefined : val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account (optional)" />
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
                    <CardTitle>Message Content</CardTitle>
                    <CardDescription>Write your message and add recipients</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Enter your message here..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Recipients (one per line)</label>
                      <Textarea
                        value={recipients}
                        onChange={(e) => setRecipients(e.target.value)}
                        placeholder="Enter usernames or IDs, one per line..."
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleSendMessages}
                      disabled={sending}
                      className="w-full"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Messages
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Message Type Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {messageTypes.map((type) => (
                      <div key={type.value} className="flex items-start gap-3 p-4 rounded-lg border">
                        <type.icon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">{type.label}</h4>
                          <p className="text-sm text-muted-foreground">
                            {type.value === "dm" && "Send direct messages to individual users"}
                            {type.value === "group_chat" && "Add customers to a Facebook chat group"}
                            {type.value === "inbox_automation" && "Re-message all previous conversations"}
                          </p>
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
                  <CardTitle>Campaign History</CardTitle>
                  <CardDescription>View your past messaging campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No messaging campaigns yet. Start sending messages above.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">
                                {campaign.message_type.replace("_", " ")}
                              </span>
                              <Badge variant={campaign.status === "completed" ? "default" : "secondary"}>
                                {campaign.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Target: {campaign.target_type} • {campaign.total_recipients} recipients
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              <span className="text-green-500">{campaign.sent_count} sent</span>
                              {campaign.failed_count > 0 && (
                                <span className="text-red-500 ml-2">{campaign.failed_count} failed</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(campaign.created_at).toLocaleDateString()}
                            </p>
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