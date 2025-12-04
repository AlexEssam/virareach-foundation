import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { FileText, PenTool, Megaphone, Video, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function AITextModule() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [activeTab, setActiveTab] = useState("writer");

  // AI Writer state
  const [writerTopic, setWriterTopic] = useState("");
  const [writerTone, setWriterTone] = useState("professional");
  const [writerLength, setWriterLength] = useState("medium");

  // Post Writer state
  const [postPlatform, setPostPlatform] = useState("instagram");
  const [postTopic, setPostTopic] = useState("");

  // Ad Copy state
  const [adProduct, setAdProduct] = useState("");
  const [adAudience, setAdAudience] = useState("");

  // Script Writer state
  const [scriptTopic, setScriptTopic] = useState("");
  const [scriptDuration, setScriptDuration] = useState("60");

  const callTextAPI = async (action: string, params: Record<string, string>) => {
    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke('ai-text', {
        body: { action, ...params }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data.result);
      toast.success("Text generated successfully!");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to generate text");
    } finally {
      setLoading(false);
    }
  };

  const handleAIWriter = () => {
    if (!writerTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    callTextAPI("ai_writer", { topic: writerTopic, tone: writerTone, length: writerLength });
  };

  const handlePostWriter = () => {
    if (!postTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    callTextAPI("post_writer", { platform: postPlatform, topic: postTopic });
  };

  const handleAdCopy = () => {
    if (!adProduct.trim()) {
      toast.error("Please enter a product name");
      return;
    }
    callTextAPI("ad_copy", { product_name: adProduct, audience: adAudience });
  };

  const handleScriptWriter = () => {
    if (!scriptTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    callTextAPI("script_writer", { topic: scriptTopic, duration: scriptDuration });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Text Tools
            </h1>
            <p className="text-muted-foreground">Generate high-quality content with AI-powered writing tools</p>
          </div>

          {/* Stats Cards - Clickable */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card 
              className={`glass cursor-pointer transition-all hover:scale-105 ${activeTab === 'writer' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveTab('writer')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold">AI Writer</p>
                  <p className="text-xs text-muted-foreground">Blog & Articles</p>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`glass cursor-pointer transition-all hover:scale-105 ${activeTab === 'post' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveTab('post')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <PenTool className="h-8 w-8 text-pink-400" />
                <div>
                  <p className="text-2xl font-bold">Post Writer</p>
                  <p className="text-xs text-muted-foreground">Social Media</p>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`glass cursor-pointer transition-all hover:scale-105 ${activeTab === 'ad' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveTab('ad')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Megaphone className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold">Ad Copy</p>
                  <p className="text-xs text-muted-foreground">Advertising</p>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`glass cursor-pointer transition-all hover:scale-105 ${activeTab === 'script' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveTab('script')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Video className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold">Script Writer</p>
                  <p className="text-xs text-muted-foreground">Video Scripts</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Generate Content</CardTitle>
                <CardDescription>Choose a tool and provide your inputs</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="writer">Writer</TabsTrigger>
                    <TabsTrigger value="post">Post</TabsTrigger>
                    <TabsTrigger value="ad">Ad Copy</TabsTrigger>
                    <TabsTrigger value="script">Script</TabsTrigger>
                  </TabsList>

                  <TabsContent value="writer" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <Input
                        placeholder="What do you want to write about?"
                        value={writerTopic}
                        onChange={(e) => setWriterTopic(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tone</Label>
                        <Select value={writerTone} onValueChange={setWriterTone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                            <SelectItem value="humorous">Humorous</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Length</Label>
                        <Select value={writerLength} onValueChange={setWriterLength}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">Short (~100 words)</SelectItem>
                            <SelectItem value="medium">Medium (~300 words)</SelectItem>
                            <SelectItem value="long">Long (~500+ words)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleAIWriter} disabled={loading} variant="glow" className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                      Generate Content
                    </Button>
                  </TabsContent>

                  <TabsContent value="post" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select value={postPlatform} onValueChange={setPostPlatform}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="twitter">Twitter/X</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <Textarea
                        placeholder="What's your post about?"
                        value={postTopic}
                        onChange={(e) => setPostTopic(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button onClick={handlePostWriter} disabled={loading} variant="glow" className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PenTool className="h-4 w-4 mr-2" />}
                      Generate Post
                    </Button>
                  </TabsContent>

                  <TabsContent value="ad" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Product Name</Label>
                      <Input
                        placeholder="Enter your product or service name"
                        value={adProduct}
                        onChange={(e) => setAdProduct(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Audience</Label>
                      <Input
                        placeholder="e.g., young professionals, parents, fitness enthusiasts"
                        value={adAudience}
                        onChange={(e) => setAdAudience(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAdCopy} disabled={loading} variant="glow" className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Megaphone className="h-4 w-4 mr-2" />}
                      Generate Ad Copy
                    </Button>
                  </TabsContent>

                  <TabsContent value="script" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Script Topic</Label>
                      <Textarea
                        placeholder="What's your video about?"
                        value={scriptTopic}
                        onChange={(e) => setScriptTopic(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (seconds)</Label>
                      <Select value={scriptDuration} onValueChange={setScriptDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">60 seconds</SelectItem>
                          <SelectItem value="90">90 seconds</SelectItem>
                          <SelectItem value="120">2 minutes</SelectItem>
                          <SelectItem value="180">3 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleScriptWriter} disabled={loading} variant="glow" className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Video className="h-4 w-4 mr-2" />}
                      Generate Script
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Content</CardTitle>
                    <CardDescription>Your AI-generated text will appear here</CardDescription>
                  </div>
                  {result && (
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-12 w-12 animate-spin mb-4" />
                    <p>Generating content...</p>
                  </div>
                ) : result ? (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50 whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                    {result}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                    <p>Select a tool and generate content</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
