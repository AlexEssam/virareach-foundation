import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  BarChart3,
  Send,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Rocket,
  TrendingUp,
  Zap,
  Target,
  Mail,
  Instagram,
  Linkedin
} from "lucide-react";
import { SiPinterest, SiSnapchat } from "@icons-pack/react-simple-icons";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  type: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
  target_count: number;
  sent_count: number;
  success_count: number;
  failed_count: number;
  created_at: string;
  scheduled_at?: string;
  content?: string;
}

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    platform: 'email',
    type: 'message',
    content: '',
    scheduled_at: ''
  });

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const [emailRes, instagramRes, linkedinRes, pinterestRes, snapchatRes] = await Promise.all([
        supabase.from('email_campaigns').select('*').eq('user_id', user?.id),
        supabase.from('instagram_campaigns').select('*').eq('user_id', user?.id),
        supabase.from('linkedin_campaigns').select('*').eq('user_id', user?.id),
        supabase.from('pinterest_campaigns').select('*').eq('user_id', user?.id),
        supabase.from('snapchat_campaigns').select('*').eq('user_id', user?.id),
      ]);

      const allCampaigns: Campaign[] = [];

      emailRes.data?.forEach(c => allCampaigns.push({
        id: c.id,
        name: c.campaign_name,
        platform: 'email',
        type: 'email',
        status: c.status as Campaign['status'],
        target_count: c.total_recipients || 0,
        sent_count: c.sent_count || 0,
        success_count: c.sent_count || 0,
        failed_count: c.failed_count || 0,
        created_at: c.created_at,
        content: c.content || ''
      }));

      instagramRes.data?.forEach(c => allCampaigns.push({
        id: c.id,
        name: c.campaign_name,
        platform: 'instagram',
        type: c.campaign_type,
        status: c.status as Campaign['status'],
        target_count: c.total_recipients || 0,
        sent_count: c.sent_count || 0,
        success_count: c.sent_count || 0,
        failed_count: c.failed_count || 0,
        created_at: c.created_at,
        content: c.content || ''
      }));

      linkedinRes.data?.forEach(c => allCampaigns.push({
        id: c.id,
        name: c.campaign_name,
        platform: 'linkedin',
        type: c.campaign_type,
        status: c.status as Campaign['status'],
        target_count: c.total_recipients || 0,
        sent_count: c.sent_count || 0,
        success_count: c.sent_count || 0,
        failed_count: c.failed_count || 0,
        created_at: c.created_at,
        content: c.content || ''
      }));

      pinterestRes.data?.forEach(c => allCampaigns.push({
        id: c.id,
        name: c.campaign_name,
        platform: 'pinterest',
        type: c.campaign_type,
        status: c.status as Campaign['status'],
        target_count: c.total_recipients || 0,
        sent_count: c.sent_count || 0,
        success_count: c.sent_count || 0,
        failed_count: c.failed_count || 0,
        created_at: c.created_at,
        content: c.content || ''
      }));

      snapchatRes.data?.forEach(c => allCampaigns.push({
        id: c.id,
        name: c.campaign_name,
        platform: 'snapchat',
        type: 'message',
        status: c.status as Campaign['status'],
        target_count: c.total_recipients || 0,
        sent_count: c.sent_count || 0,
        success_count: c.sent_count || 0,
        failed_count: c.failed_count || 0,
        created_at: c.created_at,
        content: c.content || ''
      }));

      allCampaigns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.name || !user) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const campaignData: any = {
        user_id: user.id,
        campaign_name: newCampaign.name,
        content: newCampaign.content,
        status: newCampaign.scheduled_at ? 'scheduled' : 'draft',
      };

      let error = null;

      if (newCampaign.platform === 'email') {
        campaignData.subject = newCampaign.name;
        campaignData.content_type = 'text';
        const result = await supabase.from('email_campaigns').insert(campaignData);
        error = result.error;
      } else if (newCampaign.platform === 'instagram') {
        campaignData.campaign_type = newCampaign.type;
        campaignData.message_type = 'text';
        const result = await supabase.from('instagram_campaigns').insert(campaignData);
        error = result.error;
      } else if (newCampaign.platform === 'linkedin') {
        campaignData.campaign_type = newCampaign.type;
        campaignData.sending_mode = 'sequential';
        const result = await supabase.from('linkedin_campaigns').insert(campaignData);
        error = result.error;
      } else if (newCampaign.platform === 'pinterest') {
        campaignData.campaign_type = newCampaign.type;
        campaignData.message_type = 'text';
        const result = await supabase.from('pinterest_campaigns').insert(campaignData);
        error = result.error;
      } else if (newCampaign.platform === 'snapchat') {
        campaignData.message_type = 'text';
        const result = await supabase.from('snapchat_campaigns').insert(campaignData);
        error = result.error;
      }

      if (error) throw error;

      toast.success('Campaign created successfully!');
      setCreateDialogOpen(false);
      setNewCampaign({ name: '', platform: 'email', type: 'message', content: '', scheduled_at: '' });
      loadCampaigns();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    }
  };

  const getStatusConfig = (status: Campaign['status']) => {
    const configs = {
      draft: { 
        variant: 'outline' as const, 
        icon: Edit, 
        className: 'border-muted-foreground/30 text-muted-foreground' 
      },
      scheduled: { 
        variant: 'secondary' as const, 
        icon: Calendar, 
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
      },
      running: { 
        variant: 'default' as const, 
        icon: Play, 
        className: 'bg-primary/20 text-primary border-primary/30' 
      },
      paused: { 
        variant: 'secondary' as const, 
        icon: Pause, 
        className: 'bg-muted text-muted-foreground' 
      },
      completed: { 
        variant: 'default' as const, 
        icon: CheckCircle2, 
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
      },
      failed: { 
        variant: 'destructive' as const, 
        icon: XCircle, 
        className: 'bg-destructive/20 text-destructive border-destructive/30' 
      },
    };
    return configs[status] || configs.draft;
  };

  const getPlatformConfig = (platform: string) => {
    const configs: Record<string, { icon: any; color: string; bg: string }> = {
      email: { icon: Mail, color: 'text-orange-400', bg: 'bg-orange-500/10' },
      instagram: { icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-500/10' },
      linkedin: { icon: Linkedin, color: 'text-blue-400', bg: 'bg-blue-500/10' },
      pinterest: { icon: SiPinterest, color: 'text-red-400', bg: 'bg-red-500/10' },
      snapchat: { icon: SiSnapchat, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    };
    return configs[platform] || { icon: Mail, color: 'text-muted-foreground', bg: 'bg-muted' };
  };

  const stats = {
    total: campaigns.length,
    running: campaigns.filter(c => c.status === 'running').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    totalSent: campaigns.reduce((acc, c) => acc + c.sent_count, 0),
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">
                <span className="text-gradient">Campaigns</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage and track your marketing campaigns across platforms
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gradient-primary text-primary-foreground font-semibold shadow-lg hover:shadow-primary/25 transition-all">
                  <Plus className="h-5 w-5 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl">Create Campaign</DialogTitle>
                  <DialogDescription>
                    Set up a new marketing campaign to reach your audience
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Campaign Name</label>
                    <Input
                      placeholder="e.g., Summer Sale Promo"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Platform</label>
                      <Select
                        value={newCampaign.platform}
                        onValueChange={(value) => setNewCampaign({ ...newCampaign, platform: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="pinterest">Pinterest</SelectItem>
                          <SelectItem value="snapchat">Snapchat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <Select
                        value={newCampaign.type}
                        onValueChange={(value) => setNewCampaign({ ...newCampaign, type: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="message">Direct Message</SelectItem>
                          <SelectItem value="broadcast">Broadcast</SelectItem>
                          <SelectItem value="followup">Follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message Content</label>
                    <Textarea
                      placeholder="Write your campaign message here..."
                      value={newCampaign.content}
                      onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createCampaign} className="gradient-primary text-primary-foreground">
                    Create Campaign
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Running</p>
                    <p className="text-3xl font-bold">{stats.running}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold">{stats.completed}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Messages Sent</p>
                    <p className="text-3xl font-bold">{stats.totalSent.toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Send className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">All Campaigns</CardTitle>
                  <CardDescription>View and manage your marketing campaigns</CardDescription>
                </div>
                {campaigns.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {campaigns.length} total
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading campaigns...</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 space-y-6">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <Rocket className="h-10 w-10 text-primary" />
                  </div>
                  <div className="text-center space-y-2 max-w-sm">
                    <h3 className="text-xl font-semibold">No campaigns yet</h3>
                    <p className="text-muted-foreground">
                      Create your first campaign to start reaching your audience across multiple platforms.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setCreateDialogOpen(true)}
                    className="gradient-primary text-primary-foreground font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="font-semibold">Campaign</TableHead>
                        <TableHead className="font-semibold">Platform</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Progress</TableHead>
                        <TableHead className="font-semibold">Created</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => {
                        const statusConfig = getStatusConfig(campaign.status);
                        const platformConfig = getPlatformConfig(campaign.platform);
                        const StatusIcon = statusConfig.icon;
                        const PlatformIcon = platformConfig.icon;
                        const progress = campaign.target_count 
                          ? Math.round((campaign.sent_count / campaign.target_count) * 100) 
                          : 0;

                        return (
                          <TableRow key={campaign.id} className="border-border/50 group">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg ${platformConfig.bg} flex items-center justify-center shrink-0`}>
                                  <PlatformIcon className={`h-5 w-5 ${platformConfig.color}`} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{campaign.name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{campaign.type}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${platformConfig.bg} ${platformConfig.color} border-0 capitalize`}>
                                {campaign.platform}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={statusConfig.variant} 
                                className={`${statusConfig.className} flex items-center gap-1.5 w-fit`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3 min-w-[140px]">
                                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                  <div 
                                    className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium tabular-nums w-16">
                                  {campaign.sent_count}/{campaign.target_count}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
