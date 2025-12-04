import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, RefreshCw, Image, Link, Calendar, Loader2 } from "lucide-react";
import { SiPinterest } from "@icons-pack/react-simple-icons";

interface PinPost {
  id: string;
  post_type: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  destination_url: string | null;
  source_pin_url: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

interface Account {
  id: string;
  username: string;
  account_name: string | null;
}

interface Board {
  id: string;
  board_name: string;
}

export default function PinterestPublisher() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("new-pin");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [pinTitle, setPinTitle] = useState("");
  const [pinDescription, setPinDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [repinUrl, setRepinUrl] = useState("");
  const [bulkRepinUrls, setBulkRepinUrls] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["pinterest-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pinterest_accounts")
        .select("id, username, account_name")
        .eq("status", "active");
      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user
  });

  const { data: boards = [] } = useQuery({
    queryKey: ["pinterest-boards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pinterest_boards")
        .select("id, board_name");
      if (error) throw error;
      return data as Board[];
    },
    enabled: !!user
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["pinterest-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pinterest_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as PinPost[];
    },
    enabled: !!user
  });

  const createPinMutation = useMutation({
    mutationFn: async (postType: "pin" | "repin") => {
      const postData = {
        user_id: user?.id,
        account_id: selectedAccount || null,
        board_id: selectedBoard || null,
        post_type: postType,
        title: pinTitle || null,
        description: pinDescription || null,
        image_url: postType === "pin" ? imageUrl || null : null,
        destination_url: destinationUrl || null,
        source_pin_url: postType === "repin" ? repinUrl || null : null,
        status: "pending"
      };
      
      const { error } = await supabase.from("pinterest_posts").insert(postData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinterest-posts"] });
      setPinTitle("");
      setPinDescription("");
      setImageUrl("");
      setDestinationUrl("");
      setRepinUrl("");
      toast({ title: "Pin queued for publishing" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const bulkRepinMutation = useMutation({
    mutationFn: async () => {
      const urls = bulkRepinUrls.split("\n").filter(u => u.trim());
      const posts = urls.map(url => ({
        user_id: user?.id,
        account_id: selectedAccount || null,
        board_id: selectedBoard || null,
        post_type: "repin",
        source_pin_url: url.trim(),
        status: "pending"
      }));
      
      const { error } = await supabase.from("pinterest_posts").insert(posts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinterest-posts"] });
      setBulkRepinUrls("");
      toast({ title: "Bulk repins queued" });
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
              <SiPinterest className="h-8 w-8" color="#E60023" />
              Pinterest Publisher
            </h1>
            <p className="text-muted-foreground mt-1">Auto-post and repost pins from multiple accounts</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Pin Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Content</CardTitle>
                <CardDescription>Post new pins or repin existing content</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="new-pin" className="flex-1">
                      <Image className="h-4 w-4 mr-2" />
                      New Pin
                    </TabsTrigger>
                    <TabsTrigger value="repin" className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Repin
                    </TabsTrigger>
                    <TabsTrigger value="bulk-repin" className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Bulk Repin
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Account</Label>
                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                @{account.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Board</Label>
                        <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select board" />
                          </SelectTrigger>
                          <SelectContent>
                            {boards.map((board) => (
                              <SelectItem key={board.id} value={board.id}>
                                {board.board_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <TabsContent value="new-pin" className="space-y-4 mt-0">
                      <div>
                        <Label>Pin Title</Label>
                        <Input
                          value={pinTitle}
                          onChange={(e) => setPinTitle(e.target.value)}
                          placeholder="Amazing home decor ideas"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={pinDescription}
                          onChange={(e) => setPinDescription(e.target.value)}
                          placeholder="Check out these amazing ideas..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Image URL</Label>
                        <Input
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div>
                        <Label>Destination URL</Label>
                        <Input
                          value={destinationUrl}
                          onChange={(e) => setDestinationUrl(e.target.value)}
                          placeholder="https://yourwebsite.com/article"
                        />
                      </div>
                      <Button 
                        onClick={() => createPinMutation.mutate("pin")}
                        disabled={createPinMutation.isPending}
                        className="w-full bg-[#E60023] hover:bg-[#C50020]"
                      >
                        {createPinMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Create Pin
                      </Button>
                    </TabsContent>

                    <TabsContent value="repin" className="space-y-4 mt-0">
                      <div>
                        <Label>Pin URL to Repin</Label>
                        <Input
                          value={repinUrl}
                          onChange={(e) => setRepinUrl(e.target.value)}
                          placeholder="https://pinterest.com/pin/123456789"
                        />
                      </div>
                      <div>
                        <Label>Custom Description (optional)</Label>
                        <Textarea
                          value={pinDescription}
                          onChange={(e) => setPinDescription(e.target.value)}
                          placeholder="Add your own description..."
                          rows={3}
                        />
                      </div>
                      <Button 
                        onClick={() => createPinMutation.mutate("repin")}
                        disabled={createPinMutation.isPending}
                        className="w-full bg-[#E60023] hover:bg-[#C50020]"
                      >
                        {createPinMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Repin
                      </Button>
                    </TabsContent>

                    <TabsContent value="bulk-repin" className="space-y-4 mt-0">
                      <div>
                        <Label>Pin URLs (one per line)</Label>
                        <Textarea
                          value={bulkRepinUrls}
                          onChange={(e) => setBulkRepinUrls(e.target.value)}
                          placeholder="https://pinterest.com/pin/123&#10;https://pinterest.com/pin/456&#10;https://pinterest.com/pin/789"
                          rows={6}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {bulkRepinUrls.split("\n").filter(u => u.trim()).length} pins
                        </p>
                      </div>
                      <Button 
                        onClick={() => bulkRepinMutation.mutate()}
                        disabled={bulkRepinMutation.isPending}
                        className="w-full bg-[#E60023] hover:bg-[#C50020]"
                      >
                        {bulkRepinMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Bulk Repin All
                      </Button>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            {/* Post History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Post History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center text-muted-foreground py-4">Loading...</p>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8">
                    <Image className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-muted-foreground">No posts yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {posts.map((post) => (
                      <div key={post.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {post.post_type === "pin" ? (
                              <Image className="h-4 w-4 text-[#E60023]" />
                            ) : (
                              <RefreshCw className="h-4 w-4 text-[#E60023]" />
                            )}
                            <span className="font-medium text-sm">
                              {post.title || post.post_type.toUpperCase()}
                            </span>
                          </div>
                          <Badge variant={
                            post.status === "published" ? "default" :
                            post.status === "pending" ? "secondary" : "outline"
                          }>
                            {post.status}
                          </Badge>
                        </div>
                        {post.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {post.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleString()}
                        </p>
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