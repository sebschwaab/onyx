"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AdminPageTitle } from "@/components/admin/Title";
import { getSourceMetadata, isValidSource } from "@/lib/sources";
import { ValidSources } from "@/lib/types";
import CardSection from "@/components/admin/CardSection";
import { handleOAuthAuthorizationResponse } from "@/lib/oauth_utils";
import { SvgKey } from "@opal/icons";
export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();

  const [statusMessage, setStatusMessage] = useState("Traitement en cours...");
  const [statusDetails, setStatusDetails] = useState(
    "Veuillez patienter pendant que nous finalisons la configuration."
  );
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [pageTitle, setPageTitle] = useState(
    "Autorisation avec un service tiers"
  );

  // Extract query parameters
  const code = searchParams?.get("code");
  const state = searchParams?.get("state");

  const pathname = usePathname();
  const connector = pathname?.split("/")[3];

  useEffect(() => {
    const onFirstLoad = async () => {
      // Examples
      // connector (url segment)= "google-drive"
      // sourceType (for looking up metadata) = "google_drive"

      if (!code || !state) {
        setStatusMessage("Requête d'autorisation OAuth mal formée.");
        setStatusDetails(
          !code ? "Code d'autorisation manquant." : "Paramètre d'état manquant."
        );
        setIsError(true);
        return;
      }

      if (!connector) {
        setStatusMessage(
          `Le type de source du connecteur spécifié ${connector} n'existe pas.`
        );
        setStatusDetails(`${connector} n'est pas un type de source valide.`);
        setIsError(true);
        return;
      }

      const sourceType = connector.replaceAll("-", "_");
      if (!isValidSource(sourceType)) {
        setStatusMessage(
          `Le type de source du connecteur spécifié ${sourceType} n'existe pas.`
        );
        setStatusDetails(`${sourceType} n'est pas un type de source valide.`);
        setIsError(true);
        return;
      }

      const sourceMetadata = getSourceMetadata(sourceType as ValidSources);
      setPageTitle(`Autorisation avec ${sourceMetadata.displayName}`);

      setStatusMessage("Traitement en cours...");
      setStatusDetails("Veuillez patienter pendant que nous finalisons l'autorisation.");
      setIsError(false); // Ensure no error state during loading

      try {
        const response = await handleOAuthAuthorizationResponse(
          connector,
          code,
          state
        );

        if (!response) {
          throw new Error("Réponse vide du serveur OAuth.");
        }

        setStatusMessage("Succès !");

        // set the continuation link
        if (response.finalize_url) {
          setRedirectUrl(response.finalize_url);
          setStatusDetails(
            `Votre autorisation avec ${sourceMetadata.displayName} s'est terminée avec succès. Des étapes supplémentaires sont nécessaires pour finaliser la configuration des identifiants.`
          );
        } else {
          setRedirectUrl(response.redirect_on_success);
          setStatusDetails(
            `Votre autorisation avec ${sourceMetadata.displayName} s'est terminée avec succès.`
          );
        }
        setIsError(false);
      } catch (error) {
        console.error("OAuth error:", error);
        setStatusMessage("Oups, quelque chose s'est mal passé !");
        setStatusDetails(
          "Une erreur s'est produite pendant le processus OAuth. Veuillez réessayer."
        );
        setIsError(true);
      }
    };

    onFirstLoad();
  }, [code, state, connector]);

  return (
    <div className="mx-auto h-screen flex flex-col">
      <AdminPageTitle title={pageTitle} icon={SvgKey} />

      <div className="flex-1 flex flex-col items-center justify-center">
        <CardSection className="max-w-md w-[500px] h-[250px] p-8">
          <h1 className="text-2xl font-bold mb-4">{statusMessage}</h1>
          <p className="text-text-500">{statusDetails}</p>
          {redirectUrl && !isError && (
            <div className="mt-4">
              <p className="text-sm">
                Cliquez{" "}
                <a href={redirectUrl} className="text-blue-500 underline">
                  ici
                </a>{" "}
                pour continuer.
              </p>
            </div>
          )}
        </CardSection>
      </div>
    </div>
  );
}
