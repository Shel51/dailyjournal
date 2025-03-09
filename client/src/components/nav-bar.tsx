import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { UserCircle, LogOut } from "lucide-react";
import { Link } from "wouter";

export function NavBar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold">My Journal</span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          {user.isAdmin && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm">
              <UserCircle className="h-5 w-5 text-primary" />
              <span className="font-medium text-primary">Admin Account</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </nav>
  );
}