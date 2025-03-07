import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { type Journal, type Comment } from "@shared/schema";
import { CommentSection } from "@/components/comment-section";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function JournalDetail() {
  const { id } = useParams();

  const { data: journal, isLoading: isLoadingJournal } = useQuery<Journal>({
    queryKey: [`/api/journals/${id}`],
  });

  const { data: comments = [], isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: [`/api/journals/${id}/comments`],
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/journals/${id}/like`);
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/journals/${id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/journals/${id}/comments`] });
    },
  });

  if (isLoadingJournal || isLoadingComments) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!journal) return <div>Journal not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{journal.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          <time>{format(new Date(journal.createdAt), "MMMM d, yyyy")}</time>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => likeMutation.mutate()}
          >
            <Heart className="h-4 w-4" />
            <span>{journal.likeCount}</span>
          </Button>
        </div>

        {journal.imageUrl && (
          <img
            src={journal.imageUrl}
            alt={journal.title}
            className="w-full aspect-video object-cover rounded-lg mb-8"
          />
        )}

        {journal.videoUrl && (
          <div className="aspect-video mb-8">
            <iframe
              src={journal.videoUrl}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none mb-12">
          {journal.content.split("\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <hr className="my-12" />

        <CommentSection
          comments={comments}
          journalId={journal.id}
          onSubmitComment={async (content) => await commentMutation.mutateAsync(content)}
        />
      </article>
    </div>
  );
}