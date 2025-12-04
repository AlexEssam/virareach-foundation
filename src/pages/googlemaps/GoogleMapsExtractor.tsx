import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Search, Building2, Phone, Star, Globe, Clock, Download, FileSpreadsheet, Loader2 } from "lucide-react";

interface Extraction {
  id: string;
  extraction_name: string;
  extraction_type: string;
  niche: string | null;
  city: string | null;
  country: string | null;
  status: string;
  result_count: number;
  created_at: string;
}

const extractionTypes = [
  { value: "businesses", label: "Extract Businesses", icon: Building2 },
  { value: "reviews", label: "Extract Reviews", icon: Star },
  { value: "contacts", label: "Extract Contacts", icon: Phone },
];

export default function GoogleMapsExtractor() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  
  const [extractionName, setExtractionName] = useState("");
  const [extractionType, setExtractionType] = useState("businesses");
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchExtractions();
    }
  }, [user]);

  const fetchExtractions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("google_maps_extractions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      toast.error("Failed to fetch extractions");
    } else {
      setExtractions(data || []);
    }
    setLoading(false);
  };

  const handleExtract = async () => {
    if (!extractionName.trim()) {
      toast.error("Please enter an extraction name");
      return;
    }

    if (extractionType === "businesses" && !niche && !searchQuery) {
      toast.error("Please enter a niche or search query");
      return;
    }

    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-maps-extract", {
        body: {
          action: "extract_businesses",
          params: {
            extraction_name: extractionName,
            extraction_type: extractionType,
            niche,
            city,
            country,
            search_query: searchQuery,
          },
        },
      });

      if (error) throw error;
      toast.success(`Extraction started: ${data.result_count} results found`);
      fetchExtractions();
      setExtractionName("");
      setNiche("");
      setCity("");
      setCountry("");
      setSearchQuery("");
    } catch (error: any) {
      toast.error(error.message || "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const handleExport = async (extractionId: string, format: "csv" | "excel") => {
    try {
      const { data, error } = await supabase.functions.invoke("google-maps-export", {
        body: {
          extraction_id: extractionId,
          format,
        },
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data.content], { type: format === "csv" ? "text/csv" : "application/vnd.ms-excel" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `extraction_${extractionId}.${format === "csv" ? "csv" : "xlsx"}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported to ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(error.message || "Export failed");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              Google Maps Extractor
            </h1>
            <p className="text-muted-foreground mt-2">
              Extract business information, reviews, and contacts from Google Maps
            </p>
          </div>

          {/* Extraction Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                New Extraction
              </CardTitle>
              <CardDescription>
                Search and extract business data from Google Maps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Extraction Name</Label>
                  <Input
                    placeholder="e.g., Restaurants NYC"
                    value={extractionName}
                    onChange={(e) => setExtractionName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Extraction Type</Label>
                  <Select value={extractionType} onValueChange={setExtractionType}>
                    <SelectTrigger>
                      <SelectValue />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Niche/Category</Label>
                  <Input
                    placeholder="e.g., restaurants, hotels"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    placeholder="e.g., New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    placeholder="e.g., United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Search Query (Optional)</Label>
                <Input
                  placeholder="e.g., best pizza near Times Square"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button onClick={handleExtract} disabled={extracting} className="w-full">
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Start Extraction
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Extraction Features */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">Business Info</p>
                  <p className="text-sm text-muted-foreground">Name, address, category</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Phone className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium">Contact Details</p>
                  <p className="text-sm text-muted-foreground">Phone, website, email</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="font-medium">Ratings & Reviews</p>
                  <p className="text-sm text-muted-foreground">All customer reviews</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-medium">Opening Hours</p>
                  <p className="text-sm text-muted-foreground">Full schedule data</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Extraction History */}
          <Card>
            <CardHeader>
              <CardTitle>Extraction History</CardTitle>
              <CardDescription>Your recent Google Maps extractions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : extractions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No extractions yet. Start your first extraction above.
                </p>
              ) : (
                <div className="space-y-4">
                  {extractions.map((extraction) => (
                    <div
                      key={extraction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{extraction.extraction_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{extraction.extraction_type}</Badge>
                          {extraction.niche && <span>• {extraction.niche}</span>}
                          {extraction.city && <span>• {extraction.city}</span>}
                          {extraction.country && <span>• {extraction.country}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(extraction.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge
                            variant={
                              extraction.status === "completed"
                                ? "default"
                                : extraction.status === "processing"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {extraction.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {extraction.result_count} results
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(extraction.id, "csv")}
                            disabled={extraction.status !== "completed"}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(extraction.id, "excel")}
                            disabled={extraction.status !== "completed"}
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-1" />
                            Excel
                          </Button>
                        </div>
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
