import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Coins, TrendingUp, TrendingDown, History, Gift, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface PointsTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

export default function Points() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPointsData();
    }
  }, [user]);

  const fetchPointsData = async () => {
    try {
      // Fetch balance
      const { data: pointsData, error: pointsError } = await supabase
        .from("points")
        .select("balance")
        .eq("user_id", user?.id)
        .single();

      if (pointsError) throw pointsError;
      setBalance(pointsData?.balance || 0);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("points_transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error("Error fetching points data:", error);
      toast.error("Failed to load points data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pointsPackages = [
    { points: 500, price: "$4.99", bonus: 0 },
    { points: 1000, price: "$8.99", bonus: 50 },
    { points: 2500, price: "$19.99", bonus: 200 },
    { points: 5000, price: "$34.99", bonus: 500 },
    { points: 10000, price: "$59.99", bonus: 1500 },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Points</h1>
            <p className="text-muted-foreground">Manage your points balance and purchase more credits</p>
          </div>

          {/* Balance Card */}
          <Card className="glass-strong border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/20">
                    <Coins className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-4xl font-bold text-foreground">{balance.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">points available</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">Active Account</Badge>
                  <p className="text-xs text-muted-foreground">Points never expire</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points Packages */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Buy Points
              </CardTitle>
              <CardDescription>Choose a package to add more points to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {pointsPackages.map((pkg) => (
                  <Card key={pkg.points} className="glass-strong hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="mb-2">
                        <Coins className="h-8 w-8 mx-auto text-primary" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{pkg.points.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground mb-2">points</p>
                      {pkg.bonus > 0 && (
                        <Badge className="mb-2 bg-green-500/20 text-green-400 border-green-500/30">
                          <Gift className="h-3 w-3 mr-1" />
                          +{pkg.bonus} bonus
                        </Badge>
                      )}
                      <Button className="w-full mt-2" variant="glow" onClick={() => toast.info("Payment integration coming soon!")}>
                        {pkg.price}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transactions History */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>Your recent points activity</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${transaction.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {transaction.amount > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{transaction.description || transaction.type}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      <div className={`font-bold ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points Usage Info */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>How Points Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">AI Features</h4>
                  <p className="text-sm text-muted-foreground">Use points for AI-powered image generation, video creation, and content analysis.</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Automation</h4>
                  <p className="text-sm text-muted-foreground">Points are consumed when running automated campaigns across social platforms.</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Data Extraction</h4>
                  <p className="text-sm text-muted-foreground">Extract data from social media platforms using your points balance.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
