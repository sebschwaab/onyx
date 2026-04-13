"use client";

import type { Route } from "next";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { SvgExternalLink, SvgUsers } from "@opal/icons";
import Message from "@/refresh-components/messages/Message";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import SimpleLoader from "@/refresh-components/loaders/SimpleLoader";
import { errorHandlingFetcher } from "@/lib/fetcher";
import type { UserGroup } from "@/lib/types";
import { SWR_KEYS } from "@/lib/swr-keys";
import GroupsList from "./GroupsList";
import AdminListHeader from "@/sections/admin/AdminListHeader";
import { IllustrationContent } from "@opal/layouts";
import SvgNoResult from "@opal/illustrations/no-result";

function GroupsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: groups,
    error,
    isLoading,
  } = useSWR<UserGroup[]>(SWR_KEYS.adminUserGroups, errorHandlingFetcher);

  return (
    <SettingsLayouts.Root>
      <div data-testid="groups-page-heading">
        <SettingsLayouts.Header icon={SvgUsers} title="Groupes" separator>
          <Message
            info
            static
            large
            close={false}
            icon
            text="Changements à venir dans les permissions"
            description="Onyx passe aux permissions basées sur des groupes, permettant un contrôle d'accès plus flexible grâce à des permissions configurables par groupe. Nous recommandons de revoir la structure de vos groupes pour préparer cette mise à jour."
            actions="En savoir plus"
            actionIcon={SvgExternalLink}
            onAction={() =>
              window.open(
                "https://docs.onyx.app/admins/permissions/whats_changing",
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="w-full"
          />
        </SettingsLayouts.Header>
      </div>

      <SettingsLayouts.Body>
        <AdminListHeader
          hasItems={!isLoading && !error && (groups?.length ?? 0) > 0}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          placeholder="Rechercher des groupes..."
          emptyStateText="Créez des groupes pour organiser les utilisateurs et gérer les accès."
          onAction={() => router.push("/admin/groups/create" as Route)}
          actionLabel="Nouveau groupe"
        />

        {isLoading && <SimpleLoader />}

        {error && (
          <IllustrationContent
            illustration={SvgNoResult}
            title="Échec du chargement des groupes."
            description="Veuillez vérifier la console pour plus de détails."
          />
        )}

        {!isLoading && !error && groups && (
          <GroupsList groups={groups} searchQuery={searchQuery} />
        )}
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}

export default GroupsPage;
