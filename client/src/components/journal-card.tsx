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

// Handle image URL based on whether it's a full URL or relative path
const normalizeImageUrl = (url: string | null): string | null => {
  if (!url) return null;

  // If it's already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // For uploaded images or relative paths, ensure proper URL construction
  const cleanPath = url.replace(/^\/+/, '');
  return `${window.location.origin}/${cleanPath}`;
};

export function JournalCard({ journal, commentsCount }: JournalCardProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [localLikeCount, setLocalLikeCount] = useState(journal.likeCount);
  const [localHasLiked, setLocalHasLiked] = useState(journal.hasLiked);
  const [imageError, setImageError] = useState(false);
  const queryClient = useQueryClient();

  // Update local state when journal prop changes
  useEffect(() => {
    setLocalLikeCount(journal.likeCount);
    setLocalHasLiked(journal.hasLiked);
  }, [journal.likeCount, journal.hasLiked]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/journals/${journal.id}/like`);
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

      // Update the cache
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      queryClient.invalidateQueries({ queryKey: [`/api/journals/${journal.id}`] });
    },
    onError: (error) => {
      // Revert optimistic update on error
      setLocalLikeCount(journal.likeCount);
      setLocalHasLiked(journal.hasLiked);
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
    if (!localHasLiked) {
      likeMutation.mutate();
    }
  };

  const handleImageError = () => {
    console.error('Image failed to load:', journal.imageUrl);
    setImageError(true);
  };

  const imageUrl = normalizeImageUrl(journal.imageUrl);

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
          </div>
        )}

        <div className="flex items-center gap-6 text-sm text-muted-foreground/70">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors duration-300 ${
              localHasLiked ? 'text-red-500' : 'hover:text-red-500'
            }`}
            disabled={likeMutation.isPending || localHasLiked}
          >
            <Heart 
              className={`h-5 w-5 transition-all duration-300 ${likeMutation.isPending ? 'animate-pulse' : ''} ${
                localHasLiked ? 'scale-110' : 'scale-100'
              }`}
              fill={localHasLiked ? "currentColor" : "none"}
              stroke={localHasLiked ? "none" : "currentColor"}
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