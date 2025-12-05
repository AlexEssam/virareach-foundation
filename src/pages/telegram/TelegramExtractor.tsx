import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Users, MessageSquare, Archive, Phone, Clock, Eye, UserSearch, Filter, Loader2, RefreshCw, Trash2, Crown, AtSign } from "lucide-react";

interface Extraction {
  id: string;
  extraction_type: string;
  source: string | null;
  status: string;
  result_count: number | null;
  results: Record<string, unknown>[] | null;
  created_at: string;
}

interface TelegramAccount {
  id: string;
  phone_number: string;
  account_name: string | null;
  status: string;
}

const extractionTypes = [
  { value: "group_members", label: "Group Members", icon: Users, description: "Extract all visible members from a group" },
  { value: "group_members_hidden", label: "Hidden Members (Premium)", icon: Eye, description: "Extract hidden members using premium methods" },
  { value: "hidden_members_full", label: "Full Hidden Info", icon: UserSearch, description: "Extract complete hidden member profiles" },
  { value: "last_seen", label: "Last Seen Timestamps", icon: Clock, description: "Extract last seen status for users" },
  { value: "messenger_customers", label: "Messenger Customers", icon: MessageSquare, description: "Extract customers who messaged you" },
  { value: "contacts_filtered", label: "Filtered Contacts", icon: Filter, description: "Filter contacts by phone patterns" },
  { value: "chats", label: "Chats List", icon: MessageSquare, description: "Extract all chats from an account" },
  { value: "contacts", label: "All Contacts", icon: Phone, description: "Extract all contacts with phone numbers" },
  { value: "archived", label: "Archived Chats", icon: Archive, description: "Extract archived chats and content" },
];

