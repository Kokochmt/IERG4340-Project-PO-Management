import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadedFile {
  name: string;
  url: string;
}

interface FileUploadProps {
  onUploaded: (urls: string) => void;
  existingUrl?: string | null;
}

const FileUpload = ({ onUploaded, existingUrl }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>(() => {
    if (!existingUrl) return [];
    // Parse existing comma-separated URLs
    return existingUrl.split(",").filter(Boolean).map((url) => ({
      name: decodeURIComponent(url.split("/").pop()?.replace(/^[a-f0-9-]+-/, "") || "Document"),
      url: url.trim(),
    }));
  });

  const emitUrls = (updatedFiles: UploadedFile[]) => {
    onUploaded(updatedFiles.map((f) => f.url).join(","));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      if (file.type !== "application/pdf") {
        toast.error(`"${file.name}" is not a PDF — skipped`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" exceeds 5MB — skipped`);
        continue;
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);

      if (error) {
        toast.error(`Upload failed for "${file.name}": ${error.message}`);
        continue;
      }

      const { data } = supabase.storage.from("documents").getPublicUrl(path);
      newFiles.push({ name: file.name, url: data.publicUrl });
    }

    if (newFiles.length > 0) {
      const updated = [...files, ...newFiles];
      setFiles(updated);
      emitUrls(updated);
      toast.success(`${newFiles.length} file(s) uploaded`);
    }

    setUploading(false);
    // Reset input so the same files can be re-selected
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    emitUrls(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
          <label className="cursor-pointer">
            <Upload className="h-4 w-4 mr-1" />
            {uploading ? "Uploading..." : "Upload PDFs"}
            <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} multiple />
          </label>
        </Button>
        <span className="text-xs text-muted-foreground">Max 5MB each, PDF only</span>
      </div>
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate max-w-[200px]"
                title={file.name}
              >
                {file.name}
              </a>
              <button type="button" onClick={() => removeFile(i)} className="shrink-0">
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
