import type { ChangeEvent, RefObject } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ImageInpaintTabProps {
  prompt: string;
  setPrompt: (value: string) => void;
  uploadedImage: string | null;
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  loading: boolean;
  callAIImage: (action: string, params: Record<string, unknown>) => Promise<void>;
}

export default function ImageInpaintTab({
  prompt,
  setPrompt,
  uploadedImage,
  handleImageUpload,
  fileInputRef,
  loading,
  callAIImage,
}: ImageInpaintTabProps) {
  return (
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
          onClick={() =>
            void callAIImage("inpainting", { image: uploadedImage, prompt })
          }
          disabled={loading || !uploadedImage || !prompt}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Edit Image
        </Button>
      </CardContent>
    </Card>
  );
}