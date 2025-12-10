import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UseAiImageState {
  loading: boolean;
  generatedImage: string | null;
  generatedImages: string[];
}

export interface UseAiImageHook extends UseAiImageState {
  callAIImage: (action: string, params: Record<string, unknown>) => Promise<void>;
  resetResults: () => void;
}

export function useAiImage(): UseAiImageHook {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const resetResults = useCallback(() => {
    setGeneratedImage(null);
    setGeneratedImages([]);
  }, []);

  const callAIImage = useCallback(
    async (action: string, params: Record<string, unknown>) => {
      setLoading(true);
      resetResults();

      try {
        const { data, error } = await supabase.functions.invoke("ai-image", {
          body: { action, ...params },
        });

        if (error) {
          console.error("Function invoke error:", error);
          throw new Error(error.message || "Failed to call AI service");
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        if (data?.images && data.images.length > 0) {
          setGeneratedImages(data.images);
          toast.success(`Generated ${data.images.length} images!`);
        } else {
          const imageUrl =
            data?.image_url ||
            data?.styled_image_url ||
            data?.upscaled_image_url ||
            data?.enhanced_face_image ||
            data?.result_image_url ||
            data?.transparent_image_url;

          if (imageUrl) {
            setGeneratedImage(imageUrl);
            toast.success("Image generated successfully!");
          } else {
            console.error("No image in response:", data);
            toast.error("No image was generated. Please try again.");
          }
        }
      } catch (error: any) {
        console.error("AI Image error:", error);
        if (error.message?.includes("Rate limit")) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.");
        } else if (error.message?.includes("Credits")) {
          toast.error("Credits exhausted. Please add more credits to continue.");
        } else {
          toast.error(error.message || "Failed to process image");
        }
      } finally {
        setLoading(false);
      }
    },
    [resetResults]
  );

  return {
    loading,
    generatedImage,
    generatedImages,
    callAIImage,
    resetResults,
  };
}