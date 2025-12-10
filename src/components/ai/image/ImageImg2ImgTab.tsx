import type { ChangeEvent, RefObject } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ImageImg2ImgTabProps {
  prompt: string;
  setPrompt: (value: string) => void;
  uploadedImage: string | null;
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  loading: boolean;
  callAIImage: (action: string, params: Record<string, unknown>) => Promise<void>;
}

export default function ImageImg2ImgTab({
  prompt,
  setPrompt,
  uploadedImage,
  handleImageUpload,
  fileInputRef,
  loading,
  callAIImage,
}: ImageImg2ImgTabProps) {
  return (
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
          onClick={() =>
            void callAIImage("image_to_image", { image: uploadedImage, prompt })
          }
          disabled={loading || !uploadedImage}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Transform
        </Button>
      </CardContent>
    </Card>
  );
}