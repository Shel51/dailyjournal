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

type EditorProps = {
  onSubmit: (data: any) => Promise<void>;
  defaultValues?: any;
};

export function JournalEditor({ onSubmit, defaultValues }: EditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertJournalSchema),
    defaultValues: defaultValues || {
      title: "",
      content: "",
      imageUrl: "",
      videoUrl: "",
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      form.reset();
      toast({
        title: "Success",
        description: "Journal entry saved successfully",
      });
    } catch (error) {
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

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter image URL..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Entry"}
        </Button>
      </form>
    </Form>
  );
}
