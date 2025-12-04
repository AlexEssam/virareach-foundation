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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Database, 
  Plus, 
  Download, 
  Trash2, 
  MapPin, 
  Building, 
  ShoppingBag, 
  Home, 
  BookOpen,
  ShoppingCart,
  Store,
  RefreshCw,
  Plane,
  BadgeCheck,
  Newspaper,
  Tag,
  Map,
  Gavel,
  Stethoscope,
  HeartPulse,
  Bed,
  Hotel,
  Users
} from "lucide-react";
import { SiFacebook } from "@icons-pack/react-simple-icons";

interface B2BSource {
  id: string;
  name: string;
  icon: string;
  description: string;
  countries: string[];
  category?: string;
}

interface Extraction {
  id: string;
  extraction_name: string;
  source: string;
  source_url: string | null;
  search_query: string | null;
  location: string | null;
  category: string | null;
  status: string;
  result_count: number;
  results: unknown[];
  created_at: string;
  completed_at: string | null;
}

const B2BDataCenter = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState<B2BSource[]>([]);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [selectedSource, setSelectedSource] = useState<B2BSource | null>(null);
  const [extractionName, setExtractionName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadSources();
      loadExtractions();
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const loadSources = async () => {
    try {
      const response = await supabase.functions.invoke('b2b-extract', {
        body: { action: 'get_sources' }
      });
      if (response.data?.sources) {
        setSources(response.data.sources);
      }
    } catch (error) {
      console.error('Error loading sources:', error);
    }
  };

  const loadExtractions = async () => {
    try {
      const response = await supabase.functions.invoke('b2b-extract', {
        body: { action: 'get_extractions' }
      });
      if (response.data?.extractions) {
        setExtractions(response.data.extractions);
      }
    } catch (error) {
      console.error('Error loading extractions:', error);
    }
  };

  const createExtraction = async () => {
    if (!selectedSource || !extractionName) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('b2b-extract', {
        body: {
          action: 'create_extraction',
          extraction_name: extractionName,
          source: selectedSource.id,
          source_url: sourceUrl || undefined,
          search_query: searchQuery || undefined,
          location: location || undefined,
          category: category || undefined
        }
      });

      if (response.error) throw response.error;

      toast({ title: "Extraction created successfully" });
      resetForm();
      setDialogOpen(false);
      loadExtractions();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: "Error creating extraction", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExtraction = async (id: string) => {
    try {
      const response = await supabase.functions.invoke('b2b-extract', {
        body: { action: 'delete_extraction', extraction_id: id }
      });
      if (response.error) throw response.error;
      toast({ title: "Extraction deleted" });
      loadExtractions();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: "Error deleting extraction", description: errorMessage, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setExtractionName("");
    setSearchQuery("");
    setLocation("");
    setCategory("");
    setSourceUrl("");
    setSelectedSource(null);
  };

  const getSourceIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'facebook': <SiFacebook className="h-6 w-6" color="#1877F2" />,
      'shopping-bag': <ShoppingBag className="h-6 w-6 text-orange-500" />,
      'store': <Store className="h-6 w-6 text-green-500" />,
      'map-pin': <MapPin className="h-6 w-6 text-red-500" />,
      'building': <Building className="h-6 w-6 text-blue-500" />,
      'shopping-cart': <ShoppingCart className="h-6 w-6 text-purple-500" />,
      'home': <Home className="h-6 w-6 text-amber-500" />,
      'book-open': <BookOpen className="h-6 w-6 text-yellow-500" />,
      'plane': <Plane className="h-6 w-6 text-sky-500" />,
      'verified': <BadgeCheck className="h-6 w-6 text-emerald-500" />,
      'newspaper': <Newspaper className="h-6 w-6 text-slate-500" />,
      'tag': <Tag className="h-6 w-6 text-pink-500" />,
      'map': <Map className="h-6 w-6 text-teal-500" />,
      'gavel': <Gavel className="h-6 w-6 text-indigo-500" />,
      'stethoscope': <Stethoscope className="h-6 w-6 text-red-400" />,
      'heart-pulse': <HeartPulse className="h-6 w-6 text-rose-500" />,
      'bed': <Bed className="h-6 w-6 text-violet-500" />,
      'hotel': <Hotel className="h-6 w-6 text-cyan-500" />,
      'users': <Users className="h-6 w-6 text-primary" />
    };
    return icons[iconName] || <Database className="h-6 w-6" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      running: "default",
      completed: "outline",
      failed: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getSourceName = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    return source?.name || sourceId;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Database className="h-8 w-8" />
                B2B Data Center
              </h1>
              <p className="text-muted-foreground mt-2">Extract business data from multiple sources</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Extraction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Extraction</DialogTitle>
                  <DialogDescription>Select a source and configure your extraction</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Extraction Name *</Label>
                    <Input
                      value={extractionName}
                      onChange={(e) => setExtractionName(e.target.value)}
                      placeholder="My B2B Extraction"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select Source *</Label>
                    <Select 
                      value={selectedSource?.id || ""} 
                      onValueChange={(v) => setSelectedSource(sources.find(s => s.id === v) || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            <div className="flex items-center gap-2">
                              {getSourceIcon(source.icon)}
                              <span>{source.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSource && (
                      <p className="text-xs text-muted-foreground">
                        {selectedSource.description} • Available in: {selectedSource.countries.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Search Query</Label>
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="restaurants, hotels, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Dubai, Riyadh, etc."
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Real Estate, Automotive, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Source URL (optional)</Label>
                      <Input
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button onClick={createExtraction} disabled={isLoading}>
                      {isLoading ? "Creating..." : "Create Extraction"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="sources" className="space-y-6">
            <TabsList>
              <TabsTrigger value="sources">Data Sources</TabsTrigger>
              <TabsTrigger value="extractions">My Extractions</TabsTrigger>
            </TabsList>

            <TabsContent value="sources">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {sources.map((source) => (
                  <Card key={source.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { setSelectedSource(source); setDialogOpen(true); }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        {getSourceIcon(source.icon)}
                        <CardTitle className="text-lg">{source.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{source.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {source.countries.slice(0, 3).map((country) => (
                          <Badge key={country} variant="secondary" className="text-xs">
                            {country}
                          </Badge>
                        ))}
                        {source.countries.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{source.countries.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="extractions">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Extraction History</CardTitle>
                    <CardDescription>View and manage your B2B data extractions</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadExtractions}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {extractions.length === 0 ? (
                    <div className="text-center py-8">
                      <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Extractions Yet</h3>
                      <p className="text-muted-foreground mb-4">Create your first extraction to get started</p>
                      <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Extraction
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {extractions.map((extraction) => (
                        <div key={extraction.id} className="border rounded-lg p-4 flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{extraction.extraction_name}</h4>
                              {getStatusBadge(extraction.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Source: {getSourceName(extraction.source)}
                              {extraction.location && ` • Location: ${extraction.location}`}
                              {extraction.search_query && ` • Query: ${extraction.search_query}`}
                            </p>
                            <div className="flex gap-4 mt-2 text-sm">
                              <span>Results: {extraction.result_count}</span>
                              <span className="text-muted-foreground">
                                Created: {new Date(extraction.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {extraction.result_count > 0 && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Export
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => deleteExtraction(extraction.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

export default B2BDataCenter;
