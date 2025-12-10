import type { ChangeEvent, RefObject } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ImageFaceTabProps {
  uploadedImage: string | null;
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  loading: boolean;
  callAIImage: (action: string, params: Record<string, unknown>) => Promise<void>;
}

export default function ImageFaceTab({
  uploadedImage,
  handleImageUpload,
  fileInputRef,
  loading,
  callAIImage,
}: ImageFaceTabProps) {
  return (
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
          onClick={() => void callAIImage("face_enhance", { image: uploadedImage })}
          disabled={loading || !uploadedImage}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Enhance Face
        </Button>
      </CardContent>
    </Card>
  );
}