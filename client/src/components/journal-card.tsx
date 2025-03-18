import { type Journal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ShareButton } from "./share-button";

type JournalCardProps = {
  journal: Journal & { hasLiked: boolean };
  commentsCount: number;
};

export function JournalCard({ journal, commentsCount }: JournalCardProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [localLikeCount, setLocalLikeCount] = useState(journal.likeCount);
  const [imageError, setImageError] = useState(false);
  const queryClient = useQueryClient();

  // Update local state when journal prop changes
  useEffect(() => {
    setLocalLikeCount(journal.likeCount);
  }, [journal.likeCount]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/journals/${journal.id}/like`);
      return res.json();
    },
    onMutate: async () => {
      // Optimistic update
      setLocalLikeCount(prev => prev + 1);
    },
    onSuccess: (data) => {
      // Set the actual server value
      setLocalLikeCount(data.likeCount);

      // Update the cache
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      queryClient.invalidateQueries({ queryKey: [`/api/journals/${journal.id}`] });
    },
    onError: () => {
      // Revert optimistic update on error
      setLocalLikeCount(journal.likeCount);
      toast({
        title: "Error",
        description: "Failed to like the journal entry",
        variant: "destructive",
      });
    },
  });

  const handleNavigate = () => {
    window.scrollTo(0, 0); // Scroll to top before navigation
    navigate(`/journal/${journal.id}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    likeMutation.mutate();
  };

  const handleImageError = () => {
    console.error('Image failed to load:', journal.imagePath);
    setImageError(true);
  };

  // Get the full image URL
  const imageUrl = journal.imagePath ? 
    (journal.imagePath.startsWith('http') ? journal.imagePath : `${window.location.origin}${journal.imagePath.startsWith('/') ? journal.imagePath : `/${journal.imagePath}`}`) 
    : null;

  return (
    <Card 
      className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-border/50 bg-gradient-to-b from-background/50 to-background hover:from-background/80 hover:to-background"
      onClick={handleNavigate}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-xl md:text-2xl font-lora tracking-tight">{journal.title}</CardTitle>
        <p className="text-sm text-muted-foreground/80 font-medium">
          {format(new Date(journal.createdAt), "MMMM d, yyyy")}
        </p>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-[18px] font-merriweather text-muted-foreground/90 leading-[1.8] mb-6">
          {journal.content}
        </p>

        {imageUrl && !imageError && (
          <div className="mb-6 overflow-hidden rounded-lg">
            <img
              src={imageUrl}
              alt={journal.title}
              className="w-full aspect-square object-cover transform transition-transform duration-500 group-hover:scale-105"
              onError={handleImageError}
            />
            {journal.imageSubtext && (
              <p className="mt-2 text-xs text-muted-foreground/80 italic text-center">
                {journal.imageSubtext}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-6 text-sm text-muted-foreground/70">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors duration-300 ${
              localLikeCount > 0 ? 'text-red-500' : 'hover:text-red-500'
            }`}
            disabled={likeMutation.isPending}
          >
            <Heart 
              className={`h-5 w-5 transition-all duration-300 ${likeMutation.isPending ? 'animate-pulse' : ''}`}
              fill={localLikeCount > 0 ? "currentColor" : "none"}
              stroke={localLikeCount > 0 ? "none" : "currentColor"}
            />
            <span className="font-medium">{localLikeCount}</span>
          </button>

          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">{commentsCount}</span>
          </div>

          <ShareButton
            title={journal.title}
            url={`${window.location.origin}/journal/${journal.id}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}