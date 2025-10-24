import { useState } from "react";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuctionRules } from "@/hooks/useAuctionRules";
import { useScoringRules } from "@/hooks/useScoringRules";
import { useTournaments } from "@/hooks/useTournaments";
import { Plus, Edit, Loader2, Settings, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const Masters = () => {
  const { auctionRules, isLoading: loadingAuction, createAuctionRule, updateAuctionRule, deleteAuctionRule } = useAuctionRules();
  const { scoringRules, isLoading: loadingScoring, createScoringRule, updateScoringRule, deleteScoringRule } = useScoringRules();
  const { tournaments } = useTournaments();

  const [auctionDialogOpen, setAuctionDialogOpen] = useState(false);
  const [scoringDialogOpen, setScoringDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState<any>(null);
  const [editingScoring, setEditingScoring] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [auctionForm, setAuctionForm] = useState({
    name: "",
    type: "sealed_bid",
    initial_budget: 10000000,
    min_bid: 100000,
    increment_value: 100000,
    bid_increment_type: "fixed",
    max_players_per_team: 25,
    currency: "INR",
  });

  const [scoringForm, setScoringForm] = useState({
    name: "",
    description: "",
    rules: {} as any,
  });

  const [categoryForm, setCategoryForm] = useState({
    tournament_id: "",
    name: "",
    description: "",
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'auction' | 'scoring' | 'category' } | null>(null);

  // Load categories
  const loadCategories = async () => {
    setLoadingCategories(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setCategories(data);
    }
    setLoadingCategories(false);
  };

  useState(() => {
    loadCategories();
  });

  const handleCreateAuction = () => {
    createAuctionRule(
      { ...auctionForm, role_constraints: {} },
      {
        onSuccess: () => {
          setAuctionDialogOpen(false);
          setAuctionForm({
            name: "",
            type: "sealed_bid",
            initial_budget: 10000000,
            min_bid: 100000,
            increment_value: 100000,
            bid_increment_type: "fixed",
            max_players_per_team: 25,
            currency: "INR",
          });
        },
      }
    );
  };

  const handleUpdateAuction = () => {
    if (editingAuction) {
      updateAuctionRule(
        { id: editingAuction.id, updates: auctionForm },
        {
          onSuccess: () => {
            setAuctionDialogOpen(false);
            setEditingAuction(null);
          },
        }
      );
    }
  };

  const handleCreateScoring = () => {
    createScoringRule(
      scoringForm,
      {
        onSuccess: () => {
          setScoringDialogOpen(false);
          setScoringForm({ name: "", description: "", rules: {} });
        },
      }
    );
  };

  const handleUpdateScoring = () => {
    if (editingScoring) {
      updateScoringRule(
        { id: editingScoring.id, updates: scoringForm },
        {
          onSuccess: () => {
            setScoringDialogOpen(false);
            setEditingScoring(null);
          },
        }
      );
    }
  };

  const openEditAuction = (rule: any) => {
    setEditingAuction(rule);
    setAuctionForm({
      name: rule.name,
      type: rule.type,
      initial_budget: rule.initial_budget,
      min_bid: rule.min_bid,
      increment_value: rule.increment_value,
      bid_increment_type: rule.bid_increment_type,
      max_players_per_team: rule.max_players_per_team,
      currency: rule.currency,
    });
    setAuctionDialogOpen(true);
  };

  const openEditScoring = (rule: any) => {
    setEditingScoring(rule);
    setScoringForm({
      name: rule.name,
      description: rule.description || "",
      rules: rule.rules || {},
    });
    setScoringDialogOpen(true);
  };

  const handleCreateCategory = async () => {
    const { error } = await supabase
      .from('categories')
      .insert([categoryForm]);
    
    if (!error) {
      setCategoryDialogOpen(false);
      setCategoryForm({ tournament_id: "", name: "", description: "" });
      loadCategories();
    }
  };

  const handleUpdateCategory = async () => {
    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update(categoryForm)
        .eq('id', editingCategory.id);
      
      if (!error) {
        setCategoryDialogOpen(false);
        setEditingCategory(null);
        loadCategories();
      }
    }
  };

  const openEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      tournament_id: category.tournament_id,
      name: category.name,
      description: category.description || "",
    });
    setCategoryDialogOpen(true);
  };

  const handleDeleteClick = (id: string, type: 'auction' | 'scoring' | 'category') => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'auction') {
      deleteAuctionRule(itemToDelete.id);
    } else if (itemToDelete.type === 'scoring') {
      deleteScoringRule(itemToDelete.id);
    } else if (itemToDelete.type === 'category') {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', itemToDelete.id);
      
      if (!error) {
        loadCategories();
      }
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Master Templates</h1>
          </div>
          <p className="text-muted-foreground">
            Manage auction rules, scoring systems, and categories
          </p>
        </div>

        <Tabs defaultValue="auction" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auction">Auction Rules</TabsTrigger>
            <TabsTrigger value="scoring">Scoring Rules</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Auction Rules Tab */}
          <TabsContent value="auction" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Auction Rule Templates</CardTitle>
                    <CardDescription>Create and manage auction configurations</CardDescription>
                  </div>
                  <Dialog open={auctionDialogOpen} onOpenChange={setAuctionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { setEditingAuction(null); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAuction ? "Edit Auction Rule" : "Create Auction Rule"}
                        </DialogTitle>
                        <DialogDescription>
                          Configure auction parameters and constraints
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Template Name</Label>
                          <Input
                            value={auctionForm.name}
                            onChange={(e) => setAuctionForm({ ...auctionForm, name: e.target.value })}
                            placeholder="e.g., Standard IPL Auction"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Initial Budget</Label>
                            <Input
                              type="number"
                              value={auctionForm.initial_budget}
                              onChange={(e) => setAuctionForm({ ...auctionForm, initial_budget: parseInt(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Min Bid</Label>
                            <Input
                              type="number"
                              value={auctionForm.min_bid}
                              onChange={(e) => setAuctionForm({ ...auctionForm, min_bid: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Increment Value</Label>
                            <Input
                              type="number"
                              value={auctionForm.increment_value}
                              onChange={(e) => setAuctionForm({ ...auctionForm, increment_value: parseInt(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Max Players per Team</Label>
                            <Input
                              type="number"
                              value={auctionForm.max_players_per_team}
                              onChange={(e) => setAuctionForm({ ...auctionForm, max_players_per_team: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={editingAuction ? handleUpdateAuction : handleCreateAuction}
                          className="w-full"
                        >
                          {editingAuction ? "Update Template" : "Create Template"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAuction ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Initial Budget</TableHead>
                        <TableHead>Min Bid</TableHead>
                        <TableHead>Max Players</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auctionRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell>{rule.currency} {rule.initial_budget.toLocaleString()}</TableCell>
                          <TableCell>{rule.currency} {rule.min_bid.toLocaleString()}</TableCell>
                          <TableCell>{rule.max_players_per_team}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditAuction(rule)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(rule.id, 'auction')}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scoring Rules Tab */}
          <TabsContent value="scoring" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Scoring Rule Templates</CardTitle>
                    <CardDescription>Create and manage scoring systems</CardDescription>
                  </div>
                  <Dialog open={scoringDialogOpen} onOpenChange={setScoringDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { setEditingScoring(null); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingScoring ? "Edit Scoring Rule" : "Create Scoring Rule"}
                        </DialogTitle>
                        <DialogDescription>
                          Configure point values for different actions
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Template Name</Label>
                          <Input
                            value={scoringForm.name}
                            onChange={(e) => setScoringForm({ ...scoringForm, name: e.target.value })}
                            placeholder="e.g., Standard Cricket Scoring"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={scoringForm.description}
                            onChange={(e) => setScoringForm({ ...scoringForm, description: e.target.value })}
                            placeholder="Describe the scoring system..."
                          />
                        </div>
                        <Button 
                          onClick={editingScoring ? handleUpdateScoring : handleCreateScoring}
                          className="w-full"
                        >
                          {editingScoring ? "Update Template" : "Create Template"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingScoring ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scoringRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell>{rule.description || "No description"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditScoring(rule)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(rule.id, 'scoring')}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Player Categories</CardTitle>
                    <CardDescription>Manage player categories for tournaments</CardDescription>
                  </div>
                  <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { setEditingCategory(null); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingCategory ? "Edit Category" : "Create Category"}
                        </DialogTitle>
                        <DialogDescription>
                          Add a new player category for a tournament
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Tournament</Label>
                          <Select 
                            value={categoryForm.tournament_id} 
                            onValueChange={(value) => setCategoryForm({ ...categoryForm, tournament_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select tournament" />
                            </SelectTrigger>
                            <SelectContent>
                              {tournaments.map((tournament) => (
                                <SelectItem key={tournament.id} value={tournament.id}>
                                  {tournament.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Category Name</Label>
                          <Input
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            placeholder="e.g., Marquee, Premium, Base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                            placeholder="Optional description..."
                          />
                        </div>
                        <Button 
                          onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                          className="w-full"
                        >
                          {editingCategory ? "Update Category" : "Create Category"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tournament</TableHead>
                        <TableHead>Category Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            {category.tournaments?.name || "N/A"}
                          </TableCell>
                          <TableCell>{category.name}</TableCell>
                          <TableCell>{category.description || "No description"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditCategory(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(category.id, 'category')}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this {itemToDelete?.type} template.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Masters;
