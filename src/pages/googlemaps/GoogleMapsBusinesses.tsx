import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Search, Phone, Globe, Star, MapPin, Trash2, Loader2, ExternalLink } from "lucide-react";

interface Business {
  id: string;
  business_name: string;
  phone_number: string | null;
  rating: number | null;
  address: string | null;
  website: string | null;
  category: string | null;
  review_count: number;
  email: string | null;
  created_at: string;
}

export default function GoogleMapsBusinesses() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBusinesses();
    }
  }, [user]);

  const fetchBusinesses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("google_maps_businesses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Failed to fetch businesses");
    } else {
      setBusinesses(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("google_maps_businesses")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete business");
    } else {
      toast.success("Business deleted");
      setBusinesses(businesses.filter((b) => b.id !== id));
    }
  };

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              Extracted Businesses
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage all extracted business data
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{businesses.length}</p>
                  <p className="text-sm text-muted-foreground">Total Businesses</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Phone className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {businesses.filter((b) => b.phone_number).length}
                  </p>
                  <p className="text-sm text-muted-foreground">With Phone</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {businesses.filter((b) => b.website).length}
                  </p>
                  <p className="text-sm text-muted-foreground">With Website</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {businesses.length > 0
                      ? (
                          businesses.reduce((acc, b) => acc + (b.rating || 0), 0) /
                          businesses.filter((b) => b.rating).length
                        ).toFixed(1)
                      : "0"}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Business Directory</CardTitle>
                  <CardDescription>All extracted businesses from Google Maps</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search businesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredBusinesses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No businesses found. Start extracting from the Extractor page.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBusinesses.map((business) => (
                        <TableRow key={business.id}>
                          <TableCell className="font-medium">
                            {business.business_name}
                          </TableCell>
                          <TableCell>
                            {business.category && (
                              <Badge variant="outline">{business.category}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {business.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span>{business.rating}</span>
                                <span className="text-muted-foreground text-sm">
                                  ({business.review_count})
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {business.phone_number && (
                              <a
                                href={`tel:${business.phone_number}`}
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" />
                                {business.phone_number}
                              </a>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {business.address && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{business.address}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {business.website && (
                              <a
                                href={business.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Visit
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(business.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
