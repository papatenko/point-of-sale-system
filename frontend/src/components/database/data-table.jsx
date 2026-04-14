import { useState, useMemo, useEffect } from "react";
import { Search, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertPopup, useAlertPopup } from "@/components/common/alert-popup";
import { Trash2 } from "lucide-react";
import { formatPhoneNumber } from "@/utils/constraints";

export function DataTable({
  columns,
  data,
  pageSize = 10,
  searchKeys,
  deleteIdKey,
  onDelete,
  onEdit,
  loading = false,
  emptyMessage = "No items found",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { alertConfig, showAlert, hideAlert, AlertPopupComponent } = useAlertPopup();

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return value?.toString().toLowerCase().includes(term);
      }),
    );
  }, [data, searchTerm, searchKeys]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredData.length);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else if (e.key === "ArrowRight" && currentPage < totalPages) {
        setCurrentPage((p) => p + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages]);

  const handleDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
    }
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const showError = (message) => {
    showAlert({
      title: "Error",
      description: message,
      variant: "error",
    });
  };

  const formatValue = (value, format, colKey, item) => {
    if (format) return format(value);
    if (colKey === "phone_number" && value) {
      return formatPhoneNumber(value);
    }
    return value ?? "-";
  };

  const renderCell = (col, item) => {
    if (col.render) {
      return col.render(item[col.key], item);
    }
    return formatValue(item[col.key], col.format, col.key, item);
  };

  return (
    <div className="flex flex-col gap-4 w-full min-h-full">
      <div className="flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border w-full [&>div]:!overflow-visible">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className={onEdit ? "w-[150px]" : "w-[100px]"}>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center py-8"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow key={item[deleteIdKey] || index}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {renderCell(col, item)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-2">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(item)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item[deleteIdKey])}
                        disabled={!deleteIdKey}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredData.length > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{endIndex} of {filteredData.length} items
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertPopup
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        variant="destructive"
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
      />
      <AlertPopupComponent />
    </div>
  );
}
