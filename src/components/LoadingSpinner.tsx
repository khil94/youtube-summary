"use client";

import { PulseLoader } from "react-spinners";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({
  message = "처리 중입니다...",
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4">
      <PulseLoader color="#3B82F6" />
      <div className="text-gray-400 text-sm animate-pulse">{message}</div>
    </div>
  );
}
