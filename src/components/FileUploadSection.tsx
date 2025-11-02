import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { studyGuideSchema } from "@/lib/validations";

const FileUploadSection = () => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);
    const rawData = {
      title: formData.get("title") as string,
      subject: formData.get("subject") as string,
      level: formData.get("level") as string,
      description: formData.get("description") as string,
      fileUrl: formData.get("fileUrl") as string,
    };

    try {
      // Validate input data
      const validated = studyGuideSchema.safeParse(rawData);
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
        file_url: validated.data.fileUrl,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Study guide uploaded successfully!");
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload study guide");
    } finally {
      setUploading(false);
    }
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
      <CardContent>
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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Brief description of the content"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileUrl">File URL</Label>
            <Input
              id="fileUrl"
              name="fileUrl"
              type="url"
              placeholder="https://example.com/file.pdf"
              required
            />
            <p className="text-xs text-muted-foreground">
              Upload your file to a service like Google Drive and paste the link here
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Study Guide"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FileUploadSection;
