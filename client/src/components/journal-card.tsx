import { type Journal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type JournalCardProps = {
  journal: Journal & { hasLiked: boolean };
  commentsCount: number;
};

export function JournalCard({ journal, commentsCount }: JournalCardProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [localLikeCount, setLocalLikeCount] = useState(journal.likeCount);
  const [localHasLiked, setLocalHasLiked] = useState(journal.hasLiked);
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/journals/${journal.id}/like`);
      return await res.json();
    },
    onSuccess: (data) => {
      setLocalLikeCount(data.likeCount);
      setLocalHasLiked(data.hasLiked);

      // Invalidate queries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/journals"],
        exact: true 
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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!likeMutation.isPending) {
      likeMutation.mutate();
    }
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-none hover:bg-accent/5"
      onClick={() => navigate(`/journal/${journal.id}`)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-xl md:text-2xl font-serif">{journal.title}</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          {format(new Date(journal.createdAt), "MMMM d, yyyy")}
        </p>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm md:text-base text-muted-foreground leading-relaxed mb-4 md:mb-6">
          {journal.content}
        </p>

        {journal.imageUrl && (
          <div className="mb-4 md:mb-6">
            <img
              src={journal.imageUrl}
              alt={journal.title}
              className="w-full aspect-square object-cover rounded-md max-w-[200px] md:max-w-[300px]"
            />
          </div>
        )}

        <div className="flex items-center gap-4 md:gap-6 text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors ${
              localHasLiked ? 'text-red-500' : 'hover:text-red-500'
            }`}
            disabled={likeMutation.isPending}
          >
            <Heart 
              className={`h-4 w-4 md:h-5 md:w-5 ${likeMutation.isPending ? 'animate-pulse' : ''}`}
              fill={localHasLiked ? "currentColor" : "none"}
              stroke={localHasLiked ? "none" : "currentColor"}
            />
            <span>{localLikeCount}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
            <span>{commentsCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}