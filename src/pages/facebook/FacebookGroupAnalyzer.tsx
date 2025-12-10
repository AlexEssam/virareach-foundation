import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { BarChart3, Users, Clock, TrendingUp, Loader2, Search, Link, ArrowRight } from "lucide-react";

interface GroupAnalysis {
  group_id: string;
  name: string;
  members_count: number;
  type: string;
  url: string;
  posts_per_day: number;
  engagement_rate: string;
  top_posting_times: string[];
  admin_count: number;
  recent_growth: string;
  analyzed_at: string;
}

export default function FacebookGroupAnalyzer() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [analysis, setAnalysis] = useState<GroupAnalysis | null>(null);
  
  // Form state
  const [groupUrl, setGroupUrl] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [convertedPostId, setConvertedPostId] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleAnalyze = async () => {
    if (!groupUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group URL",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const response = await supabase.functions.invoke("facebook-analyze", {
        body: { action: "analyze", group_url: groupUrl },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to analyze group";

        throw new Error(rawMessage);
      }

      setAnalysis(response.data?.analysis);
      toast({
        title: "Analysis Complete",
        description: response.data?.message || "Group analysis completed.",
      });
    } catch (error: any) {
      console.error("Error analyzing:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze group",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConvertPostUrl = async () => {
    if (!postUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a post URL",
        variant: "destructive",
      });
      return;
    }

    setConverting(true);
    try {
      const response = await supabase.functions.invoke("facebook-analyze", {
        body: { action: "convert_post_url", post_url: postUrl },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to convert URL";

        throw new Error(rawMessage);
      }

      setConvertedPostId(response.data?.post_id);
      toast({
        title: "Conversion Complete",
        description: `Post ID: ${response.data?.post_id}`,
      });
    } catch (error: any) {
      console.error("Error converting:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert URL",
        variant: "destructive",
      });
    } finally {
      setConverting(false);
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
    <div className="min-h-screen flex bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <header className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Group Analyzer</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Analyze Facebook groups and convert post URLs
            </p>
          </header>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Group Analysis */}
            <Card variant="glow" className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analyze Group
                </CardTitle>
                <CardDescription>
                  Get detailed insights about any Facebook group
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupUrl">Group URL</Label>
                  <Input
                    id="groupUrl"
                    placeholder="https://facebook.com/groups/..."
                    value={groupUrl}
                    onChange={(e) => setGroupUrl(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleAnalyze} 
                  disabled={analyzing}
                  className="w-full"
                  variant="hero"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Analyze Group
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* URL Converter */}
            <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Post URL → ID
                </CardTitle>
                <CardDescription>
                  Convert a Facebook post URL to its Post ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="postUrl">Post URL</Label>
                  <Input
                    id="postUrl"
                    placeholder="https://facebook.com/.../posts/..."
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleConvertPostUrl} 
                  disabled={converting}
                  className="w-full"
                  variant="glow"
                >
                  {converting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Convert to ID
                    </>
                  )}
                </Button>

                {convertedPostId && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm text-muted-foreground">Post ID:</p>
                    <p className="font-mono text-primary">{convertedPostId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <section className="mt-8 animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
              
              <Card variant="glass">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold">{analysis.name}</h3>
                      <p className="text-muted-foreground">{analysis.url}</p>
                    </div>
                    <Badge className="bg-primary/20 text-primary border border-primary/30">
                      {analysis.type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                      <Users className="h-5 w-5 text-primary mb-2" />
                      <p className="text-2xl font-bold">{analysis.members_count.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Members</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                      <BarChart3 className="h-5 w-5 text-primary mb-2" />
                      <p className="text-2xl font-bold">{analysis.posts_per_day}</p>
                      <p className="text-sm text-muted-foreground">Posts/Day</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                      <TrendingUp className="h-5 w-5 text-primary mb-2" />
                      <p className="text-2xl font-bold">{analysis.engagement_rate}</p>
                      <p className="text-sm text-muted-foreground">Engagement</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                      <Users className="h-5 w-5 text-primary mb-2" />
                      <p className="text-2xl font-bold">{analysis.admin_count}</p>
                      <p className="text-sm text-muted-foreground">Admins</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                      <Clock className="h-5 w-5 text-primary mb-2" />
                      <p className="font-medium mb-2">Best Posting Times</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.top_posting_times.map((time, i) => (
                          <Badge key={i} variant="outline">{time}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                      <TrendingUp className="h-5 w-5 text-primary mb-2" />
                      <p className="font-medium mb-2">Recent Growth</p>
                      <p className="text-muted-foreground">{analysis.recent_growth}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}