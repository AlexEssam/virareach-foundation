import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
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
  Target,
  Mail,
  Instagram,
  Linkedin,
  Activity,
  Clock,
  Upload,
  Image,
  Video,
  X,
  LogIn,
  MessageCircle
} from "lucide-react";
import { SiPinterest, SiSnapchat, SiFacebook, SiX, SiTelegram, SiTiktok, SiReddit } from "@icons-pack/react-simple-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const platformOptions = [
  { id: 'facebook', label: 'Facebook', icon: SiFacebook, color: 'text-blue-600' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'twitter', label: 'Twitter', icon: SiX, color: 'text-foreground' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-orange-500' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-500' },
  { id: 'telegram', label: 'Telegram', icon: SiTelegram, color: 'text-sky-500' },
  { id: 'tiktok', label: 'TikTok', icon: SiTiktok, color: 'text-foreground' },
  { id: 'reddit', label: 'Reddit', icon: SiReddit, color: 'text-orange-600' },
];

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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    platform: 'facebook',
    type: 'broadcast',
    content: '',
    scheduled_at: ''
  });

  useEffect(() => {
    if (!authLoading && user) {
      loadCampaigns();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB max)
    if (file.size > 52428800) {
      toast.error('File size must be less than 50MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image or video.');
      return;
    }

    setMediaFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile || !user) return null;

    const fileExt = mediaFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('campaign-media')
      .upload(fileName, mediaFile);

    if (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload media');
    }

    const { data: publicUrl } = supabase.storage
      .from('campaign-media')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  };

  const createCampaign = async () => {
    if (!newCampaign.name || !user) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);

    try {
      // Upload media if present
      let mediaUrl: string | null = null;
      if (mediaFile) {
        mediaUrl = await uploadMedia();
      }

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
        campaignData.message_type = mediaUrl ? 'media' : 'text';
        campaignData.media_url = mediaUrl;
        const result = await supabase.from('instagram_campaigns').insert(campaignData);
        error = result.error;
      } else if (newCampaign.platform === 'linkedin') {
        campaignData.campaign_type = newCampaign.type;
        campaignData.sending_mode = 'sequential';
        const result = await supabase.from('linkedin_campaigns').insert(campaignData);
        error = result.error;
      } else if (newCampaign.platform === 'pinterest') {
        campaignData.campaign_type = newCampaign.type;
        campaignData.message_type = mediaUrl ? 'media' : 'text';
        campaignData.media_url = mediaUrl;
        const result = await supabase.from('pinterest_campaigns').insert(campaignData);
        error = result.error;
      } else if (newCampaign.platform === 'snapchat') {
        campaignData.message_type = mediaUrl ? 'media' : 'text';
        campaignData.media_url = mediaUrl;
        const result = await supabase.from('snapchat_campaigns').insert(campaignData);
        error = result.error;
      }

      if (error) throw error;

      toast.success('Campaign created successfully!');
      setCreateDialogOpen(false);
      setNewCampaign({ name: '', platform: 'facebook', type: 'broadcast', content: '', scheduled_at: '' });
      removeMedia();
      loadCampaigns();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setUploading(false);
    }
  };

  const getStatusConfig = (status: Campaign['status']) => {
    const configs = {
      draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: Edit },
      scheduled: { label: 'Scheduled', color: 'bg-amber-500/10 text-amber-500', icon: Calendar },
      running: { label: 'Running', color: 'bg-primary/10 text-primary', icon: Play },
      paused: { label: 'Paused', color: 'bg-muted text-muted-foreground', icon: Pause },
      completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2 },
      failed: { label: 'Failed', color: 'bg-destructive/10 text-destructive', icon: XCircle },
    };
    return configs[status] || configs.draft;
  };

  const getPlatformConfig = (platform: string) => {
    const configs: Record<string, { icon: any; color: string; label: string }> = {
      facebook: { icon: SiFacebook, color: 'text-blue-600', label: 'Facebook' },
      email: { icon: Mail, color: 'text-orange-500', label: 'Email' },
      instagram: { icon: Instagram, color: 'text-pink-500', label: 'Instagram' },
      twitter: { icon: SiX, color: 'text-foreground', label: 'Twitter' },
      whatsapp: { icon: MessageCircle, color: 'text-green-500', label: 'WhatsApp' },
      telegram: { icon: SiTelegram, color: 'text-sky-500', label: 'Telegram' },
      tiktok: { icon: SiTiktok, color: 'text-foreground', label: 'TikTok' },
      reddit: { icon: SiReddit, color: 'text-orange-600', label: 'Reddit' },
      linkedin: { icon: Linkedin, color: 'text-blue-500', label: 'LinkedIn' },
      pinterest: { icon: SiPinterest, color: 'text-red-500', label: 'Pinterest' },
      snapchat: { icon: SiSnapchat, color: 'text-yellow-500', label: 'Snapchat' },
    };
    return configs[platform] || { icon: Mail, color: 'text-muted-foreground', label: platform };
  };

  const stats = {
    total: campaigns.length,
    running: campaigns.filter(c => c.status === 'running').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    totalSent: campaigns.reduce((acc, c) => acc + c.sent_count, 0),
  };

  const isVideoFile = mediaFile?.type.startsWith('video/');

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-md mx-auto mt-20 p-8">
            <Card>
              <CardHeader className="text-center">
                <Target className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>Login Required</CardTitle>
                <CardDescription>
                  Please log in to access Campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={() => navigate('/login')}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Campaigns</h1>
              <p className="text-muted-foreground mt-1">Manage and monitor your marketing campaigns</p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={(open) => {
              setCreateDialogOpen(open);
              if (!open) removeMedia();
            }}>
              <DialogTrigger asChild>
                <Button className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Set up a new marketing campaign to reach your audience
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Campaign Name <span className="text-destructive">*</span></label>
                    <Input
                      placeholder="e.g., Summer Sale Promo"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Platform <span className="text-destructive">*</span></label>
                    <div className="grid grid-cols-4 gap-3">
                      {platformOptions.map((platform) => {
                        const Icon = platform.icon;
                        return (
                          <button
                            key={platform.id}
                            type="button"
                            onClick={() => setNewCampaign({ ...newCampaign, platform: platform.id })}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all hover:bg-muted/50",
                              newCampaign.platform === platform.id
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            )}
                          >
                            <Icon className={cn("h-5 w-5 mb-1.5", platform.color)} />
                            <span className="text-xs font-medium">{platform.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Campaign Type <span className="text-destructive">*</span></label>
                    <Select
                      value={newCampaign.type}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="broadcast">Broadcast</SelectItem>
                        <SelectItem value="message">Direct Message</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Campaign Content <span className="text-destructive">*</span></label>
                    <Textarea
                      placeholder="Write your campaign message here..."
                      value={newCampaign.content}
                      onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                      rows={4}
                    />
                  </div>

                  {/* Media Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Media (Optional)</label>
                    {!mediaPreview ? (
                      <div 
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Upload photo or video</p>
                            <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WEBP, MP4, WEBM (max 50MB)</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border border-border">
                        {isVideoFile ? (
                          <video 
                            src={mediaPreview} 
                            className="w-full h-40 object-cover"
                            controls
                          />
                        ) : (
                          <img 
                            src={mediaPreview} 
                            alt="Preview" 
                            className="w-full h-40 object-cover"
                          />
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={removeMedia}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
                          {isVideoFile ? (
                            <Video className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Image className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {mediaFile?.name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={uploading}>
                    Cancel
                  </Button>
                  <Button onClick={createCampaign} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Campaign'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/40">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-semibold tracking-tight">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Activity className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Running</p>
                    <p className="text-2xl font-semibold tracking-tight">{stats.running}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-semibold tracking-tight">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Send className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Sent</p>
                    <p className="text-2xl font-semibold tracking-tight">{stats.totalSent.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card className="border-border/40">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">No campaigns yet</h3>
                  <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">
                    Create your first campaign to start reaching your audience across platforms.
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="w-[280px]">Campaign</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => {
                      const statusConfig = getStatusConfig(campaign.status);
                      const platformConfig = getPlatformConfig(campaign.platform);
                      const PlatformIcon = platformConfig.icon;
                      const StatusIcon = statusConfig.icon;
                      const progress = campaign.target_count > 0 
                        ? Math.round((campaign.sent_count / campaign.target_count) * 100)
                        : 0;

                      return (
                        <TableRow key={campaign.id} className="border-border/40">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{campaign.name}</span>
                              <span className="text-xs text-muted-foreground capitalize">{campaign.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <PlatformIcon className={`h-4 w-4 ${platformConfig.color}`} />
                              <span className="text-sm">{platformConfig.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`${statusConfig.color} border-0 font-medium`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 min-w-[140px]">
                              <Progress value={progress} className="h-1.5 flex-1" />
                              <span className="text-xs text-muted-foreground w-12 text-right">
                                {campaign.sent_count}/{campaign.target_count}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-sm">{format(new Date(campaign.created_at), 'MMM d, yyyy')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
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
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
