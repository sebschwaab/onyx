import Modal from "@/refresh-components/Modal";
import Text from "@/refresh-components/texts/Text";
import { Button } from "@opal/components";
import { Callout } from "@/components/ui/callout";
import {
  CloudEmbeddingProvider,
  getFormattedProviderName,
} from "../../../../components/embedding/interfaces";
import { SvgTrash } from "@opal/icons";
import { markdown } from "@opal/utils";

export interface DeleteCredentialsModalProps {
  modelProvider: CloudEmbeddingProvider;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteCredentialsModal({
  modelProvider,
  onConfirm,
  onCancel,
}: DeleteCredentialsModalProps) {
  return (
    <Modal open onOpenChange={onCancel}>
      <Modal.Content width="sm" height="sm">
        <Modal.Header
          icon={SvgTrash}
          title={markdown(
            `Supprimer les identifiants *${getFormattedProviderName(
              modelProvider.provider_type
            )}* ?`
          )}
          onClose={onCancel}
        />
        <Modal.Body>
          <Text as="p">
            Vous êtes sur le point de supprimer vos identifiants{" "}
            {getFormattedProviderName(modelProvider.provider_type)}.
            Êtes-vous sûr ?
          </Text>
          <Callout type="danger" title="Point de non-retour" />
        </Modal.Body>
        <Modal.Footer>
          <Button prominence="secondary" onClick={onCancel}>
            Conserver les identifiants
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Supprimer les identifiants
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
