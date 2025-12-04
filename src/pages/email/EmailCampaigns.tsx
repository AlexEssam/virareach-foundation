import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Upload, Send, FileText, Settings, Play, Pause, RotateCcw } from "lucide-react";

interface EmailRecipient {
  email: string;
  name?: string;
  status?: 'pending' | 'sent' | 'failed';
}

interface Campaign {
  id: string;
  campaign_name: string;
  subject: string;
  content_type: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
}

const EmailCampaigns = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"html" | "text">("html");
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(5);
  const [batchSize, setBatchSize] = useState(50);
  const [dailyLimit, setDailyLimit] = useState(500);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const newRecipients: EmailRecipient[] = [];

      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('email') || line.toLowerCase().includes('name'))) {
          return; // Skip header row
        }
        const parts = line.split(',').map(p => p.trim());
        if (parts[0] && parts[0].includes('@')) {
          newRecipients.push({
            email: parts[0],
            name: parts[1] || undefined,
            status: 'pending'
          });
        }
      });

      setRecipients(prev => [...prev, ...newRecipients]);
      toast({
        title: "Recipients Imported",
        description: `${newRecipients.length} recipients added from file`,
      });
    };
    reader.readAsText(file);
  };

  const addRecipientManually = () => {
    if (!recipientInput.includes('@')) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    setRecipients(prev => [...prev, { email: recipientInput.trim(), status: 'pending' }]);
    setRecipientInput("");
  };

  const createCampaign = async () => {
    if (!campaignName || !subject || !content || recipients.length === 0) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('email-send', {
        body: {
          action: 'create_campaign',
          campaign_name: campaignName,
          subject,
          content,
          content_type: contentType,
          recipients,
          anti_spam_settings: {
            delay_between_emails: delayBetweenEmails,
            batch_size: batchSize,
            daily_limit: dailyLimit
          }
        }
      });

      if (response.error) throw response.error;

      toast({ title: "Campaign created successfully" });
      setCampaignName("");
      setSubject("");
      setContent("");
      setRecipients([]);
      loadCampaigns();
    } catch (error: any) {
      toast({ title: "Error creating campaign", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('email-send', {
        body: { action: 'get_campaigns' }
      });

      if (response.data?.campaigns) {
        setCampaigns(response.data.campaigns);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      running: "default",
      completed: "outline",
      failed: "destructive",
      paused: "secondary"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-8 w-8" />
              Email Campaigns
            </h1>
            <p className="text-muted-foreground mt-2">Create and manage bulk email campaigns</p>
          </div>

          <Tabs defaultValue="create" className="space-y-6" onValueChange={(v) => v === 'campaigns' && loadCampaigns()}>
            <TabsList>
              <TabsTrigger value="create">Create Campaign</TabsTrigger>
              <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
              <TabsTrigger value="settings">Anti-Spam Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>Configure your email campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Campaign Name</Label>
                      <Input
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="My Email Campaign"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subject Line</Label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Your email subject"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content Type</Label>
                      <Select value={contentType} onValueChange={(v: "html" | "text") => setContentType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="text">Plain Text</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Email Content</Label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={contentType === 'html' ? '<html><body>Your content here</body></html>' : 'Your message here...'}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recipients</CardTitle>
                    <CardDescription>Import from CSV/Excel or add manually</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Import from File (CSV)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileUpload}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Format: email,name (one per line)</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Add Manually</Label>
                      <div className="flex gap-2">
                        <Input
                          value={recipientInput}
                          onChange={(e) => setRecipientInput(e.target.value)}
                          placeholder="email@example.com"
                          onKeyDown={(e) => e.key === 'Enter' && addRecipientManually()}
                        />
                        <Button variant="outline" onClick={addRecipientManually}>Add</Button>
                      </div>
                    </div>

                    <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                      <p className="text-sm font-medium mb-2">Recipients ({recipients.length})</p>
                      {recipients.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recipients added yet</p>
                      ) : (
                        <ul className="space-y-1">
                          {recipients.slice(0, 10).map((r, i) => (
                            <li key={i} className="text-sm flex justify-between items-center">
                              <span>{r.email}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRecipients(prev => prev.filter((_, idx) => idx !== i))}
                              >
                                ×
                              </Button>
                            </li>
                          ))}
                          {recipients.length > 10 && (
                            <li className="text-sm text-muted-foreground">...and {recipients.length - 10} more</li>
                          )}
                        </ul>
                      )}
                    </div>

                    <Button onClick={createCampaign} disabled={isLoading} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      {isLoading ? "Creating..." : "Create Campaign"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="campaigns">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign History</CardTitle>
                  <CardDescription>View and manage your email campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No campaigns yet</p>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="border rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{campaign.campaign_name}</h4>
                            <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                            <div className="flex gap-4 mt-2 text-sm">
                              <span>Total: {campaign.total_recipients}</span>
                              <span className="text-green-600">Sent: {campaign.sent_count}</span>
                              <span className="text-red-600">Failed: {campaign.failed_count}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(campaign.status)}
                            <div className="flex gap-1">
                              {campaign.status === 'draft' && (
                                <Button size="sm" variant="outline">
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}
                              {campaign.status === 'running' && (
                                <Button size="sm" variant="outline">
                                  <Pause className="h-3 w-3" />
                                </Button>
                              )}
                              {campaign.status === 'failed' && (
                                <Button size="sm" variant="outline">
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Anti-Spam Settings
                  </CardTitle>
                  <CardDescription>Configure sending limits to avoid spam filters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Delay Between Emails (seconds)</Label>
                      <Input
                        type="number"
                        value={delayBetweenEmails}
                        onChange={(e) => setDelayBetweenEmails(Number(e.target.value))}
                        min={1}
                      />
                      <p className="text-xs text-muted-foreground">Wait time between each email</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Batch Size</Label>
                      <Input
                        type="number"
                        value={batchSize}
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                        min={1}
                      />
                      <p className="text-xs text-muted-foreground">Emails per batch before pause</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Daily Limit</Label>
                      <Input
                        type="number"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(Number(e.target.value))}
                        min={1}
                      />
                      <p className="text-xs text-muted-foreground">Maximum emails per day</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Best Practices
                    </h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Use delays of 5-10 seconds between emails</li>
                      <li>Keep batch sizes under 100 emails</li>
                      <li>Stay under 500 emails per day for new domains</li>
                      <li>Warm up your sending domain gradually</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default EmailCampaigns;
