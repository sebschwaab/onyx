"use client";

import { useState } from "react";
import { ThreeDotsLoader } from "@/components/Loading";
import { ErrorCallout } from "@/components/ErrorCallout";
import { toast } from "@/hooks/useToast";
import { Section } from "@/layouts/general-layouts";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import Text from "@/refresh-components/texts/Text";
import CreateButton from "@/refresh-components/buttons/CreateButton";
import Modal from "@/refresh-components/Modal";
import CopyIconButton from "@/refresh-components/buttons/CopyIconButton";
import Card from "@/refresh-components/cards/Card";
import { SvgKey } from "@opal/icons";
import {
  useDiscordGuilds,
  useDiscordBotConfig,
} from "@/app/admin/discord-bot/hooks";
import { createGuildConfig } from "@/app/admin/discord-bot/lib";
import { DiscordGuildsTable } from "@/app/admin/discord-bot/DiscordGuildsTable";
import { BotConfigCard } from "@/app/admin/discord-bot/BotConfigCard";
import { ADMIN_ROUTES } from "@/lib/admin-routes";

const route = ADMIN_ROUTES.DISCORD_BOTS;

function DiscordBotContent() {
  const { data: guilds, isLoading, error, refreshGuilds } = useDiscordGuilds();
  const { data: botConfig, isManaged } = useDiscordBotConfig();
  const [registrationKey, setRegistrationKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Bot is available if:
  // - Managed externally (Cloud/env) - assume it's configured
  // - Self-hosted and explicitly configured via UI
  const isBotAvailable = isManaged || botConfig?.configured === true;

  const handleCreateGuild = async () => {
    setIsCreating(true);
    try {
      const result = await createGuildConfig();
      setRegistrationKey(result.registration_key);
      refreshGuilds();
      toast.success("Configuration du serveur créée !");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de créer le serveur"
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <ThreeDotsLoader />;
  }

  if (error || !guilds) {
    return (
      <ErrorCallout
        errorTitle="Impossible de charger les serveurs Discord"
        errorMsg={error?.info?.detail || "Une erreur inconnue s'est produite"}
      />
    );
  }

  return (
    <>
      <BotConfigCard />

      <Modal open={!!registrationKey}>
        <Modal.Content width="sm">
          <Modal.Header
            title="Clé d'enregistrement"
            icon={SvgKey}
            onClose={() => setRegistrationKey(null)}
            description="Cette clé ne sera affichée qu'une seule fois !"
          />
          <Modal.Body>
            <Text text04 mainUiBody>
              Copiez la commande et envoyez-la depuis n&apos;importe quel canal texte de votre serveur !
            </Text>
            <Card variant="secondary">
              <Section
                flexDirection="row"
                justifyContent="between"
                alignItems="center"
              >
                <Text text03 secondaryMono>
                  !register {registrationKey}
                </Text>
                <CopyIconButton
                  getCopyText={() => `!register ${registrationKey}`}
                />
              </Section>
            </Card>
          </Modal.Body>
        </Modal.Content>
      </Modal>

      <Card variant={!isBotAvailable ? "disabled" : "primary"}>
        <Section
          flexDirection="row"
          justifyContent="between"
          alignItems="center"
        >
          <Text mainContentEmphasis text05>
            Configurations des serveurs
          </Text>
          <CreateButton
            onClick={handleCreateGuild}
            disabled={isCreating || !isBotAvailable}
          >
            {isCreating ? "Création..." : "Ajouter un serveur"}
          </CreateButton>
        </Section>
        <DiscordGuildsTable guilds={guilds} onRefresh={refreshGuilds} />
      </Card>
    </>
  );
}

export default function Page() {
  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header
        icon={route.icon}
        title={route.title}
        description="Connectez Onyx à vos serveurs Discord. Les utilisateurs peuvent poser des questions directement dans les canaux Discord."
      />
      <SettingsLayouts.Body>
        <DiscordBotContent />
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}
