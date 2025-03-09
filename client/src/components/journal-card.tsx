import { type Journal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type JournalCardProps = {
  journal: Journal;
  commentsCount: number;
};

export function JournalCard({ journal, commentsCount }: JournalCardProps) {
  const [_, navigate] = useLocation();

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/journals/${journal.id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journals/search"] });
      queryClient.invalidateQueries({ queryKey: [`/api/journals/${journal.id}`] });
    },
  });

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
            onClick={() => likeMutation.mutate()}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Heart className="h-4 w-4 md:h-5 md:w-5" />
            <span>{journal.likeCount}</span>
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