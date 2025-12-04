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
import { Download, Users, Heart, MessageCircle, TrendingUp, Target, Mail } from "lucide-react";
import { SiX } from "@icons-pack/react-simple-icons";

export default function XExtractors() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [extractions, setExtractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    source_username: "",
    tweet_url: "",
    keywords: "",
    competitor_usernames: "",
    country_code: "US",
    email_keywords: "",
    min_followers: "1000",
  });

  const fetchExtractions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("x-extract", {
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
          body.source_username = formData.source_username;
          break;
        case "interested_users":
          body.keywords = formData.keywords.split(",").map((s) => s.trim());
          break;
        case "tweet_interactors":
          body.tweet_url = formData.tweet_url;
          break;
        case "trends":
          body.country_code = formData.country_code;
          break;
        case "competitor_customers":
          body.competitor_usernames = formData.competitor_usernames.split(",").map((s) => s.trim());
          break;
        case "emails_by_interest":
          body.keywords = formData.email_keywords.split(",").map((s) => s.trim());
          body.filters = { min_followers: parseInt(formData.min_followers) };
          break;
      }

      const { data, error } = await supabase.functions.invoke("x-extract", { body });

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
    { id: "followers", label: "Followers", icon: Users, description: "Extract followers from any X account" },
    { id: "interested_users", label: "Interested Users", icon: Target, description: "Find users interested in keywords" },
    { id: "tweet_interactors", label: "Tweet Interactors", icon: Heart, description: "Extract likers, retweeters, commenters" },
    { id: "trends", label: "Trends", icon: TrendingUp, description: "Get trending topics by country" },
    { id: "competitor_customers", label: "Competitor Customers", icon: MessageCircle, description: "Extract competitor followers" },
    { id: "emails_by_interest", label: "Emails by Interest", icon: Mail, description: "Extract customer emails by keywords" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <SiX className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">X Extractors</h1>
              <p className="text-muted-foreground">Extract data from X (Twitter) profiles and tweets</p>
            </div>
          </div>

          <Tabs defaultValue="followers">
            <TabsList className="grid grid-cols-6 h-auto">
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
                    {type.id === "followers" && (
                      <div>
                        <Label>Username</Label>
                        <Input
                          value={formData.source_username}
                          onChange={(e) => setFormData({ ...formData, source_username: e.target.value })}
                          placeholder="@username"
                        />
                      </div>
                    )}

                    {type.id === "interested_users" && (
                      <div>
                        <Label>Keywords (comma separated)</Label>
                        <Input
                          value={formData.keywords}
                          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                          placeholder="marketing, growth, startup"
                        />
                      </div>
                    )}

                    {type.id === "tweet_interactors" && (
                      <div>
                        <Label>Tweet URL</Label>
                        <Input
                          value={formData.tweet_url}
                          onChange={(e) => setFormData({ ...formData, tweet_url: e.target.value })}
                          placeholder="https://x.com/user/status/..."
                        />
                      </div>
                    )}

                    {type.id === "trends" && (
                      <div>
                        <Label>Country Code</Label>
                        <Input
                          value={formData.country_code}
                          onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                          placeholder="US, GB, CA..."
                        />
                      </div>
                    )}

                    {type.id === "competitor_customers" && (
                      <div>
                        <Label>Competitor Usernames (comma separated)</Label>
                        <Input
                          value={formData.competitor_usernames}
                          onChange={(e) => setFormData({ ...formData, competitor_usernames: e.target.value })}
                          placeholder="competitor1, competitor2"
                        />
                      </div>
                    )}

                    {type.id === "emails_by_interest" && (
                      <div className="space-y-4">
                        <div>
                          <Label>Keywords / Interests (comma separated)</Label>
                          <Input
                            value={formData.email_keywords}
                            onChange={(e) => setFormData({ ...formData, email_keywords: e.target.value })}
                            placeholder="marketing, SaaS, startup founder"
                          />
                        </div>
                        <div>
                          <Label>Min Followers</Label>
                          <Input
                            type="number"
                            value={formData.min_followers}
                            onChange={(e) => setFormData({ ...formData, min_followers: e.target.value })}
                            placeholder="1000"
                          />
                        </div>
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
