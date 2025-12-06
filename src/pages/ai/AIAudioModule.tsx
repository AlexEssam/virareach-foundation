import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Volume2, Mic, Sparkles, Loader2, Upload, Play, Pause, Copy, LogIn, Check, User, UserCircle, Settings, Key, Trash2, Star, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// All 20 ElevenLabs voices with proper IDs and descriptions
const voices = [
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria", description: "Young female, expressive and warm", gender: "female" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Middle-aged male, confident and clear", gender: "male" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Professional female, soft and calm", gender: "female" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Young female, friendly and upbeat", gender: "female" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Young male, casual and natural", gender: "male" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Mature male, warm British accent", gender: "male" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", description: "Young male, energetic Scottish", gender: "male" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", description: "Non-binary, calm and soothing", gender: "neutral" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Young male, neutral American", gender: "male" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", description: "Middle-aged female, elegant British", gender: "female" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "Young female, British and confident", gender: "female" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Young female, warm Australian", gender: "female" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", description: "Young male, friendly American", gender: "male" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Young female, expressive American", gender: "female" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", description: "Middle-aged male, deep and authoritative", gender: "male" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", description: "Young male, casual and relatable", gender: "male" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Middle-aged male, deep American", gender: "male" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Young male, British and authoritative", gender: "male" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Young female, British and warm", gender: "female" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", description: "Older male, wise and trustworthy", gender: "male" },
];

interface CustomVoice {
  id: string;
  name: string;
  description: string | null;
  elevenlabs_voice_id: string;
  sample_file_name: string | null;
  created_at: string;
}

