import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, LayoutGrid, Users } from "lucide-react";
import { SiPinterest } from "@icons-pack/react-simple-icons";

interface Board {
  id: string;
  board_name: string;
  board_url: string | null;
  description: string | null;
  pins_count: number;
  followers_count: number;
  category: string | null;
  is_collaborative: boolean;
  status: string;
  created_at: string;
}

export default function PinterestBoards() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBoard, setNewBoard] = useState({
    board_name: "",
    board_url: "",
    description: "",
    category: ""
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["pinterest-boards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pinterest_boards")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Board[];
    },
    enabled: !!user
  });

  const addBoardMutation = useMutation({
    mutationFn: async (boardData: typeof newBoard) => {
      const { error } = await supabase.from("pinterest_boards").insert({
        user_id: user?.id,
        board_name: boardData.board_name,
        board_url: boardData.board_url || null,
        description: boardData.description || null,
        category: boardData.category || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinterest-boards"] });
      setIsAddDialogOpen(false);
      setNewBoard({ board_name: "", board_url: "", description: "", category: "" });
      toast({ title: "Board added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error adding board", description: error.message, variant: "destructive" });
    }
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pinterest_boards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinterest-boards"] });
      toast({ title: "Board deleted" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <SiPinterest className="h-8 w-8" color="#E60023" />
                Pinterest Boards
              </h1>
              <p className="text-muted-foreground mt-1">Manage and organize your Pinterest boards</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#E60023] hover:bg-[#C50020]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Board
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Pinterest Board</DialogTitle>
                  <DialogDescription>Add a board to manage</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Board Name *</Label>
                    <Input
                      value={newBoard.board_name}
                      onChange={(e) => setNewBoard({ ...newBoard, board_name: e.target.value })}
                      placeholder="My Board"
                    />
                  </div>
                  <div>
                    <Label>Board URL</Label>
                    <Input
                      value={newBoard.board_url}
                      onChange={(e) => setNewBoard({ ...newBoard, board_url: e.target.value })}
                      placeholder="https://pinterest.com/user/board"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newBoard.description}
                      onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                      placeholder="Board description"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={newBoard.category}
                      onChange={(e) => setNewBoard({ ...newBoard, category: e.target.value })}
                      placeholder="e.g., Home Decor, Recipes"
                    />
                  </div>
                  <Button 
                    onClick={() => addBoardMutation.mutate(newBoard)}
                    disabled={!newBoard.board_name || addBoardMutation.isPending}
                    className="w-full bg-[#E60023] hover:bg-[#C50020]"
                  >
                    {addBoardMutation.isPending ? "Adding..." : "Add Board"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <p className="text-muted-foreground col-span-full text-center py-8">Loading boards...</p>
            ) : boards.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No boards yet. Add your first board to get started.</p>
                </CardContent>
              </Card>
            ) : (
              boards.map((board) => (
                <Card key={board.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{board.board_name}</CardTitle>
                        <CardDescription>{board.category || "No category"}</CardDescription>
                      </div>
                      <Badge variant={board.status === "active" ? "default" : "secondary"}>
                        {board.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {board.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {board.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div className="bg-muted/50 rounded p-2 text-center">
                        <p className="font-semibold">{board.pins_count}</p>
                        <p className="text-xs text-muted-foreground">Pins</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2 text-center">
                        <p className="font-semibold">{board.followers_count}</p>
                        <p className="text-xs text-muted-foreground">Followers</p>
                      </div>
                    </div>
                    {board.is_collaborative && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <Users className="h-3 w-3" />
                        Collaborative Board
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Pins
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteBoardMutation.mutate(board.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}