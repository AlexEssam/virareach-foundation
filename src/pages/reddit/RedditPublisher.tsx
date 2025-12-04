import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Image, Link, FileText, Loader2, Clock } from "lucide-react";
import { SiReddit } from "@icons-pack/react-simple-icons";

interface Post {
  id: string;
  subreddit: string;
  post_type: string;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  status: string;
  upvotes: number;
  published_at: string | null;
  created_at: string;
}

interface Account {
  id: string;
  username: string;
}

interface Community {
  id: string;
  subreddit_name: string;
  is_joined: boolean;
}

export default function RedditPublisher() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [postType, setPostType] = useState<"text" | "image" | "link">("text");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [subreddit, setSubreddit] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [flair, setFlair] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["reddit-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reddit_accounts")
        .select("id, username")
        .eq("status", "active");
      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user
  });

  const { data: communities = [] } = useQuery({
    queryKey: ["reddit-joined-communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reddit_communities")
        .select("id, subreddit_name, is_joined")
        .eq("is_joined", true);
      if (error) throw error;
      return data as Community[];
    },
    enabled: !!user
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["reddit-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reddit_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Post[];
    },
    enabled: !!user
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const { data: post, error } = await supabase
        .from("reddit_posts")
        .insert({
          user_id: user?.id,
          account_id: selectedAccount || null,
          subreddit: subreddit.replace(/^r\//, ""),
          post_type: postType,
          title,
          content: postType === "text" ? content : null,
          image_url: postType === "image" ? imageUrl : null,
          link_url: postType === "link" ? linkUrl : null,
          flair: flair || null,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate publishing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await supabase
        .from("reddit_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          reddit_post_id: `t3_${Math.random().toString(36).substring(7)}`
        })
        .eq("id", post.id);

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reddit-posts"] });
      setTitle("");
      setContent("");
      setImageUrl("");
      setLinkUrl("");
      setFlair("");
      toast({ title: "Post published successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const bulkPostMutation = useMutation({
    mutationFn: async () => {
      const joinedCommunities = communities.filter(c => c.is_joined).slice(0, 5);
      const posts = joinedCommunities.map(c => ({
        user_id: user?.id,
        account_id: selectedAccount || null,
        subreddit: c.subreddit_name,
        post_type: postType,
        title,
        content: postType === "text" ? content : null,
        image_url: postType === "image" ? imageUrl : null,
        link_url: postType === "link" ? linkUrl : null,
        status: "pending"
      }));

      const { data, error } = await supabase.from("reddit_posts").insert(posts).select();
      if (error) throw error;

      // Simulate publishing with delays
      for (const post of data) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 3000));
        await supabase
          .from("reddit_posts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            reddit_post_id: `t3_${Math.random().toString(36).substring(7)}`
          })
          .eq("id", post.id);
      }

      return data.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["reddit-posts"] });
      toast({ title: `Posted to ${count} communities!` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <SiReddit className="h-8 w-8" color="#FF4500" />
              Reddit Publisher
            </h1>
            <p className="text-muted-foreground mt-1">Auto-publish posts to multiple subreddits</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Post */}
            <Card>
              <CardHeader>
                <CardTitle>Create Post</CardTitle>
                <CardDescription>Publish to single or multiple communities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Account</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(a => (
                          <SelectItem key={a.id} value={a.id}>u/{a.username}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subreddit</Label>
                    <Input
                      value={subreddit}
                      onChange={(e) => setSubreddit(e.target.value)}
                      placeholder="r/subreddit"
                    />
                  </div>
                </div>

                <Tabs value={postType} onValueChange={(v) => setPostType(v as typeof postType)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="text" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex-1">
                      <Image className="h-4 w-4 mr-2" />
                      Image
                    </TabsTrigger>
                    <TabsTrigger value="link" className="flex-1">
                      <Link className="h-4 w-4 mr-2" />
                      Link
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-4 space-y-4">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Post title"
                      />
                    </div>

                    <TabsContent value="text" className="mt-0">
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Post content..."
                          rows={5}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="image" className="mt-0">
                      <div>
                        <Label>Image URL</Label>
                        <Input
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="link" className="mt-0">
                      <div>
                        <Label>Link URL</Label>
                        <Input
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://example.com/article"
                        />
                      </div>
                    </TabsContent>

                    <div>
                      <Label>Flair (optional)</Label>
                      <Input
                        value={flair}
                        onChange={(e) => setFlair(e.target.value)}
                        placeholder="Post flair"
                      />
                    </div>
                  </div>
                </Tabs>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => createPostMutation.mutate()}
                    disabled={createPostMutation.isPending || !title || !subreddit}
                    className="bg-[#FF4500] hover:bg-[#E03D00]"
                  >
                    {createPostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Post
                  </Button>
                  <Button 
                    onClick={() => bulkPostMutation.mutate()}
                    disabled={bulkPostMutation.isPending || !title || communities.length === 0}
                    variant="outline"
                  >
                    {bulkPostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Post to All Joined
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Post History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Post History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-4 text-muted-foreground">Loading...</p>
                ) : posts.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No posts yet</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {posts.map((post) => (
                      <div key={post.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{post.title}</p>
                            <p className="text-xs text-muted-foreground">r/{post.subreddit}</p>
                          </div>
                          <Badge variant={
                            post.status === "published" ? "default" :
                            post.status === "pending" ? "secondary" : "destructive"
                          }>
                            {post.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {post.post_type === "text" && <FileText className="h-3 w-3" />}
                            {post.post_type === "image" && <Image className="h-3 w-3" />}
                            {post.post_type === "link" && <Link className="h-3 w-3" />}
                            {post.post_type}
                          </span>
                          {post.published_at && (
                            <span>{new Date(post.published_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}