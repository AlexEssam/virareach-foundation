import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Users, Heart, MessageCircle, Star, BarChart3, Target } from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";

export default function InstagramExtractor() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [extractions, setExtractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    source_username: "",
    post_url: "",
    niche: "",
    min_followers: "",
    competitor_usernames: "",
  });

  const fetchExtractions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("instagram-extract", {
        body: { action: "list" },
      });

      if (error) throw error;
      setExtractions(data.extractions || []);
    } catch (error: any) {
      console.error("Error fetching extractions:", error);
    }
  };

  useEffect(() => {
    fetchExtractions();
  }, []);

  const handleExtract = async (type: string) => {
    setLoading(true);
    try {
      let body: any = { action: type };

      switch (type) {
        case "followers":
        case "following":
        case "demographics":
          body.source_username = formData.source_username;
          break;
        case "post_likers":
        case "post_commenters":
          body.post_url = formData.post_url;
          break;
        case "dm_customers":
          break;
        case "influencers":
          body.niche = formData.niche;
          body.min_followers = parseInt(formData.min_followers) || 10000;
          break;
        case "competitors_followers":
          body.competitor_usernames = formData.competitor_usernames.split(",").map((s) => s.trim());
          break;
      }

      const { data, error } = await supabase.functions.invoke("instagram-extract", { body });

      if (error) throw error;

      toast({
        title: "Extraction Complete",
        description: `Extracted ${data.extraction?.result_count || 0} results`,
      });
      fetchExtractions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractionTypes = [
    { id: "followers", label: "Followers", icon: Users, description: "Extract followers from any account" },
    { id: "following", label: "Following", icon: Users, description: "Extract following list from any account" },
    { id: "post_likers", label: "Post Likers", icon: Heart, description: "Extract users who liked a post" },
    { id: "post_commenters", label: "Post Commenters", icon: MessageCircle, description: "Extract users who commented" },
    { id: "dm_customers", label: "DM Customers", icon: MessageCircle, description: "Extract users from DMs" },
    { id: "influencers", label: "Influencers", icon: Star, description: "Find influencers in a niche" },
    { id: "competitors_followers", label: "Competitor Followers", icon: Target, description: "Extract competitor followers" },
    { id: "demographics", label: "Demographics", icon: BarChart3, description: "Analyze audience demographics" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <SiInstagram className="h-8 w-8" color="#E4405F" />
            <div>
              <h1 className="text-3xl font-bold">Instagram Extractor</h1>
              <p className="text-muted-foreground">Extract data from Instagram profiles and posts</p>
            </div>
          </div>

          <Tabs defaultValue="followers">
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 h-auto">
              {extractionTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.id} className="text-xs">
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {extractionTypes.map((type) => (
              <TabsContent key={type.id} value={type.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <type.icon className="h-5 w-5" />
                      {type.label}
                    </CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(type.id === "followers" || type.id === "following" || type.id === "demographics") && (
                      <div>
                        <Label>Username</Label>
                        <Input
                          value={formData.source_username}
                          onChange={(e) => setFormData({ ...formData, source_username: e.target.value })}
                          placeholder="@username"
                        />
                      </div>
                    )}

                    {(type.id === "post_likers" || type.id === "post_commenters") && (
                      <div>
                        <Label>Post URL</Label>
                        <Input
                          value={formData.post_url}
                          onChange={(e) => setFormData({ ...formData, post_url: e.target.value })}
                          placeholder="https://instagram.com/p/..."
                        />
                      </div>
                    )}

                    {type.id === "influencers" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Niche</Label>
                          <Input
                            value={formData.niche}
                            onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                            placeholder="fitness, fashion, tech..."
                          />
                        </div>
                        <div>
                          <Label>Min Followers</Label>
                          <Input
                            type="number"
                            value={formData.min_followers}
                            onChange={(e) => setFormData({ ...formData, min_followers: e.target.value })}
                            placeholder="10000"
                          />
                        </div>
                      </div>
                    )}

                    {type.id === "competitors_followers" && (
                      <div>
                        <Label>Competitor Usernames (comma separated)</Label>
                        <Input
                          value={formData.competitor_usernames}
                          onChange={(e) => setFormData({ ...formData, competitor_usernames: e.target.value })}
                          placeholder="competitor1, competitor2, competitor3"
                        />
                      </div>
                    )}

                    <Button onClick={() => handleExtract(type.id)} disabled={loading}>
                      <Download className="h-4 w-4 mr-2" />
                      {loading ? "Extracting..." : "Extract"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Recent Extractions</CardTitle>
            </CardHeader>
            <CardContent>
              {extractions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No extractions yet</p>
              ) : (
                <div className="space-y-3">
                  {extractions.slice(0, 10).map((extraction) => (
                    <div
                      key={extraction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium capitalize">{extraction.extraction_type.replace("_", " ")}</p>
                        <p className="text-sm text-muted-foreground">
                          {extraction.source_username || extraction.source}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={extraction.status === "completed" ? "default" : "secondary"}>
                          {extraction.status}
                        </Badge>
                        <span className="text-sm">{extraction.result_count} results</span>
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
