"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ThreeDotsLoader } from "@/components/Loading";
import { ErrorCallout } from "@/components/ErrorCallout";
import { toast } from "@/hooks/useToast";
import { Section } from "@/layouts/general-layouts";
import { ContentAction } from "@opal/layouts";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import Text from "@/refresh-components/texts/Text";
import Card from "@/refresh-components/cards/Card";
import { Callout } from "@/components/ui/callout";
import Message from "@/refresh-components/messages/Message";
import { Button } from "@opal/components";
import { SvgServer } from "@opal/icons";
import InputSelect from "@/refresh-components/inputs/InputSelect";
import {
  useDiscordGuild,
  useDiscordChannels,
} from "@/app/admin/discord-bot/hooks";
import {
  updateGuildConfig,
  bulkUpdateChannelConfigs,
} from "@/app/admin/discord-bot/lib";
import { DiscordChannelsTable } from "@/app/admin/discord-bot/[guild-id]/DiscordChannelsTable";
import { DiscordChannelConfig } from "@/app/admin/discord-bot/types";
import { useAdminPersonas } from "@/hooks/useAdminPersonas";
import { Persona } from "@/app/admin/agents/interfaces";

interface Props {
  params: Promise<{ "guild-id": string }>;
}

function GuildDetailContent({
  guildId,
  personas,
  localChannels,
  onChannelUpdate,
  handleEnableAll,
  handleDisableAll,
  disabled,
}: {
  guildId: number;
  personas: Persona[];
  localChannels: DiscordChannelConfig[];
  onChannelUpdate: (
    channelId: number,
    field:
      | "enabled"
      | "require_bot_invocation"
      | "thread_only_mode"
      | "persona_override_id",
    value: boolean | number | null
  ) => void;
  handleEnableAll: () => void;
  handleDisableAll: () => void;
  disabled: boolean;
}) {
  const {
    data: guild,
    isLoading: guildLoading,
    error: guildError,
  } = useDiscordGuild(guildId);
  const { isLoading: channelsLoading, error: channelsError } =
    useDiscordChannels(guildId);

  if (guildLoading) {
    return <ThreeDotsLoader />;
  }

  if (guildError || !guild) {
    return (
      <ErrorCallout
        errorTitle="Impossible de charger le serveur"
        errorMsg={guildError?.info?.detail || "Serveur introuvable"}
      />
    );
  }

  const isRegistered = !!guild.guild_id;

  return (
    <>
      {!isRegistered && (
        <Callout type="notice" title="En attente d'enregistrement">
          Utilisez la commande !register dans votre serveur Discord avec la clé d&apos;enregistrement pour terminer la configuration.
        </Callout>
      )}

      <Card variant={disabled ? "disabled" : "primary"}>
        <ContentAction
          title="Configuration des canaux"
          description="Exécutez !sync-channels dans Discord pour mettre à jour la liste des canaux."
          sizePreset="main-content"
          variant="section"
          rightChildren={
            isRegistered && !channelsLoading && !channelsError ? (
              <Section
                flexDirection="row"
                justifyContent="end"
                alignItems="center"
                width="fit"
                gap={0.5}
              >
                <Button
                  disabled={disabled}
                  prominence="secondary"
                  onClick={handleEnableAll}
                >
                  Tout activer
                </Button>
                <Button
                  disabled={disabled}
                  prominence="secondary"
                  onClick={handleDisableAll}
                >
                  Tout désactiver
                </Button>
              </Section>
            ) : undefined
          }
        />

        {!isRegistered ? (
          <Text text03 secondaryBody>
            La configuration des canaux sera disponible après l&apos;enregistrement du serveur.
          </Text>
        ) : channelsLoading ? (
          <ThreeDotsLoader />
        ) : channelsError ? (
          <ErrorCallout
            errorTitle="Impossible de charger les canaux"
            errorMsg={channelsError?.info?.detail || "Impossible de charger les canaux"}
          />
        ) : (
          <DiscordChannelsTable
            channels={localChannels}
            personas={personas}
            onChannelUpdate={onChannelUpdate}
            disabled={disabled}
          />
        )}
      </Card>
    </>
  );
}

