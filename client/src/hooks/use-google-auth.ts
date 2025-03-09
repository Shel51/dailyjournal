import { useEffect } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export function useGoogleAuth() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          const idToken = await result.user.getIdToken();
          
          // Send the token to our backend
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: idToken }),
          });

          if (!response.ok) {
            throw new Error('Failed to authenticate with the server');
          }

          await response.json();
          
          toast({
            title: "Success",
            description: "Successfully signed in with Google",
          });

          setLocation("/");
        }
      })
      .catch((error) => {
        console.error('Google auth error:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      });
  }, []);
}
