import { useState, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Image, 
  Wand2, 
  Palette, 
  Copy, 
  Eraser, 
  ZoomIn, 
  Smile, 
  Layers,
  PenTool,
  Download,
  Loader2
} from "lucide-react";

export default function AIImageModule() {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [styleId, setStyleId] = useState("oil_painting");
  const [variationCount, setVariationCount] = useState(2);
  const [batchCount, setBatchCount] = useState(4);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const callAIImage = async (action: string, params: Record<string, any>) => {
    setLoading(true);
    setGeneratedImage(null);
    setGeneratedImages([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-image', {
        body: { action, ...params }
      });

      if (error) throw error;
      
      if (data.images) {
        setGeneratedImages(data.images);
        toast.success(`Generated ${data.images.length} images!`);
      } else {
        const imageUrl = data.image_url || data.styled_image_url || data.upscaled_image_url || 
                        data.enhanced_face_image || data.result_image_url || data.transparent_image_url;
        if (imageUrl) {
          setGeneratedImage(imageUrl);
          toast.success("Image generated successfully!");
        }
      }
    } catch (error: any) {
      console.error('AI Image error:', error);
      toast.error(error.message || "Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const styles = [
    { id: 'oil_painting', name: 'Oil Painting' },
    { id: 'watercolor', name: 'Watercolor' },
    { id: 'pencil_sketch', name: 'Pencil Sketch' },
    { id: 'anime', name: 'Anime' },
    { id: 'pop_art', name: 'Pop Art' },
    { id: 'cyberpunk', name: 'Cyberpunk' },
    { id: 'vintage', name: 'Vintage' },
    { id: 'minimalist', name: 'Minimalist' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Image className="h-8 w-8 text-primary" />
              AI Image Module
            </h1>
            <p className="text-muted-foreground mt-2">
              Generate and manipulate images with AI
            </p>
          </div>

          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="img2img" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Img2Img
              </TabsTrigger>
              <TabsTrigger value="sketch" className="flex items-center gap-2">
                <PenTool className="h-4 w-4" />
                Sketch
              </TabsTrigger>
              <TabsTrigger value="style" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Style
              </TabsTrigger>
              <TabsTrigger value="variations" className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Variations
              </TabsTrigger>
              <TabsTrigger value="inpaint" className="flex items-center gap-2">
                <Eraser className="h-4 w-4" />
                Inpaint
              </TabsTrigger>
              <TabsTrigger value="upscale" className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Upscale
              </TabsTrigger>
              <TabsTrigger value="face" className="flex items-center gap-2">
                <Smile className="h-4 w-4" />
                Face
              </TabsTrigger>
            </TabsList>

            {/* Generate Tab */}
            <TabsContent value="generate">
              <Card>
                <CardHeader>
                  <CardTitle>Text to Image</CardTitle>
                  <CardDescription>Generate images from text descriptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Describe the image you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-4">
                    <Button
                      onClick={() => callAIImage('generate_image', { prompt })}
                      disabled={loading || !prompt}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      Generate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => callAIImage('batch_generate', { prompt, count: batchCount })}
                      disabled={loading || !prompt}
                    >
                      Batch Generate ({batchCount})
                    </Button>
                    <Select value={batchCount.toString()} onValueChange={(v) => setBatchCount(parseInt(v))}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Img2Img Tab */}
            <TabsContent value="img2img">
              <Card>
                <CardHeader>
                  <CardTitle>Image to Image</CardTitle>
                  <CardDescription>Transform existing images with AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Image
                  </Button>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Uploaded" className="max-h-48 rounded-lg" />
                  )}
                  <Textarea
                    placeholder="Describe how to transform the image..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                  />
                  <Button
                    onClick={() => callAIImage('image_to_image', { image: uploadedImage, prompt })}
                    disabled={loading || !uploadedImage}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Transform
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sketch Tab */}
            <TabsContent value="sketch">
              <Card>
                <CardHeader>
                  <CardTitle>Sketch to Image</CardTitle>
                  <CardDescription>Convert sketches into detailed images</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Sketch
                  </Button>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Sketch" className="max-h-48 rounded-lg" />
                  )}
                  <Textarea
                    placeholder="Describe what the sketch represents..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                  />
                  <Button
                    onClick={() => callAIImage('sketch_to_image', { image: uploadedImage, prompt })}
                    disabled={loading || !uploadedImage}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Convert Sketch
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Style Transfer Tab */}
            <TabsContent value="style">
              <Card>
                <CardHeader>
                  <CardTitle>Style Transfer</CardTitle>
                  <CardDescription>Apply artistic styles to images</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Image
                  </Button>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Original" className="max-h-48 rounded-lg" />
                  )}
                  <Select value={styleId} onValueChange={setStyleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => callAIImage('style_transfer', { image: uploadedImage, style_id: styleId })}
                    disabled={loading || !uploadedImage}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Apply Style
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Variations Tab */}
            <TabsContent value="variations">
              <Card>
                <CardHeader>
                  <CardTitle>Image Variations</CardTitle>
                  <CardDescription>Generate creative variations of an image</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Image
                  </Button>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Original" className="max-h-48 rounded-lg" />
                  )}
                  <div className="flex gap-4 items-center">
                    <span className="text-sm">Number of variations:</span>
                    <Select value={variationCount.toString()} onValueChange={(v) => setVariationCount(parseInt(v))}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => callAIImage('variations', { image: uploadedImage, count: variationCount })}
                    disabled={loading || !uploadedImage}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Generate Variations
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inpainting Tab */}
            <TabsContent value="inpaint">
              <Card>
                <CardHeader>
                  <CardTitle>Inpainting</CardTitle>
                  <CardDescription>Edit specific areas of an image</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Image
                  </Button>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Original" className="max-h-48 rounded-lg" />
                  )}
                  <Textarea
                    placeholder="Describe what you want to change or add..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                  />
                  <Button
                    onClick={() => callAIImage('inpainting', { image: uploadedImage, prompt })}
                    disabled={loading || !uploadedImage || !prompt}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Edit Image
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upscale Tab */}
            <TabsContent value="upscale">
              <Card>
                <CardHeader>
                  <CardTitle>Upscale</CardTitle>
                  <CardDescription>Enhance and upscale images</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Image
                  </Button>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Original" className="max-h-48 rounded-lg" />
                  )}
                  <Button
                    onClick={() => callAIImage('upscale', { image: uploadedImage })}
                    disabled={loading || !uploadedImage}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Upscale Image
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Face Enhancement Tab */}
            <TabsContent value="face">
              <Card>
                <CardHeader>
                  <CardTitle>Face Enhancement</CardTitle>
                  <CardDescription>Enhance facial features in photos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Photo
                  </Button>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Original" className="max-h-48 rounded-lg" />
                  )}
                  <Button
                    onClick={() => callAIImage('face_enhance', { image: uploadedImage })}
                    disabled={loading || !uploadedImage}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Enhance Face
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Results Section */}
          {(generatedImage || generatedImages.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Results</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedImage && (
                  <div className="space-y-4">
                    <img src={generatedImage} alt="Generated" className="max-w-full rounded-lg" />
                    <Button onClick={() => downloadImage(generatedImage, 'ai-generated.png')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
                {generatedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {generatedImages.map((img, idx) => (
                      <div key={idx} className="space-y-2">
                        <img src={img} alt={`Generated ${idx + 1}`} className="w-full rounded-lg" />
                        <Button size="sm" onClick={() => downloadImage(img, `ai-generated-${idx + 1}.png`)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
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
