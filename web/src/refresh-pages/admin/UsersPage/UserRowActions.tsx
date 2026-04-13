"use client";

import { useState } from "react";
import { Button } from "@opal/components";
import {
  SvgMoreHorizontal,
  SvgUsers,
  SvgXCircle,
  SvgUserCheck,
  SvgUserPlus,
  SvgUserX,
  SvgKey,
} from "@opal/icons";
import { Disabled } from "@opal/core";
import LineItem from "@/refresh-components/buttons/LineItem";
import Popover from "@/refresh-components/Popover";
import Separator from "@/refresh-components/Separator";
import { Section } from "@/layouts/general-layouts";
import Text from "@/refresh-components/texts/Text";
import { UserStatus } from "@/lib/types";
import { toast } from "@/hooks/useToast";
import { approveRequest } from "./svc";
import EditUserModal from "./EditUserModal";
import {
  CancelInviteModal,
  DeactivateUserModal,
  ActivateUserModal,
  DeleteUserModal,
  ResetPasswordModal,
} from "./UserActionModals";
import type { UserRow } from "./interfaces";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

enum Modal {
  DEACTIVATE = "deactivate",
  ACTIVATE = "activate",
  DELETE = "delete",
  CANCEL_INVITE = "cancelInvite",
  EDIT_GROUPS = "editGroups",
  RESET_PASSWORD = "resetPassword",
}

interface UserRowActionsProps {
  user: UserRow;
  onMutate: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UserRowActions({
  user,
  onMutate,
}: UserRowActionsProps) {
  const [modal, setModal] = useState<Modal | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const openModal = (type: Modal) => {
    setPopoverOpen(false);
    setModal(type);
  };

  const closeModal = () => setModal(null);

  const closeAndMutate = () => {
    setModal(null);
    onMutate();
  };

  // Status-aware action menus
  const actionButtons = (() => {
    // SCIM-managed users get limited actions — most changes would be
    // overwritten on the next IdP sync.
    if (user.is_scim_synced) {
      return (
        <>
          {user.id && (
            <LineItem
              icon={SvgUsers}
              onClick={() => openModal(Modal.EDIT_GROUPS)}
            >
              Groupes &amp; Rôles
            </LineItem>
          )}
          <Disabled disabled>
            <LineItem danger icon={SvgUserX}>
              Désactiver l&apos;utilisateur
            </LineItem>
          </Disabled>
          <Separator paddingXRem={0.5} />
          <Text as="p" secondaryBody text03 className="px-3 py-1">
            Cet utilisateur est synchronisé via SCIM et géré par votre fournisseur d&apos;identité.
          </Text>
        </>
      );
    }

    switch (user.status) {
      case UserStatus.INVITED:
        return (
          <LineItem
            danger
            icon={SvgXCircle}
            onClick={() => openModal(Modal.CANCEL_INVITE)}
          >
            Annuler l&apos;invitation
          </LineItem>
        );

      case UserStatus.REQUESTED:
        return (
          <LineItem
            icon={SvgUserCheck}
            onClick={() => {
              setPopoverOpen(false);
              void (async () => {
                try {
                  await approveRequest(user.email);
                  onMutate();
                  toast.success("Demande approuvée");
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "Une erreur s'est produite"
                  );
                }
              })();
            }}
          >
            Approuver
          </LineItem>
        );

      case UserStatus.ACTIVE:
        return (
          <>
            {user.id && (
              <LineItem
                icon={SvgUsers}
                onClick={() => openModal(Modal.EDIT_GROUPS)}
              >
                Groupes &amp; Rôles
              </LineItem>
            )}
            <LineItem
              icon={SvgKey}
              onClick={() => openModal(Modal.RESET_PASSWORD)}
            >
              Réinitialiser le mot de passe
            </LineItem>
            <Separator paddingXRem={0.5} />
            <LineItem
              danger
              icon={SvgUserX}
              onClick={() => openModal(Modal.DEACTIVATE)}
            >
              Désactiver l&apos;utilisateur
            </LineItem>
          </>
        );

      case UserStatus.INACTIVE:
        return (
          <>
            {user.id && (
              <LineItem
                icon={SvgUsers}
                onClick={() => openModal(Modal.EDIT_GROUPS)}
              >
                Groupes &amp; Rôles
              </LineItem>
            )}
            <LineItem
              icon={SvgKey}
              onClick={() => openModal(Modal.RESET_PASSWORD)}
            >
              Réinitialiser le mot de passe
            </LineItem>
            <Separator paddingXRem={0.5} />
            <LineItem
              icon={SvgUserPlus}
              onClick={() => openModal(Modal.ACTIVATE)}
            >
              Activer l&apos;utilisateur
            </LineItem>
            <Separator paddingXRem={0.5} />
            <LineItem
              danger
              icon={SvgUserX}
              onClick={() => openModal(Modal.DELETE)}
            >
              Supprimer l&apos;utilisateur
            </LineItem>
          </>
        );

      default: {
        const _exhaustive: never = user.status;
        return null;
      }
    }
  })();

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Popover.Trigger asChild>
          <Button prominence="tertiary" icon={SvgMoreHorizontal} />
        </Popover.Trigger>
        <Popover.Content align="end" width="sm">
          <Section
            gap={0.5}
            height="auto"
            alignItems="stretch"
            justifyContent="start"
          >
            {actionButtons}
          </Section>
        </Popover.Content>
      </Popover>

      {modal === Modal.EDIT_GROUPS && user.id && (
        <EditUserModal
          user={user as UserRow & { id: string }}
          onClose={closeModal}
          onMutate={onMutate}
        />
      )}

      {modal === Modal.CANCEL_INVITE && (
        <CancelInviteModal
          email={user.email}
          onClose={closeModal}
          onMutate={onMutate}
        />
      )}

      {modal === Modal.DEACTIVATE && (
        <DeactivateUserModal
          email={user.email}
          onClose={closeModal}
          onMutate={onMutate}
        />
      )}

      {modal === Modal.ACTIVATE && (
        <ActivateUserModal
          email={user.email}
          onClose={closeModal}
          onMutate={onMutate}
        />
      )}

      {modal === Modal.DELETE && (
        <DeleteUserModal
          email={user.email}
          onClose={closeModal}
          onMutate={onMutate}
        />
      )}

      {modal === Modal.RESET_PASSWORD && (
        <ResetPasswordModal email={user.email} onClose={closeModal} />
      )}
    </>
  );
}
