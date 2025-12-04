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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Users, ThumbsUp, MessageCircle, Share2, UserPlus, Loader2, History } from "lucide-react";

interface Extraction {
  id: string;
  extraction_type: string;
  source_url: string | null;
  status: string;
  result_count: number;
  created_at: string;
}

const extractionTypes = [
  { value: "likers", label: "Post Likers", icon: ThumbsUp },
  { value: "commenters", label: "Post Commenters", icon: MessageCircle },
  { value: "sharers", label: "Post Sharers", icon: Share2 },
  { value: "group_members", label: "Group Members", icon: Users },
  { value: "page_fans", label: "Page Fans", icon: UserPlus },
  { value: "active_friends", label: "Active Friends", icon: Users },
  { value: "page_messagers", label: "Page Messagers", icon: MessageCircle },
];

export default function FacebookExtractor() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  
  // Form state
  const [extractionType, setExtractionType] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchExtractions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("facebook_extractions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setExtractions(data || []);
    } catch (error) {
      console.error("Error fetching extractions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExtractions();
    }
  }, [user]);

  const handleExtract = async () => {
    if (!extractionType) {
      toast({
        title: "Error",
        description: "Please select extraction type",
        variant: "destructive",
      });
      return;
    }

    if (!sourceUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter source URL",
        variant: "destructive",
      });
      return;
    }

    setExtracting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("facebook-extract", {
        body: {
          extraction_type: extractionType,
          source_url: sourceUrl,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Extraction Complete",
        description: response.data.message,
      });
      
      setSourceUrl("");
      setExtractionType("");
      fetchExtractions();
    } catch (error: any) {
      console.error("Error extracting:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to extract data",
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const found = extractionTypes.find(t => t.value === type);
    return found?.icon || Users;
  };

  const getTypeLabel = (type: string) => {
    const found = extractionTypes.find(t => t.value === type);
    return found?.label || type;
  };

  if (authLoading || loading) {
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
              <span className="text-gradient">Facebook Extractor</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Extract users from posts, groups, and pages
            </p>
          </header>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Extraction Form */}
            <Card variant="glow" className="animate-fade-in">
              <CardHeader>
                <CardTitle>New Extraction</CardTitle>
                <CardDescription>
                  Select what to extract and provide the source URL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Extraction Type</Label>
                  <Select value={extractionType} onValueChange={setExtractionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {extractionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">Source URL</Label>
                  <Input
                    id="sourceUrl"
                    placeholder="https://facebook.com/..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the post, group, or page URL to extract from
                  </p>
                </div>

                <Button 
                  onClick={handleExtract} 
                  disabled={extracting}
                  className="w-full"
                  variant="hero"
                >
                  {extracting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Start Extraction
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Extraction Types Info */}
            <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <CardTitle>Available Extractions</CardTitle>
                <CardDescription>
                  Types of data you can extract from Facebook
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {extractionTypes.map((type) => (
                    <div 
                      key={type.value}
                      className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center gap-2"
                    >
                      <type.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm">{type.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Extractions */}
          <section className="mt-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Recent Extractions</h2>
            </div>

            {extractions.length === 0 ? (
              <Card variant="glass">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Download className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No extractions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {extractions.map((extraction) => {
                  const Icon = getTypeIcon(extraction.extraction_type);
                  return (
                    <Card key={extraction.id} variant="glass">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{getTypeLabel(extraction.extraction_type)}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {extraction.source_url || "No URL"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge 
                              className={
                                extraction.status === "completed" 
                                  ? "bg-primary/20 text-primary border border-primary/30" 
                                  : extraction.status === "failed"
                                  ? "bg-destructive/20 text-destructive border border-destructive/30"
                                  : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                              }
                            >
                              {extraction.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {extraction.result_count} results
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
