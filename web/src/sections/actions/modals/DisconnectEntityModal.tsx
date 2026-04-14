"use client";

import { useRef } from "react";
import Modal from "@/refresh-components/Modal";
import { Button } from "@opal/components";
import Text from "@/refresh-components/texts/Text";
import { cn } from "@/lib/utils";
import { markdown } from "@opal/utils";
import { SvgUnplug } from "@opal/icons";
interface DisconnectEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string | null;
  onConfirmDisconnect: () => void;
  onConfirmDisconnectAndDelete?: () => void;
  isDisconnecting?: boolean;
  skipOverlay?: boolean;
}

export default function DisconnectEntityModal({
  isOpen,
  onClose,
  name,
  onConfirmDisconnect,
  onConfirmDisconnectAndDelete,
  isDisconnecting = false,
  skipOverlay = false,
}: DisconnectEntityModalProps) {
  const disconnectButtonRef = useRef<HTMLButtonElement>(null);

  if (!name) return null;

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Modal.Content
        width="sm"
        preventAccidentalClose={false}
        skipOverlay={skipOverlay}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          disconnectButtonRef.current?.focus();
        }}
      >
        <Modal.Header
          icon={({ className }) => (
            <SvgUnplug className={cn(className, "stroke-action-danger-05")} />
          )}
          title={markdown(`Disconnect *${name}*`)}
          onClose={onClose}
        />

        <Modal.Body>
          <Text as="p" text03 mainUiBody>
            Tous les outils connectés à {name} cesseront de fonctionner. Vous pourrez vous reconnecter
            à ce serveur ultérieurement si nécessaire.
          </Text>
          <Text as="p" text03 mainUiBody>
            Êtes-vous sûr de vouloir continuer ?
          </Text>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDisconnecting}
            prominence="secondary"
            onClick={onClose}
          >
            Annuler
          </Button>
          {onConfirmDisconnectAndDelete && (
            <Button
              disabled={isDisconnecting}
              variant="danger"
              prominence="secondary"
              onClick={onConfirmDisconnectAndDelete}
            >
              Déconnecter &amp; Supprimer
            </Button>
          )}
          <Button
            disabled={isDisconnecting}
            variant="danger"
            onClick={onConfirmDisconnect}
            ref={disconnectButtonRef}
          >
            {isDisconnecting ? "Déconnexion..." : "Déconnecter"}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
