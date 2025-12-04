import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Users, Building2, GraduationCap, UserCheck, MessageSquare, Mail, Loader2 } from "lucide-react";

interface Extraction {
  id: string;
  extraction_type: string;
  source: string | null;
  status: string;
  result_count: number | null;
  created_at: string;
}

const extractionTypes = [
  { value: "customers", label: "Customers", icon: Users, description: "Extract customers from a company" },
  { value: "companies", label: "Companies", icon: Building2, description: "Search and extract companies" },
  { value: "universities", label: "Universities", icon: GraduationCap, description: "Extract university data" },
  { value: "colleagues", label: "Colleagues", icon: UserCheck, description: "Extract employees from a company" },
  { value: "post_commenters", label: "Post Commenters", icon: MessageSquare, description: "Extract users who engaged with a post" },
  { value: "emails_by_interest", label: "Emails by Interest", icon: Mail, description: "Find emails by interest and country" },
];

export default function LinkedInExtract() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [extractionType, setExtractionType] = useState("customers");
  const [companyUrl, setCompanyUrl] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [interest, setInterest] = useState("");

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
    const { data, error } = await supabase.functions.invoke('linkedin-extract', {
      body: { action: 'history' }
    });
    if (data?.extractions) setExtractions(data.extractions);
  };

  const handleExtract = async () => {
    setLoading(true);
    try {
      let body: any = { action: extractionType };
      
      switch (extractionType) {
        case 'customers':
        case 'colleagues':
          if (!companyUrl) {
            toast({ title: "Error", description: "Please enter a company URL", variant: "destructive" });
            return;
          }
          body.company_url = companyUrl;
          break;
        case 'companies':
          if (!keyword) {
            toast({ title: "Error", description: "Please enter a search keyword", variant: "destructive" });
            return;
          }
          body = { ...body, keyword, industry, location: country };
          break;
        case 'universities':
          body = { ...body, country, field: interest };
          break;
        case 'post_commenters':
          if (!postUrl) {
            toast({ title: "Error", description: "Please enter a post URL", variant: "destructive" });
            return;
          }
          body.post_url = postUrl;
          break;
        case 'emails_by_interest':
          if (!interest) {
            toast({ title: "Error", description: "Please enter an interest", variant: "destructive" });
            return;
          }
          body = { ...body, interest, country };
          break;
      }

      const { data, error } = await supabase.functions.invoke('linkedin-extract', { body });

      if (error) throw error;

      toast({ title: "Extraction Complete", description: `Extracted ${data.count} results` });
      fetchExtractions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">LinkedIn Extract Center</h1>
            <p className="text-muted-foreground mt-2">Extract customers, companies, universities, and emails</p>
          </div>

          <Tabs value={extractionType} onValueChange={setExtractionType} className="space-y-6">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
              {extractionTypes.map((type) => (
                <TabsTrigger key={type.value} value={type.value} className="text-xs">
                  <type.icon className="h-4 w-4 mr-1" />
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="customers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Extract Customers</CardTitle>
                  <CardDescription>Find customers who follow or engage with a company</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company LinkedIn URL</Label>
                    <Input
                      placeholder="https://linkedin.com/company/example"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleExtract} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Extract Customers
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="companies" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search Companies</CardTitle>
                  <CardDescription>Find companies by keyword, industry, and location</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Keyword</Label>
                      <Input
                        placeholder="e.g., SaaS, Marketing"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                          <SelectItem value="fr">France</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleExtract} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Search Companies
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="universities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Extract Universities</CardTitle>
                  <CardDescription>Find universities by country and field of study</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Field of Study</Label>
                      <Input
                        placeholder="e.g., Computer Science, Business"
                        value={interest}
                        onChange={(e) => setInterest(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleExtract} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Extract Universities
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colleagues" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Extract Colleagues</CardTitle>
                  <CardDescription>Find employees working at a specific company</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company LinkedIn URL</Label>
                    <Input
                      placeholder="https://linkedin.com/company/example"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleExtract} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Extract Colleagues
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="post_commenters" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Extract Post Commenters</CardTitle>
                  <CardDescription>Find users who engaged with a LinkedIn post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Post URL</Label>
                    <Input
                      placeholder="https://linkedin.com/posts/..."
                      value={postUrl}
                      onChange={(e) => setPostUrl(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleExtract} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Extract Engagers
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emails_by_interest" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Extract Emails by Interest</CardTitle>
                  <CardDescription>Find email addresses based on interest and country</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Interest/Topic</Label>
                      <Input
                        placeholder="e.g., Marketing, AI, Crypto"
                        value={interest}
                        onChange={(e) => setInterest(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                          <SelectItem value="fr">France</SelectItem>
                          <SelectItem value="global">Global</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleExtract} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Extract Emails
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Recent Extractions</CardTitle>
              <CardDescription>Your extraction history</CardDescription>
            </CardHeader>
            <CardContent>
              {extractions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No extractions yet</p>
              ) : (
                <div className="space-y-3">
                  {extractions.map((extraction) => (
                    <div key={extraction.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium capitalize">{extraction.extraction_type.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {extraction.source || 'N/A'} • {new Date(extraction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={extraction.status === 'completed' ? 'default' : 'secondary'}>
                          {extraction.status}
                        </Badge>
                        <span className="text-sm font-medium">{extraction.result_count || 0} results</span>
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
