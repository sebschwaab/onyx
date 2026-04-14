"use client";

import { useState } from "react";
import Modal, { BasicModalFooter } from "@/refresh-components/Modal";
import { Button } from "@opal/components";
import { toast } from "@/hooks/useToast";
import { SvgArrowRight, SvgUsers, SvgX } from "@opal/icons";
import { logout } from "@/lib/user";
import { useUser } from "@/providers/UserProvider";
import { NewTenantInfo } from "@/lib/types";
import { useRouter } from "next/navigation";
import Text from "@/refresh-components/texts/Text";
import { ErrorTextLayout } from "@/layouts/input-layouts";

// App domain should not be hardcoded
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "onyx.app";

export interface NewTenantModalProps {
  tenantInfo: NewTenantInfo;
  isInvite?: boolean;
  onClose?: () => void;
}

export default function NewTenantModal({
  tenantInfo,
  isInvite = false,
  onClose,
}: NewTenantModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoinTenant() {
    setIsLoading(true);
    setError(null);

    try {
      if (isInvite) {
        // Accept the invitation through the API
        const response = await fetch("/api/tenants/users/invite/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tenant_id: tenantInfo.tenant_id }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail ||
              errorData.message ||
              "Échec de l'acceptation de l'invitation"
          );
        }

        toast.success("Vous avez accepté l'invitation.");
      } else {
        // For non-invite flow, just show success message
        toast.success("Traitement de votre demande de rejoindre l'équipe...");
      }

      // Common logout and redirect for both flows
      await logout();
      router.push(`/auth/join?email=${encodeURIComponent(user?.email || "")}`);
      onClose?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Échec de la connexion à l'équipe. Veuillez réessayer.";

      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRejectInvite() {
    if (!isInvite) return;

    setIsLoading(true);
    setError(null);

    try {
      // Deny the invitation through the API
      const response = await fetch("/api/tenants/users/invite/deny", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenant_id: tenantInfo.tenant_id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            errorData.message ||
            "Échec du refus de l'invitation"
        );
      }

      toast.info("Vous avez refusé l'invitation.");
      onClose?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Échec du refus de l'invitation. Veuillez réessayer.";

      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  const title = isInvite
    ? `Vous avez été invité à rejoindre ${
        tenantInfo.number_of_users
      } autre${
        tenantInfo.number_of_users === 1 ? "" : "s"
      } membre${tenantInfo.number_of_users === 1 ? "" : "s"} de ${APP_DOMAIN}.`
    : `Votre demande de rejoindre ${tenantInfo.number_of_users} autres utilisateurs de ${APP_DOMAIN} a été approuvée.`;

  const description = isInvite
    ? `En acceptant cette invitation, vous rejoindrez l'équipe ${APP_DOMAIN} existante et perdrez l'accès à votre équipe actuelle. Remarque : vous perdrez l'accès à vos agents, prompts, conversations et sources connectées actuels.`
    : `Pour finaliser l'intégration à votre équipe, veuillez vous réauthentifier avec ${user?.email}.`;

  return (
    <Modal open>
      <Modal.Content width="sm" height="sm" preventAccidentalClose={false}>
        <Modal.Header icon={SvgUsers} title={title} onClose={onClose} />

        <Modal.Body>
          <Text>{description}</Text>
          {error && <ErrorTextLayout>{error}</ErrorTextLayout>}
        </Modal.Body>

        <Modal.Footer>
          <BasicModalFooter
            cancel={
              isInvite ? (
                <Button
                  disabled={isLoading}
                  prominence="secondary"
                  onClick={handleRejectInvite}
                  icon={SvgX}
                >
                  Refuser
                </Button>
              ) : undefined
            }
            submit={
              <Button
                disabled={isLoading}
                onClick={handleJoinTenant}
                rightIcon={SvgArrowRight}
              >
                {isLoading
                  ? isInvite
                    ? "Acceptation..."
                    : "Connexion..."
                  : isInvite
                    ? "Accepter l'invitation"
                    : "Se réauthentifier"}
              </Button>
            }
          />
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
