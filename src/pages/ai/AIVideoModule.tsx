import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Video, 
  Wand2, 
  Play, 
  UserSquare2, 
  Mic2, 
  RefreshCw, 
  ZoomIn,
  Download,
  Loader2,
  Image,
  LogIn
} from "lucide-react";

export default function AIVideoModule() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    video_url?: string;
    frames?: string[];
    storyboard?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondFileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [secondImage, setSecondImage] = useState<string | null>(null);
  const [motionStyle, setMotionStyle] = useState("zoom_in");
  const [duration, setDuration] = useState("5");
  const [resolution, setResolution] = useState("4K");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setImage: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const callAIVideo = async (action: string, params: Record<string, any>) => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-video', {
        body: { action, ...params }
      });

      if (error) throw error;
      
      setResult(data);
      toast.success("Video processed successfully!");
    } catch (error: any) {
      console.error('AI Video error:', error);
      toast.error(error.message || "Failed to process video");
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const motionStyles = [
    { id: 'zoom_in', name: 'Zoom In' },
    { id: 'zoom_out', name: 'Zoom Out' },
    { id: 'pan_left', name: 'Pan Left' },
    { id: 'pan_right', name: 'Pan Right' },
    { id: 'rotate', name: 'Rotate' },
    { id: 'parallax', name: 'Parallax' },
    { id: 'morph', name: 'Morph' },
    { id: 'pulse', name: 'Pulse' },
  ];

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-md mx-auto mt-20">
            <Card>
              <CardHeader className="text-center">
                <Video className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>Login Required</CardTitle>
                <CardDescription>
                  Please log in to access AI Video features
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
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Video className="h-8 w-8 text-primary" />
              AI Video Module
            </h1>
            <p className="text-muted-foreground mt-2">
              Generate and manipulate videos with AI
            </p>
          </div>

          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="img2video" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Img2Video
              </TabsTrigger>
              <TabsTrigger value="lipsync" className="flex items-center gap-2">
                <Mic2 className="h-4 w-4" />
                Lip Sync
              </TabsTrigger>
              <TabsTrigger value="replace" className="flex items-center gap-2">
                <UserSquare2 className="h-4 w-4" />
                Replace
              </TabsTrigger>
              <TabsTrigger value="motion" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Motion
              </TabsTrigger>
              <TabsTrigger value="upscale" className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Upscale
              </TabsTrigger>
            </TabsList>

            {/* Generate Video Tab */}
            <TabsContent value="generate">
              <Card>
                <CardHeader>
                  <CardTitle>Text to Video</CardTitle>
                  <CardDescription>Generate video storyboards from text descriptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Describe the video you want to create..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-4 items-center">
                    <span className="text-sm">Duration:</span>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 seconds</SelectItem>
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="15">15 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => callAIVideo('generate_video', { prompt, duration: `${duration}s` })}
                    disabled={loading || !prompt}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                    Generate Storyboard
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Image to Video Tab */}
            <TabsContent value="img2video">
              <Card>
                <CardHeader>
                  <CardTitle>Image to Video</CardTitle>
                  <CardDescription>Animate static images with motion effects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setUploadedImage)}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Image className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Uploaded" className="max-h-48 rounded-lg" />
                  )}
                  <div className="flex gap-4 items-center">
                    <span className="text-sm">Motion Style:</span>
                    <Select value={motionStyle} onValueChange={setMotionStyle}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {motionStyles.map((style) => (
                          <SelectItem key={style.id} value={style.id}>
                            {style.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => callAIVideo('image_to_video', { image: uploadedImage, motion_style: motionStyle })}
                    disabled={loading || !uploadedImage}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    Animate Image
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lip Sync Tab */}
            <TabsContent value="lipsync">
              <Card>
                <CardHeader>
                  <CardTitle>Lip Sync</CardTitle>
                  <CardDescription>Sync face movements to audio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setUploadedImage)}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Upload a face/portrait image:</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Image className="h-4 w-4 mr-2" />
                      Upload Face Image
                    </Button>
                  </div>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Face" className="max-h-48 rounded-lg" />
                  )}
                  <Button
                    onClick={() => callAIVideo('lip_sync', { image: uploadedImage })}
                    disabled={loading || !uploadedImage}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mic2 className="h-4 w-4 mr-2" />}
                    Generate Lip Sync Frame
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Replace Character Tab */}
            <TabsContent value="replace">
              <Card>
                <CardHeader>
                  <CardTitle>Replace Character</CardTitle>
                  <CardDescription>Replace faces/characters in scenes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setUploadedImage)}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setSecondImage)}
                    ref={secondFileInputRef}
                    className="hidden"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Original scene:</p>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Upload Scene
                      </Button>
                      {uploadedImage && (
                        <img src={uploadedImage} alt="Scene" className="max-h-32 rounded-lg" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">New face:</p>
                      <Button variant="outline" onClick={() => secondFileInputRef.current?.click()}>
                        Upload Face
                      </Button>
                      {secondImage && (
                        <img src={secondImage} alt="New Face" className="max-h-32 rounded-lg" />
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => callAIVideo('replace_character', { video: uploadedImage, new_face_image: secondImage })}
                    disabled={loading || !uploadedImage || !secondImage}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserSquare2 className="h-4 w-4 mr-2" />}
                    Replace Character
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Motion Sync Tab */}
            <TabsContent value="motion">
              <Card>
                <CardHeader>
                  <CardTitle>Motion Sync</CardTitle>
                  <CardDescription>Sync motion patterns between sources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleImageUpload(e, setUploadedImage)}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Upload source with motion reference:</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Upload Source
                    </Button>
                  </div>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Source" className="max-h-48 rounded-lg" />
                  )}
                  <Button
                    onClick={() => callAIVideo('motion_sync', { source_video: uploadedImage })}
                    disabled={loading || !uploadedImage}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Analyze Motion
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upscale Tab */}
            <TabsContent value="upscale">
              <Card>
                <CardHeader>
                  <CardTitle>Video Upscale</CardTitle>
                  <CardDescription>Enhance video/frame quality and resolution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleImageUpload(e, setUploadedImage)}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Frame/Video
                  </Button>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Original" className="max-h-48 rounded-lg" />
                  )}
                  <div className="flex gap-4 items-center">
                    <span className="text-sm">Target Resolution:</span>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HD">HD (720p)</SelectItem>
                        <SelectItem value="FHD">Full HD (1080p)</SelectItem>
                        <SelectItem value="4K">4K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => callAIVideo('video_upscale', { video: uploadedImage, resolution })}
                    disabled={loading || !uploadedImage}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ZoomIn className="h-4 w-4 mr-2" />}
                    Upscale
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Results Section */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.storyboard && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{result.storyboard}</p>
                  </div>
                )}
                {result.video_url && (
                  <div className="space-y-4">
                    <img src={result.video_url} alt="Generated" className="max-w-full rounded-lg" />
                    <Button onClick={() => downloadResult(result.video_url!, 'ai-video-frame.png')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
                {result.frames && result.frames.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Generated Frames:</p>
                    <div className="grid grid-cols-2 gap-4">
                      {result.frames.map((frame, idx) => (
                        <div key={idx} className="space-y-2">
                          <img src={frame} alt={`Frame ${idx + 1}`} className="w-full rounded-lg" />
                          <Button size="sm" onClick={() => downloadResult(frame, `frame-${idx + 1}.png`)}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
