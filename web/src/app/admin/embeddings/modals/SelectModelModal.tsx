import Modal from "@/refresh-components/Modal";
import { Button } from "@opal/components";
import Text from "@/refresh-components/texts/Text";
import { CloudEmbeddingModel } from "@/components/embedding/interfaces";
import { markdown } from "@opal/utils";
import { SvgServer } from "@opal/icons";

export interface SelectModelModalProps {
  model: CloudEmbeddingModel;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SelectModelModal({
  model,
  onConfirm,
  onCancel,
}: SelectModelModalProps) {
  return (
    <Modal open onOpenChange={onCancel}>
      <Modal.Content width="sm" height="sm">
        <Modal.Header
          icon={SvgServer}
          title={markdown(`Select *${model.model_name}*`)}
          onClose={onCancel}
        />
        <Modal.Body>
          <Text as="p">
            Vous sélectionnez un nouveau modèle d&apos;intégration,{" "}
            <strong>{model.model_name}</strong>. Si vous passez à ce modèle,
            vous devrez procéder à une réindexation complète. Êtes-vous sûr ?
          </Text>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onConfirm}>Confirmer</Button>
          <Button prominence="secondary" onClick={onCancel}>
            Annuler
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
