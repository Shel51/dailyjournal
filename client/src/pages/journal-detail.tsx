import { useState, useEffect as ReactuseEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { type Journal, type Comment } from "@shared/schema";
import { CommentSection } from "@/components/comment-section";
import { Heart, Edit2, Trash2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { JournalEditor } from "@/components/journal-editor";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function JournalDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: journal, isLoading: isLoadingJournal } = useQuery<Journal>({
    queryKey: [`/api/journals/${id}`],
  });

  const { data: comments = [], isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: [`/api/journals/${id}/comments`],
  });

  const [localLikeCount, setLocalLikeCount] = useState(journal?.likeCount ?? 0);
  const [localHasLiked, setLocalHasLiked] = useState(journal?.hasLiked ?? false);

  // Update local state when journal data changes
  ReactuseEffect(() => {
    if (journal) {
      setLocalLikeCount(journal.likeCount);
      setLocalHasLiked(journal.hasLiked || false);
    }
  }, [journal]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/journals/${id}/like`);
      return res.json();
    },
    onSuccess: (data) => {
      setLocalLikeCount(data.likeCount);
      setLocalHasLiked(true);

      // Update the cache immediately
      queryClient.setQueryData(["/api/journals"], (old: any) => {
        if (!old) return old;
        return old.map((j: Journal) => 
          j.id === Number(id)
            ? { ...j, likeCount: data.likeCount, hasLiked: true }
            : j
        );
      });

      // Also update the individual journal cache
      queryClient.setQueryData([`/api/journals/${id}`], (old: any) => {
        if (!old) return old;
        return { ...old, likeCount: data.likeCount, hasLiked: true };
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like the journal entry",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/journals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      navigate("/");
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", `/api/journals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/journals/${id}`] });
      setIsEditing(false);
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

  if (isEditing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <JournalEditor
          onSubmit={async (data) => await editMutation.mutateAsync(data)}
          defaultValues={journal}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">{journal.title}</h1>
          {user?.isAdmin && (
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Entry
              </Button>
              <Button
                onClick={() => deleteMutation.mutate()}
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isPending ? "Deleting..." : "Delete Entry"}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 md:mb-8">
          <time>{format(new Date(journal.createdAt), "MMMM d, yyyy")}</time>
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1.5 transition-colors ${
              localHasLiked ? 'text-red-500' : 'hover:text-red-500'
            }`}
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
          >
            <Heart 
              className={`h-4 w-4 ${likeMutation.isPending ? 'animate-pulse' : ''}`}
              fill={localHasLiked ? "currentColor" : "none"}
              stroke={localHasLiked ? "none" : "currentColor"}
            />
            <span>{localLikeCount}</span>
          </Button>
        </div>

        {journal.imageUrl && (
          <img
            src={journal.imageUrl}
            alt={journal.title}
            className="w-full aspect-square object-cover rounded-lg mb-6 md:mb-8 max-w-[300px] md:max-w-[400px]"
          />
        )}

        <div className="prose prose-lg max-w-none mb-8 md:mb-12">
          {journal.content.split("\n").map((paragraph, index) => (
            <p key={index} className="text-base md:text-lg text-foreground/90 leading-relaxed">{paragraph}</p>
          ))}
        </div>

        {journal.videoUrl && (
          <div className="w-full max-w-3xl mx-auto mb-8">
            <div className="relative w-full aspect-video">
              <iframe
                src={journal.videoUrl.includes('youtube.com') ? 
                  journal.videoUrl.replace('watch?v=', 'embed/') : 
                  journal.videoUrl}
                title="Video content"
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {journal.refUrl && (
          <div className="mt-4 flex items-center gap-2 text-sm mb-8">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <a 
              href={journal.refUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Reference Link
            </a>
          </div>
        )}

        <hr className="my-8 md:my-12 border-border" />

        <CommentSection
          comments={comments}
          journalId={journal.id}
          onSubmitComment={async (content) => {
            const res = await apiRequest("POST", `/api/journals/${id}/comments`, { content });
            queryClient.invalidateQueries({ queryKey: [`/api/journals/${id}/comments`] });
            return res;
          }}
        />
      </article>
    </div>
  );
}