import { useAuth } from "@/hooks/use-auth";
import { JournalEditor } from "@/components/journal-editor";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { type InsertJournal } from "@shared/schema";

export default function NewEntry() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  const createMutation = useMutation({
    mutationFn: async (data: InsertJournal) => {
      await apiRequest("POST", "/api/journals", data);
    },
    onSuccess: () => {
      setLocation("/feed");
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">
          You don't have permission to create new entries.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">New Journal Entry</h1>
        <JournalEditor onSubmit={async (data) => await createMutation.mutateAsync(data)} />
      </div>
    </div>
  );
}