export default function TelegramExtractor() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [extractionType, setExtractionType] = useState("");
  const [groupLink, setGroupLink] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [extractLimit, setExtractLimit] = useState("all");
  
  // Last seen extraction
  const [usernamesList, setUsernamesList] = useState("");
  
  // Messenger customers
  const [minMessages, setMinMessages] = useState("1");
  const [timeRange, setTimeRange] = useState("30");
  
  // Contact filtering
  const [phonePrefixes, setPhonePrefixes] = useState("");
  const [countryCodes, setCountryCodes] = useState("");
  const [excludePrefixes, setExcludePrefixes] = useState("");
  
  // Auto-refresh state
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Filter state
  const [filterPremium, setFilterPremium] = useState<string>("all");
  const [filterLastSeen, setFilterLastSeen] = useState<string>("all");
  const [filterHasUsername, setFilterHasUsername] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Auto-refresh when there are processing extractions
  useEffect(() => {
    const hasProcessing = extractions.some(e => e.status === 'processing');
    
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchData();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [extractions]);

  const fetchData = async () => {
    const [extractionsRes, accountsRes] = await Promise.all([
      supabase.from('telegram_extractions').select('id, extraction_type, source, status, result_count, results, created_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('telegram_accounts').select('*').eq('status', 'active')
    ]);

    if (extractionsRes.data) setExtractions(extractionsRes.data as Extraction[]);
    if (accountsRes.data) setAccounts(accountsRes.data);
    setLastUpdated(new Date());
  };

  const handleDelete = async (extractionId: string) => {
    try {
      const { error } = await supabase
        .from('telegram_extractions')
        .delete()
        .eq('id', extractionId);
      
      if (error) throw error;
      
      toast({ title: "Deleted", description: "Extraction removed successfully" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete extraction", variant: "destructive" });
    }
  };

  // Filter function for extraction results
  const getFilteredResults = (results: Record<string, unknown>[] | null) => {
    if (!results || results.length === 0) return [];
    
    return results.filter(item => {
      // Premium filter
      if (filterPremium === "premium" && !item.is_premium) return false;
      if (filterPremium === "non-premium" && item.is_premium) return false;
      
      // Last seen filter
      if (filterLastSeen !== "all" && item.last_seen_status !== filterLastSeen) return false;
      
      // Username filter
      if (filterHasUsername === "yes" && !item.username) return false;
      if (filterHasUsername === "no" && item.username) return false;
      
      return true;
    });
  };

  const handleDownload = (extraction: Extraction, format: 'csv' | 'json') => {
    if (!extraction.results || extraction.results.length === 0) {
      toast({ title: "No data", description: "This extraction has no results to download", variant: "destructive" });
      return;
    }

    // Apply filters to results
    const filteredResults = getFilteredResults(extraction.results);
    
    if (filteredResults.length === 0) {
      toast({ title: "No matching data", description: "No results match the current filters", variant: "destructive" });
      return;
    }

    const filename = `${extraction.extraction_type}_${new Date(extraction.created_at).toISOString().split('T')[0]}_filtered`;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filteredResults, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = Object.keys(filteredResults[0] || {});
      const csvRows = [headers.join(',')];
      filteredResults.forEach(row => {
        csvRows.push(headers.map(h => {
          const value = row[h];
          const stringValue = value === null || value === undefined ? '' : String(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({ title: "Downloaded", description: `${filteredResults.length} ${format.toUpperCase()} records downloaded` });
  };

  const handleExtract = async () => {
    if (!extractionType) {
      toast({ title: "Error", description: "Please select an extraction type", variant: "destructive" });
      return;
    }

    // Validation based on extraction type
    if ((extractionType === "group_members" || extractionType === "group_members_hidden" || extractionType === "hidden_members_full") && !groupLink) {
      toast({ title: "Error", description: "Please enter a group link", variant: "destructive" });
      return;
    }

    if (extractionType === "last_seen" && !usernamesList.trim()) {
      toast({ title: "Error", description: "Please enter usernames or user IDs", variant: "destructive" });
      return;
    }

    if ((extractionType === "chats" || extractionType === "contacts" || extractionType === "archived" || 
         extractionType === "messenger_customers" || extractionType === "contacts_filtered") && !selectedAccount) {
      toast({ title: "Error", description: "Please select an account", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let action = extractionType;
      let body: Record<string, unknown> = {};

      switch (extractionType) {
        case "group_members":
        case "group_members_hidden":
          action = "group_members";
          body = { 
            action,
            group_link: groupLink,
            include_hidden: includeHidden || extractionType === "group_members_hidden",
            limit: extractLimit
          };
          break;
        case "hidden_members_full":
          body = { action, group_link: groupLink };
          break;
        case "last_seen":
          body = { 
            action,
            usernames: usernamesList.split('\n').filter(u => u.trim())
          };
          break;
        case "messenger_customers":
          body = { 
            action,
            account_id: selectedAccount,
            min_messages: parseInt(minMessages),
            time_range: parseInt(timeRange)
          };
          break;
        case "contacts_filtered":
          body = { 
            action,
            account_id: selectedAccount,
            phone_prefixes: phonePrefixes.split(',').map(p => p.trim()).filter(p => p),
            country_codes: countryCodes.split(',').map(c => c.trim()).filter(c => c),
            exclude_prefixes: excludePrefixes.split(',').map(p => p.trim()).filter(p => p)
          };
          break;
        default:
          body = { 
            action: extractionType,
            account_id: selectedAccount
          };
      }

      const { data, error } = await supabase.functions.invoke('telegram-extract', { body });

      if (error) throw error;

      toast({ 
        title: "Extraction Complete", 
        description: `Extracted ${data.count} items successfully` 
      });
      
      setGroupLink("");
      setUsernamesList("");
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const needsGroupLink = ["group_members", "group_members_hidden", "hidden_members_full"].includes(extractionType);
  const needsAccount = ["chats", "contacts", "archived", "messenger_customers", "contacts_filtered"].includes(extractionType);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Telegram Extractor</h1>
            <p className="text-muted-foreground mt-2">Extract members, last-seen, customers, and filtered contacts</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  New Extraction
                </CardTitle>
                <CardDescription>Configure and start a new data extraction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Extraction Type</Label>
                  <Select value={extractionType} onValueChange={setExtractionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select extraction type" />
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

                {needsGroupLink && (
                  <>
                    <div className="space-y-2">
                      <Label>Group Link or Username</Label>
                      <Input
                        placeholder="https://t.me/groupname, @groupname, or groupname"
                        value={groupLink}
                        onChange={(e) => setGroupLink(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Accepts: https://t.me/groupname, t.me/groupname, @groupname, or just groupname
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Extraction Limit</Label>
                      <Select value={extractLimit} onValueChange={setExtractLimit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select limit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Members</SelectItem>
                          <SelectItem value="100">100 members</SelectItem>
                          <SelectItem value="500">500 members</SelectItem>
                          <SelectItem value="1000">1,000 members</SelectItem>
                          <SelectItem value="2000">2,000 members</SelectItem>
                          <SelectItem value="5000">5,000 members</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {extractionType === "group_members" && (
                      <div className="flex items-center justify-between">
                        <Label>Include Hidden Members (Premium)</Label>
                        <Switch checked={includeHidden} onCheckedChange={setIncludeHidden} />
                      </div>
                    )}
                  </>
                )}

                {extractionType === "last_seen" && (
                  <div className="space-y-2">
                    <Label>Usernames or User IDs (one per line)</Label>
                    <Textarea
                      placeholder="@username1&#10;@username2&#10;123456789"
                      rows={5}
                      value={usernamesList}
                      onChange={(e) => setUsernamesList(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      {usernamesList.split('\n').filter(u => u.trim()).length} users to check
                    </p>
                  </div>
                )}

                {extractionType === "messenger_customers" && (
                  <>
                    <div className="space-y-2">
                      <Label>Select Account</Label>
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_name || account.phone_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Min Messages</Label>
                        <Input
                          type="number"
                          min="1"
                          value={minMessages}
                          onChange={(e) => setMinMessages(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time Range (days)</Label>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {extractionType === "contacts_filtered" && (
                  <>
                    <div className="space-y-2">
                      <Label>Select Account</Label>
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_name || account.phone_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Include Phone Prefixes (comma-separated)</Label>
                      <Input
                        placeholder="+1, +44, +91"
                        value={phonePrefixes}
                        onChange={(e) => setPhonePrefixes(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country Codes (comma-separated)</Label>
                      <Input
                        placeholder="+1, +44, +49"
                        value={countryCodes}
                        onChange={(e) => setCountryCodes(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Exclude Prefixes (comma-separated)</Label>
                      <Input
                        placeholder="+1900, +1800"
                        value={excludePrefixes}
                        onChange={(e) => setExcludePrefixes(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {needsAccount && extractionType !== "messenger_customers" && extractionType !== "contacts_filtered" && (
                  <div className="space-y-2">
                    <Label>Select Account</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name || account.phone_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {accounts.length === 0 && (
                      <p className="text-sm text-muted-foreground">No active accounts. Add an account first.</p>
                    )}
                  </div>
                )}

                <Button onClick={handleExtract} disabled={loading} className="w-full">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting...</> : "Start Extraction"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Extraction Types</CardTitle>
                <CardDescription>Available extraction methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {extractionTypes.map((type) => (
                  <div key={type.value} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <type.icon className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Extractions</CardTitle>
                    <CardDescription>Your extraction history - filter before downloading</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Updated {Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago
                    </span>
                    <Button size="sm" variant="outline" onClick={fetchData}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                  </div>
                </div>
                
                {/* Filter Controls */}
                <div className="flex flex-wrap gap-3 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterPremium} onValueChange={setFilterPremium}>
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Premium" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="premium">Premium Only</SelectItem>
                        <SelectItem value="non-premium">Non-Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterLastSeen} onValueChange={setFilterLastSeen}>
                      <SelectTrigger className="w-[150px] h-8">
                        <SelectValue placeholder="Last Seen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="online">Online Now</SelectItem>
                        <SelectItem value="recently">Recently</SelectItem>
                        <SelectItem value="within_week">Within Week</SelectItem>
                        <SelectItem value="within_month">Within Month</SelectItem>
                        <SelectItem value="long_ago">Long Ago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterHasUsername} onValueChange={setFilterHasUsername}>
                      <SelectTrigger className="w-[150px] h-8">
                        <SelectValue placeholder="Username" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="yes">Has Username</SelectItem>
                        <SelectItem value="no">No Username</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(filterPremium !== "all" || filterLastSeen !== "all" || filterHasUsername !== "all") && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8"
                      onClick={() => {
                        setFilterPremium("all");
                        setFilterLastSeen("all");
                        setFilterHasUsername("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {extractions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No extractions yet</p>
              ) : (
                <div className="space-y-3">
                  {extractions.map((extraction) => {
                    const totalResults = extraction.result_count || 0;
                    const filteredCount = extraction.results ? getFilteredResults(extraction.results).length : 0;
                    const hasActiveFilters = filterPremium !== "all" || filterLastSeen !== "all" || filterHasUsername !== "all";
                    
                    return (
                      <div key={extraction.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium capitalize">{extraction.extraction_type.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-muted-foreground">
                            {extraction.source || 'Account extraction'} • {new Date(extraction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={extraction.status === 'completed' ? 'default' : extraction.status === 'processing' ? 'outline' : 'secondary'}>
                            {extraction.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            {extraction.status}
                          </Badge>
                          <span className="text-sm font-medium">
                            {hasActiveFilters && extraction.status === 'completed' ? (
                              <span className={filteredCount === 0 ? 'text-destructive' : 'text-primary'}>
                                {filteredCount} of {totalResults}
                              </span>
                            ) : (
                              `${totalResults} results`
                            )}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(extraction, 'csv')}
                              disabled={extraction.status !== 'completed' || !extraction.results || (hasActiveFilters && filteredCount === 0)}
                            >
                              <Download className="h-4 w-4 mr-1" /> CSV
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(extraction, 'json')}
                              disabled={extraction.status !== 'completed' || !extraction.results || (hasActiveFilters && filteredCount === 0)}
                            >
                              <Download className="h-4 w-4 mr-1" /> JSON
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(extraction.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
