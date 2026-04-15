import { DefaultDropdown } from "@/components/Dropdown";
import {
  AccessType,
  ValidAutoSyncSource,
  ConfigurableSources,
  validAutoSyncSources,
} from "@/lib/types";
import { useField } from "formik";
import { AutoSyncOptions } from "./AutoSyncOptions";
import { usePaidEnterpriseFeaturesEnabled } from "@/components/settings/usePaidEnterpriseFeaturesEnabled";
import { useEffect, useMemo } from "react";
import { Credential } from "@/lib/connectors/credentials";
import { credentialTemplates } from "@/lib/connectors/credentials";

function isValidAutoSyncSource(
  value: ConfigurableSources
): value is ValidAutoSyncSource {
  return validAutoSyncSources.includes(value as ValidAutoSyncSource);
}

export function AccessTypeForm({
  connector,
  currentCredential,
}: {
  connector: ConfigurableSources;
  currentCredential?: Credential<any> | null;
}) {
  const [access_type, meta, access_type_helpers] =
    useField<AccessType>("access_type");

  const isPaidEnterpriseEnabled = usePaidEnterpriseFeaturesEnabled();
  const isAutoSyncSupported = isValidAutoSyncSource(connector);

  const selectedAuthMethod = currentCredential?.credential_json?.[
    "authentication_method"
  ] as string | undefined;

  // If the selected auth method is one that disables sync, return true
  const isSyncDisabledByAuth = useMemo(() => {
    const template = (credentialTemplates as any)[connector];
    const authMethods = template?.authMethods as
      | { value: string; disablePermSync?: boolean }[]
      | undefined; // auth methods are returned as an array of objects with a value and disablePermSync property
    if (!authMethods || !selectedAuthMethod) return false;
    const method = authMethods.find((m) => m.value === selectedAuthMethod);
    return method?.disablePermSync === true;
  }, [connector, selectedAuthMethod]);

  useEffect(
    () => {
      // Only set default value if access_type.value is not already set
      if (!access_type.value) {
        if (!isPaidEnterpriseEnabled) {
          access_type_helpers.setValue("public");
        } else if (isAutoSyncSupported) {
          access_type_helpers.setValue("sync");
        } else {
          access_type_helpers.setValue("private");
        }
      }
    },
    [
      // Only run this effect once when the component mounts
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ]
  );

  const options = [
    {
      name: "Privé",
      value: "private",
      description:
        "Seuls les utilisateurs auxquels l'accès à ce connecteur a été explicitement accordé (via la page Groupes d'utilisateurs) peuvent accéder aux documents récupérés par ce connecteur",
      disabled: false,
      disabledReason: "",
    },
    {
      name: "Public",
      value: "public",
      description:
        "Tout utilisateur ayant un compte sur Onyx peut accéder aux documents récupérés par ce connecteur",
      disabled: false,
      disabledReason: "",
    },
  ];

  if (isAutoSyncSupported && isPaidEnterpriseEnabled) {
    options.push({
      name: "Synchronisation automatique des permissions",
      value: "sync",
      description:
        "Nous synchroniserons automatiquement les permissions depuis la source. Un document sera consultable dans Onyx si et seulement si l'utilisateur effectuant la recherche a la permission d'accéder au document dans la source.",
      disabled: isSyncDisabledByAuth,
      disabledReason:
        "La méthode d'authentification actuelle ne prend pas en charge la synchronisation automatique des permissions. Veuillez changer la méthode d'authentification pour une méthode prise en charge.",
    });
  }

  return (
    <>
      {isPaidEnterpriseEnabled && (
        <>
          <div>
            <label className="text-text-950 font-medium">Document Access</label>
            <p className="text-sm text-text-500">
              Control who has access to the documents indexed by this connector.
            </p>
          </div>
          <DefaultDropdown
            options={options}
            selected={access_type.value}
            onSelect={(selected) => {
              access_type_helpers.setValue(selected as AccessType);
            }}
            includeDefault={false}
          />
          {access_type.value === "sync" && isAutoSyncSupported && (
            <AutoSyncOptions connectorType={connector as ValidAutoSyncSource} />
          )}
        </>
      )}
    </>
  );
}
