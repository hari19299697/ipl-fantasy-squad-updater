import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/useCategories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, Upload, Edit2, Trash2, X } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}

const CategoryManagementModal = ({ isOpen, onClose, tournamentId }: CategoryManagementModalProps) => {
  const { categories, bulkCreateCategories, updateCategory, deleteCategory } = useCategories(tournamentId);
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState({ name: "", description: "", adder: "1000" });
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; description: string; adder: string } | null>(null);

  const handleAddCategory = () => {
    if (!newCategory.name) {
      toast({ title: "Error", description: "Please enter category name", variant: "destructive" });
      return;
    }

    bulkCreateCategories([{
      tournament_id: tournamentId,
      name: newCategory.name,
      description: newCategory.description || undefined,
      adder: parseFloat(newCategory.adder) || 1000,
    }]);

    setNewCategory({ name: "", description: "", adder: "1000" });
  };

  const handleExport = () => {
    const exportData = categories.map((cat) => ({
      Name: cat.name,
      Description: cat.description || "",
      Adder: cat.adder || 1000,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categories");
    XLSX.writeFile(wb, `categories_${tournamentId}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const categoriesToImport = jsonData.map((row) => ({
          tournament_id: tournamentId,
          name: row.Name || row.name,
          description: row.Description || row.description || undefined,
          adder: parseFloat(row.Adder || row.adder) || 1000,
        }));

        bulkCreateCategories(categoriesToImport);
      } catch (error) {
        toast({ title: "Import Error", description: "Failed to import file", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleEdit = (category: typeof categories[0]) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      description: category.description || "",
      adder: category.adder?.toString() || "1000",
    });
  };

  const handleUpdate = () => {
    if (!editingCategory || !editingCategory.name) {
      toast({ title: "Error", description: "Please enter category name", variant: "destructive" });
      return;
    }

    updateCategory({
      id: editingCategory.id,
      updates: {
        name: editingCategory.name,
        description: editingCategory.description || undefined,
        adder: parseFloat(editingCategory.adder) || 1000,
      },
    });

    setEditingCategory(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteCategory(id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>Add or import player categories for this tournament</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Category */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Category
            </h3>
            <div className="space-y-3">
              <div>
                <Label>Category Name *</Label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="A, B, C, etc."
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div>
                <Label>Bid Increment (Adder) *</Label>
                <Input
                  type="number"
                  step="any"
                  value={newCategory.adder}
                  onChange={(e) => setNewCategory({ ...newCategory, adder: e.target.value })}
                  placeholder="0.25"
                />
              </div>
            </div>
            <Button onClick={handleAddCategory} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {/* Import/Export */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <label>
                <Upload className="h-4 w-4 mr-2" />
                Import from Excel
                <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
              </label>
            </Button>
          </div>

          {/* Edit Category Form */}
          {editingCategory && (
            <div className="border rounded-lg p-4 space-y-3 bg-primary/5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Edit2 className="h-4 w-4" />
                  Edit Category
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setEditingCategory(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Category Name *</Label>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editingCategory.description}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Bid Increment (Adder) *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={editingCategory.adder}
                    onChange={(e) => setEditingCategory({ ...editingCategory, adder: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleUpdate} className="w-full">
                Update Category
              </Button>
            </div>
          )}

          {/* Categories List */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Bid Increment</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{cat.description || "—"}</TableCell>
                    <TableCell>₹{cat.adder?.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) || '1,000'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cat)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No categories added yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagementModal;
