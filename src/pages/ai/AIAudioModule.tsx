import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Volume2, Mic, Sparkles, Loader2, Upload, Play, Copy } from "lucide-react";
import { toast } from "sonner";

export default function AIAudioModule() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // TTS state
  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState("aria");

  // Voice clone state
  const [voiceSample, setVoiceSample] = useState<File | null>(null);

  // Audio clean state
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const callAudioAPI = async (action: string, params: Record<string, any>) => {
    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke('ai-audio', {
        body: { action, ...params }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data.result || data.message || "Operation completed");
      toast.success(data.message || "Operation completed successfully!");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to process audio");
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = () => {
    if (!ttsText.trim()) {
      toast.error("Please enter text to convert");
      return;
    }
    callAudioAPI("tts", { text: ttsText, voice_id: ttsVoice });
  };

  const handleVoiceClone = () => {
    if (!voiceSample) {
      toast.error("Please upload a voice sample");
      return;
    }
    callAudioAPI("voice_clone", { voice_sample: voiceSample.name });
  };

  const handleAudioClean = () => {
    callAudioAPI("audio_clean", { audio_data: audioFile?.name || "general" });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  };

  const voices = [
    { id: "aria", name: "Aria - Young Female" },
    { id: "roger", name: "Roger - Middle-aged Male" },
    { id: "sarah", name: "Sarah - Professional Female" },
    { id: "charlie", name: "Charlie - Friendly Male" },
    { id: "laura", name: "Laura - Warm Female" },
    { id: "george", name: "George - British Male" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Volume2 className="h-8 w-8 text-primary" />
              AI Audio Tools
            </h1>
            <p className="text-muted-foreground">Text-to-speech, voice cloning, and audio enhancement</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass">
              <CardContent className="p-4 flex items-center gap-3">
                <Volume2 className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold">Text to Speech</p>
                  <p className="text-xs text-muted-foreground">Convert text to audio</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-4 flex items-center gap-3">
                <Mic className="h-8 w-8 text-pink-400" />
                <div>
                  <p className="text-2xl font-bold">Voice Clone</p>
                  <p className="text-xs text-muted-foreground">Clone any voice</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-4 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold">Audio Clean</p>
                  <p className="text-xs text-muted-foreground">Enhance quality</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Audio Operations</CardTitle>
                <CardDescription>Choose a tool and provide your inputs</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tts" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tts">TTS</TabsTrigger>
                    <TabsTrigger value="clone">Voice Clone</TabsTrigger>
                    <TabsTrigger value="clean">Audio Clean</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tts" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Text to Convert</Label>
                      <Textarea
                        placeholder="Enter the text you want to convert to speech..."
                        value={ttsText}
                        onChange={(e) => setTtsText(e.target.value)}
                        rows={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Voice</Label>
                      <Select value={ttsVoice} onValueChange={setTtsVoice}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voices.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleTTS} disabled={loading} variant="glow" className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      Generate Speech
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Note: For actual audio generation, ElevenLabs API integration is required.
                    </p>
                  </TabsContent>

                  <TabsContent value="clone" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Voice Sample</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload a voice sample (min 30 seconds)
                        </p>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setVoiceSample(e.target.files?.[0] || null)}
                          className="hidden"
                          id="voice-upload"
                        />
                        <Button variant="outline" asChild>
                          <label htmlFor="voice-upload" className="cursor-pointer">
                            Choose File
                          </label>
                        </Button>
                        {voiceSample && (
                          <p className="text-sm text-primary mt-2">{voiceSample.name}</p>
                        )}
                      </div>
                    </div>
                    <Button onClick={handleVoiceClone} disabled={loading} variant="glow" className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                      Clone Voice
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Requires ElevenLabs API key for voice cloning functionality.
                    </p>
                  </TabsContent>

                  <TabsContent value="clean" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Audio File (Optional)</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload audio to enhance
                        </p>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="audio-upload"
                        />
                        <Button variant="outline" asChild>
                          <label htmlFor="audio-upload" className="cursor-pointer">
                            Choose File
                          </label>
                        </Button>
                        {audioFile && (
                          <p className="text-sm text-primary mt-2">{audioFile.name}</p>
                        )}
                      </div>
                    </div>
                    <Button onClick={handleAudioClean} disabled={loading} variant="glow" className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Get Cleaning Tips
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
                    <CardTitle>Result</CardTitle>
                    <CardDescription>Output will appear here</CardDescription>
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
                    <p>Processing...</p>
                  </div>
                ) : result ? (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50 whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                    {result}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Volume2 className="h-12 w-12 mb-4 opacity-50" />
                    <p>Select a tool to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>About Audio Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Text to Speech</h4>
                  <p className="text-sm text-muted-foreground">Convert any text into natural-sounding speech with multiple voice options.</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Voice Cloning</h4>
                  <p className="text-sm text-muted-foreground">Create a digital copy of any voice from a short audio sample.</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Audio Enhancement</h4>
                  <p className="text-sm text-muted-foreground">Remove background noise and improve audio clarity automatically.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
