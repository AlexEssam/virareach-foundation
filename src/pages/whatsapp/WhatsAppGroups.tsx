import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Link, Trash2, UserPlus, Loader2, Copy } from "lucide-react";

interface WhatsAppGroup {
  id: string;
  group_name: string;
  group_id: string | null;
  invite_link: string | null;
  member_count: number;
  status: string;
  created_at: string;
}

export default function WhatsAppGroups() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addMembersDialogOpen, setAddMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroup | null>(null);
  
  // Form state
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchGroups = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("whatsapp_groups")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({ title: "Error", description: "Please enter group name", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("whatsapp-groups?action=create", {
        body: { group_name: groupName },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Group Created",
        description: response.data.message,
      });
      
      setGroupName("");
      setCreateDialogOpen(false);
      fetchGroups();
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAddMembers = async () => {
    if (!selectedGroup) return;

    const memberList = members.split("\n").map(m => m.trim()).filter(m => m.length > 0);
    if (memberList.length === 0) {
      toast({ title: "Error", description: "Please enter at least one phone number", variant: "destructive" });
      return;
    }

    setAddingMembers(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("whatsapp-groups?action=add-members", {
        body: { 
          group_id: selectedGroup.id,
          members: memberList,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Members Added",
        description: response.data.message,
      });
      
      setMembers("");
      setAddMembersDialogOpen(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error: any) {
      console.error("Error adding members:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add members",
        variant: "destructive",
      });
    } finally {
      setAddingMembers(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("whatsapp-groups?action=delete", {
        body: { group_id: groupId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Group Deleted",
        description: "Group has been removed",
      });
      
      fetchGroups();
    } catch (error: any) {
      console.error("Error deleting group:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: "Copied", description: "Invite link copied to clipboard" });
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
          <header className="mb-8 flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-gradient">WhatsApp Groups</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage WhatsApp groups
              </p>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription>
                    Create a new WhatsApp group
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      placeholder="My WhatsApp Group"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={creating}>
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card variant="glass" className="animate-fade-in">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20">
                  <Users className="h-6 w-6 text-[#25D366]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{groups.length}</p>
                  <p className="text-sm text-muted-foreground">Total Groups</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {groups.reduce((acc, g) => acc + g.member_count, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <Link className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {groups.filter(g => g.invite_link).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Links</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Groups List */}
          {groups.length === 0 ? (
            <Card variant="glass" className="animate-fade-in">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No groups yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first WhatsApp group
                </p>
                <Button variant="glow" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {groups.map((group, index) => (
                <Card 
                  key={group.id} 
                  variant="glass" 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20">
                          <Users className="h-6 w-6 text-[#25D366]" />
                        </div>
                        <div>
                          <h3 className="font-medium">{group.group_name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {group.member_count} members
                            </span>
                            {group.invite_link && (
                              <button 
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                onClick={() => copyInviteLink(group.invite_link!)}
                              >
                                <Copy className="h-3 w-3" />
                                Copy link
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={
                            group.status === "active" 
                              ? "bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30" 
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {group.status}
                        </Badge>
                        <Button 
                          variant="glow" 
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(group);
                            setAddMembersDialogOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add Members Dialog */}
          <Dialog open={addMembersDialogOpen} onOpenChange={setAddMembersDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Members to {selectedGroup?.group_name}</DialogTitle>
                <DialogDescription>
                  Add phone numbers (one per line). Rate limit: 250 users per 3 minutes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="members">Phone Numbers</Label>
                  <Textarea
                    id="members"
                    placeholder="+1234567890&#10;+0987654321&#10;..."
                    value={members}
                    onChange={(e) => setMembers(e.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    {members.split("\n").filter(m => m.trim()).length} numbers entered
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setAddMembersDialogOpen(false);
                  setSelectedGroup(null);
                  setMembers("");
                }}>
                  Cancel
                </Button>
                <Button onClick={handleAddMembers} disabled={addingMembers}>
                  {addingMembers && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Members
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
