"use client";

import { useState } from "react";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import {
  SvgArrowExchange,
  SvgCheckCircle,
  SvgRefreshCw,
  SvgTerminal,
  SvgUnplug,
  SvgXOctagon,
} from "@opal/icons";
import { ADMIN_ROUTES } from "@/lib/admin-routes";
import { Section } from "@/layouts/general-layouts";
import { Button, SelectCard } from "@opal/components";
import { Card } from "@opal/layouts";
import { Disabled, Hoverable } from "@opal/core";
import Text from "@/refresh-components/texts/Text";
import SimpleLoader from "@/refresh-components/loaders/SimpleLoader";
import ConfirmationModalLayout from "@/refresh-components/layouts/ConfirmationModalLayout";
import useCodeInterpreter from "@/hooks/useCodeInterpreter";
import { updateCodeInterpreter } from "@/refresh-pages/admin/CodeInterpreterPage/svc";
import { toast } from "@/hooks/useToast";

const route = ADMIN_ROUTES.CODE_INTERPRETER;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CheckingStatus() {
  return (
    <Section
      flexDirection="row"
      justifyContent="end"
      alignItems="center"
      gap={0.25}
      padding={0.5}
    >
      <Text mainUiAction text03>
        Vérification...
      </Text>
      <SimpleLoader />
    </Section>
  );
}

interface ConnectionStatusProps {
  healthy: boolean;
  isLoading: boolean;
}

function ConnectionStatus({ healthy, isLoading }: ConnectionStatusProps) {
  if (isLoading) {
    return <CheckingStatus />;
  }

  const label = healthy ? "Connecté" : "Connexion perdue";
  const Icon = healthy ? SvgCheckCircle : SvgXOctagon;
  const iconColor = healthy ? "text-status-success-05" : "text-status-error-05";

  return (
    <Section
      flexDirection="row"
      justifyContent="end"
      alignItems="center"
      gap={0.25}
      padding={0.5}
    >
      <Text mainUiAction text03>
        {label}
      </Text>
      <Icon size={16} className={iconColor} />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CodeInterpreterPage() {
  const { isHealthy, isEnabled, isLoading, refetch } = useCodeInterpreter();
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  async function handleToggle(enabled: boolean) {
    const action = enabled ? "reconnect" : "disconnect";
    setIsReconnecting(enabled);
    try {
      const response = await updateCodeInterpreter({ enabled });
      if (!response.ok) {
        toast.error(`Échec de la ${action === "reconnect" ? "reconnexion" : "déconnexion"} de l'interpréteur de code`);
        return;
      }
      setShowDisconnectModal(false);
      refetch();
    } finally {
      setIsReconnecting(false);
    }
  }

  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header
        icon={route.icon}
        title={route.title}
        description="Environnement Python sécurisé et isolé disponible pour votre LLM. Consultez la documentation pour plus de détails."
        separator
      />

      <SettingsLayouts.Body>
        {isEnabled || isLoading ? (
          <Hoverable.Root group="code-interpreter/Card">
            <SelectCard state="filled" padding="sm" rounding="lg">
              <Card.Header
                sizePreset="main-ui"
                variant="section"
                icon={SvgTerminal}
                title="Interpréteur de code"
                description="Environnement Python intégré"
                rightChildren={
                  <ConnectionStatus healthy={isHealthy} isLoading={isLoading} />
                }
                bottomRightChildren={
                  <Section
                    flexDirection="row"
                    justifyContent="end"
                    alignItems="center"
                    gap={0.25}
                    padding={0.25}
                  >
                    <Disabled disabled={isLoading}>
                      <Hoverable.Item group="code-interpreter/Card">
                        <Button
                          prominence="tertiary"
                          size="sm"
                          icon={SvgUnplug}
                          onClick={() => setShowDisconnectModal(true)}
                          tooltip="Déconnecter"
                        />
                      </Hoverable.Item>
                    </Disabled>
                    <Button
                      disabled={isLoading}
                      prominence="tertiary"
                      size="sm"
                      icon={SvgRefreshCw}
                      onClick={refetch}
                      tooltip="Actualiser"
                    />
                  </Section>
                }
              />
            </SelectCard>
          </Hoverable.Root>
        ) : (
          <SelectCard
            state="empty"
            padding="sm"
            rounding="lg"
            onClick={() => handleToggle(true)}
          >
            <Card.Header
              sizePreset="main-ui"
              variant="section"
              icon={SvgTerminal}
              title="Interpréteur de code (Déconnecté)"
              description="Environnement Python intégré"
              rightChildren={
                <Section flexDirection="row" alignItems="center" padding={0.5}>
                  {isReconnecting ? (
                    <CheckingStatus />
                  ) : (
                    <Button
                      prominence="tertiary"
                      rightIcon={SvgArrowExchange}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(true);
                      }}
                    >
                      Reconnecter
                    </Button>
                  )}
                </Section>
              }
            />
          </SelectCard>
        )}
      </SettingsLayouts.Body>

      {showDisconnectModal && (
        <ConfirmationModalLayout
          icon={SvgUnplug}
          title="Déconnecter l'interpréteur de code"
          onClose={() => setShowDisconnectModal(false)}
          submit={
            <Button variant="danger" onClick={() => handleToggle(false)}>
              Déconnecter
            </Button>
          }
        >
          <Text as="p" text03>
            Toutes les sessions en cours connectées à{" "}
            <Text as="span" mainContentEmphasis text03>
              l&apos;interpréteur de code
            </Text>{" "}
            cesseront de fonctionner. Cela ne supprimera aucune donnée de votre
            environnement. Vous pouvez vous reconnecter ultérieurement si nécessaire.
          </Text>
        </ConfirmationModalLayout>
      )}
    </SettingsLayouts.Root>
  );
}
