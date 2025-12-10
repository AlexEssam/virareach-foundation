import { useState, useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useAiImage } from "@/hooks/useAiImage";
import ImageGenerateTab from "@/components/ai/image/ImageGenerateTab";
import ImageImg2ImgTab from "@/components/ai/image/ImageImg2ImgTab";
import ImageSketchTab from "@/components/ai/image/ImageSketchTab";
import ImageStyleTab from "@/components/ai/image/ImageStyleTab";
import ImageVariationsTab from "@/components/ai/image/ImageVariationsTab";
import ImageInpaintTab from "@/components/ai/image/ImageInpaintTab";
import ImageUpscaleTab from "@/components/ai/image/ImageUpscaleTab";
import ImageFaceTab from "@/components/ai/image/ImageFaceTab";
import ImageResultsSection from "@/components/ai/image/ImageResultsSection";
import {
  Image as ImageIcon,
  Wand2,
  Palette,
  Copy,
  Eraser,
  ZoomIn,
  Smile,
  Layers,
  PenTool,
  LogIn,
} from "lucide-react";

export default function AIImageModule() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { loading, generatedImage, generatedImages, callAIImage } = useAiImage();

  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [styleId, setStyleId] = useState("oil_painting");
  const [variationCount, setVariationCount] = useState(2);
  const [batchCount, setBatchCount] = useState(4);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!authLoading && !user) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-md mx-auto mt-20">
            <Card>
              <CardHeader className="text-center">
                <ImageIcon className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>Login Required</CardTitle>
                <CardDescription>
                  Please log in to access AI Image features
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={() => navigate("/login")}>
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
              <ImageIcon className="h-8 w-8 text-primary" />
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

            <TabsContent value="generate">
              <ImageGenerateTab
                prompt={prompt}
                setPrompt={setPrompt}
                batchCount={batchCount}
                setBatchCount={setBatchCount}
                loading={loading}
                callAIImage={callAIImage}
              />
            </TabsContent>

            <TabsContent value="img2img">
              <ImageImg2ImgTab
                prompt={prompt}
                setPrompt={setPrompt}
                uploadedImage={uploadedImage}
                handleImageUpload={handleImageUpload}
                fileInputRef={fileInputRef}
                loading={loading}
                callAIImage={callAIImage}
              />
            </TabsContent>

            <TabsContent value="sketch">
              <ImageSketchTab
                prompt={prompt}
                setPrompt={setPrompt}
                uploadedImage={uploadedImage}
                handleImageUpload={handleImageUpload}
                fileInputRef={fileInputRef}
                loading={loading}
                callAIImage={callAIImage}
              />
            </TabsContent>

            <TabsContent value="style">
              <ImageStyleTab
                uploadedImage={uploadedImage}
                handleImageUpload={handleImageUpload}
                fileInputRef={fileInputRef}
                styleId={styleId}
                setStyleId={setStyleId}
                loading={loading}
                callAIImage={callAIImage}
              />
            </TabsContent>

            <TabsContent value="variations">
              <ImageVariationsTab
                uploadedImage={uploadedImage}
                handleImageUpload={handleImageUpload}
                fileInputRef={fileInputRef}
                variationCount={variationCount}
                setVariationCount={setVariationCount}
                loading={loading}
                callAIImage={callAIImage}
              />
            </TabsContent>

            <TabsContent value="inpaint">
              <ImageInpaintTab
                prompt={prompt}
                setPrompt={setPrompt}
                uploadedImage={uploadedImage}
                handleImageUpload={handleImageUpload}
                fileInputRef={fileInputRef}
                loading={loading}
                callAIImage={callAIImage}
              />
            </TabsContent>

            <TabsContent value="upscale">
              <ImageUpscaleTab
                uploadedImage={uploadedImage}
                handleImageUpload={handleImageUpload}
                fileInputRef={fileInputRef}
                loading={loading}
                callAIImage={callAIImage}
              />
            </TabsContent>

            <TabsContent value="face">
              <ImageFaceTab
                uploadedImage={uploadedImage}
                handleImageUpload={handleImageUpload}
                fileInputRef={fileInputRef}
                loading={loading}
                callAIImage={callAIImage}
              />
            </TabsContent>
          </Tabs>

          <ImageResultsSection
            loading={loading}
            generatedImage={generatedImage}
            generatedImages={generatedImages}
            onDownload={downloadImage}
          />
        </div>
      </main>
    </div>
  );
}