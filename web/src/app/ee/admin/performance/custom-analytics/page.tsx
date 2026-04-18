import * as SettingsLayouts from "@/layouts/settings-layouts";
import { CUSTOM_ANALYTICS_ENABLED } from "@/lib/constants";
import { Callout } from "@/components/ui/callout";
import { ADMIN_ROUTES } from "@/lib/admin-routes";
import { Text } from "@opal/components";
import Spacer from "@/refresh-components/Spacer";
import { CustomAnalyticsUpdateForm } from "./CustomAnalyticsUpdateForm";

const route = ADMIN_ROUTES.CUSTOM_ANALYTICS;

function Main() {
  if (!CUSTOM_ANALYTICS_ENABLED) {
    return (
      <div>
        <div className="mt-4">
          <Callout type="danger" title="L'analytics personnalisé n'est pas activé.">
            Pour configurer des scripts d&apos;analytics personnalisés, veuillez travailler avec l&apos;équipe qui
            a configuré Onyx dans votre équipe pour définir la variable d&apos;environnement{" "}
            <i>CUSTOM_ANALYTICS_SECRET_KEY</i>.
          </Callout>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Text as="p">
        {
          "Cela vous permet d'apporter votre propre outil d'analytics à Onyx ! Copiez le snippet Web de votre fournisseur d'analytics dans la zone ci-dessous, et nous commencerons à envoyer des événements d'utilisation."
        }
      </Text>
      <Spacer rem={2} />

      <CustomAnalyticsUpdateForm />
    </div>
  );
}

export default function Page() {
  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header icon={route.icon} title={route.title} separator />
      <SettingsLayouts.Body>
        <Main />
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}
