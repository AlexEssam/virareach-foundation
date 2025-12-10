import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Plus, Clock, Trash2, Loader2, XCircle } from "lucide-react";

interface ScheduledCampaign {
  id: string;
  campaign_name: string;
  message_type: string;
  content: string | null;
  recipients: string[] | null;
  scheduled_at: string;
  sending_mode: string;
  status: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export default function WhatsAppScheduler() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [scheduled, setScheduled] = useState<ScheduledCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [content, setContent] = useState("");
  const [recipients, setRecipients] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sendingMode, setSendingMode] = useState("10_per_min");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (user) {
      fetchScheduled();
    }
  }, [user, authLoading, navigate]);

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("whatsapp-scheduler", {
        body: { action: "list" },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to load scheduled campaigns";

        const friendlyMessage =
          rawMessage === "Edge Function returned a non-2xx status code"
            ? "Unable to load scheduled campaigns from the server right now. Please try again later."
            : rawMessage;

        throw new Error(friendlyMessage);
      }

      if (response.data?.scheduled) {
        setScheduled(response.data.scheduled);
      } else {
        setScheduled([]);
      }
    } catch (error) {
      console.error("Error fetching scheduled:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load scheduled campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!campaignName.trim() || !content.trim() || !scheduledAt) {
      toast({ title: "Error", description: "Fill all required fields", variant: "destructive" });
      return;
    }

    const recipientList = recipients.split("\n").filter(r => r.trim());
    if (recipientList.length === 0) {
      toast({ title: "Error", description: "Enter at least one recipient", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await supabase.functions.invoke("whatsapp-scheduler", {
        body: {
          action: "schedule",
          campaign_name: campaignName,
          message_type: "text",
          content,
          recipients: recipientList,
          scheduled_at: new Date(scheduledAt).toISOString(),
          sending_mode: sendingMode,
        },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to schedule campaign";

        throw new Error(rawMessage);
      }

      toast({
        title: "Campaign Scheduled",
        description: response.data?.message || "Campaign scheduled successfully.",
      });
      setDialogOpen(false);
      setCampaignName("");
      setContent("");
      setRecipients("");
      setScheduledAt("");
      fetchScheduled();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to schedule campaign", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const response = await supabase.functions.invoke("whatsapp-scheduler", {
        body: { action: "cancel", id },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to cancel campaign";

        throw new Error(rawMessage);
      }

      toast({ title: "Campaign cancelled" });
      fetchScheduled();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to cancel campaign", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await supabase.functions.invoke("whatsapp-scheduler", {
        body: { action: "delete", id },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to delete campaign";

        throw new Error(rawMessage);
      }

      toast({ title: "Deleted" });
      fetchScheduled();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete campaign", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/20 text-blue-500";
      case "completed": return "bg-green-500/20 text-green-500";
      case "cancelled": return "bg-red-500/20 text-red-500";
      default: return "bg-gray-500/20 text-gray-500";
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
              <h1 className="text-3xl font-bold">Campaign Scheduler</h1>
              <p className="text-muted-foreground mt-1">
                Schedule WhatsApp campaigns for later
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Schedule New Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium">Campaign Name</label>
                    <Input
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="My Scheduled Campaign"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Message Content</label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter your message..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Recipients (one per line)</label>
                    <Textarea
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                      placeholder="+1234567890&#10;+0987654321"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Schedule Date & Time</label>
                      <Input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Sending Mode</label>
                      <Select value={sendingMode} onValueChange={setSendingMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10_per_min">10/min (Safe)</SelectItem>
                          <SelectItem value="20_per_min">20/min (Normal)</SelectItem>
                          <SelectItem value="35_per_min">35/min (Fast)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleSchedule} disabled={saving} className="w-full">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Schedule Campaign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {scheduled.filter(s => s.status === "scheduled").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Calendar className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {scheduled.filter(s => s.status === "completed").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/10">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {scheduled.filter(s => s.status === "cancelled").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {scheduled.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No scheduled campaigns. Schedule your first one.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduled.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{campaign.campaign_name}</span>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {campaign.recipients?.length || 0} recipients • {campaign.sending_mode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {campaign.status === "scheduled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(campaign.id)}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(campaign.id)}
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