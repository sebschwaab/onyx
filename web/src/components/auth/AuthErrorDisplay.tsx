"use client";

import { useEffect } from "react";
import { toast } from "@/hooks/useToast";

const ERROR_MESSAGES = {
  Anonymous: "L'accès anonyme n'est pas activé pour votre équipe.",
};

export default function AuthErrorDisplay({
  searchParams,
}: {
  searchParams: any;
}) {
  const error = searchParams?.error;

  useEffect(() => {
    if (error) {
      toast.error(
        ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES] ||
          "Une erreur s'est produite."
      );
    }
  }, [error]);

  return null;
}