export default function AIAudioModule() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);

  // API Key state
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [checkingApiKey, setCheckingApiKey] = useState(true);

  // TTS state
  const [ttsText, setTtsText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [selectedVoiceName, setSelectedVoiceName] = useState(voices[0].name);

  // Voice preview state
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice clone state
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([]);
  const [loadingCustomVoices, setLoadingCustomVoices] = useState(false);
  const [cloningVoice, setCloningVoice] = useState(false);

  // Audio clean state
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Check if user has API key on mount
  useEffect(() => {
    if (user) {
      checkApiKey();
      fetchCustomVoices();
    }
  }, [user]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const checkApiKey = async () => {
    setCheckingApiKey(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-audio', {
        body: { action: 'check_api_key' }
      });
      if (!error && data) {
        setHasApiKey(data.has_api_key);
      }
    } catch (e) {
      console.error("Failed to check API key:", e);
    } finally {
      setCheckingApiKey(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter your API key");
      return;
    }

    setSavingApiKey(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-audio', {
        body: { action: 'save_api_key', api_key: apiKey }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setHasApiKey(true);
      setApiKey("");
      toast.success("API key saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save API key");
    } finally {
      setSavingApiKey(false);
    }
  };

  const fetchCustomVoices = async () => {
    setLoadingCustomVoices(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-audio', {
        body: { action: 'list_custom_voices' }
      });

      if (!error && data?.voices) {
        setCustomVoices(data.voices);
      }
    } catch (e) {
      console.error("Failed to fetch custom voices:", e);
    } finally {
      setLoadingCustomVoices(false);
    }
  };

  const handlePlayVoice = async (voiceId: string, voiceName: string) => {
    if (playingVoice === voiceId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoice(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!hasApiKey) {
      toast.error("Please configure your ElevenLabs API key first to preview voices");
      return;
    }

    setLoadingVoice(voiceId);
    setPlayingVoice(null);

    try {
      // Call edge function to get authenticated preview
      const { data, error } = await supabase.functions.invoke('ai-audio', {
        body: { action: 'voice_preview', voice_id: voiceId }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.audio_base64) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
        audioRef.current = audio;

        audio.onended = () => {
          setPlayingVoice(null);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setLoadingVoice(null);
          setPlayingVoice(null);
          toast.error(`Failed to play preview for ${voiceName}`);
        };

        setLoadingVoice(null);
        setPlayingVoice(voiceId);
        audio.play();
      } else {
        throw new Error("No audio data received");
      }
    } catch (error: any) {
      setLoadingVoice(null);
      setPlayingVoice(null);
      toast.error(error.message || "Failed to load voice preview");
    }
  };

  const callAudioAPI = async (action: string, params: Record<string, any>) => {
    setLoading(true);
    setResult("");
    setGeneratedAudio(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-audio', {
        body: { action, ...params }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.audio_base64) {
        setGeneratedAudio(`data:audio/mpeg;base64,${data.audio_base64}`);
        toast.success("Audio generated successfully!");
      } else {
        setResult(data.result || data.message || "Operation completed");
        toast.success(data.message || "Operation completed successfully!");
      }
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
    callAudioAPI("tts", { text: ttsText, voice_id: selectedVoice });
  };

  const handleVoiceClone = async () => {
    if (!voiceName.trim()) {
      toast.error("Please enter a voice name");
      return;
    }
    if (!voiceSample) {
      toast.error("Please upload a voice sample");
      return;
    }

    setCloningVoice(true);
    try {
      // Convert file to base64
      const arrayBuffer = await voiceSample.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const { data, error } = await supabase.functions.invoke('ai-audio', {
        body: { 
          action: 'voice_clone',
          voice_name: voiceName,
          voice_description: voiceDescription,
          audio_base64: base64,
          file_name: voiceSample.name
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Voice cloned successfully!");
      setVoiceName("");
      setVoiceDescription("");
      setVoiceSample(null);
      fetchCustomVoices();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to clone voice");
    } finally {
      setCloningVoice(false);
    }
  };

  const handleDeleteCustomVoice = async (voiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-audio', {
        body: { action: 'delete_custom_voice', voice_id: voiceId }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Voice deleted successfully!");
      fetchCustomVoices();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete voice");
    }
  };

  const handleAudioClean = () => {
    callAudioAPI("audio_clean", { audio_data: audioFile?.name || "general" });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  };

  const selectVoice = (id: string, name: string) => {
    setSelectedVoice(id);
    setSelectedVoiceName(name);
  };

  const maleVoices = voices.filter(v => v.gender === "male");
  const femaleVoices = voices.filter(v => v.gender === "female");
  const neutralVoices = voices.filter(v => v.gender === "neutral");

  const VoiceCard = ({ voice, isCustom = false }: { voice: typeof voices[0] | CustomVoice; isCustom?: boolean }) => {
    const voiceId = isCustom ? (voice as CustomVoice).elevenlabs_voice_id : voice.id;
    const isSelected = selectedVoice === voiceId;
    const isPlaying = playingVoice === voiceId;
    const isLoadingPreview = loadingVoice === voiceId;

    return (
      <div
        className={`relative p-3 rounded-lg border transition-all cursor-pointer ${
          isSelected
            ? "border-primary bg-primary/10"
            : "border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card"
        }`}
        onClick={() => selectVoice(voiceId, voice.name)}
      >
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className={`h-9 w-9 rounded-full shrink-0 ${
              isPlaying ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handlePlayVoice(voiceId, voice.name);
            }}
            disabled={isLoadingPreview}
          >
            {isLoadingPreview ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isCustom && <Star className="h-3.5 w-3.5 text-yellow-500" />}
              <span className="font-medium text-sm">{voice.name}</span>
              {isSelected && (
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{voice.description || "Custom voice"}</p>
          </div>
          {isCustom && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCustomVoice((voice as CustomVoice).id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-md mx-auto mt-20">
            <Card>
              <CardHeader className="text-center">
                <Volume2 className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>Login Required</CardTitle>
                <CardDescription>
                  Please log in to access AI Audio features
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={() => navigate('/login')}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Volume2 className="h-8 w-8 text-primary" />
              <span className="text-gradient">AI Audio Tools</span>
            </h1>
            <p className="text-muted-foreground">Text-to-speech with 20 premium voices, voice cloning, and audio enhancement</p>
          </div>

          {/* API Key Settings Card */}
          <Card variant="glass" className="animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-primary" />
                ElevenLabs Settings
              </CardTitle>
              <CardDescription>
                Add your ElevenLabs API key to enable voice cloning and TTS generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checkingApiKey ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking API key status...</span>
                </div>
              ) : hasApiKey ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-500">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">API key configured</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHasApiKey(false)}
                  >
                    Update Key
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="password"
                        placeholder="Enter your ElevenLabs API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>
                    <Button onClick={saveApiKey} disabled={savingApiKey}>
                      {savingApiKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </div>
                  <a
                    href="https://elevenlabs.io/app/settings/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Get your API key from elevenlabs.io
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="glass" className="animate-fade-in">
              <CardContent className="p-4 flex items-center gap-3">
                <Volume2 className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold">{20 + customVoices.length} Voices</p>
                  <p className="text-xs text-muted-foreground">Premium + Custom</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-4 flex items-center gap-3">
                <Mic className="h-8 w-8 text-pink-400" />
                <div>
                  <p className="text-2xl font-bold">{customVoices.length} Cloned</p>
                  <p className="text-xs text-muted-foreground">Your custom voices</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
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
            {/* Voice Library */}
            <Card variant="glass" className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Voice Library
                </CardTitle>
                <CardDescription>
                  Click play to preview, click card to select
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {/* Custom Voices */}
                    {customVoices.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium text-muted-foreground">My Voices ({customVoices.length})</span>
                        </div>
                        <div className="grid gap-2">
                          {customVoices.map((voice) => (
                            <VoiceCard key={voice.id} voice={voice} isCustom={true} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Female Voices */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <UserCircle className="h-4 w-4 text-pink-500" />
                        <span className="text-sm font-medium text-muted-foreground">Female Voices ({femaleVoices.length})</span>
                      </div>
                      <div className="grid gap-2">
                        {femaleVoices.map((voice) => (
                          <VoiceCard key={voice.id} voice={voice} />
                        ))}
                      </div>
                    </div>

                    {/* Male Voices */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-muted-foreground">Male Voices ({maleVoices.length})</span>
                      </div>
                      <div className="grid gap-2">
                        {maleVoices.map((voice) => (
                          <VoiceCard key={voice.id} voice={voice} />
                        ))}
                      </div>
                    </div>

                    {/* Neutral Voices */}
                    {neutralVoices.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium text-muted-foreground">Neutral Voices ({neutralVoices.length})</span>
                        </div>
                        <div className="grid gap-2">
                          {neutralVoices.map((voice) => (
                            <VoiceCard key={voice.id} voice={voice} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Tools Column */}
            <div className="space-y-6">
              {/* Input Section */}
              <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
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
                        <Label>Selected Voice</Label>
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-primary" />
                            <span className="font-medium">{selectedVoiceName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Text to Convert</Label>
                        <Textarea
                          placeholder="Enter the text you want to convert to speech..."
                          value={ttsText}
                          onChange={(e) => setTtsText(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <Button onClick={handleTTS} disabled={loading || !hasApiKey} variant="glow" className="w-full">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                        Generate Speech
                      </Button>
                      {!hasApiKey && (
                        <p className="text-xs text-amber-500">
                          Add your ElevenLabs API key above to generate audio.
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="clone" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Voice Name *</Label>
                        <Input
                          placeholder="e.g., My Professional Voice"
                          value={voiceName}
                          onChange={(e) => setVoiceName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (optional)</Label>
                        <Input
                          placeholder="e.g., Warm, professional tone"
                          value={voiceDescription}
                          onChange={(e) => setVoiceDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Voice Sample *</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Upload a voice sample (min 30 seconds, MP3/WAV)
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
                      <Button 
                        onClick={handleVoiceClone} 
                        disabled={cloningVoice || !hasApiKey} 
                        variant="glow" 
                        className="w-full"
                      >
                        {cloningVoice ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                        Clone Voice
                      </Button>
                      {!hasApiKey && (
                        <p className="text-xs text-amber-500">
                          Add your ElevenLabs API key above to clone voices.
                        </p>
                      )}
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
              <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
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
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-10 w-10 animate-spin mb-3" />
                      <p>Processing...</p>
                    </div>
                  ) : generatedAudio ? (
                    <div className="space-y-3">
                      <audio controls className="w-full" src={generatedAudio} />
                      <p className="text-sm text-muted-foreground text-center">
                        Generated audio ready to play
                      </p>
                    </div>
                  ) : result ? (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 whitespace-pre-wrap max-h-[200px] overflow-y-auto text-sm">
                      {result}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Volume2 className="h-10 w-10 mb-3 opacity-50" />
                      <p className="text-sm">Select a tool to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
