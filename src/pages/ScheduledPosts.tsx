import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Trash2,
  CalendarClock,
  Linkedin
} from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiTiktok, SiTelegram, SiReddit, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const platformOptions = [
  { id: 'facebook', label: 'Facebook', icon: SiFacebook, color: '#1877F2' },
  { id: 'instagram', label: 'Instagram', icon: SiInstagram, color: '#E4405F' },
  { id: 'twitter', label: 'X (Twitter)', icon: SiX, color: 'currentColor' },
  { id: 'tiktok', label: 'TikTok', icon: SiTiktok, color: 'currentColor' },
  { id: 'telegram', label: 'Telegram', icon: SiTelegram, color: '#26A5E4' },
  { id: 'reddit', label: 'Reddit', icon: SiReddit, color: '#FF4500' },
  { id: 'whatsapp', label: 'WhatsApp', icon: SiWhatsapp, color: '#25D366' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
];

const postTypes = [
  { value: 'feed_post', label: 'Feed Post' },
  { value: 'story', label: 'Story' },
  { value: 'reel', label: 'Reel / Short' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'text', label: 'Text Only' },
];

export default function ScheduledPosts() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    platform: 'facebook',
    content: '',
    scheduled_at: '',
    post_type: 'feed_post',
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (post: typeof newPost) => {
      const { error } = await supabase.from('scheduled_posts').insert({
        user_id: user?.id,
        title: post.title,
        platform: post.platform,
        content: post.content,
        scheduled_at: post.scheduled_at,
        post_type: post.post_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      setDialogOpen(false);
      setNewPost({ title: '', platform: 'facebook', content: '', scheduled_at: '', post_type: 'feed_post' });
      toast({ title: "Post scheduled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast({ title: "Post cancelled" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scheduled_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast({ title: "Post deleted" });
    },
  });

  const stats = {
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    completed: posts.filter(p => p.status === 'completed').length,
    cancelled: posts.filter(p => p.status === 'cancelled').length,
    failed: posts.filter(p => p.status === 'failed').length,
  };

  const getPlatformConfig = (platform: string) => {
    return platformOptions.find(p => p.id === platform) || platformOptions[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="border-primary/50 text-primary"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.scheduled_at) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(newPost);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Scheduled Posts</h1>
              <p className="text-muted-foreground mt-1">Schedule content across all platforms</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Schedule New Post</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Post Title *</Label>
                    <Input
                      placeholder="Enter post title..."
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Platform *</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {platformOptions.map((platform) => {
                        const Icon = platform.icon;
                        return (
                          <button
                            key={platform.id}
                            type="button"
                            onClick={() => setNewPost({ ...newPost, platform: platform.id })}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                              newPost.platform === platform.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-secondary/50"
                            )}
                          >
                            <Icon size={24} color={platform.color} />
                            <span className="text-xs font-medium">{platform.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Post Type</Label>
                    <Select
                      value={newPost.post_type}
                      onValueChange={(value) => setNewPost({ ...newPost, post_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {postTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      placeholder="Write your post content..."
                      rows={4}
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Schedule Date & Time *</Label>
                    <Input
                      type="datetime-local"
                      value={newPost.scheduled_at}
                      onChange={(e) => setNewPost({ ...newPost, scheduled_at: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Scheduling...' : 'Schedule Post'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.scheduled}</p>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <XCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.cancelled}</p>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Posts Table */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Scheduled Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No scheduled posts yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Click "Schedule New Post" to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => {
                      const platformConfig = getPlatformConfig(post.platform);
                      const Icon = platformConfig.icon;
                      return (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">{post.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon size={16} color={platformConfig.color} />
                              <span>{platformConfig.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{post.post_type?.replace('_', ' ')}</TableCell>
                          <TableCell>
                            {format(new Date(post.scheduled_at), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>{getStatusBadge(post.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {post.status === 'scheduled' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => cancelMutation.mutate(post.id)}
                                  disabled={cancelMutation.isPending}
                                >
                                  Cancel
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate(post.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
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