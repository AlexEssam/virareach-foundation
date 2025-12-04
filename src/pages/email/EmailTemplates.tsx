import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Edit, Trash2, Copy, Eye } from "lucide-react";

interface Template {
  id: string;
  template_name: string;
  subject: string;
  content: string;
  content_type: string;
  created_at: string;
  updated_at: string;
}

const EmailTemplates = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"html" | "text">("html");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const loadTemplates = async () => {
    try {
      const response = await supabase.functions.invoke('email-send', {
        body: { action: 'get_templates' }
      });

      if (response.data?.templates) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveTemplate = async () => {
    if (!templateName || !subject || !content) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (editingTemplate) {
        const response = await supabase.functions.invoke('email-send', {
          body: {
            action: 'update_template',
            template_id: editingTemplate.id,
            template_name: templateName,
            subject,
            content,
            content_type: contentType
          }
        });
        if (response.error) throw response.error;
        toast({ title: "Template updated" });
      } else {
        const response = await supabase.functions.invoke('email-send', {
          body: {
            action: 'create_template',
            template_name: templateName,
            subject,
            content,
            content_type: contentType
          }
        });
        if (response.error) throw response.error;
        toast({ title: "Template created" });
      }

      resetForm();
      setDialogOpen(false);
      loadTemplates();
    } catch (error: any) {
      toast({ title: "Error saving template", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const response = await supabase.functions.invoke('email-send', {
        body: { action: 'delete_template', template_id: id }
      });
      if (response.error) throw response.error;
      toast({ title: "Template deleted" });
      loadTemplates();
    } catch (error: any) {
      toast({ title: "Error deleting template", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setTemplateName("");
    setSubject("");
    setContent("");
    setContentType("html");
    setEditingTemplate(null);
  };

  const startEditing = (template: Template) => {
    setEditingTemplate(template);
    setTemplateName(template.template_name);
    setSubject(template.subject);
    setContent(template.content);
    setContentType(template.content_type as "html" | "text");
    setDialogOpen(true);
  };

  const duplicateTemplate = (template: Template) => {
    setTemplateName(`${template.template_name} (Copy)`);
    setSubject(template.subject);
    setContent(template.content);
    setContentType(template.content_type as "html" | "text");
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <FileText className="h-8 w-8" />
                Email Templates
              </h1>
              <p className="text-muted-foreground mt-2">Create and manage reusable email templates</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
                  <DialogDescription>
                    {editingTemplate ? "Update your email template" : "Create a new reusable email template"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Welcome Email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject Line</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Welcome to our platform!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select value={contentType} onValueChange={(v: "html" | "text") => setContentType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="text">Plain Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Email Content</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={contentType === 'html' ? '<html><body>Your content here</body></html>' : 'Your message here...'}
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{{name}}"} for recipient name, {"{{email}}"} for recipient email
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button onClick={saveTemplate} disabled={isLoading}>
                      {isLoading ? "Saving..." : (editingTemplate ? "Update" : "Create")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Templates Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first email template to get started</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <CardDescription className="truncate">{template.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="capitalize">{template.content_type}</span>
                      <span>{new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(template)}>
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => startEditing(template)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => duplicateTemplate(template)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteTemplate(template.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Preview Dialog */}
          <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Template Preview: {previewTemplate?.template_name}</DialogTitle>
                <DialogDescription>Subject: {previewTemplate?.subject}</DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                {previewTemplate?.content_type === 'html' ? (
                  <div 
                    className="border rounded-lg p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: previewTemplate?.content || '' }}
                  />
                ) : (
                  <pre className="border rounded-lg p-4 bg-muted whitespace-pre-wrap text-sm">
                    {previewTemplate?.content}
                  </pre>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default EmailTemplates;
