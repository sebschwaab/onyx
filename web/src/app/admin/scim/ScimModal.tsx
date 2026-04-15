import { SvgDownload, SvgKey, SvgRefreshCw } from "@opal/icons";
import { Interactive, Hoverable } from "@opal/core";
import { Section } from "@/layouts/general-layouts";
import { Button } from "@opal/components";
import Text from "@/refresh-components/texts/Text";
import CopyIconButton from "@/refresh-components/buttons/CopyIconButton";
import InputTextArea from "@/refresh-components/inputs/InputTextArea";
import Modal, { BasicModalFooter } from "@/refresh-components/Modal";
import ConfirmationModalLayout from "@/refresh-components/layouts/ConfirmationModalLayout";
import { toast } from "@/hooks/useToast";
import { downloadFile } from "@/lib/download";

import type { ScimModalView } from "./interfaces";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ScimModalProps {
  view: ScimModalView;
  isSubmitting: boolean;
  onRegenerate: () => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Token copié dans le presse-papiers");
  } catch {
    toast.error("Impossible de copier le token");
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ScimModal({
  view,
  isSubmitting,
  onRegenerate,
  onClose,
}: ScimModalProps) {
  switch (view.kind) {
    case "regenerate":
      return (
        <ConfirmationModalLayout
          icon={SvgRefreshCw}
          title="Régénérer le token SCIM"
          onClose={onClose}
          submit={
            <Button
              disabled={isSubmitting}
              variant="danger"
              onClick={onRegenerate}
            >
              Régénérer le token
            </Button>
          }
        >
          <Section alignItems="start" gap={0.5}>
            <Text as="p" text03>
              Votre token SCIM actuel sera révoqué et un nouveau token sera
              généré. Vous devrez mettre à jour le token sur votre fournisseur d&apos;identité
              avant que le provisionnement SCIM reprenne.
            </Text>
          </Section>
        </ConfirmationModalLayout>
      );

    case "token":
      return (
        <Modal open onOpenChange={(open) => !open && onClose()}>
          <Modal.Content width="sm">
            <Modal.Header
              icon={SvgKey}
              title="Token SCIM"
              description="Sauvegardez cette clé avant de continuer. Elle ne sera plus affichée."
              onClose={onClose}
            />
            <Modal.Body>
              <Hoverable.Root group="token">
                <Interactive.Stateless
                  onClick={() => copyToClipboard(view.rawToken)}
                >
                  <InputTextArea
                    value={view.rawToken}
                    readOnly
                    autoResize
                    resizable={false}
                    rows={2}
                    className="font-main-ui-mono break-all cursor-pointer [&_textarea]:cursor-pointer"
                    rightSection={
                      <div onClick={(e) => e.stopPropagation()}>
                        <Hoverable.Item
                          group="token"
                          variant="opacity-on-hover"
                        >
                          <CopyIconButton getCopyText={() => view.rawToken} />
                        </Hoverable.Item>
                      </div>
                    }
                  />
                </Interactive.Stateless>
              </Hoverable.Root>
            </Modal.Body>
            <Modal.Footer>
              <BasicModalFooter
                left={
                  <Button
                    prominence="secondary"
                    icon={SvgDownload}
                    onClick={() =>
                      downloadFile(`onyx-scim-token-${Date.now()}.txt`, {
                        content: view.rawToken,
                      })
                    }
                  >
                    Télécharger
                  </Button>
                }
                submit={
                  <Button
                    autoFocus
                    onClick={() => copyToClipboard(view.rawToken)}
                  >
                    Copier le token
                  </Button>
                }
              />
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      );
  }
}
