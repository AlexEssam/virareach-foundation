import type { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Loader2 } from "lucide-react";

interface ImageGenerateTabProps {
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  batchCount: number;
  setBatchCount: Dispatch<SetStateAction<number>>;
  loading: boolean;
  callAIImage: (action: string, params: Record<string, unknown>) => Promise<void>;
}

export default function ImageGenerateTab({
  prompt,
  setPrompt,
  batchCount,
  setBatchCount,
  loading,
  callAIImage,
}: ImageGenerateTabProps) {
  return (
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
        <div className="flex gap-4 flex-wrap">
          <Button
            onClick={() => void callAIImage("generate_image", { prompt })}
            disabled={loading || !prompt}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Generate
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              void callAIImage("batch_generate", {
                prompt,
                count: batchCount,
                high_quality: true,
              })
            }
            disabled={loading || !prompt}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            توليد {batchCount} صور بجودة عالية
          </Button>
          <Select
            value={batchCount.toString()}
            onValueChange={(v) => setBatchCount(parseInt(v))}
          >
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
  );
}