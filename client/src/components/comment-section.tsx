import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCommentSchema, type Comment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { UserCircle, Pencil, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);

  const form = useForm({
    resolver: zodResolver(insertCommentSchema),
    defaultValues: {
      content: "",
      journalId,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(insertCommentSchema.pick({ content: true })),
    defaultValues: {
      content: "",
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/journals/${journalId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      await apiRequest("PATCH", `/api/comments/${id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/journals/${journalId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      setEditingCommentId(null);
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

  const startEditing = (comment: Comment) => {
    editForm.reset({ content: comment.content });
    setEditingCommentId(comment.id);
  };

  const handleEditSubmit = async (data: any) => {
    if (!editingCommentId) return;
    await editMutation.mutateAsync({ id: editingCommentId, content: data.content });
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.username || 'Anonymous User'}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                {(user?.id === comment.authorId || user?.isAdmin) && (
                  <div className="flex items-center gap-2">
                    {user?.id === comment.authorId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(comment)}
                        className="h-8 px-2"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(comment.id)}
                      className="h-8 px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {editingCommentId === comment.id ? (
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="mt-2 space-y-2">
                    <FormField
                      control={editForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={editMutation.isPending}
                      >
                        {editMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCommentId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <p className="mt-1 text-sm">{comment.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}