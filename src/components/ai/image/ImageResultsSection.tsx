import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";

interface ImageResultsSectionProps {
  loading: boolean;
  generatedImage: string | null;
  generatedImages: string[];
  onDownload: (url: string, filename: string) => void;
}

export default function ImageResultsSection({
  loading,
  generatedImage,
  generatedImages,
  onDownload,
}: ImageResultsSectionProps) {
  return (
    <>
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating your image...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && (generatedImage || generatedImages.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Results</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedImage && (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="max-w-full max-h-[600px] mx-auto object-contain"
                    onError={(e) => {
                      console.error("Image failed to load");
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <Button onClick={() => onDownload(generatedImage, "ai-generated.png")}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
            {generatedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {generatedImages.map((img, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                      <img
                        src={img}
                        alt={`Generated ${idx + 1}`}
                        className="w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        onDownload(img, `ai-generated-${idx + 1}.png`)
                      }
                    >
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
    </>
  );
}