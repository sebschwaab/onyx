"use client";

import { use } from "react";
import { SlackChannelConfigCreationForm } from "@/app/admin/bots/[bot-id]/channels/SlackChannelConfigCreationForm";
import { ErrorCallout } from "@/components/ErrorCallout";
import SimpleLoader from "@/refresh-components/loaders/SimpleLoader";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import { SvgSlack } from "@opal/logos";
import { useSlackChannelConfigs } from "@/app/admin/bots/[bot-id]/hooks";
import { useDocumentSets } from "@/app/admin/documents/sets/hooks";
import { useAgents } from "@/hooks/useAgents";
import { useStandardAnswerCategories } from "@/app/ee/admin/standard-answer/hooks";
import { usePaidEnterpriseFeaturesEnabled } from "@/components/settings/usePaidEnterpriseFeaturesEnabled";
import type { StandardAnswerCategoryResponse } from "@/components/standardAnswers/getStandardAnswerCategoriesIfEE";

function EditSlackChannelConfigContent({ id }: { id: string }) {
  const isPaidEnterprise = usePaidEnterpriseFeaturesEnabled();

  const {
    data: slackChannelConfigs,
    isLoading: isChannelsLoading,
    error: channelsError,
  } = useSlackChannelConfigs();

  const {
    data: documentSets,
    isLoading: isDocSetsLoading,
    error: docSetsError,
  } = useDocumentSets();

  const {
    agents,
    isLoading: isAgentsLoading,
    error: agentsError,
  } = useAgents();

  const {
    data: standardAnswerCategories,
    isLoading: isStdAnswerLoading,
    error: stdAnswerError,
  } = useStandardAnswerCategories();

  const isLoading =
    isChannelsLoading ||
    isDocSetsLoading ||
    isAgentsLoading ||
    (isPaidEnterprise && isStdAnswerLoading);

  const slackChannelConfig = slackChannelConfigs?.find(
    (config) => config.id === Number(id)
  );

  const title = slackChannelConfig?.is_default
    ? "Modifier la config Slack par défaut"
    : "Modifier la config du canal Slack";

  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header
        icon={SvgSlack}
        title={title}
        separator
        backButton
      />
      <SettingsLayouts.Body>
        {isLoading ? (
          <SimpleLoader />
        ) : channelsError || !slackChannelConfigs ? (
          <ErrorCallout
            errorTitle="Une erreur s'est produite :("
            errorMsg={`Impossible de récupérer les canaux Slack - ${
              channelsError?.message ?? "erreur inconnue"
            }`}
          />
        ) : !slackChannelConfig ? (
          <ErrorCallout
            errorTitle="Une erreur s'est produite :("
            errorMsg={`Configuration du canal Slack introuvable avec l'ID : ${id}`}
          />
        ) : docSetsError || !documentSets ? (
          <ErrorCallout
            errorTitle="Une erreur s'est produite :("
            errorMsg={`Impossible de récupérer les ensembles de documents - ${
              docSetsError?.message ?? "erreur inconnue"
            }`}
          />
        ) : agentsError ? (
          <ErrorCallout
            errorTitle="Une erreur s'est produite :("
            errorMsg={`Impossible de récupérer les agents - ${
              agentsError?.message ?? "erreur inconnue"
            }`}
          />
        ) : (
          <SlackChannelConfigCreationForm
            slack_bot_id={slackChannelConfig.slack_bot_id}
            documentSets={documentSets}
            personas={agents}
            standardAnswerCategoryResponse={
              isPaidEnterprise
                ? {
                    paidEnterpriseFeaturesEnabled: true,
                    categories: standardAnswerCategories ?? [],
                    ...(stdAnswerError
                      ? { error: { message: String(stdAnswerError) } }
                      : {}),
                  }
                : { paidEnterpriseFeaturesEnabled: false }
            }
            existingSlackChannelConfig={slackChannelConfig}
          />
        )}
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}

export default function Page(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);

  return <EditSlackChannelConfigContent id={params.id} />;
}
