import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Building2, GraduationCap, BarChart3, Loader2, Search, Globe, Users, TrendingUp } from "lucide-react";

interface CompanyAnalysis {
  name: string;
  industry: string;
  size: string;
  location: string;
  followers: number;
  employees_on_linkedin: number;
  growth_rate: string;
  top_skills: string[];
  recent_hires: number;
  departments: { name: string; count: number }[];
}

interface UniversityAnalysis {
  name: string;
  location: string;
  students: number;
  alumni_on_linkedin: number;
  top_employers: string[];
  top_fields: string[];
  employment_rate: string;
  average_salary: string;
}

export default function LinkedInAnalysis() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  
  const [companyUrl, setCompanyUrl] = useState("");
  const [universityUrl, setUniversityUrl] = useState("");
  
  const [companyAnalysis, setCompanyAnalysis] = useState<CompanyAnalysis | null>(null);
  const [universityAnalysis, setUniversityAnalysis] = useState<UniversityAnalysis | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleAnalyzeCompany = async () => {
    if (!companyUrl) {
      toast({ title: "Error", description: "Please enter a company URL", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Simulate company analysis
      const mockAnalysis: CompanyAnalysis = {
        name: "Example Company",
        industry: "Technology",
        size: "1,001-5,000 employees",
        location: "San Francisco, CA",
        followers: Math.floor(Math.random() * 500000) + 10000,
        employees_on_linkedin: Math.floor(Math.random() * 5000) + 500,
        growth_rate: `${(Math.random() * 20 + 5).toFixed(1)}% YoY`,
        top_skills: ["JavaScript", "Python", "Cloud Computing", "Machine Learning", "Product Management"],
        recent_hires: Math.floor(Math.random() * 200) + 50,
        departments: [
          { name: "Engineering", count: Math.floor(Math.random() * 1000) + 200 },
          { name: "Sales", count: Math.floor(Math.random() * 500) + 100 },
          { name: "Marketing", count: Math.floor(Math.random() * 200) + 50 },
          { name: "Product", count: Math.floor(Math.random() * 150) + 30 },
          { name: "HR", count: Math.floor(Math.random() * 100) + 20 },
        ]
      };

      setCompanyAnalysis(mockAnalysis);
      toast({ title: "Analysis Complete" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeUniversity = async () => {
    if (!universityUrl) {
      toast({ title: "Error", description: "Please enter a university URL", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Simulate university analysis
      const mockAnalysis: UniversityAnalysis = {
        name: "Example University",
        location: "Boston, MA",
        students: Math.floor(Math.random() * 30000) + 10000,
        alumni_on_linkedin: Math.floor(Math.random() * 200000) + 50000,
        top_employers: ["Google", "Amazon", "Microsoft", "Meta", "Apple"],
        top_fields: ["Computer Science", "Business Administration", "Engineering", "Economics"],
        employment_rate: `${(Math.random() * 10 + 88).toFixed(1)}%`,
        average_salary: `$${Math.floor(Math.random() * 50000 + 70000).toLocaleString()}`
      };

      setUniversityAnalysis(mockAnalysis);
      toast({ title: "Analysis Complete" });
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
            <h1 className="text-3xl font-bold">Company & University Analysis</h1>
            <p className="text-muted-foreground mt-2">Deep insights into companies and universities on LinkedIn</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="company"><Building2 className="h-4 w-4 mr-2" />Company</TabsTrigger>
              <TabsTrigger value="university"><GraduationCap className="h-4 w-4 mr-2" />University</TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Analyze Company
                  </CardTitle>
                  <CardDescription>Get deep insights into any company on LinkedIn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="https://linkedin.com/company/example"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAnalyzeCompany} disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Analyze
                    </Button>
                  </div>

                  {companyAnalysis && (
                    <div className="mt-6 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{companyAnalysis.name}</h3>
                          <p className="text-muted-foreground">{companyAnalysis.industry} • {companyAnalysis.size}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Globe className="h-4 w-4" />
                            <span className="text-sm">Location</span>
                          </div>
                          <p className="font-medium">{companyAnalysis.location}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">Followers</span>
                          </div>
                          <p className="font-medium">{companyAnalysis.followers.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">Employees on LinkedIn</span>
                          </div>
                          <p className="font-medium">{companyAnalysis.employees_on_linkedin.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm">Growth Rate</span>
                          </div>
                          <p className="font-medium">{companyAnalysis.growth_rate}</p>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Top Skills</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {companyAnalysis.top_skills.map((skill) => (
                                <Badge key={skill} variant="secondary">{skill}</Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Departments</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {companyAnalysis.departments.map((dept) => (
                                <div key={dept.name} className="flex justify-between">
                                  <span className="text-muted-foreground">{dept.name}</span>
                                  <span className="font-medium">{dept.count}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">{companyAnalysis.recent_hires}</span> new hires in the last 6 months
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="university" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Analyze University
                  </CardTitle>
                  <CardDescription>Get insights into university alumni and career outcomes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="https://linkedin.com/school/example"
                      value={universityUrl}
                      onChange={(e) => setUniversityUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAnalyzeUniversity} disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Analyze
                    </Button>
                  </div>

                  {universityAnalysis && (
                    <div className="mt-6 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{universityAnalysis.name}</h3>
                          <p className="text-muted-foreground">{universityAnalysis.location}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">Students</span>
                          </div>
                          <p className="font-medium">{universityAnalysis.students.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">Alumni on LinkedIn</span>
                          </div>
                          <p className="font-medium">{universityAnalysis.alumni_on_linkedin.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm">Employment Rate</span>
                          </div>
                          <p className="font-medium">{universityAnalysis.employment_rate}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <BarChart3 className="h-4 w-4" />
                            <span className="text-sm">Avg. Starting Salary</span>
                          </div>
                          <p className="font-medium">{universityAnalysis.average_salary}</p>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Top Employers</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {universityAnalysis.top_employers.map((employer, i) => (
                                <div key={employer} className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{i + 1}.</span>
                                  <span>{employer}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Top Fields of Study</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {universityAnalysis.top_fields.map((field) => (
                                <Badge key={field} variant="secondary">{field}</Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
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
}
