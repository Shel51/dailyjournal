import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJournalSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus } from "lucide-react";

type EditorProps = {
  onSubmit: (data: any) => Promise<void>;
  defaultValues?: any;
};

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    console.log("Starting image upload...");
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error("Upload failed with status:", res.status);
      throw new Error("Failed to upload image");
    }

    const data = await res.json();
    console.log("Upload successful, received path:", data.url);
    return data.url;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

export function JournalEditor({ onSubmit, defaultValues }: EditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultValues?.imagePath ? `${window.location.origin}/${defaultValues.imagePath}` : null
  );
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertJournalSchema),
    defaultValues: defaultValues || {
      title: "",
      content: "",
      imagePath: "",
      imageSubtext: "",
      videoUrl: "",
      refUrl: "",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected image:", file.name);
      setSelectedImage(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      form.setValue("imagePath", "");
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      if (selectedImage) {
        console.log("Uploading image...");
        const imagePath = await uploadImage(selectedImage);
        console.log("Image uploaded successfully, path:", imagePath);
        data.imagePath = imagePath;
      }

      await onSubmit(data);
      form.reset();
      setSelectedImage(null);
      setPreviewUrl(null);
      toast({
        title: "Success",
        description: "Journal entry saved successfully",
      });
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your thoughts..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div>
            <FormLabel>Image</FormLabel>
            <div className="mt-2 flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                {selectedImage ? 'Change Image' : 'Upload Image'}
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            {previewUrl && (
              <div className="mt-4 space-y-4">
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full aspect-square object-cover rounded-lg max-w-[300px]"
                  />
                  {form.getValues("imageSubtext") && (
                    <p className="mt-2 text-xs text-muted-foreground/80 italic text-center">
                      {form.getValues("imageSubtext")}
                    </p>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="imageSubtext"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Caption</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Add a caption for your image..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="videoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter video URL..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="refUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Add a reference link..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Entry"}
        </Button>
      </form>
    </Form>
  );
}