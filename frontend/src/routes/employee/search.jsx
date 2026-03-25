import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";

export const Route = createFileRoute("/employee/search")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    searchTerm,
    setSearchTerm,
    loading,
    hasSearched,
    searchResults,
    fetchError,
    search,
  } = useSearch();

  const handleSearch = () => {
    search(searchTerm);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Search Screen</h1>
          <p className="text-muted-foreground">Search across menu items, ingredients, employees, and suppliers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search menu items, ingredients, employees, suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fetchError ? (
            <p className="text-destructive text-sm py-2">{fetchError}</p>
          ) : loading ? (
            <p className="text-muted-foreground">Searching...</p>
          ) : !hasSearched ? (
            <p className="text-muted-foreground">Enter a search term and click Search to find items across all data.</p>
          ) : searchResults.length === 0 ? (
            <p className="text-muted-foreground">No results found for "{searchTerm}".</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/50">
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((r) => (
                    <TableRow key={`${r.type}-${r.id}`}>
                      <TableCell className="whitespace-nowrap text-sm">{r.type}</TableCell>
                      <TableCell className="text-sm">{r.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.details || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
