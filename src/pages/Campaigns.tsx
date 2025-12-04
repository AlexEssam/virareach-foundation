import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageSquare
} from "lucide-react";
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
    platform: 'facebook',
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
      // Load from multiple campaign tables
      const [emailRes, instagramRes, linkedinRes, pinterestRes, snapchatRes] = await Promise.all([
        supabase.from('email_campaigns').select('*').eq('user_id', user?.id),
        supabase.from('instagram_campaigns').select('*').eq('user_id', user?.id),
        supabase.from('linkedin_campaigns').select('*').eq('user_id', user?.id),
        supabase.from('pinterest_campaigns').select('*').eq('user_id', user?.id),
        supabase.from('snapchat_campaigns').select('*').eq('user_id', user?.id),
      ]);

      const allCampaigns: Campaign[] = [];

      // Map email campaigns
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

      // Map instagram campaigns
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

      // Map linkedin campaigns
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

      // Map pinterest campaigns
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

      // Map snapchat campaigns
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

      // Sort by created_at descending
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
      setNewCampaign({ name: '', platform: 'facebook', type: 'message', content: '', scheduled_at: '' });
      loadCampaigns();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      draft: { variant: 'outline', icon: Edit },
      scheduled: { variant: 'secondary', icon: Calendar },
      running: { variant: 'default', icon: Play },
      paused: { variant: 'secondary', icon: Pause },
      completed: { variant: 'default', icon: CheckCircle2 },
      failed: { variant: 'destructive', icon: XCircle },
    };
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      facebook: 'bg-blue-500/20 text-blue-500',
      instagram: 'bg-pink-500/20 text-pink-500',
      whatsapp: 'bg-green-500/20 text-green-500',
      telegram: 'bg-sky-500/20 text-sky-500',
      linkedin: 'bg-blue-700/20 text-blue-700',
      email: 'bg-orange-500/20 text-orange-500',
      pinterest: 'bg-red-500/20 text-red-500',
      snapchat: 'bg-yellow-500/20 text-yellow-600',
    };
    
    return (
      <Badge className={colors[platform] || 'bg-muted'}>
        {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </Badge>
    );
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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-primary" />
                Campaigns
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage all your marketing campaigns across platforms
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Set up a new marketing campaign
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Campaign Name</label>
                    <Input
                      placeholder="Enter campaign name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Platform</label>
                    <Select
                      value={newCampaign.platform}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, platform: value })}
                    >
                      <SelectTrigger>
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
                    <label className="text-sm font-medium">Campaign Type</label>
                    <Select
                      value={newCampaign.type}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="message">Direct Message</SelectItem>
                        <SelectItem value="broadcast">Broadcast</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      placeholder="Enter campaign message content..."
                      value={newCampaign.content}
                      onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createCampaign}>
                    Create Campaign
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Campaigns</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Play className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Running</p>
                    <p className="text-2xl font-bold">{stats.running}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Send className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sent</p>
                    <p className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Campaigns</CardTitle>
              <CardDescription>View and manage your campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first campaign to get started</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{getPlatformBadge(campaign.platform)}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${campaign.target_count ? (campaign.sent_count / campaign.target_count) * 100 : 0}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {campaign.sent_count}/{campaign.target_count}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
