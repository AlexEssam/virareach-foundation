import type { ChangeEvent, RefObject } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ImageSketchTabProps {
  prompt: string;
  setPrompt: (value: string) => void;
  uploadedImage: string | null;
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  loading: boolean;
  callAIImage: (action: string, params: Record<string, unknown>) => Promise<void>;
}

export default function ImageSketchTab({
  prompt,
  setPrompt,
  uploadedImage,
  handleImageUpload,
  fileInputRef,
  loading,
  callAIImage,
}: ImageSketchTabProps) {
  return (
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
          onClick={() =>
            void callAIImage("sketch_to_image", { image: uploadedImage, prompt })
          }
          disabled={loading || !uploadedImage}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Convert Sketch
        </Button>
      </CardContent>
    </Card>
  );
}