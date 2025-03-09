import { useQuery } from "@tanstack/react-query";
import { type Journal } from "@shared/schema";
import { JournalCard } from "@/components/journal-card";
import { Button } from "@/components/ui/button";
import { PencilLine, LogIn } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
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
          <p className="text-xl text-muted-foreground mb-8">
            Welcome to my personal space where I share my thoughts, experiences, and reflections.
          </p>
          {user?.isAdmin ? (
            <Button asChild className="bg-primary hover:bg-primary/90 text-2xl font-bold p-4 rounded-lg">
              <Link href="/today">
                <PencilLine className="mr-2 h-6 w-6" />
                Today's thought
              </Link>
            </Button>
          ) : !user && (
            <Button asChild variant="outline" className="text-lg p-3">
              <Link href="/auth">
                <LogIn className="mr-2 h-5 w-5" />
                Sign in to write
              </Link>
            </Button>
          )}
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