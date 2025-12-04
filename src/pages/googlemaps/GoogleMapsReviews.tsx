import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, MessageSquare, AlertTriangle, Loader2, Sparkles, Shield } from "lucide-react";

interface Review {
  id: string;
  reviewer_name: string | null;
  rating: number | null;
  review_text: string | null;
  review_date: string | null;
  created_at: string;
}

interface ReviewGeneration {
  id: string;
  business_name: string;
  review_text: string;
  rating: number;
  status: string;
  created_at: string;
}

export default function GoogleMapsReviews() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [generations, setGenerations] = useState<ReviewGeneration[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Review generation form
  const [businessName, setBusinessName] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState("5");

  // Safety limits
  const [dailyLimit] = useState(3); // Safety limit for daily reviews
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReviews();
      fetchGenerations();
    }
  }, [user]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("google_maps_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Failed to fetch reviews");
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const fetchGenerations = async () => {
    const { data, error } = await supabase
      .from("google_maps_review_generations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      toast.error("Failed to fetch generations");
    } else {
      setGenerations(data || []);
      
      // Count today's generations
      const today = new Date().toISOString().split("T")[0];
      const todayGens = (data || []).filter(
        (g) => g.created_at.split("T")[0] === today
      );
      setTodayCount(todayGens.length);
    }
  };

  const handleGenerateReview = async () => {
    if (todayCount >= dailyLimit) {
      toast.error(`Daily limit reached (${dailyLimit} reviews/day for safety)`);
      return;
    }

    if (!businessName.trim() || !reviewText.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-maps-reviews", {
        body: {
          action: "generate_review",
          params: {
            business_name: businessName,
            business_url: businessUrl,
            review_text: reviewText,
            rating: parseInt(rating),
          },
        },
      });

      if (error) throw error;
      toast.success("Review queued for posting");
      fetchGenerations();
      setBusinessName("");
      setBusinessUrl("");
      setReviewText("");
      setRating("5");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate review");
    } finally {
      setGenerating(false);
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < count ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
        }`}
      />
    ));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Star className="h-8 w-8 text-primary" />
              Google Maps Reviews
            </h1>
            <p className="text-muted-foreground mt-2">
              View extracted reviews and manage review generation
            </p>
          </div>

          {/* Safety Warning */}
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="font-medium">Safety Limits Active</p>
                <p className="text-sm text-muted-foreground">
                  Review generation is limited to {dailyLimit} reviews per day for account safety.
                  Today: {todayCount}/{dailyLimit} used.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Review Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generate Review
              </CardTitle>
              <CardDescription>
                Create a review to be posted on Google Maps (with safety limits)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name *</Label>
                  <Input
                    placeholder="Enter business name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Google Maps URL (Optional)</Label>
                  <Input
                    placeholder="https://maps.google.com/..."
                    value={businessUrl}
                    onChange={(e) => setBusinessUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <SelectItem key={r} value={r.toString()}>
                        <div className="flex items-center gap-2">
                          {renderStars(r)}
                          <span>{r} Star{r !== 1 ? "s" : ""}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Review Text *</Label>
                <Textarea
                  placeholder="Write your review..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleGenerateReview}
                  disabled={generating || todayCount >= dailyLimit}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Queue Review
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Reviews remaining today: {dailyLimit - todayCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Reviews</CardTitle>
              <CardDescription>History of review generations</CardDescription>
            </CardHeader>
            <CardContent>
              {generations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No reviews generated yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {generations.map((gen) => (
                    <div
                      key={gen.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{gen.business_name}</p>
                        <Badge
                          variant={
                            gen.status === "posted"
                              ? "default"
                              : gen.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {gen.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(gen.rating)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {gen.review_text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(gen.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extracted Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Extracted Reviews
              </CardTitle>
              <CardDescription>Reviews extracted from businesses</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No reviews extracted yet. Extract reviews from the Extractor page.
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{review.reviewer_name || "Anonymous"}</p>
                        {review.rating && (
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                        )}
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-muted-foreground">
                          {review.review_text}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {review.review_date || new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
