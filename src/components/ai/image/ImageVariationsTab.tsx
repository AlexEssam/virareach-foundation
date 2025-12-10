import type { ChangeEvent, RefObject } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ImageVariationsTabProps {
  uploadedImage: string | null;
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  variationCount: number;
  setVariationCount: (value: number) => void;
  loading: boolean;
  callAIImage: (action: string, params: Record<string, unknown>) => Promise<void>;
}

export default function ImageVariationsTab({
  uploadedImage,
  handleImageUpload,
  fileInputRef,
  variationCount,
  setVariationCount,
  loading,
  callAIImage,
}: ImageVariationsTabProps) {
  return (
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
          <Select
            value={variationCount.toString()}
            onValueChange={(v) => setVariationCount(parseInt(v))}
          >
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
          onClick={() =>
            void callAIImage("variations", {
              image: uploadedImage,
              count: variationCount,
            })
          }
          disabled={loading || !uploadedImage}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Generate Variations
        </Button>
      </CardContent>
    </Card>
  );
}