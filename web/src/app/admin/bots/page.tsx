"use client";

import { ErrorCallout } from "@/components/ErrorCallout";
import { ThreeDotsLoader } from "@/components/Loading";
import { InstantSSRAutoRefresh } from "@/components/SSRAutoRefresh";
import { SlackBotTable } from "./SlackBotTable";
import { useSlackBots } from "./[bot-id]/hooks";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import { ADMIN_ROUTES } from "@/lib/admin-routes";
import CreateButton from "@/refresh-components/buttons/CreateButton";
import { DOCS_ADMINS_PATH } from "@/lib/constants";

const route = ADMIN_ROUTES.SLACK_BOTS;

function Main() {
  const {
    data: slackBots,
    isLoading: isSlackBotsLoading,
    error: slackBotsError,
  } = useSlackBots();

  if (isSlackBotsLoading) {
    return <ThreeDotsLoader />;
  }

  if (slackBotsError || !slackBots) {
    const errorMsg =
      slackBotsError?.info?.message ||
      slackBotsError?.info?.detail ||
      "Une erreur inconnue s'est produite";

    return (
      <ErrorCallout errorTitle="Erreur lors du chargement des applications" errorMsg={`${errorMsg}`} />
    );
  }

  return (
    <div className="mb-8">
      <p className="mb-2 text-sm text-muted-foreground">
        Configurez des bots Slack connectés à Onyx. Une fois configuré, vous pourrez
        poser des questions à Onyx directement depuis Slack. Vous pouvez également :
      </p>

      <div className="mb-2">
        <ul className="list-disc mt-2 ml-4 text-sm text-muted-foreground">
          <li>
            Configurer OnyxBot pour répondre automatiquement aux questions dans certains canaux.
          </li>
          <li>
            Choisir quels ensembles de documents OnyxBot doit utiliser en fonction
            du canal où la question est posée.
          </li>
          <li>
            Envoyer un message direct à OnyxBot pour rechercher comme dans l&apos;interface web.
          </li>
        </ul>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Suivez le{" "}
        <a
          className="text-blue-500 hover:underline"
          href={`${DOCS_ADMINS_PATH}/getting_started/slack_bot_setup`}
          target="_blank"
          rel="noopener noreferrer"
        >
          guide{" "}
        </a>
        dans la documentation Onyx pour commencer !
      </p>

      <CreateButton href="/admin/bots/new">Nouveau bot Slack</CreateButton>

      <SlackBotTable slackBots={slackBots} />
    </div>
  );
}

export default function Page() {
  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header icon={route.icon} title={route.title} separator />
      <SettingsLayouts.Body>
        <InstantSSRAutoRefresh />
        <Main />
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}
