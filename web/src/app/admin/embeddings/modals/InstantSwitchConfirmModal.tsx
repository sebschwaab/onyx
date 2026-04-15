import Modal from "@/refresh-components/Modal";
import { Button } from "@opal/components";
import Text from "@/refresh-components/texts/Text";
import { SvgAlertTriangle } from "@opal/icons";
export interface InstantSwitchConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function InstantSwitchConfirmModal({
  onClose,
  onConfirm,
}: InstantSwitchConfirmModalProps) {
  return (
    <Modal open onOpenChange={onClose}>
      <Modal.Content width="sm" height="sm">
        <Modal.Header
          icon={SvgAlertTriangle}
          title="Êtes-vous sûr de vouloir effectuer un changement instantané ?"
          onClose={onClose}
        />
        <Modal.Body>
          <Text as="p">
            Le changement instantané modifiera immédiatement le modèle d&apos;embeddings
            sans réindexer. Les recherches porteront sur un ensemble partiel de
            documents (en commençant par 0 document) jusqu&apos;à la fin de la réindexation.
          </Text>
          <Text as="p">
            <strong>Cette action est irréversible.</strong>
          </Text>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onConfirm}>Confirmer</Button>
          <Button prominence="secondary" onClick={onClose}>
            Annuler
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
