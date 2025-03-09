import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCommentSchema, type Comment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { UserCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

type CommentSectionProps = {
  comments: Comment[];
  journalId: number;
  onSubmitComment: (content: string) => Promise<void>;
};

export function CommentSection({
  comments,
  journalId,
  onSubmitComment,
}: CommentSectionProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertCommentSchema),
    defaultValues: {
      content: "",
      journalId,
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await onSubmitComment(data.content);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Comments</h3>

      {user ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Write a comment..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </form>
        </Form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Please log in to leave a comment.
        </p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <Avatar>
              <AvatarFallback>
                <UserCircle className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.username || 'Anonymous User'}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              <p className="mt-1 text-sm">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}