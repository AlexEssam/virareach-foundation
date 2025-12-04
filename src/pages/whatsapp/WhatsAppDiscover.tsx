import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, Plus, Loader2, Globe, CheckCircle } from "lucide-react";
import { SiFacebook, SiTelegram, SiInstagram, SiX } from "@icons-pack/react-simple-icons";

interface DiscoveredGroup {
  id: string;
  source_platform: string;
  source_url: string | null;
  invite_link: string;
  group_name: string | null;
  description: string | null;
  member_estimate: number | null;
  category: string | null;
  status: string;
  discovered_at: string;
  joined_at: string | null;
}

const platforms = [
  { value: "facebook", label: "Facebook", icon: SiFacebook, color: "#1877F2" },
  { value: "telegram", label: "Telegram", icon: SiTelegram, color: "#26A5E4" },
  { value: "instagram", label: "Instagram", icon: SiInstagram, color: "#E4405F" },
  { value: "twitter", label: "X/Twitter", icon: SiX, color: "#000000" },
];

export default function WhatsAppDiscover() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<DiscoveredGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [joining, setJoining] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("facebook");
  const [category, setCategory] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (user) {
      fetchGroups();
    }
  }, [user, authLoading, navigate]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-discover", { method: "GET" });
      if (data?.groups) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-discover?action=discover", {
        body: {
          platform: selectedPlatform,
          category: category || null,
        },
      });

      if (error) throw error;

      toast({ title: "Discovery Complete", description: data.message });
      fetchGroups();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDiscovering(false);
    }
  };

  const handleJoinSelected = async () => {
    if (selectedGroups.length === 0) {
      toast({ title: "Error", description: "Select groups to join", variant: "destructive" });
      return;
    }

    setJoining(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-discover?action=join", {
        body: { group_ids: selectedGroups },
      });

      if (error) throw error;

      toast({ title: "Success", description: data.message });
      setSelectedGroups([]);
      fetchGroups();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const toggleSelectGroup = (id: string) => {
    setSelectedGroups(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const selectAllDiscovered = () => {
    const discoveredIds = groups.filter(g => g.status === "discovered").map(g => g.id);
    setSelectedGroups(discoveredIds);
  };

  const getPlatformIcon = (platform: string) => {
    const found = platforms.find(p => p.value === platform);
    return found?.icon || Globe;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const discoveredGroups = groups.filter(g => g.status === "discovered");
  const joinedGroups = groups.filter(g => g.status === "joined");

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Group Discovery</h1>
            <p className="text-muted-foreground mt-1">
              Discover WhatsApp groups from social platforms and auto-join
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Discover Groups</CardTitle>
              <CardDescription>
                Search social platforms for WhatsApp group links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Platform</label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2">
                            <p.icon className="h-4 w-4" style={{ color: p.color }} />
                            {p.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Category/Interest</label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., crypto, marketing, tech"
                  />
                </div>
                <Button onClick={handleDiscover} disabled={discovering}>
                  {discovering ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Discover
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="discovered" className="space-y-4">
            <TabsList>
              <TabsTrigger value="discovered">
                Discovered ({discoveredGroups.length})
              </TabsTrigger>
              <TabsTrigger value="joined">
                Joined ({joinedGroups.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discovered">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Discovered Groups</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllDiscovered}>
                        Select All
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleJoinSelected}
                        disabled={joining || selectedGroups.length === 0}
                      >
                        {joining ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Join Selected ({selectedGroups.length})
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {discoveredGroups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No groups discovered yet. Start a discovery search.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {discoveredGroups.map((group) => {
                        const PlatformIcon = getPlatformIcon(group.source_platform);
                        return (
                          <div
                            key={group.id}
                            className="flex items-center gap-4 p-4 border rounded-lg"
                          >
                            <Checkbox
                              checked={selectedGroups.includes(group.id)}
                              onCheckedChange={() => toggleSelectGroup(group.id)}
                            />
                            <div className="p-2 rounded-lg bg-muted">
                              <PlatformIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{group.group_name || "Unknown Group"}</p>
                              <p className="text-sm text-muted-foreground">
                                {group.member_estimate?.toLocaleString() || "?"} members
                                {group.category && ` • ${group.category}`}
                              </p>
                            </div>
                            <Badge variant="outline">{group.source_platform}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="joined">
              <Card>
                <CardHeader>
                  <CardTitle>Joined Groups</CardTitle>
                </CardHeader>
                <CardContent>
                  {joinedGroups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No groups joined yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {joinedGroups.map((group) => {
                        const PlatformIcon = getPlatformIcon(group.source_platform);
                        return (
                          <div
                            key={group.id}
                            className="flex items-center gap-4 p-4 border rounded-lg"
                          >
                            <div className="p-2 rounded-lg bg-green-500/10">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{group.group_name || "Unknown Group"}</p>
                              <p className="text-sm text-muted-foreground">
                                Joined {group.joined_at ? new Date(group.joined_at).toLocaleDateString() : ""}
                              </p>
                            </div>
                            <Badge className="bg-green-500/20 text-green-500">Joined</Badge>
                          </div>
                        );
                      })}
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
