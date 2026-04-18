"use client";

import { cn } from "@/lib/utils";
import Message from "@/refresh-components/messages/Message";

interface ConnectorInfoOverlayProps {
  visible: boolean;
}

export function ConnectorInfoOverlay({ visible }: ConnectorInfoOverlayProps) {
  return (
    <div
      className={cn(
        "fixed bottom-16 left-1/2 -translate-x-1/2 z-toast transition-all duration-300 ease-in-out",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <Message
        info
        text="Les sessions existantes n'auront pas accès à ces données"
        description="Une fois synchronisés, les documents de ce connecteur seront disponibles dans vos nouvelles sessions !"
        close={false}
      />
    </div>
  );
}

interface ReprovisionWarningOverlayProps {
  visible: boolean;
  onUpdate?: () => void;
  isUpdating?: boolean;
}

export function ReprovisionWarningOverlay({
  visible,
  onUpdate,
  isUpdating,
}: ReprovisionWarningOverlayProps) {
  return (
    <div
      className={cn(
        "fixed bottom-16 left-1/2 -translate-x-1/2 z-toast transition-all duration-300 ease-in-out",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <Message
        warning
        text={isUpdating ? "Mise à jour..." : "Cliquez sur Mettre à jour pour appliquer vos modifications"}
        description="Votre bac à sable sera recréé avec vos nouveaux paramètres. Les sessions en cours ne seront pas affectées."
        close={false}
        actions={isUpdating ? false : "Mettre à jour"}
        onAction={isUpdating ? undefined : onUpdate}
      />
    </div>
  );
}
