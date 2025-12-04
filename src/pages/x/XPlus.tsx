import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, Activity, Tag, MessageCircle, TrendingUp, Users, 
  AtSign, Sparkles, Play, Loader2, BarChart3, Zap
} from "lucide-react";
import { SiX } from "@icons-pack/react-simple-icons";

export default function XPlus() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const [activityForm, setActivityForm] = useState({ account_username: "" });
  const [tagForm, setTagForm] = useState({ comments: "", keywords: "" });
  const [engageForm, setEngageForm] = useState({ users: "", niche: "", tone: "friendly" });
  const [trendForm, setTrendForm] = useState({ topic: "", volume: "1000", style: "casual" });
  const [demoForm, setDemoForm] = useState({ users_data: "" });
  const [mentionForm, setMentionForm] = useState({ context: "", users: "", goal: "" });

  const callAI = async (action: string, params: any) => {
    setLoading(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("x-plus-ai", {
        body: { action, ...params },
      });

      if (error) throw error;
      setResults(data);
      toast({ title: "AI Analysis Complete", description: "Results are ready" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleActivityAnalysis = () => {
    callAI("analyze_activity", {
      account_username: activityForm.account_username,
      recent_tweets: [
        { text: "Sample tweet 1", likes: 100, retweets: 20 },
        { text: "Sample tweet 2", likes: 50, retweets: 10 },
      ],
    });
  };

  const handleTagCustomers = () => {
    const comments = tagForm.comments.split("\n").filter(Boolean).map((c, i) => ({
      id: i,
      username: `user_${i}`,
      text: c,
    }));
    callAI("tag_interested_customers", {
      comments,
      product_keywords: tagForm.keywords.split(",").map((k) => k.trim()),
    });
  };

  const handleAutoEngage = () => {
    const users = engageForm.users.split("\n").filter(Boolean).map((u) => ({
      username: u.trim(),
      bio: "Sample bio",
      followers: Math.floor(Math.random() * 10000),
    }));
    callAI("auto_engage_first_tweet", {
      target_users: users,
      niche: engageForm.niche,
      tone: engageForm.tone,
    });
  };

  const handleTrendBooster = () => {
    callAI("trend_booster_generate", {
      topic: trendForm.topic,
      target_volume: parseInt(trendForm.volume),
      style: trendForm.style,
    });
  };

  const handleDemographicAnalysis = () => {
    const users = demoForm.users_data.split("\n").filter(Boolean).map((u, i) => ({
      username: u.trim(),
      bio: "Tech enthusiast | Startup founder",
      location: ["USA", "UK", "Canada", "Germany"][i % 4],
      followers: Math.floor(Math.random() * 50000),
    }));
    callAI("demographic_analysis", { users_data: users });
  };

  const handleSmartMention = () => {
    const users = mentionForm.users.split(",").map((u) => u.trim()).filter(Boolean);
    callAI("smart_mention_generator", {
      tweet_context: mentionForm.context,
      target_users: users,
      goal: mentionForm.goal,
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <SiX className="h-8 w-8" />
              <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">X Plus AI</h1>
              <p className="text-muted-foreground">Advanced AI-powered automation features</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">6</p>
                <p className="text-xs text-muted-foreground">Advanced tools</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  AI Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>Gemini 2.5 Flash</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="activity">
            <TabsList className="grid grid-cols-6 h-auto">
              <TabsTrigger value="activity" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Monitor
              </TabsTrigger>
              <TabsTrigger value="tag" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                Tag
              </TabsTrigger>
              <TabsTrigger value="engage" className="text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                Engage
              </TabsTrigger>
              <TabsTrigger value="trend" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trend
              </TabsTrigger>
              <TabsTrigger value="demo" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Demo
              </TabsTrigger>
              <TabsTrigger value="mention" className="text-xs">
                <AtSign className="h-3 w-3 mr-1" />
                Mention
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Real-time Activity Monitor
                    </CardTitle>
                    <CardDescription>AI monitors account health and activity patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Account Username</Label>
                      <Input
                        value={activityForm.account_username}
                        onChange={(e) => setActivityForm({ account_username: e.target.value })}
                        placeholder="@username"
                      />
                    </div>
                    <Button onClick={handleActivityAnalysis} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                      Analyze Activity
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results?.analysis ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.analysis}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Run analysis to see results</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tag">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      AI Customer Tagging
                    </CardTitle>
                    <CardDescription>Identify interested customers from comments</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Comments (one per line)</Label>
                      <Textarea
                        value={tagForm.comments}
                        onChange={(e) => setTagForm({ ...tagForm, comments: e.target.value })}
                        placeholder="I love this product!&#10;Where can I buy this?&#10;This looks amazing!"
                        className="h-32"
                      />
                    </div>
                    <div>
                      <Label>Product Keywords (comma separated)</Label>
                      <Input
                        value={tagForm.keywords}
                        onChange={(e) => setTagForm({ ...tagForm, keywords: e.target.value })}
                        placeholder="SaaS, marketing tool, automation"
                      />
                    </div>
                    <Button onClick={handleTagCustomers} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Tag className="h-4 w-4 mr-2" />}
                      Tag Interested Customers
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tagged Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results?.tagged_customers ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.tagged_customers}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Analyze comments to see tagged customers</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="engage">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      AI Auto-Engage
                    </CardTitle>
                    <CardDescription>Generate personalized first-tweet engagement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Target Users (one per line)</Label>
                      <Textarea
                        value={engageForm.users}
                        onChange={(e) => setEngageForm({ ...engageForm, users: e.target.value })}
                        placeholder="elonmusk&#10;sama&#10;OpenAI"
                        className="h-24"
                      />
                    </div>
                    <div>
                      <Label>Niche/Industry</Label>
                      <Input
                        value={engageForm.niche}
                        onChange={(e) => setEngageForm({ ...engageForm, niche: e.target.value })}
                        placeholder="AI, Tech, Startup"
                      />
                    </div>
                    <div>
                      <Label>Tone</Label>
                      <Select value={engageForm.tone} onValueChange={(v) => setEngageForm({ ...engageForm, tone: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="witty">Witty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAutoEngage} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                      Generate Engagement Plan
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results?.engagement_plan ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.engagement_plan}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Generate plan to see engagement strategies</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trend">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Trend Booster
                    </CardTitle>
                    <CardDescription>Generate mass tweet templates (500-1M accounts)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Topic / Hashtag</Label>
                      <Input
                        value={trendForm.topic}
                        onChange={(e) => setTrendForm({ ...trendForm, topic: e.target.value })}
                        placeholder="#YourTrend or topic description"
                      />
                    </div>
                    <div>
                      <Label>Target Volume</Label>
                      <Select value={trendForm.volume} onValueChange={(v) => setTrendForm({ ...trendForm, volume: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">500 tweets</SelectItem>
                          <SelectItem value="1000">1,000 tweets</SelectItem>
                          <SelectItem value="10000">10,000 tweets</SelectItem>
                          <SelectItem value="100000">100,000 tweets</SelectItem>
                          <SelectItem value="500000">500,000 tweets</SelectItem>
                          <SelectItem value="1000000">1,000,000 tweets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Style</Label>
                      <Select value={trendForm.style} onValueChange={(v) => setTrendForm({ ...trendForm, style: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="viral">Viral/Meme</SelectItem>
                          <SelectItem value="news">News Style</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleTrendBooster} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                      Generate Tweet Templates
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tweet Templates</CardTitle>
                    {results?.estimated_reach && (
                      <Badge variant="secondary">Est. Reach: {results.estimated_reach.toLocaleString()}</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    {results?.templates ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.templates}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Generate templates to see results</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="demo">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      AI Demographic Analyzer
                    </CardTitle>
                    <CardDescription>Analyze customer demographics and interests</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>User List (one username per line)</Label>
                      <Textarea
                        value={demoForm.users_data}
                        onChange={(e) => setDemoForm({ users_data: e.target.value })}
                        placeholder="user1&#10;user2&#10;user3"
                        className="h-32"
                      />
                    </div>
                    <Button onClick={handleDemographicAnalysis} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
                      Analyze Demographics
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Demographic Insights</CardTitle>
                    {results?.confidence_score && (
                      <Badge variant="secondary">Confidence: {(results.confidence_score * 100).toFixed(0)}%</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    {results?.demographics ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.demographics}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Analyze users to see demographics</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="mention">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AtSign className="h-5 w-5" />
                      AI Smart Mentions
                    </CardTitle>
                    <CardDescription>Generate strategic mention tweets</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Tweet Context / Topic</Label>
                      <Textarea
                        value={mentionForm.context}
                        onChange={(e) => setMentionForm({ ...mentionForm, context: e.target.value })}
                        placeholder="Describe the tweet topic or context..."
                        className="h-20"
                      />
                    </div>
                    <div>
                      <Label>Users to Mention (comma separated)</Label>
                      <Input
                        value={mentionForm.users}
                        onChange={(e) => setMentionForm({ ...mentionForm, users: e.target.value })}
                        placeholder="@user1, @user2, @user3"
                      />
                    </div>
                    <div>
                      <Label>Goal</Label>
                      <Select value={mentionForm.goal} onValueChange={(v) => setMentionForm({ ...mentionForm, goal: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engagement">Get Engagement</SelectItem>
                          <SelectItem value="collaboration">Propose Collaboration</SelectItem>
                          <SelectItem value="awareness">Brand Awareness</SelectItem>
                          <SelectItem value="conversation">Start Conversation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSmartMention} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AtSign className="h-4 w-4 mr-2" />}
                      Generate Mention Tweets
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Generated Mentions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results?.mention_tweets ? (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
                        {results.mention_tweets}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Generate mentions to see results</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
