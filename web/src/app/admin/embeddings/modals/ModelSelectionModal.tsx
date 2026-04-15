import Modal from "@/refresh-components/Modal";
import Text from "@/refresh-components/texts/Text";
import { Callout } from "@/components/ui/callout";
import { Button } from "@opal/components";
import { HostedEmbeddingModel } from "@/components/embedding/interfaces";
import { SvgServer } from "@opal/icons";

export interface ModelSelectionConfirmationModalProps {
  selectedModel: HostedEmbeddingModel;
  isCustom: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ModelSelectionConfirmationModal({
  selectedModel,
  isCustom,
  onConfirm,
  onCancel,
}: ModelSelectionConfirmationModalProps) {
  return (
    <Modal open onOpenChange={onCancel}>
      <Modal.Content width="sm" height="lg">
        <Modal.Header
          icon={SvgServer}
          title="Mettre à jour le modèle d'embeddings"
          onClose={onCancel}
        />
        <Modal.Body>
          <Text as="p">
            Vous avez sélectionné : <strong>{selectedModel.model_name}</strong>. Êtes-vous
            sûr de vouloir passer à ce nouveau modèle d&apos;embeddings ?
          </Text>
          <Text as="p">
            Nous réindexerons tous vos documents en arrière-plan afin que vous puissiez
            continuer à utiliser Onyx normalement avec l&apos;ancien modèle en attendant.
            Selon le nombre de documents indexés, cela peut prendre un certain temps.
          </Text>
          <Text as="p">
            <i>REMARQUE :</i> ce processus de réindexation consommera plus de ressources
            que la normale. Si vous hébergez vous-même, nous recommandons d&apos;allouer
            au moins 16 Go de RAM à Onyx pendant ce processus.
          </Text>

          {isCustom && (
            <Callout type="warning" title="IMPORTANT">
              Nous avons détecté qu&apos;il s&apos;agit d&apos;un modèle d&apos;embeddings personnalisé.
              Comme nous devons télécharger les fichiers du modèle avant de vérifier
              la configuration, nous ne pourrons pas vous informer de la validité de
              la configuration avant <strong>après</strong> le début de la réindexation.
              S&apos;il y a un problème, il apparaîtra sur cette page comme une erreur d&apos;indexation
              après avoir cliqué sur Confirmer.
            </Callout>
          )}
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
