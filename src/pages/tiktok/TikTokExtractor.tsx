import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Hash, Users, Globe, Heart, MessageCircle, Play } from "lucide-react";
import { SiTiktok } from "@icons-pack/react-simple-icons";

interface Extraction {
  id: string;
  extraction_type: string;
  source_username: string | null;
  hashtag: string | null;
  country_code: string | null;
  status: string;
  result_count: number;
  created_at: string;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
];

const TikTokExtractor = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [username, setUsername] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [country, setCountry] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) loadExtractions();
  }, [user]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const loadExtractions = async () => {
    try {
      const response = await supabase.functions.invoke('tiktok-extract', { body: { action: 'get_extractions' } });
      if (response.data?.extractions) setExtractions(response.data.extractions);
    } catch (error) {
      console.error('Error loading extractions:', error);
    }
  };

  const startExtraction = async (type: string, params: Record<string, string>) => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('tiktok-extract', { body: { action: type, ...params } });
      if (response.error) throw response.error;
      toast({ title: "Extraction started" });
      loadExtractions();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary", running: "default", completed: "outline", failed: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getExtractionIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      followers: <Users className="h-4 w-4" />,
      following: <Users className="h-4 w-4" />,
      hashtag: <Hash className="h-4 w-4" />,
      famous_users: <Globe className="h-4 w-4" />,
      video_commenters: <MessageCircle className="h-4 w-4" />,
      video_likers: <Heart className="h-4 w-4" />
    };
    return icons[type] || <Download className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <SiTiktok className="h-8 w-8" />
              TikTok Extractor
            </h1>
            <p className="text-muted-foreground mt-2">Extract followers, hashtags, and famous users</p>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users">User Data</TabsTrigger>
              <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
              <TabsTrigger value="famous">Famous Users</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Extract Followers</CardTitle>
                    <CardDescription>Get complete follower list from any account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>TikTok Username</Label>
                      <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" />
                    </div>
                    <Button onClick={() => startExtraction('extract_followers', { source_username: username })} disabled={isLoading || !username} className="w-full">
                      <Play className="h-4 w-4 mr-2" />{isLoading ? "Starting..." : "Extract Followers"}
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Extract Following</CardTitle>
                    <CardDescription>Get accounts that a user follows</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>TikTok Username</Label>
                      <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" />
                    </div>
                    <Button onClick={() => startExtraction('extract_following', { source_username: username })} disabled={isLoading || !username} className="w-full">
                      <Play className="h-4 w-4 mr-2" />{isLoading ? "Starting..." : "Extract Following"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="hashtags">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5" />Hashtag Analysis</CardTitle>
                  <CardDescription>Extract and analyze hashtag data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hashtag</Label>
                    <Input value={hashtag} onChange={(e) => setHashtag(e.target.value)} placeholder="#trending" />
                  </div>
                  <Button onClick={() => startExtraction('extract_hashtag', { hashtag })} disabled={isLoading || !hashtag} className="w-full">
                    <Play className="h-4 w-4 mr-2" />{isLoading ? "Starting..." : "Analyze Hashtag"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="famous">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Famous Users by Country</CardTitle>
                  <CardDescription>Extract top TikTok influencers by region</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => startExtraction('extract_famous_users', { country_code: country })} disabled={isLoading || !country} className="w-full">
                    <Play className="h-4 w-4 mr-2" />{isLoading ? "Starting..." : "Extract Famous Users"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" />Video Commenters</CardTitle>
                    <CardDescription>Extract users who commented on a video</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Video URL</Label>
                      <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://tiktok.com/@user/video/..." />
                    </div>
                    <Button onClick={() => startExtraction('extract_video_commenters', { video_url: videoUrl })} disabled={isLoading || !videoUrl} className="w-full">
                      <Play className="h-4 w-4 mr-2" />Extract Commenters
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" />Video Likers</CardTitle>
                    <CardDescription>Extract users who liked a video</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Video URL</Label>
                      <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://tiktok.com/@user/video/..." />
                    </div>
                    <Button onClick={() => startExtraction('extract_video_likers', { video_url: videoUrl })} disabled={isLoading || !videoUrl} className="w-full">
                      <Play className="h-4 w-4 mr-2" />Extract Likers
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Extraction History</CardTitle>
                  <CardDescription>View past extractions and results</CardDescription>
                </CardHeader>
                <CardContent>
                  {extractions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No extractions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {extractions.map((ext) => (
                        <div key={ext.id} className="border rounded-lg p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {getExtractionIcon(ext.extraction_type)}
                            <div>
                              <p className="font-medium capitalize">{ext.extraction_type.replace('_', ' ')}</p>
                              <p className="text-sm text-muted-foreground">
                                {ext.source_username || ext.hashtag || ext.country_code || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm">{ext.result_count} results</span>
                            {getStatusBadge(ext.status)}
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
};

export default TikTokExtractor;
