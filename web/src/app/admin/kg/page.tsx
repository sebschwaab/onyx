"use client";

import CardSection from "@/components/admin/CardSection";
import {
  DatePickerField,
  FieldLabel,
  TextArrayField,
  TextFormField,
} from "@/components/Field";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import Modal from "@/refresh-components/Modal";
import { Button } from "@opal/components";
import SwitchField from "@/refresh-components/form/SwitchField";
import { Form, Formik, FormikState, useFormikContext } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import {
  KGConfig,
  KGConfigRaw,
  SourceAndEntityTypeView,
} from "@/app/admin/kg/interfaces";
import { sanitizeKGConfig } from "@/app/admin/kg/utils";
import useSWR from "swr";
import { errorHandlingFetcher } from "@/lib/fetcher";
import { SWR_KEYS } from "@/lib/swr-keys";
import { toast } from "@/hooks/useToast";
import Title from "@/components/ui/title";
import { redirect } from "next/navigation";
import { useIsKGExposed } from "@/app/admin/kg/utils";
import KGEntityTypes from "@/app/admin/kg/KGEntityTypes";
import Text from "@/refresh-components/texts/Text";
import { cn } from "@/lib/utils";
import { SvgSettings } from "@opal/icons";
import { ADMIN_ROUTES } from "@/lib/admin-routes";

const route = ADMIN_ROUTES.KNOWLEDGE_GRAPH;

function createDomainField(
  name: string,
  label: string,
  subtext: string,
  placeholder: string,
  minFields?: number
) {
  return function DomainFields({ disabled = false }: { disabled?: boolean }) {
    const { values } = useFormikContext<any>();

    return (
      <TextArrayField
        name={name}
        label={label}
        subtext={subtext}
        placeholder={placeholder}
        minFields={minFields}
        values={values}
        disabled={disabled}
      />
    );
  };
}

const VendorDomains = createDomainField(
  "vendor_domains",
  "Domaines de l'entreprise",
  "Noms de domaine de votre entreprise. Les utilisateurs avec ces domaines d'email seront reconnus comme employés.",
  "Domaine",
  1
);

const IgnoreDomains = createDomainField(
  "ignore_domains",
  "Domaines à ignorer",
  "Noms de domaine à ignorer. Les utilisateurs avec ces domaines d'email seront exclus du Graphe de Connaissances.",
  "Domaine"
);

