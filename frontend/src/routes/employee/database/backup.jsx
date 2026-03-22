import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Database, Loader2 } from "lucide-react";

export const Route = createFileRoute("/employee/database/backup")({
  component: BackupPage,
});

function BackupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleBackup = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/backup", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to generate backup");
      }

      const data = await res.json();
      const blob = new Blob([data.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Backup downloaded successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to download backup" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold">Database Backup</h1>
        <p className="text-muted-foreground">Download a complete backup of your database</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SQL Database Backup
          </CardTitle>
          <CardDescription>
            Download a full SQL dump of all tables including schema and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleBackup} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Backup...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Backup
              </>
            )}
          </Button>

          {message && (
            <p
              className={`text-sm ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