export default function Page({ params }: Props) {
  const unwrappedParams = use(params);
  const guildId = Number(unwrappedParams["guild-id"]);
  const { data: guild, refreshGuild } = useDiscordGuild(guildId);
  const {
    data: channels,
    isLoading: channelsLoading,
    error: channelsError,
    refreshChannels,
  } = useDiscordChannels(guildId);
  const { personas, isLoading: personasLoading } = useAdminPersonas({
    includeDefault: true,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Local state for channel configurations
  const [localChannels, setLocalChannels] = useState<DiscordChannelConfig[]>(
    []
  );

  // Track the original server state to detect changes
  const [originalChannels, setOriginalChannels] = useState<
    DiscordChannelConfig[]
  >([]);

  // Sync local state with fetched channels
  useEffect(() => {
    if (channels) {
      setLocalChannels(channels);
      setOriginalChannels(channels);
    }
  }, [channels]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    for (const local of localChannels) {
      const original = originalChannels.find((c) => c.id === local.id);
      if (!original) return true;
      if (
        local.enabled !== original.enabled ||
        local.require_bot_invocation !== original.require_bot_invocation ||
        local.thread_only_mode !== original.thread_only_mode ||
        local.persona_override_id !== original.persona_override_id
      ) {
        return true;
      }
    }
    return false;
  }, [localChannels, originalChannels]);

  // Get list of changed channels for bulk update
  const getChangedChannels = useCallback(() => {
    const changes: {
      channelConfigId: number;
      update: {
        enabled: boolean;
        require_bot_invocation: boolean;
        thread_only_mode: boolean;
        persona_override_id: number | null;
      };
    }[] = [];

    for (const local of localChannels) {
      const original = originalChannels.find((c) => c.id === local.id);
      if (!original) continue;
      if (
        local.enabled !== original.enabled ||
        local.require_bot_invocation !== original.require_bot_invocation ||
        local.thread_only_mode !== original.thread_only_mode ||
        local.persona_override_id !== original.persona_override_id
      ) {
        changes.push({
          channelConfigId: local.id,
          update: {
            enabled: local.enabled,
            require_bot_invocation: local.require_bot_invocation,
            thread_only_mode: local.thread_only_mode,
            persona_override_id: local.persona_override_id,
          },
        });
      }
    }

    return changes;
  }, [localChannels, originalChannels]);

  const handleChannelUpdate = useCallback(
    (
      channelId: number,
      field:
        | "enabled"
        | "require_bot_invocation"
        | "thread_only_mode"
        | "persona_override_id",
      value: boolean | number | null
    ) => {
      setLocalChannels((prev) =>
        prev.map((channel) =>
          channel.id === channelId ? { ...channel, [field]: value } : channel
        )
      );
    },
    []
  );

  const handleEnableAll = useCallback(() => {
    setLocalChannels((prev) =>
      prev.map((channel) => ({ ...channel, enabled: true }))
    );
  }, []);

  const handleDisableAll = useCallback(() => {
    setLocalChannels((prev) =>
      prev.map((channel) => ({ ...channel, enabled: false }))
    );
  }, []);

  const handleSaveChanges = async () => {
    const changes = getChangedChannels();
    if (changes.length === 0) return;

    setIsUpdating(true);
    try {
      const { succeeded, failed } = await bulkUpdateChannelConfigs(
        guildId,
        changes
      );

      if (failed > 0) {
        toast.error(`${succeeded} canal(aux) mis à jour, mais ${failed} ont échoué`);
        // Refresh to get actual server state when some updates failed
        refreshChannels();
      } else {
        toast.success(
          `${succeeded} canal(aux) mis à jour`
        );
        // Update original to match local (avoids flash from refresh)
        setOriginalChannels(localChannels);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de mettre à jour les canaux"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDefaultPersonaChange = async (personaId: number | null) => {
    if (!guild) return;
    setIsUpdating(true);
    try {
      await updateGuildConfig(guildId, {
        enabled: guild.enabled,
        default_persona_id: personaId,
      });
      refreshGuild();
      toast.success(
        personaId ? "Agent par défaut mis à jour" : "Agent par défaut effacé"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de mettre à jour l'agent"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const registeredText = guild?.registered_at
    ? `Registered: ${new Date(guild.registered_at).toLocaleString()}`
    : "Enregistrement en attente";

  const isRegistered = !!guild?.guild_id;
  const isUpdateDisabled =
    !isRegistered ||
    channelsLoading ||
    !!channelsError ||
    !hasUnsavedChanges ||
    !guild?.enabled ||
    isUpdating;

  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header
        icon={SvgServer}
        title={guild?.guild_name || `Server #${guildId}`}
        description={registeredText}
        backButton
        rightChildren={
          <Button disabled={isUpdateDisabled} onClick={handleSaveChanges}>
            Mettre à jour la configuration
          </Button>
        }
      />
      <SettingsLayouts.Body>
        {/* Default Persona Selector */}
        <Card variant={!guild?.enabled ? "disabled" : "primary"}>
          <ContentAction
            title="Agent par défaut"
            description="L'agent utilisé par le bot dans tous les canaux sauf si remplacé."
            sizePreset="main-content"
            variant="section"
            rightChildren={
              <InputSelect
                value={guild?.default_persona_id?.toString() ?? "default"}
                onValueChange={(value: string) =>
                  handleDefaultPersonaChange(
                    value === "default" ? null : parseInt(value)
                  )
                }
                disabled={isUpdating || !guild?.enabled || personasLoading}
              >
                <InputSelect.Trigger placeholder="Sélectionner un agent" />
                <InputSelect.Content>
                  <InputSelect.Item value="default">
                    Agent par défaut
                  </InputSelect.Item>
                  {personas.map((persona) => (
                    <InputSelect.Item
                      key={persona.id}
                      value={persona.id.toString()}
                    >
                      {persona.name}
                    </InputSelect.Item>
                  ))}
                </InputSelect.Content>
              </InputSelect>
            }
          />
        </Card>

        <GuildDetailContent
          guildId={guildId}
          personas={personas}
          localChannels={localChannels}
          onChannelUpdate={handleChannelUpdate}
          handleEnableAll={handleEnableAll}
          handleDisableAll={handleDisableAll}
          disabled={!guild?.enabled}
        />

        {/* Unsaved changes indicator - sticky at bottom, centered in content area */}
        <div
          className={cn(
            "sticky z-toast bottom-4 w-fit mx-auto transition-all duration-300 ease-in-out",
            hasUnsavedChanges &&
              isRegistered &&
              !channelsLoading &&
              guild?.enabled
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          <Message
            warning
            text="Vous avez des modifications non enregistrées"
            description="Cliquez sur Mettre à jour pour les enregistrer."
            close={false}
          />
        </div>
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}
