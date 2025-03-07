import { useQuery } from "@tanstack/react-query";
import { type Journal } from "@shared/schema";
import { JournalCard } from "@/components/journal-card";

export default function HomePage() {
  const { data: journals = [], isLoading } = useQuery<Journal[]>({
    queryKey: ["/api/journals"],
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["/api/comments"],
  });

  const getCommentCount = (journalId: number) => {
    return comments.filter((comment) => comment.journalId === journalId).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">My Daily Journal</h1>
          <p className="text-xl text-muted-foreground">
            Welcome to my personal space where I share my thoughts, experiences, and reflections.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {journals.map((journal) => (
            <JournalCard
              key={journal.id}
              journal={journal}
              commentsCount={getCommentCount(journal.id)}
              onLike={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}