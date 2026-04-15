"use client";

import { useState } from "react";
import { Section } from "@/layouts/general-layouts";
import Text from "@/refresh-components/texts/Text";
import Card from "@/refresh-components/cards/Card";
import { Button } from "@opal/components";
import { Badge } from "@/components/ui/badge";
import PasswordInputTypeIn from "@/refresh-components/inputs/PasswordInputTypeIn";
import { ThreeDotsLoader } from "@/components/Loading";
import SimpleTooltip from "@/refresh-components/SimpleTooltip";
import {
  useDiscordBotConfig,
  useDiscordGuilds,
} from "@/app/admin/discord-bot/hooks";
import { createBotConfig, deleteBotConfig } from "@/app/admin/discord-bot/lib";
import { toast } from "@/hooks/useToast";
import { ConfirmEntityModal } from "@/components/modals/ConfirmEntityModal";
import { getFormattedDateTime } from "@/lib/dateUtils";

export function BotConfigCard() {
  const {
    data: botConfig,
    isLoading,
    isManaged,
    refreshBotConfig,
  } = useDiscordBotConfig();
  const { data: guilds } = useDiscordGuilds();

  const [botToken, setBotToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Don't render anything if managed externally (Cloud or env var)
  if (isManaged) {
    return null;
  }

  // Show loading while fetching initial state
  if (isLoading) {
    return (
      <Card>
        <Section
          flexDirection="row"
          justifyContent="between"
          alignItems="center"
        >
          <Text mainContentEmphasis text05>
            Bot Token
          </Text>
        </Section>
        <ThreeDotsLoader />
      </Card>
    );
  }

  const isConfigured = botConfig?.configured ?? false;
  const hasServerConfigs = (guilds?.length ?? 0) > 0;

  const handleSaveToken = async () => {
    if (!botToken.trim()) {
      toast.error("Veuillez saisir un jeton de bot");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBotConfig(botToken.trim());
      setBotToken("");
      refreshBotConfig();
      toast.success("Jeton de bot enregistré avec succès");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible d'enregistrer le jeton de bot"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteToken = async () => {
    setIsSubmitting(true);
    try {
      await deleteBotConfig();
      refreshBotConfig();
      toast.success("Jeton de bot supprimé");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de supprimer le jeton de bot"
      );
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      {showDeleteConfirm && (
        <ConfirmEntityModal
          danger
          entityType="jeton de bot Discord"
          entityName="Jeton de bot Discord"
          onClose={() => setShowDeleteConfirm(false)}
          onSubmit={handleDeleteToken}
          additionalDetails="Cela déconnectera votre bot Discord. Vous devrez saisir à nouveau le jeton pour utiliser le bot."
        />
      )}
      <Card>
        <Section flexDirection="row" justifyContent="between">
          <Section flexDirection="row" gap={0.5} width="fit">
            <Text mainContentEmphasis text05>
              Jeton de bot
            </Text>
            {isConfigured ? (
              <Badge variant="success">Configuré</Badge>
            ) : (
              <Badge variant="secondary">Non configuré</Badge>
            )}
          </Section>
          {isConfigured && (
            <SimpleTooltip
              tooltip={
                hasServerConfigs ? "Supprimez d'abord les configs du serveur" : undefined
              }
              disabled={!hasServerConfigs}
            >
              <Button
                disabled={isSubmitting || hasServerConfigs}
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Supprimer le jeton Discord
              </Button>
            </SimpleTooltip>
          )}
        </Section>

        {isConfigured ? (
          <Section flexDirection="column" alignItems="start" gap={0.5}>
            <Text text03 secondaryBody>
              Votre jeton de bot Discord est configuré.
              {botConfig?.created_at && (
                <>
                  {" "}
                  Ajouté le {getFormattedDateTime(new Date(botConfig.created_at))}.
                </>
              )}
            </Text>
            <Text text03 secondaryBody>
              Pour changer le jeton, supprimez l&apos;actuel et ajoutez-en un nouveau.
            </Text>
          </Section>
        ) : (
          <Section flexDirection="column" alignItems="start" gap={0.75}>
            <Text text03 secondaryBody>
              Entrez votre jeton de bot Discord pour activer le bot. Vous pouvez l&apos;obtenir depuis le portail des développeurs Discord.
            </Text>
            <Section flexDirection="row" alignItems="end" gap={0.5}>
              <PasswordInputTypeIn
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Saisir le jeton du bot..."
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                disabled={isSubmitting || !botToken.trim()}
                onClick={handleSaveToken}
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer le jeton"}
              </Button>
            </Section>
          </Section>
        )}
      </Card>
    </>
  );
}
