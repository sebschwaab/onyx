"use client";

import AuthFlowContainer from "@/components/auth/AuthFlowContainer";
import Text from "@/refresh-components/texts/Text";
import { Button } from "@opal/components";

import { NEXT_PUBLIC_CLOUD_ENABLED } from "@/lib/constants";

// Maps raw IdP/OAuth error codes to user-friendly messages.
// If the message is a known code, we replace it; otherwise show it as-is.
const ERROR_CODE_MESSAGES: Record<string, string> = {
  access_denied: "L'accès a été refusé par votre fournisseur d'identité.",
  login_required: "Vous devez d'abord vous connecter via votre fournisseur d'identité.",
  consent_required:
    "Votre fournisseur d'identité requiert votre consentement pour continuer.",
  interaction_required:
    "Une interaction supplémentaire avec votre fournisseur d'identité est requise.",
  invalid_scope: "Les permissions demandées ne sont pas disponibles.",
  server_error:
    "Votre fournisseur d'identité a rencontré une erreur. Veuillez réessayer.",
  temporarily_unavailable:
    "Votre fournisseur d'identité est temporairement indisponible. Veuillez réessayer plus tard.",
};

function resolveMessage(raw: string | null): string | null {
  if (!raw) return null;
  return ERROR_CODE_MESSAGES[raw] ?? raw;
}

interface AuthErrorContentProps {
  message: string | null;
}

function AuthErrorContent({ message: rawMessage }: AuthErrorContentProps) {
  const message = resolveMessage(rawMessage);
  return (
    <AuthFlowContainer>
      <div className="flex flex-col items-center gap-4">
        <Text headingH2 text05>
          Erreur d&apos;authentification
        </Text>
        <Text mainContentBody text03>
          Un problème est survenu lors de votre tentative de connexion.
        </Text>
        {/* TODO: Error card component */}
        <div className="w-full rounded-12 border border-status-error-05 bg-status-error-00 p-4">
          {message ? (
            <Text mainContentBody className="text-status-error-05">
              {message}
            </Text>
          ) : (
            <div className="flex flex-col gap-2 px-4">
              <Text mainContentEmphasis className="text-status-error-05">
                Causes possibles :
              </Text>
              <Text as="li" mainContentBody className="text-status-error-05">
                Identifiants de connexion incorrects ou expirés
              </Text>
              <Text as="li" mainContentBody className="text-status-error-05">
                Perturbation temporaire du système d&apos;authentification
              </Text>
              <Text as="li" mainContentBody className="text-status-error-05">
                Restrictions d&apos;accès ou permissions du compte
              </Text>
            </div>
          )}
        </div>

        <Button href="/auth/login" width="full">
          Retour à la page de connexion
        </Button>

        <Text mainContentBody text04>
          {NEXT_PUBLIC_CLOUD_ENABLED ? (
            <>
              Si vous continuez à rencontrer des problèmes, contactez l&apos;équipe Onyx à{" "}
              <a href="mailto:support@onyx.app" className="text-action-link-05">
                support@onyx.app
              </a>
            </>
          ) : (
            "Si vous continuez à rencontrer des problèmes, veuillez contacter votre administrateur système."
          )}
        </Text>
      </div>
    </AuthFlowContainer>
  );
}

export default AuthErrorContent;
