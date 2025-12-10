import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Upload, Search, Trash2, Loader2, Phone, Tag, RefreshCw } from "lucide-react";

interface Contact {
  id: string;
  phone_number: string;
  name: string | null;
  tags: string[] | null;
  notes: string | null;
  message_count: number;
  last_messaged_at: string | null;
  created_at: string;
}

export default function WhatsAppContacts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newTags, setNewTags] = useState("");
  const [numbersToConvert, setNumbersToConvert] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (user) {
      fetchContacts();
    }
  }, [user, authLoading, navigate]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("whatsapp-contacts", { 
        body: { 
          action: "list",
          search: search || undefined,
        },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to load contacts";

        const friendlyMessage =
          rawMessage === "Edge Function returned a non-2xx status code"
            ? "Unable to load contacts from the server right now. Please try again later."
            : rawMessage;

        throw new Error(friendlyMessage);
      }

      if (response.data?.contacts) {
        setContacts(response.data.contacts);
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newPhone.trim()) {
      toast({ title: "Error", description: "Phone number is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await supabase.functions.invoke("whatsapp-contacts", {
        body: {
          action: "create",
          phone_number: newPhone,
          name: newName || null,
          tags: newTags ? newTags.split(",").map(t => t.trim()) : [],
        },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to add contact";

        throw new Error(rawMessage);
      }

      toast({ title: "Contact Added" });
      setAddDialogOpen(false);
      setNewPhone("");
      setNewName("");
      setNewTags("");
      fetchContacts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add contact", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleConvertNumbers = async () => {
    const numbers = numbersToConvert.split("\n").filter(n => n.trim());
    if (numbers.length === 0) {
      toast({ title: "Error", description: "Enter at least one number", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await supabase.functions.invoke("whatsapp-contacts", {
        body: { 
          action: "convert",
          numbers,
        },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to convert numbers";

        throw new Error(rawMessage);
      }

      toast({ title: "Success", description: response.data?.message || "Numbers converted to contacts" });
      setConvertDialogOpen(false);
      setNumbersToConvert("");
      fetchContacts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to convert numbers", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const response = await supabase.functions.invoke("whatsapp-contacts", {
        body: { 
          action: "delete",
          id,
        },
      });

      if (response.error || response.data?.error) {
        const rawMessage =
          response.data?.error ||
          response.error?.message ||
          "Failed to delete contact";

        throw new Error(rawMessage);
      }

      toast({ title: "Contact deleted" });
      fetchContacts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete contact", variant: "destructive" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">WhatsApp Contacts</h1>
              <p className="text-muted-foreground mt-1">
                Save and manage your WhatsApp contacts
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Mass Convert
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convert Numbers to Contacts</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Textarea
                      value={numbersToConvert}
                      onChange={(e) => setNumbersToConvert(e.target.value)}
                      placeholder="Enter phone numbers (one per line)&#10;+1234567890&#10;+0987654321"
                      rows={8}
                    />
                    <p className="text-sm text-muted-foreground">
                      {numbersToConvert.split("\n").filter(n => n.trim()).length} numbers
                    </p>
                    <Button onClick={handleConvertNumbers} disabled={saving} className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Convert All
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium">Phone Number *</label>
                      <Input
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Contact name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tags (comma separated)</label>
                      <Input
                        value={newTags}
                        onChange={(e) => setNewTags(e.target.value)}
                        placeholder="customer, vip, lead"
                      />
                    </div>
                    <Button onClick={handleAddContact} disabled={saving} className="w-full">
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Contact
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && fetchContacts()}
              />
            </div>
            <Button variant="outline" onClick={fetchContacts}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{contacts.length} Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No contacts yet. Add your first contact.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {contact.name || contact.phone_number}
                          </p>
                          {contact.name && (
                            <p className="text-sm text-muted-foreground">{contact.phone_number}</p>
                          )}
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {contact.tags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {contact.message_count} messages
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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