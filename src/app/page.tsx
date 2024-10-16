"use client";
import { useContext } from "react";
import QuizGame from "../../components/QuizGame";
import { SupabaseContext } from "@/providers/supabase";

export default function Home() {
  const { client, isAuthenticated, user } = useContext(SupabaseContext);

  const handleSignIn = async () => {
    await client.auth.signInWithOAuth({ provider: "google" });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <header className="absolute top-4 right-4 flex items-center space-x-4">
        {isAuthenticated ? (
          <div className="flex items-center space-x-3 bg-gray-100 p-2 rounded-lg shadow-md">
            <img
              src={user?.user_metadata?.avatar_url}
              alt="User avatar"
              className="w-10 h-10 rounded-full"
            />
            <span className="text-gray-800 font-semibold">
              Welcome, {user?.user_metadata?.name}
            </span>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-lg"
          >
            Sign in with Google
          </button>
        )}
      </header>

      <QuizGame />
    </main>
  );
}
