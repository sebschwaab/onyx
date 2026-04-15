"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/DeleteButton";
import { Button } from "@opal/components";
import Switch from "@/refresh-components/inputs/Switch";
import { SvgEdit, SvgServer } from "@opal/icons";
import EmptyMessage from "@/refresh-components/EmptyMessage";
import { DiscordGuildConfig } from "@/app/admin/discord-bot/types";
import {
  deleteGuildConfig,
  updateGuildConfig,
} from "@/app/admin/discord-bot/lib";
import { toast } from "@/hooks/useToast";
import { ConfirmEntityModal } from "@/components/modals/ConfirmEntityModal";

interface Props {
  guilds: DiscordGuildConfig[];
  onRefresh: () => void;
}

export function DiscordGuildsTable({ guilds, onRefresh }: Props) {
  const router = useRouter();
  const [guildToDelete, setGuildToDelete] = useState<DiscordGuildConfig | null>(
    null
  );
  const [updatingGuildIds, setUpdatingGuildIds] = useState<Set<number>>(
    new Set()
  );

  const handleDelete = async (guildId: number) => {
    try {
      await deleteGuildConfig(guildId);
      onRefresh();
      toast.success("Configuration du serveur supprimée");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de supprimer la config du serveur"
      );
    } finally {
      setGuildToDelete(null);
    }
  };

  const handleToggleEnabled = async (guild: DiscordGuildConfig) => {
    if (!guild.guild_id) {
      toast.error("Le serveur doit être enregistré avant de pouvoir être activé");
      return;
    }

    setUpdatingGuildIds((prev) => new Set(prev).add(guild.id));
    try {
      await updateGuildConfig(guild.id, {
        enabled: !guild.enabled,
        default_persona_id: guild.default_persona_id,
      });
      onRefresh();
      toast.success(`Serveur ${!guild.enabled ? "activé" : "désactivé"}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de mettre à jour le serveur"
      );
    } finally {
      setUpdatingGuildIds((prev) => {
        const next = new Set(prev);
        next.delete(guild.id);
        return next;
      });
    }
  };

  if (guilds.length === 0) {
    return (
      <EmptyMessage
        icon={SvgServer}
        title="Aucun serveur Discord configuré"
        description="Créez une configuration de serveur pour commencer."
      />
    );
  }

  return (
    <>
      {guildToDelete && (
        <ConfirmEntityModal
          danger
          entityType="configuration du serveur Discord"
          entityName={guildToDelete.guild_name || `Serveur #${guildToDelete.id}`}
          onClose={() => setGuildToDelete(null)}
          onSubmit={() => handleDelete(guildToDelete.id)}
          additionalDetails="Cela supprimera tous les paramètres de ce serveur Discord."
        />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serveur</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Enregistré</TableHead>
            <TableHead>Activé</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guilds.map((guild) => (
            <TableRow key={guild.id}>
              <TableCell>
                <Button
                  disabled={!guild.guild_id}
                  prominence="internal"
                  onClick={() => router.push(`/admin/discord-bot/${guild.id}`)}
                  icon={SvgEdit}
                >
                  {guild.guild_name || `Server #${guild.id}`}
                </Button>
              </TableCell>
              <TableCell>
                {guild.guild_id ? (
                  <Badge variant="success">Enregistré</Badge>
                ) : (
                  <Badge variant="secondary">En attente</Badge>
                )}
              </TableCell>
              <TableCell>
                {guild.registered_at
                  ? new Date(guild.registered_at).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell>
                {!guild.guild_id ? (
                  "-"
                ) : (
                  <Switch
                    checked={guild.enabled}
                    onCheckedChange={() => handleToggleEnabled(guild)}
                    disabled={updatingGuildIds.has(guild.id)}
                  />
                )}
              </TableCell>
              <TableCell>
                <DeleteButton onClick={() => setGuildToDelete(guild)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
