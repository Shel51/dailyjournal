import { useState, useEffect } from "react";
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
import { ShareButton } from "@/components/share-button";
import { updateMetaTags } from "@/lib/meta-tags";

export default function JournalDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageError, setImageError] = useState(false);

  const { data: journal, isLoading: isLoadingJournal } = useQuery<Journal>({
    queryKey: [`/api/journals/${id}`],
  });

  const { data: comments = [], isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: [`/api/journals/${id}/comments`],
  });

  const [localLikeCount, setLocalLikeCount] = useState(0);
  const [localHasLiked, setLocalHasLiked] = useState(false);

  // Update local state when journal data changes
  useEffect(() => {
    if (journal) {
      setLocalLikeCount(journal.likeCount);
      setLocalHasLiked(journal.hasLiked);
    }
  }, [journal]);

  useEffect(() => {
    if (journal) {
      const url = window.location.href;
      const description = journal.content.slice(0, 200) + (journal.content.length > 200 ? '...' : '');
      const imageUrl = journal.imagePath ? `${window.location.origin}/${journal.imagePath}` : null;

      console.log('Setting meta tags with image URL:', imageUrl); // Debug log

      updateMetaTags({
        title: `${journal.title} | Shally's Journal`,
        description,
        image: imageUrl,
        url,
      });
    }
  }, [journal]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/journals/${id}/like`);
      return res.json();
    },
    onMutate: async () => {
      // Optimistic update
      setLocalLikeCount(prev => prev + 1);
      setLocalHasLiked(true);
    },
    onSuccess: (data) => {
      // Set the actual server value
      setLocalLikeCount(data.likeCount);
      setLocalHasLiked(true);

      // Update both the list and detail cache
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      queryClient.invalidateQueries({ queryKey: [`/api/journals/${id}`] });
    },
    onError: () => {
      // Revert optimistic update on error
      if (journal) {
        setLocalLikeCount(journal.likeCount);
        setLocalHasLiked(journal.hasLiked);
      }
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

  const handleImageError = () => {
    console.error('Image failed to load:', journal?.imagePath);
    setImageError(true);
  };

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
    <div className="min-h-screen bg-background/50">
      <div className="container mx-auto py-12">
        <article className="max-w-3xl mx-auto px-5 md:px-7">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl md:text-3xl lg:text-[24px] font-lora tracking-tight text-foreground">
                {journal.title}
              </h1>
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

            <div className="flex items-center gap-4 text-base text-muted-foreground/80 mb-8 font-medium">
              <time>{format(new Date(journal.createdAt), "MMMM d, yyyy")}</time>
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1.5 transition-colors ${
                  localHasLiked ? "text-red-500" : "hover:text-red-500"
                }`}
                onClick={() => !localHasLiked && likeMutation.mutate()}
                disabled={likeMutation.isPending || localHasLiked}
              >
                <Heart
                  className={`h-4 w-4 ${likeMutation.isPending ? "animate-pulse" : ""}`}
                  fill={localHasLiked ? "currentColor" : "none"}
                  stroke={localHasLiked ? "none" : "currentColor"}
                />
                <span>{localLikeCount}</span>
              </Button>

              <ShareButton
                title={journal.title}
                url={window.location.href}
                className="ml-auto"
              />
            </div>

            {journal.imagePath && !imageError && (
              <div className="flex flex-col items-center mb-10">
                <img
                  src={`${window.location.origin}/${journal.imagePath}`}
                  alt={journal.title}
                  className="w-full aspect-square object-cover rounded-lg max-w-[300px] md:max-w-[400px] shadow-md"
                  onError={handleImageError}
                />
                {journal.imageSubtext && (
                  <p className="mt-3 text-xs text-muted-foreground/80 italic text-center max-w-[80%]">
                    {journal.imageSubtext}
                  </p>
                )}
              </div>
            )}

            <div className="prose prose-lg max-w-none mb-12">
              {journal.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-6 text-[18px] font-merriweather text-foreground/90 leading-[1.8] text-left px-3 md:px-5">
                  {paragraph}
                </p>
              ))}
            </div>

            {journal.videoUrl && (
              <div className="w-full max-w-2xl mx-auto mb-10">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md">
                  <iframe
                    src={journal.videoUrl.includes("youtube.com") ? journal.videoUrl.replace("watch?v=", "embed/") : journal.videoUrl}
                    title="Video content"
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {journal.refUrl && (
              <div className="flex items-center justify-center gap-2 text-sm mb-8">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <a
                  href={journal.refUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline transition-colors"
                >
                  Reference Link
                </a>
              </div>
            )}
          </div>

          <hr className="my-8 border-border/50" />

          <div>
            <CommentSection
              comments={comments}
              journalId={journal.id}
              onSubmitComment={async (content) => {
                const res = await apiRequest("POST", `/api/journals/${id}/comments`, { content });
                queryClient.invalidateQueries({ queryKey: [`/api/journals/${id}/comments`] });
                return res;
              }}
            />
          </div>
        </article>
      </div>
    </div>
  );
}