"use client";

import { useState } from "react";
import Link from "next/link";
import ErrorPageLayout from "@/components/errorPages/ErrorPageLayout";
import { Button } from "@opal/components";
import InlineExternalLink from "@/refresh-components/InlineExternalLink";
import { logout } from "@/lib/user";
import { loadStripe } from "@stripe/stripe-js";
import { NEXT_PUBLIC_CLOUD_ENABLED } from "@/lib/constants";
import { useLicense } from "@/hooks/useLicense";
import { useSettingsContext } from "@/providers/SettingsProvider";
import { ApplicationStatus } from "@/interfaces/settings";
import Text from "@/refresh-components/texts/Text";
import { SvgLock } from "@opal/icons";

const linkClassName = "text-action-link-05 hover:text-action-link-06 underline";

const fetchStripePublishableKey = async (): Promise<string> => {
  const response = await fetch("/api/tenants/stripe-publishable-key");
  if (!response.ok) {
    throw new Error("Failed to fetch Stripe publishable key");
  }
  const data = await response.json();
  return data.publishable_key;
};

const fetchResubscriptionSession = async () => {
  const response = await fetch("/api/tenants/create-subscription-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to create resubscription session");
  }
  return response.json();
};

export default function AccessRestricted() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: license } = useLicense();
  const settings = useSettingsContext();

  const isSeatLimitExceeded =
    settings.settings.application_status ===
    ApplicationStatus.SEAT_LIMIT_EXCEEDED;
  const hadPreviousLicense = license?.has_license === true;
  const showRenewalMessage = NEXT_PUBLIC_CLOUD_ENABLED || hadPreviousLicense;

  function getSeatLimitMessage() {
    const { used_seats, seat_count } = settings.settings;
    const counts =
      used_seats != null && seat_count != null
        ? ` (${used_seats} users / ${seat_count} seats)`
        : "";
    return `Votre organisation a dépassé le nombre de licences autorisé${counts}. L'accès est restreint jusqu'à ce que le nombre d'utilisateurs soit réduit ou que votre licence soit mise à niveau.`;
  }

  const initialModalMessage = isSeatLimitExceeded
    ? getSeatLimitMessage()
    : showRenewalMessage
      ? NEXT_PUBLIC_CLOUD_ENABLED
        ? "Votre accès à Onyx a été temporairement suspendu en raison d'une interruption de votre abonnement."
        : "Votre accès à Onyx a été temporairement suspendu en raison d'une interruption de votre licence."
      : "Une licence Enterprise est requise pour utiliser Onyx. Vos données sont protégées et seront disponibles une fois la licence activée.";

  const handleResubscribe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const publishableKey = await fetchStripePublishableKey();
      const { sessionId } = await fetchResubscriptionSession();
      const stripe = await loadStripe(publishableKey);

      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error("Stripe failed to load");
      }
    } catch (error) {
      console.error("Error creating resubscription session:", error);
      setError("Erreur lors de l'ouverture de la page de réabonnement. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorPageLayout>
      <div className="flex items-center gap-2">
        <Text headingH2>Accès restreint</Text>
        <SvgLock className="stroke-status-error-05 w-[1.5rem] h-[1.5rem]" />
      </div>

      <Text text03>{initialModalMessage}</Text>

      {isSeatLimitExceeded ? (
        <>
          <Text text03>
            Si vous êtes administrateur, vous pouvez gérer les utilisateurs sur la page{" "}
            <Link className={linkClassName} href="/admin/users">
              Gestion des utilisateurs
            </Link>{" "}
            ou mettre à niveau votre licence sur la page{" "}
            <Link className={linkClassName} href="/admin/billing">
              Facturation Admin
            </Link>
            .
          </Text>

          <div className="flex flex-row gap-2">
            <Button
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
            >
              Se déconnecter
            </Button>
          </div>
        </>
      ) : NEXT_PUBLIC_CLOUD_ENABLED ? (
        <>
          <Text text03>
            Pour rétablir votre accès et continuer à bénéficier des fonctionnalités d&apos;Onyx,
            veuillez mettre à jour vos informations de paiement.
          </Text>

          <Text text03>
            Si vous êtes administrateur, vous pouvez gérer votre abonnement en
            cliquant sur le bouton ci-dessous. Pour les autres utilisateurs, contactez votre
            administrateur.
          </Text>

          <div className="flex flex-row gap-2">
            <Button disabled={isLoading} onClick={handleResubscribe}>
              {isLoading ? "Chargement..." : "Se réabonner"}
            </Button>
            <Button
              prominence="secondary"
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
            >
              Se déconnecter
            </Button>
          </div>

          {error && <Text className="text-status-error-05">{error}</Text>}
        </>
      ) : (
        <>
          <Text text03>
            {hadPreviousLicense
              ? "Pour rétablir votre accès et continuer à utiliser Onyx, veuillez contacter votre administrateur système pour renouveler votre licence."
              : "Pour commencer, veuillez contacter votre administrateur système pour obtenir une licence Enterprise."}
          </Text>

          <Text text03>
            Si vous êtes administrateur, veuillez consulter la page{" "}
            <Link className={linkClassName} href="/admin/billing">
              Facturation Admin
            </Link>{" "}
            pour {hadPreviousLicense ? "renouveler" : "activer"} votre licence,
            s&apos;inscrire via Stripe ou contacter{" "}
            <a className={linkClassName} href="mailto:support@onyx.app">
              support@onyx.app
            </a>{" "}
            pour toute assistance concernant la facturation.
          </Text>

          <div className="flex flex-row gap-2">
            <Button
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
            >
              Se déconnecter
            </Button>
          </div>
        </>
      )}

      <Text text03>
        Besoin d&apos;aide ? Rejoignez notre{" "}
        <InlineExternalLink
          className={linkClassName}
          href="https://discord.gg/4NA5SbzrWb"
        >
          communauté Discord
        </InlineExternalLink>{" "}
        pour obtenir de l&apos;aide.
      </Text>
    </ErrorPageLayout>
  );
}