function KGConfiguration({
  kgConfig,
  onSubmitSuccess,
  entityTypesMutate,
}: {
  kgConfig: KGConfig;
  onSubmitSuccess?: () => void;
  entityTypesMutate?: () => void;
}) {
  const initialValues: KGConfig = {
    enabled: kgConfig.enabled,
    vendor: kgConfig.vendor ?? "",
    vendor_domains:
      (kgConfig.vendor_domains?.length ?? 0) > 0
        ? kgConfig.vendor_domains
        : [""],
    ignore_domains: kgConfig.ignore_domains ?? [],
    coverage_start: kgConfig.coverage_start,
  };

  const enabledSchema = Yup.object({
    enabled: Yup.boolean().required(),
    vendor: Yup.string().required("L'entreprise est requise."),
    vendor_domains: Yup.array(
      Yup.string().required("Le domaine de l'entreprise est requis.")
    )
      .min(1)
      .required(),
    ignore_domains: Yup.array(
      Yup.string().required("Le domaine à ignorer est requis")
    )
      .min(0)
      .required(),
    coverage_start: Yup.date().nullable(),
  });

  const disabledSchema = Yup.object({
    enabled: Yup.boolean().required(),
  });

  const validationSchema = Yup.lazy((values) =>
    values.enabled ? enabledSchema : disabledSchema
  );

  const onSubmit = async (
    values: KGConfig,
    {
      resetForm,
    }: {
      resetForm: (nextState?: Partial<FormikState<KGConfig>>) => void;
    }
  ) => {
    const { enabled, ...enableRequest } = values;
    const body = enabled ? enableRequest : {};

    const response = await fetch("/api/admin/kg/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorMsg = (await response.json()).detail;
      console.warn({ errorMsg });
      toast.error("Impossible de configurer le Graphe de Connaissances.");
      return;
    }

    toast.success("Graphe de Connaissances configuré avec succès.");
    resetForm({ values });
    onSubmitSuccess?.();

    // Refresh entity types if KG was enabled
    if (enabled && entityTypesMutate) {
      entityTypesMutate();
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {(props) => (
        <Form>
          <div className="flex flex-col gap-y-6 w-full">
            <div className="flex flex-col gap-y-1">
              <FieldLabel
                name="enabled"
                label="Activé"
                subtext="Activer ou désactiver le Graphe de Connaissances."
              />
              <SwitchField
                name="enabled"
                onCheckedChange={(state) => {
                  if (!state) props.resetForm();
                }}
              />
            </div>
            <div
              className={cn(
                "flex flex-col gap-y-6",
                !props.values.enabled && "opacity-50"
              )}
            >
              <TextFormField
                name="vendor"
                label="Entreprise"
                subtext="Le nom de votre entreprise."
                className="flex flex-row flex-1 w-full"
                placeholder="Mon Entreprise SA"
                disabled={!props.values.enabled}
              />
              <VendorDomains disabled={!props.values.enabled} />
              <IgnoreDomains disabled={!props.values.enabled} />
              <DatePickerField
                name="coverage_start"
                label="Début de couverture"
                subtext="La date de début de couverture pour le Graphe de Connaissances."
                startYear={2025} // TODO: remove this after public beta
                disabled={!props.values.enabled}
              />
            </div>
            <Button disabled={!props.dirty} type="submit">
              Enregistrer
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

function Main() {
  // Data:
  const {
    data: configData,
    isLoading: configIsLoading,
    mutate: configMutate,
  } = useSWR<KGConfigRaw>(SWR_KEYS.kgConfig, errorHandlingFetcher);
  const {
    data: sourceAndEntityTypesData,
    isLoading: entityTypesIsLoading,
    mutate: entityTypesMutate,
  } = useSWR<SourceAndEntityTypeView>(
    SWR_KEYS.kgEntityTypes,
    errorHandlingFetcher
  );

  // Local State:
  const [configureModalShown, setConfigureModalShown] = useState(false);

  if (
    configIsLoading ||
    entityTypesIsLoading ||
    !configData ||
    !sourceAndEntityTypesData
  ) {
    return <></>;
  }

  const kgConfig = sanitizeKGConfig(configData);

  return (
    <div className="flex flex-col py-4 gap-y-8">
      <CardSection className="max-w-2xl shadow-01 rounded-08 flex flex-col gap-2">
        <Text as="p" headingH2>
          Configuration du Graphe de Connaissances (Bêta privée)
        </Text>
        <div className="flex flex-col gap-y-6">
          <div>
            <Text as="p" text03>
              La fonctionnalité Graphe de Connaissances vous permet d&apos;explorer vos données
              de nouvelles façons. Au lieu de chercher dans du texte non structuré, vos données
              sont organisées en entités et leurs relations, permettant des requêtes puissantes comme :
            </Text>
            <div className="p-4">
              <Text as="p" text03>
                - &quot;Résume mes 3 derniers appels avec le compte XYZ&quot;
              </Text>
              <Text as="p" text03>
                - &quot;Combien de Jiras ouverts sont assignés à John Smith, classés par priorité&quot;
              </Text>
            </div>
            <Text as="p" text03>
              (Pour utiliser les requêtes du Graphe de Connaissances, vous aurez besoin d&apos;un
              Assistant dédié configuré d&apos;une manière spécifique. Veuillez contacter l&apos;équipe
              Onyx pour les instructions de configuration.)
            </Text>
          </div>
          <Text as="p" text03>
            <Title>Pour commencer :</Title>
            Commencez par configurer quelques attributs de haut niveau, puis définissez
            les entités que vous souhaitez modéliser.
          </Text>
          <Button
            icon={SvgSettings}
            onClick={() => setConfigureModalShown(true)}
          >
            Configurer le Graphe de Connaissances
          </Button>
        </div>
      </CardSection>
      {kgConfig.enabled && (
        <>
          <Text as="p" headingH2>
            Types d&apos;entités
          </Text>
          <KGEntityTypes sourceAndEntityTypes={sourceAndEntityTypesData} />
        </>
      )}
      {configureModalShown && (
        <Modal open onOpenChange={() => setConfigureModalShown(false)}>
          <Modal.Content>
            <Modal.Header
              icon={SvgSettings}
              title="Configurer le Graphe de Connaissances"
              onClose={() => setConfigureModalShown(false)}
            />
            <Modal.Body>
              <KGConfiguration
                kgConfig={kgConfig}
                onSubmitSuccess={async () => {
                  await configMutate();
                  setConfigureModalShown(false);
                }}
                entityTypesMutate={entityTypesMutate}
              />
            </Modal.Body>
          </Modal.Content>
        </Modal>
      )}
    </div>
  );
}

export default function Page() {
  const { kgExposed, isLoading } = useIsKGExposed();

  if (isLoading) {
    return <></>;
  }

  if (!kgExposed) {
    redirect("/");
  }

  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header icon={route.icon} title={route.title} separator />
      <SettingsLayouts.Body>
        <Main />
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}
