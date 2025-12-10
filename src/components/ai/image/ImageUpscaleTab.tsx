import type { ChangeEvent, RefObject } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ImageUpscaleTabProps {
  uploadedImage: string | null;
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  loading: boolean;
  callAIImage: (action: string, params: Record<string, unknown>) => Promise<void>;
}

export default function ImageUpscaleTab({
  uploadedImage,
  handleImageUpload,
  fileInputRef,
  loading,
  callAIImage,
}: ImageUpscaleTabProps) {
  return (
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
          onClick={() => void callAIImage("upscale", { image: uploadedImage })}
          disabled={loading || !uploadedImage}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Upscale Image
        </Button>
      </CardContent>
    </Card>
  );
}