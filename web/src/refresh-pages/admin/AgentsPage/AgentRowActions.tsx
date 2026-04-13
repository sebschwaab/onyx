"use client";

import { useCallback, useState } from "react";
import { Button } from "@opal/components";
// TODO(@raunakab): migrate to Opal LineItemButton once it supports danger variant
import LineItem from "@/refresh-components/buttons/LineItem";
import { cn, markdown } from "@opal/utils";
import {
  SvgMoreHorizontal,
  SvgEdit,
  SvgEye,
  SvgEyeOff,
  SvgStar,
  SvgStarOff,
  SvgShare,
  SvgBarChart,
  SvgTrash,
} from "@opal/icons";
import Popover, { PopoverMenu } from "@/refresh-components/Popover";
import ConfirmationModalLayout from "@/refresh-components/layouts/ConfirmationModalLayout";
import Text from "@/refresh-components/texts/Text";
import { toast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import {
  deleteAgent,
  toggleAgentFeatured,
  toggleAgentListed,
} from "@/refresh-pages/admin/AgentsPage/svc";
import type { AgentRow } from "@/refresh-pages/admin/AgentsPage/interfaces";
import type { Route } from "next";
import ShareAgentModal from "@/sections/modals/ShareAgentModal";
import { useCreateModal } from "@/refresh-components/contexts/ModalContext";
import { useAgent } from "@/hooks/useAgents";
import {
  updateAgentSharedStatus,
  updateAgentFeaturedStatus,
} from "@/lib/agents";
import { usePaidEnterpriseFeaturesEnabled } from "@/components/settings/usePaidEnterpriseFeaturesEnabled";
import { useUser } from "@/providers/UserProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentRowActionsProps {
  agent: AgentRow;
  onMutate: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AgentRowActions({
  agent,
  onMutate,
}: AgentRowActionsProps) {
  const router = useRouter();
  const { isAdmin, isCurator } = useUser();
  const isPaidEnterpriseFeaturesEnabled = usePaidEnterpriseFeaturesEnabled();
  const canUpdateFeaturedStatus = isAdmin || isCurator;
  const { agent: fullAgent, refresh: refreshAgent } = useAgent(agent.id);
  const shareModal = useCreateModal();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [featuredOpen, setFeaturedOpen] = useState(false);
  const [unlistOpen, setUnlistOpen] = useState(false);

  async function handleAction(action: () => Promise<void>, close: () => void) {
    setIsSubmitting(true);
    try {
      await action();
      onMutate();
      toast.success(`${agent.name} mis à jour avec succès.`);
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleShare = useCallback(
    async (
      userIds: string[],
      groupIds: number[],
      isPublic: boolean,
      isFeatured: boolean,
      labelIds: number[]
    ) => {
      const shareError = await updateAgentSharedStatus(
        agent.id,
        userIds,
        groupIds,
        isPublic,
        isPaidEnterpriseFeaturesEnabled,
        labelIds
      );

      if (shareError) {
        toast.error(`Échec du partage de l'agent : ${shareError}`);
        return;
      }

      if (canUpdateFeaturedStatus) {
        const featuredError = await updateAgentFeaturedStatus(
          agent.id,
          isFeatured
        );
        if (featuredError) {
          toast.error(`Échec de la mise à jour du statut vedette : ${featuredError}`);
          refreshAgent();
          return;
        }
      }

      refreshAgent();
      onMutate();
      shareModal.toggle(false);
    },
    [
      agent.id,
      isPaidEnterpriseFeaturesEnabled,
      canUpdateFeaturedStatus,
      refreshAgent,
      onMutate,
    ]
  );

  return (
    <>
      <shareModal.Provider>
        <ShareAgentModal
          agentId={agent.id}
          userIds={fullAgent?.users?.map((u) => u.id) ?? []}
          groupIds={fullAgent?.groups ?? []}
          isPublic={fullAgent?.is_public ?? false}
          isFeatured={fullAgent?.is_featured ?? false}
          labelIds={fullAgent?.labels?.map((l) => l.id) ?? []}
          onShare={handleShare}
        />
      </shareModal.Provider>

      <div className="flex items-center gap-0.5">
        {/* TODO(@raunakab): abstract a more standardized way of doing this
            opacity-on-hover animation. Making Hoverable more extensible
            (e.g. supporting table row groups) would let us use it here
            instead of raw Tailwind group-hover. */}
        {!agent.builtin_persona && (
          <div className="opacity-0 group-hover/row:opacity-100 transition-opacity">
            <Button
              prominence="tertiary"
              icon={SvgEdit}
              tooltip="Modifier l'agent"
              onClick={() =>
                router.push(
                  `/app/agents/edit/${
                    agent.id
                  }?u=${Date.now()}&admin=true` as Route
                )
              }
            />
          </div>
        )}
        {!agent.is_listed ? (
          <Button
            prominence="tertiary"
            icon={SvgEyeOff}
            tooltip="Remettre en liste l'agent"
            onClick={() =>
              handleAction(
                () => toggleAgentListed(agent.id, agent.is_listed),
                () => {}
              )
            }
          />
        ) : (
          <div
            className={cn(
              !agent.is_featured &&
                "opacity-0 group-hover/row:opacity-100 transition-opacity"
            )}
          >
            <Button
              prominence="tertiary"
              icon={SvgStar}
              interaction={featuredOpen ? "hover" : "rest"}
              tooltip={
                agent.is_featured ? "Retirer de la sélection" : "Mettre en vedette"
              }
              onClick={() => {
                setPopoverOpen(false);
                setFeaturedOpen(true);
              }}
            />
          </div>
        )}

        {/* Overflow menu */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <div
            className={cn(
              !popoverOpen &&
                "opacity-0 group-hover/row:opacity-100 transition-opacity"
            )}
          >
            <Popover.Trigger asChild>
              <Button prominence="tertiary" icon={SvgMoreHorizontal} />
            </Popover.Trigger>
          </div>
          <Popover.Content align="end" width="sm">
            <PopoverMenu>
              {[
                <LineItem
                  key="visibility"
                  icon={agent.is_listed ? SvgEyeOff : SvgEye}
                  onClick={() => {
                    setPopoverOpen(false);
                    if (agent.is_listed) {
                      setUnlistOpen(true);
                    } else {
                      handleAction(
                        () => toggleAgentListed(agent.id, agent.is_listed),
                        () => {}
                      );
                    }
                  }}
                >
                  {agent.is_listed ? "Retirer de la liste" : "Lister l'agent"}
                </LineItem>,
                <LineItem
                  key="share"
                  icon={SvgShare}
                  onClick={() => {
                    setPopoverOpen(false);
                    shareModal.toggle(true);
                  }}
                >
                  Partager
                </LineItem>,
                isPaidEnterpriseFeaturesEnabled ? (
                  <LineItem
                    key="stats"
                    icon={SvgBarChart}
                    onClick={() => {
                      setPopoverOpen(false);
                      router.push(`/ee/agents/stats/${agent.id}` as Route);
                    }}
                  >
                    Statistiques
                  </LineItem>
                ) : undefined,
                !agent.builtin_persona ? null : undefined,
                !agent.builtin_persona ? (
                  <LineItem
                    key="delete"
                    icon={SvgTrash}
                    danger
                    onClick={() => {
                      setPopoverOpen(false);
                      setDeleteOpen(true);
                    }}
                  >
                    Supprimer
                  </LineItem>
                ) : undefined,
              ]}
            </PopoverMenu>
          </Popover.Content>
        </Popover>
      </div>

      {deleteOpen && (
        <ConfirmationModalLayout
          icon={SvgTrash}
          title="Supprimer l'agent"
          onClose={isSubmitting ? undefined : () => setDeleteOpen(false)}
          submit={
            <Button
              disabled={isSubmitting}
              variant="danger"
              onClick={() => {
                handleAction(
                  () => deleteAgent(agent.id),
                  () => setDeleteOpen(false)
                );
              }}
            >
              Supprimer
            </Button>
          }
        >
          <Text as="p" text03>
            Êtes-vous sûr de vouloir supprimer{" "}
            <Text as="span" text05>
              {agent.name}
            </Text>
            ? Cette action est irréversible.
          </Text>
        </ConfirmationModalLayout>
      )}

      {featuredOpen && (
        <ConfirmationModalLayout
          icon={agent.is_featured ? SvgStarOff : SvgStar}
          title={
            agent.is_featured
              ? `Retirer ${agent.name} de la sélection`
              : `Mettre ${agent.name} en vedette`
          }
          onClose={isSubmitting ? undefined : () => setFeaturedOpen(false)}
          submit={
            <Button
              disabled={isSubmitting}
              onClick={() => {
                handleAction(
                  () => toggleAgentFeatured(agent.id, agent.is_featured),
                  () => setFeaturedOpen(false)
                );
              }}
            >
              {agent.is_featured ? "Retirer" : "Mettre en vedette"}
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            <Text as="p" text03>
              {agent.is_featured
                ? `Cela retirera ${agent.name} de la section vedette en haut de la liste des agents. Les nouveaux utilisateurs ne le verront plus épinglé dans leur barre latérale, mais les épingles existantes ne sont pas affectées.`
                : "Les agents en vedette apparaissent en haut de la liste des agents et sont automatiquement épinglés dans la barre latérale pour les nouveaux utilisateurs ayant accès. Utilisez cela pour mettre en avant les agents recommandés dans votre organisation."}
            </Text>
            <Text as="p" text03>
              Cela ne modifie pas qui peut accéder à cet agent.
            </Text>
          </div>
        </ConfirmationModalLayout>
      )}

      {unlistOpen && (
        <ConfirmationModalLayout
          icon={SvgEyeOff}
          title={markdown(`Retirer *${agent.name}* de la liste`)}
          onClose={isSubmitting ? undefined : () => setUnlistOpen(false)}
          submit={
            <Button
              disabled={isSubmitting}
              onClick={() => {
                handleAction(
                  () => toggleAgentListed(agent.id, agent.is_listed),
                  () => setUnlistOpen(false)
                );
              }}
            >
              Retirer de la liste
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            <Text as="p" text03>
              Les agents retirés de la liste n&apos;apparaissent pas dans la liste des agents, mais restent accessibles via un lien direct et pour les utilisateurs qui les ont déjà utilisés ou épinglés.
            </Text>
            <Text as="p" text03>
              Cela ne modifie pas qui peut accéder à cet agent.
            </Text>
          </div>
        </ConfirmationModalLayout>
      )}
    </>
  );
}
