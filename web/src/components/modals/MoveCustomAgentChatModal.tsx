"use client";

import { useState } from "react";
import ConfirmationModalLayout from "@/refresh-components/layouts/ConfirmationModalLayout";
import { Button } from "@opal/components";
import Checkbox from "@/refresh-components/inputs/Checkbox";
import Text from "@/refresh-components/texts/Text";
import { SvgAlertCircle } from "@opal/icons";
interface MoveCustomAgentChatModalProps {
  onCancel: () => void;
  onConfirm: (doNotShowAgain: boolean) => void;
}

export default function MoveCustomAgentChatModal({
  onCancel,
  onConfirm,
}: MoveCustomAgentChatModalProps) {
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  return (
    <ConfirmationModalLayout
      icon={SvgAlertCircle}
      title="Déplacer la conversation avec agent personnalisé"
      onClose={onCancel}
      submit={
        <Button onClick={() => onConfirm(doNotShowAgain)}>Confirmer le déplacement</Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Text as="p" text03>
          Cette conversation utilise un <b>agent personnalisé</b> et son déplacement vers un <b>projet</b>{" "}
          ne remplacera pas les configurations de prompt ou de connaissances de l&apos;agent.
          Cela ne doit être utilisé qu&apos;à des fins d&apos;organisation.
        </Text>
        <div className="flex items-center gap-1">
          <Checkbox
            id="move-custom-agent-do-not-show"
            checked={doNotShowAgain}
            onCheckedChange={(checked) => setDoNotShowAgain(Boolean(checked))}
          />
          <label
            htmlFor="move-custom-agent-do-not-show"
            className="text-text-03 text-sm"
          >
            Ne plus afficher ce message
          </label>
        </div>
      </div>
    </ConfirmationModalLayout>
  );
}
