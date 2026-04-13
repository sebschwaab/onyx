"use client";

import { Button } from "@opal/components";
import { useState } from "react";
import { toast } from "@/hooks/useToast";
import { triggerIndexing } from "@/app/admin/connector/[ccPairId]/lib";
import Modal from "@/refresh-components/Modal";
import Text from "@/refresh-components/texts/Text";
import Separator from "@/refresh-components/Separator";
import { SvgRefreshCw } from "@opal/icons";
// Hook to handle re-indexing functionality
export function useReIndexModal(
  connectorId: number | null,
  credentialId: number | null,
  ccPairId: number | null
) {
  const [reIndexPopupVisible, setReIndexPopupVisible] = useState(false);

  const showReIndexModal = () => {
    if (connectorId == null || credentialId == null || ccPairId == null) {
      return;
    }
    setReIndexPopupVisible(true);
  };

  const hideReIndexModal = () => {
    setReIndexPopupVisible(false);
  };

  const triggerReIndex = async (fromBeginning: boolean) => {
    if (connectorId == null || credentialId == null || ccPairId == null) {
      return;
    }

    try {
      const result = await triggerIndexing(
        fromBeginning,
        connectorId,
        credentialId,
        ccPairId
      );

      // Show appropriate notification based on result
      if (result.success) {
        toast.success(
          `${
            fromBeginning ? "Réindexation complète" : "Mise à jour de l'indexation"
          } démarrée avec succès`
        );
      } else {
        toast.error(result.message || "Échec du démarrage de l'indexation");
      }
    } catch (error) {
      console.error("Failed to trigger indexing:", error);
      toast.error(
        "Une erreur inattendue s'est produite lors du démarrage de l'indexation"
      );
    }
  };

  const FinalReIndexModal =
    reIndexPopupVisible &&
    connectorId != null &&
    credentialId != null &&
    ccPairId != null ? (
      <ReIndexModal hide={hideReIndexModal} onRunIndex={triggerReIndex} />
    ) : null;

  return {
    showReIndexModal,
    ReIndexModal: FinalReIndexModal,
  };
}

export interface ReIndexModalProps {
  hide: () => void;
  onRunIndex: (fromBeginning: boolean) => Promise<void>;
}

export default function ReIndexModal({ hide, onRunIndex }: ReIndexModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunIndex = async (fromBeginning: boolean) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // First show immediate feedback with a toast
      toast.info(
        `Démarrage ${
          fromBeginning ? "de la réindexation complète" : "de la mise à jour de l'indexation"
        }...`
      );

      // Then close the modal
      hide();

      // Then run the indexing operation
      await onRunIndex(fromBeginning);
    } catch (error) {
      console.error("Error starting indexing:", error);
      // Show error in toast if needed
      toast.error("Échec du démarrage du processus d'indexation");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal open onOpenChange={hide}>
      <Modal.Content width="sm" height="sm">
        <Modal.Header icon={SvgRefreshCw} title="Lancer l'indexation" onClose={hide} />
        <Modal.Body>
          <Text as="p">
            Ceci récupèrera et indexera tous les documents qui ont changé et/ou
            ont été ajoutés depuis la dernière indexation réussie.
          </Text>
          <Button disabled={isProcessing} onClick={() => handleRunIndex(false)}>
            Lancer la mise à jour
          </Button>

          <Separator />

          <Text as="p">
            Ceci déclenchera une réindexation complète de tous les documents de
            la source.
          </Text>
          <Text as="p">
            <strong>REMARQUE :</strong> selon le nombre de documents stockés
            dans la source, cela peut prendre un certain temps.
          </Text>

          <Button disabled={isProcessing} onClick={() => handleRunIndex(true)}>
            Lancer la réindexation complète
          </Button>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
