"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-semibold mb-4">Something went wrong loading this page.</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-amethyst-700 hover:bg-amethyst-600 rounded-md transition"
      >
        Try again
      </button>
    </div>
  );
}
