"use client";

import { toast } from "@/hooks/useToast";
import { requestEmailVerification } from "../lib";
import { Spinner } from "@/components/Spinner";
import { useState, JSX } from "react";

export function RequestNewVerificationEmail({
  children,
  email,
}: {
  children: JSX.Element | string;
  email: string;
}) {
  const [isRequestingVerification, setIsRequestingVerification] =
    useState(false);

  return (
    <button
      className="text-link"
      onClick={async () => {
        setIsRequestingVerification(true);
        const response = await requestEmailVerification(email);
        setIsRequestingVerification(false);

        if (response.ok) {
          toast.success("Un nouvel e-mail de vérification a été envoyé !");
        } else {
          const errorDetail = (await response.json()).detail;
          toast.error(
            `Échec de l'envoi d'un nouvel e-mail de vérification - ${errorDetail}`
          );
        }
      }}
    >
      {isRequestingVerification && <Spinner />}
      {children}
    </button>
  );
}
