import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, Trash2, ExternalLink, X } from "lucide-react";
import { studyGuideSchema } from "@/lib/validations";

interface UploadedFile {
  id: string;
  title: string;
  subject: string;
  education_level: string;
  description: string | null;
  file_url: string;
  created_at: string;
}

const FileUploadSection = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useExternalUrl, setUseExternalUrl] = useState(false);

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("study_guides")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUploadedFiles(data || []);
    } catch (error: any) {
      console.error("Failed to fetch files:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, DOCX, and PPTX files are allowed");
      return;
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be less than 20MB");
      return;
    }

    setSelectedFile(file);
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploadProgress(50); // Show progress

    const { error: uploadError } = await supabase.storage
      .from('study-materials')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    setUploadProgress(100);

    const { data } = supabase.storage
      .from('study-materials')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData(e.currentTarget);
    const rawData = {
      title: formData.get("title") as string,
      subject: formData.get("subject") as string,
      level: formData.get("level") as string,
      description: formData.get("description") as string,
      fileUrl: formData.get("fileUrl") as string,
    };

    try {
      let fileUrl = rawData.fileUrl;

      // If using file upload (not external URL)
      if (!useExternalUrl && selectedFile) {
        fileUrl = await uploadFileToStorage(selectedFile);
      }

      // Validate input data
      const validated = studyGuideSchema.safeParse({
        ...rawData,
        fileUrl,
      });

      if (!validated.success) {
        const firstError = validated.error.errors[0];
        toast.error(firstError.message);
        setUploading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("study_guides").insert({
        title: validated.data.title,
        subject: validated.data.subject,
        education_level: validated.data.level,
        description: validated.data.description || null,
        file_url: fileUrl,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Study guide uploaded successfully!");
      (e.target as HTMLFormElement).reset();
      setSelectedFile(null);
      setUploadProgress(0);
      fetchUploadedFiles();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload study guide");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileUrl: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from("study_guides")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      // Delete from storage if it's a storage URL
      if (fileUrl.includes('study-materials')) {
        const filePath = fileUrl.split('/study-materials/').pop();
        if (filePath) {
          await supabase.storage.from('study-materials').remove([filePath]);
        }
      }

      toast.success("File deleted successfully");
      fetchUploadedFiles();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete file");
    }
  };

  const getFileIcon = (url: string) => {
    if (url.includes('.pdf')) return '📄';
    if (url.includes('.docx') || url.includes('.doc')) return '📝';
    if (url.includes('.pptx') || url.includes('.ppt')) return '📊';
    return '📎';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Study Materials
        </CardTitle>
        <CardDescription>
          Add notes, past papers, or study guides for your students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Mathematics Chapter 5 Notes"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="e.g., Mathematics"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Education Level</Label>
              <select
                id="level"
                name="level"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="Primary">Primary</option>
                <option value="Secondary 1">Secondary 1</option>
                <option value="Secondary 2">Secondary 2</option>
                <option value="Secondary 3">Secondary 3</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Brief description of the content"
            />
          </div>

          {/* Toggle between file upload and URL */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={useExternalUrl ? "outline" : "default"}
              size="sm"
              onClick={() => setUseExternalUrl(false)}
            >
              Upload File
            </Button>
            <Button
              type="button"
              variant={useExternalUrl ? "default" : "outline"}
              size="sm"
              onClick={() => setUseExternalUrl(true)}
            >
              External URL
            </Button>
          </div>

          {!useExternalUrl ? (
            <div className="space-y-2">
              <Label htmlFor="file">Upload Document</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.pptx"
                  onChange={handleFileSelect}
                  required={!useExternalUrl}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, DOCX, PPTX (Max 20MB)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="fileUrl">File URL</Label>
              <Input
                id="fileUrl"
                name="fileUrl"
                type="url"
                placeholder="https://example.com/file.pdf"
                required={useExternalUrl}
              />
              <p className="text-xs text-muted-foreground">
                Upload your file to Google Drive or similar and paste the link here
              </p>
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Study Guide"}
          </Button>
        </form>

        {/* Manage Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3 pt-6 border-t">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manage Uploaded Files ({uploadedFiles.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFileIcon(file.file_url)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{file.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.subject} • {file.education_level} • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.file_url, '_blank')}
                      title="View file"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id, file.file_url)}
                      title="Delete file"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploadSection;
