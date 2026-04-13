"use client";

import { useState } from "react";
import { Button } from "@opal/components";
import { SvgUserPlus, SvgUserX, SvgXCircle, SvgKey } from "@opal/icons";
import ConfirmationModalLayout from "@/refresh-components/layouts/ConfirmationModalLayout";
import Text from "@/refresh-components/texts/Text";
import { toast } from "@/hooks/useToast";
import {
  deactivateUser,
  activateUser,
  deleteUser,
  cancelInvite,
  resetPassword,
} from "./svc";

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

async function runAction(
  action: () => Promise<void>,
  successMessage: string,
  onDone: () => void,
  setIsSubmitting: (v: boolean) => void
) {
  setIsSubmitting(true);
  try {
    await action();
    onDone();
    toast.success(successMessage);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Une erreur s'est produite");
  } finally {
    setIsSubmitting(false);
  }
}

// ---------------------------------------------------------------------------
// Cancel Invite Modal
// ---------------------------------------------------------------------------

interface CancelInviteModalProps {
  email: string;
  onClose: () => void;
  onMutate: () => void;
}

export function CancelInviteModal({
  email,
  onClose,
  onMutate,
}: CancelInviteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ConfirmationModalLayout
      icon={(props) => (
        <SvgUserX {...props} className="text-action-danger-05" />
      )}
      title="Annuler l'invitation"
      onClose={isSubmitting ? undefined : onClose}
      submit={
        <Button
          disabled={isSubmitting}
          variant="danger"
          onClick={() =>
            runAction(
              () => cancelInvite(email),
              "Invitation annulée",
              () => {
                onMutate();
                onClose();
              },
              setIsSubmitting
            )
          }
        >
          Annuler l&apos;invitation
        </Button>
      }
    >
      <Text as="p" text03>
        <Text as="span" text05>
          {email}
        </Text>{" "}
        ne pourra plus rejoindre Onyx avec cette invitation.
      </Text>
    </ConfirmationModalLayout>
  );
}

// ---------------------------------------------------------------------------
// Deactivate User Modal
// ---------------------------------------------------------------------------

interface DeactivateUserModalProps {
  email: string;
  onClose: () => void;
  onMutate: () => void;
}

export function DeactivateUserModal({
  email,
  onClose,
  onMutate,
}: DeactivateUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ConfirmationModalLayout
      icon={(props) => (
        <SvgUserX {...props} className="text-action-danger-05" />
      )}
      title="Désactiver l'utilisateur"
      onClose={isSubmitting ? undefined : onClose}
      submit={
        <Button
          disabled={isSubmitting}
          variant="danger"
          onClick={() =>
            runAction(
              () => deactivateUser(email),
              "Utilisateur désactivé",
              () => {
                onMutate();
                onClose();
              },
              setIsSubmitting
            )
          }
        >
          Désactiver
        </Button>
      }
    >
      <Text as="p" text03>
        <Text as="span" text05>
          {email}
        </Text>{" "}
        perdra immédiatement l&apos;accès à Onyx. Ses sessions et agents seront conservés. Son siège de licence sera libéré. Vous pourrez réactiver ce compte ultérieurement.
      </Text>
    </ConfirmationModalLayout>
  );
}

// ---------------------------------------------------------------------------
// Activate User Modal
// ---------------------------------------------------------------------------

interface ActivateUserModalProps {
  email: string;
  onClose: () => void;
  onMutate: () => void;
}

export function ActivateUserModal({
  email,
  onClose,
  onMutate,
}: ActivateUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ConfirmationModalLayout
      icon={SvgUserPlus}
      title="Activer l'utilisateur"
      onClose={isSubmitting ? undefined : onClose}
      submit={
        <Button
          disabled={isSubmitting}
          onClick={() =>
            runAction(
              () => activateUser(email),
              "Utilisateur activé",
              () => {
                onMutate();
                onClose();
              },
              setIsSubmitting
            )
          }
        >
          Activer
        </Button>
      }
    >
      <Text as="p" text03>
        <Text as="span" text05>
          {email}
        </Text>{" "}
        retrouvera l&apos;accès à Onyx.
      </Text>
    </ConfirmationModalLayout>
  );
}

// ---------------------------------------------------------------------------
// Delete User Modal
// ---------------------------------------------------------------------------

interface DeleteUserModalProps {
  email: string;
  onClose: () => void;
  onMutate: () => void;
}

export function DeleteUserModal({
  email,
  onClose,
  onMutate,
}: DeleteUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ConfirmationModalLayout
      icon={(props) => (
        <SvgUserX {...props} className="text-action-danger-05" />
      )}
      title="Supprimer l'utilisateur"
      onClose={isSubmitting ? undefined : onClose}
      submit={
        <Button
          disabled={isSubmitting}
          variant="danger"
          onClick={() =>
            runAction(
              () => deleteUser(email),
              "Utilisateur supprimé",
              () => {
                onMutate();
                onClose();
              },
              setIsSubmitting
            )
          }
        >
          Supprimer
        </Button>
      }
    >
      <Text as="p" text03>
        <Text as="span" text05>
          {email}
        </Text>{" "}
        sera définitivement supprimé d&apos;Onyx. Tout l&apos;historique de ses sessions sera effacé. La suppression est irréversible.
      </Text>
    </ConfirmationModalLayout>
  );
}

// ---------------------------------------------------------------------------
// Reset Password Modal
// ---------------------------------------------------------------------------

interface ResetPasswordModalProps {
  email: string;
  onClose: () => void;
}

export function ResetPasswordModal({
  email,
  onClose,
}: ResetPasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const handleClose = () => {
    onClose();
    setNewPassword(null);
  };

  return (
    <ConfirmationModalLayout
      icon={SvgKey}
      title={newPassword ? "Mot de passe réinitialisé" : "Réinitialiser le mot de passe"}
      onClose={isSubmitting ? undefined : handleClose}
      submit={
        newPassword ? (
          <Button onClick={handleClose}>Terminé</Button>
        ) : (
          <Button
            disabled={isSubmitting}
            variant="danger"
            onClick={async () => {
              setIsSubmitting(true);
              try {
                const result = await resetPassword(email);
                setNewPassword(result.new_password);
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Échec de la réinitialisation du mot de passe"
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            Réinitialiser le mot de passe
          </Button>
        )
      }
    >
      {newPassword ? (
        <div className="flex flex-col gap-2">
          <Text as="p" text03>
            Le mot de passe de{" "}
            <Text as="span" text05>
              {email}
            </Text>{" "}
            a été réinitialisé. Copiez le nouveau mot de passe ci-dessous — il ne sera plus affiché.
          </Text>
          <code className="rounded-sm bg-background-neutral-02 px-3 py-2 text-sm select-all">
            {newPassword}
          </code>
        </div>
      ) : (
        <Text as="p" text03>
          Cela générera un nouveau mot de passe aléatoire pour{" "}
          <Text as="span" text05>
            {email}
          </Text>
          . Le mot de passe actuel cessera de fonctionner immédiatement.
        </Text>
      )}
    </ConfirmationModalLayout>
  );
}
