import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, Hash, Globe, Users, BarChart3, Target, 
  TrendingUp, Star, Loader2, MapPin, Crown
} from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";

const countries = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "MX", name: "Mexico" },
];

const categories = [
  { value: "all", label: "All Categories" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Sports", label: "Sports" },
  { value: "Fashion", label: "Fashion" },
  { value: "Business", label: "Business" },
  { value: "Music", label: "Music" },
  { value: "Art", label: "Art" },
  { value: "Tech", label: "Technology" },
  { value: "Food", label: "Food & Cooking" },
];

export default function InstagramAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  // Form states
  const [nicheForm, setNicheForm] = useState({
    niche: "",
    country: "",
    min_followers: "",
    max_followers: "",
  });

  const [hashtagForm, setHashtagForm] = useState({
    hashtag: "",
  });

  const [famousForm, setFamousForm] = useState({
    country_code: "",
    category: "all",
    min_followers: "100000",
  });

  const [customerForm, setCustomerForm] = useState({
    usernames: "",
  });

  const [competitorForm, setCompetitorForm] = useState({
    competitor_usernames: "",
    country_code: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleExtract = async (action: string, body: any) => {
    setLoading(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("instagram-extract", {
        body: { action, ...body },
      });

      if (error) throw error;

      setResults({ type: action, data: data.extraction?.results });
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${data.extraction?.result_count || 0} results`,
      });
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3 animate-fade-in">
            <SiInstagram className="h-8 w-8" color="#E4405F" />
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-gradient">Instagram Analytics</span>
              </h1>
              <p className="text-muted-foreground">Advanced customer analysis and insights</p>
            </div>
          </div>

          <Tabs defaultValue="niche" className="animate-fade-in">
            <TabsList className="grid grid-cols-5 h-auto">
              <TabsTrigger value="niche" className="text-xs">
                <Target className="h-4 w-4 mr-1" />
                Niche Customers
              </TabsTrigger>
              <TabsTrigger value="hashtag" className="text-xs">
                <Hash className="h-4 w-4 mr-1" />
                Hashtag Analytics
              </TabsTrigger>
              <TabsTrigger value="famous" className="text-xs">
                <Crown className="h-4 w-4 mr-1" />
                Famous Users
              </TabsTrigger>
              <TabsTrigger value="customer" className="text-xs">
                <Users className="h-4 w-4 mr-1" />
                Customer Analysis
              </TabsTrigger>
              <TabsTrigger value="competitor" className="text-xs">
                <BarChart3 className="h-4 w-4 mr-1" />
                Competitor Analysis
              </TabsTrigger>
            </TabsList>

            {/* Niche Customers Tab */}
            <TabsContent value="niche">
              <Card variant="glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Niche-Targeted Customers
                  </CardTitle>
                  <CardDescription>
                    Extract customers in a specific niche with detailed statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Niche/Industry *</Label>
                      <Input
                        value={nicheForm.niche}
                        onChange={(e) => setNicheForm({ ...nicheForm, niche: e.target.value })}
                        placeholder="fitness, fashion, tech, beauty..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country (Optional)</Label>
                      <Select 
                        value={nicheForm.country} 
                        onValueChange={(v) => setNicheForm({ ...nicheForm, country: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          {countries.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Min Followers</Label>
                      <Input
                        type="number"
                        value={nicheForm.min_followers}
                        onChange={(e) => setNicheForm({ ...nicheForm, min_followers: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Followers</Label>
                      <Input
                        type="number"
                        value={nicheForm.max_followers}
                        onChange={(e) => setNicheForm({ ...nicheForm, max_followers: e.target.value })}
                        placeholder="50000"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleExtract("niche_customers", {
                      niche: nicheForm.niche,
                      country: nicheForm.country || null,
                      min_followers: parseInt(nicheForm.min_followers) || 100,
                      max_followers: parseInt(nicheForm.max_followers) || 50000,
                    })} 
                    disabled={loading || !nicheForm.niche}
                    variant="hero"
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Extract Niche Customers
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hashtag Analytics Tab */}
            <TabsContent value="hashtag">
              <Card variant="glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-primary" />
                    Hashtag Analytics
                  </CardTitle>
                  <CardDescription>
                    Full hashtag analysis with engagement data and related tags
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hashtag *</Label>
                    <Input
                      value={hashtagForm.hashtag}
                      onChange={(e) => setHashtagForm({ ...hashtagForm, hashtag: e.target.value.replace("#", "") })}
                      placeholder="fitness (without #)"
                    />
                  </div>
                  <Button 
                    onClick={() => handleExtract("hashtag_analytics", { hashtag: hashtagForm.hashtag })} 
                    disabled={loading || !hashtagForm.hashtag}
                    variant="hero"
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                    Analyze Hashtag
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Famous Users Tab */}
            <TabsContent value="famous">
              <Card variant="glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Famous Users by Country
                  </CardTitle>
                  <CardDescription>
                    Extract verified and famous users from specific countries
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Country *</Label>
                      <Select 
                        value={famousForm.country_code} 
                        onValueChange={(v) => setFamousForm({ ...famousForm, country_code: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country..." />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={famousForm.category} 
                        onValueChange={(v) => setFamousForm({ ...famousForm, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Min Followers</Label>
                      <Input
                        type="number"
                        value={famousForm.min_followers}
                        onChange={(e) => setFamousForm({ ...famousForm, min_followers: e.target.value })}
                        placeholder="100000"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleExtract("famous_by_country", {
                      country_code: famousForm.country_code,
                      category: famousForm.category === "all" ? null : famousForm.category,
                      min_followers: parseInt(famousForm.min_followers) || 100000,
                    })} 
                    disabled={loading || !famousForm.country_code}
                    variant="hero"
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Star className="h-4 w-4 mr-2" />}
                    Extract Famous Users
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customer Analysis Tab */}
            <TabsContent value="customer">
              <Card variant="glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Full Customer Analysis
                  </CardTitle>
                  <CardDescription>
                    Analyze multiple accounts: followers, following, posts, engagement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Usernames (one per line) *</Label>
                    <Textarea
                      value={customerForm.usernames}
                      onChange={(e) => setCustomerForm({ ...customerForm, usernames: e.target.value })}
                      placeholder="username1&#10;username2&#10;username3"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      {customerForm.usernames.split("\n").filter(u => u.trim()).length} usernames entered
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleExtract("customer_analysis", {
                      usernames: customerForm.usernames.split("\n").map(u => u.trim()).filter(u => u),
                    })} 
                    disabled={loading || !customerForm.usernames.trim()}
                    variant="hero"
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                    Analyze Customers
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Competitor Analysis Tab */}
            <TabsContent value="competitor">
              <Card variant="glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Competitor Analysis by Country
                  </CardTitle>
                  <CardDescription>
                    Deep analysis of competitors with market insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Competitor Usernames (comma separated) *</Label>
                      <Input
                        value={competitorForm.competitor_usernames}
                        onChange={(e) => setCompetitorForm({ ...competitorForm, competitor_usernames: e.target.value })}
                        placeholder="competitor1, competitor2, competitor3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country Focus</Label>
                      <Select 
                        value={competitorForm.country_code} 
                        onValueChange={(v) => setCompetitorForm({ ...competitorForm, country_code: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Global" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          {countries.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleExtract("competitor_analysis", {
                      competitor_usernames: competitorForm.competitor_usernames.split(",").map(u => u.trim()).filter(u => u),
                      country_code: competitorForm.country_code || null,
                    })} 
                    disabled={loading || !competitorForm.competitor_usernames.trim()}
                    variant="hero"
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                    Analyze Competitors
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Results Display */}
          {results && (
            <Card variant="glass" className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analysis Results
                  <Badge className="ml-2">{results.type.replace("_", " ")}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.type === "niche_customers" && results.data && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.statistics?.total_found || 0}</p>
                        <p className="text-xs text-muted-foreground">Total Found</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.statistics?.avg_followers?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">Avg Followers</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.statistics?.avg_engagement || 0}%</p>
                        <p className="text-xs text-muted-foreground">Avg Engagement</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.statistics?.business_accounts || 0}</p>
                        <p className="text-xs text-muted-foreground">Business Accounts</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.statistics?.personal_accounts || 0}</p>
                        <p className="text-xs text-muted-foreground">Personal Accounts</p>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-auto">
                      <div className="grid gap-2">
                        {results.data.customers?.slice(0, 10).map((c: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                            <div>
                              <p className="font-medium">@{c.username}</p>
                              <p className="text-xs text-muted-foreground">{c.country}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>{c.follower_count?.toLocaleString()} followers</span>
                              <span>{c.engagement_rate}% eng.</span>
                              <Badge variant={c.is_business ? "default" : "secondary"}>
                                {c.is_business ? "Business" : "Personal"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {results.type === "hashtag_analytics" && results.data && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.total_posts?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">Total Posts</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.daily_posts?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">Daily Posts</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.avg_likes?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">Avg Likes</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.difficulty_score || 0}</p>
                        <p className="text-xs text-muted-foreground">Difficulty Score</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Related Hashtags</p>
                      <div className="flex flex-wrap gap-2">
                        {results.data.related_hashtags?.slice(0, 10).map((h: any, i: number) => (
                          <Badge key={i} variant="outline">#{h.tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {results.type === "famous_by_country" && results.data && (
                  <div className="max-h-96 overflow-auto">
                    <div className="grid gap-2">
                      {results.data.map((u: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                          <div className="flex items-center gap-3">
                            {u.verified && <Badge className="bg-blue-500/20 text-blue-400">✓ Verified</Badge>}
                            <div>
                              <p className="font-medium">@{u.username}</p>
                              <p className="text-xs text-muted-foreground">{u.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span>{u.follower_count?.toLocaleString()} followers</span>
                            <span>{u.engagement_rate}% eng.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.type === "customer_analysis" && results.data && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.summary?.total_analyzed || 0}</p>
                        <p className="text-xs text-muted-foreground">Analyzed</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.summary?.avg_followers?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">Avg Followers</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.summary?.avg_engagement || 0}%</p>
                        <p className="text-xs text-muted-foreground">Avg Engagement</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 text-center">
                        <p className="text-2xl font-bold">{results.data.summary?.business_ratio || 0}%</p>
                        <p className="text-xs text-muted-foreground">Business Ratio</p>
                      </div>
                    </div>
                  </div>
                )}

                {results.type === "competitor_analysis" && results.data && (
                  <div className="space-y-4">
                    <div className="max-h-64 overflow-auto">
                      {results.data.competitors?.map((c: any, i: number) => (
                        <div key={i} className="p-4 rounded-lg bg-secondary/30 mb-2">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">@{c.username}</p>
                            <Badge>{c.growth_rate_30d}% growth</Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            <span>{c.follower_count?.toLocaleString()} followers</span>
                            <span>{c.engagement_rate}% eng.</span>
                            <span>{c.posting_frequency}</span>
                            <span>{c.audience_overlap}% overlap</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {results.data.market_analysis?.recommendations && (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="font-medium mb-2">Recommendations</p>
                        <ul className="text-sm space-y-1">
                          {results.data.market_analysis.recommendations.map((r: string, i: number) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
