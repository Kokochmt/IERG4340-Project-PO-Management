import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface FileUploadProps {
  onUploaded: (url: string) => void;
  existingUrl?: string | null;
}

const FileUpload = ({ onUploaded, existingUrl }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(existingUrl ?? null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File must be under 5MB");
      return;
    }

    setUploading(true);
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    setFileUrl(data.publicUrl);
    onUploaded(data.publicUrl);
    toast.success("File uploaded");
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
          <label className="cursor-pointer">
            <Upload className="h-4 w-4 mr-1" />
            {uploading ? "Uploading..." : "Upload PDF"}
            <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
          </label>
        </Button>
        <span className="text-xs text-muted-foreground">Max 5MB, PDF only</span>
      </div>
      {fileUrl && (
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-primary" />
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
            View Document
          </a>
          <button type="button" onClick={() => { setFileUrl(null); onUploaded(""); }}>
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
