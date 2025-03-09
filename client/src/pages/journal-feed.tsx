import { useQuery, useMutation } from "@tanstack/react-query";
import { JournalCard } from "@/components/journal-card";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { type Journal, type Comment } from "@shared/schema";

export default function JournalFeed() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: journals = [], isLoading } = useQuery<Journal[]>({
    queryKey: [searchQuery ? `/api/journals/search?q=${searchQuery}` : "/api/journals"],
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Journal Feed</h1>
        {user?.isAdmin && (
          <Button asChild>
            <Link href="/new">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Link>
          </Button>
        )}
      </div>

      <div className="max-w-md mb-8">
        <SearchBar onSearch={setSearchQuery} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {journals.map((journal) => (
          <JournalCard
            key={journal.id}
            journal={journal}
            commentsCount={getCommentCount(journal.id)}
          />
        ))}
      </div>
    </div>
  );
}