import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, RefreshCw, Search, Globe } from "lucide-react";
import { SiX } from "@icons-pack/react-simple-icons";

export default function XTrends() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [trends, setTrends] = useState<any[]>([]);
  const [monitorKeyword, setMonitorKeyword] = useState("");
  const [liveTweets, setLiveTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const { toast } = useToast();

  const fetchCountries = async () => {
    const { data } = await supabase.functions.invoke("x-trends", {
      body: { action: "get_countries" },
    });
    setCountries(data?.countries || []);
  };

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("x-trends", {
        body: { action: "get_trends", country_code: selectedCountry },
      });

      if (error) throw error;

      setTrends(data.trends || []);
      toast({
        title: data.cached ? "Trends (Cached)" : "Trends Updated",
        description: `Found ${data.trends?.length || 0} trending topics`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = async () => {
    if (!monitorKeyword.trim()) return;
    
    setMonitoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("x-trends", {
        body: { action: "monitor_keyword", keyword: monitorKeyword },
      });

      if (error) throw error;

      setLiveTweets(data.tweets || []);
      toast({ title: "Monitoring Started", description: `Watching for "${monitorKeyword}"` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchTrends();
    }
  }, [selectedCountry]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <SiX className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">X Trends Monitor</h1>
              <p className="text-muted-foreground">Track trending topics and monitor keywords in real-time</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Topics
                </CardTitle>
                <CardDescription>Top trending topics by country</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-48">
                      <Globe className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={fetchTrends} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {trends.map((trend, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setMonitorKeyword(trend.name.replace("#", ""))}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-8">
                          {trend.rank}
                        </span>
                        <div>
                          <p className="font-medium">{trend.name}</p>
                          {trend.category && (
                            <Badge variant="outline" className="text-xs">
                              {trend.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {trend.tweet_volume?.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">tweets</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Live Keyword Monitor
                </CardTitle>
                <CardDescription>Monitor tweets mentioning a keyword in real-time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={monitorKeyword}
                    onChange={(e) => setMonitorKeyword(e.target.value)}
                    placeholder="Enter keyword to monitor..."
                  />
                  <Button onClick={startMonitoring} disabled={!monitorKeyword.trim()}>
                    Monitor
                  </Button>
                </div>

                {monitoring && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Monitoring "{monitorKeyword}"
                  </div>
                )}

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {liveTweets.map((tweet, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{tweet.display_name}</span>
                        <span className="text-sm text-muted-foreground">@{tweet.username}</span>
                      </div>
                      <p className="text-sm">{tweet.content}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>❤️ {tweet.likes}</span>
                        <span>🔁 {tweet.retweets}</span>
                        <span>💬 {tweet.replies}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
