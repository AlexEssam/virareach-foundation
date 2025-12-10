import type { ChangeEvent, RefObject } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ImageStyleTabProps {
  uploadedImage: string | null;
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  styleId: string;
  setStyleId: (value: string) => void;
  loading: boolean;
  callAIImage: (action: string, params: Record<string, unknown>) => Promise<void>;
}

const styles = [
  { id: "oil_painting", name: "Oil Painting" },
  { id: "watercolor", name: "Watercolor" },
  { id: "pencil_sketch", name: "Pencil Sketch" },
  { id: "anime", name: "Anime" },
  { id: "pop_art", name: "Pop Art" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "vintage", name: "Vintage" },
  { id: "minimalist", name: "Minimalist" },
];

export default function ImageStyleTab({
  uploadedImage,
  handleImageUpload,
  fileInputRef,
  styleId,
  setStyleId,
  loading,
  callAIImage,
}: ImageStyleTabProps) {
  return (
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
          onClick={() =>
            void callAIImage("style_transfer", {
              image: uploadedImage,
              style_id: styleId,
            })
          }
          disabled={loading || !uploadedImage}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Apply Style
        </Button>
      </CardContent>
    </Card>
  );
}