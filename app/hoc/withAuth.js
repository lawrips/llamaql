// app/hoc/withAuth.jsx

"use client";

import { useSession, signIn } from "next-auth/react";

const withAuth = (WrappedComponent) => {
  return (props) => {
    const { data: session, status } = useSession();

    if (status === "loading") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      );
    }

     // If the user is not logged in, show a sign-in prompt instead of automatically redirecting
     if (!session) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <p>You are not signed in. Please sign in to continue.</p>
            <button
              onClick={() => signIn("google")} // Trigger Google sign-in when the button is clicked
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mt-4"
            >
              Sign in with Google
            </button>
          </div>
        );
      }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
