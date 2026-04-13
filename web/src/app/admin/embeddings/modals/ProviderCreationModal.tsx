import React, { useRef, useState } from "react";
import Text from "@/refresh-components/texts/Text";
import { Callout } from "@/components/ui/callout";
import { Button } from "@opal/components";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Label, TextFormField } from "@/components/Field";
import {
  CloudEmbeddingProvider,
  EmbeddingProvider,
  getFormattedProviderName,
} from "@/components/embedding/interfaces";
import { EMBEDDING_PROVIDERS_ADMIN_URL } from "@/lib/llmConfig/constants";
import Modal from "@/refresh-components/Modal";
import { markdown } from "@opal/utils";
import { SvgSettings } from "@opal/icons";
import SimpleLoader from "@/refresh-components/loaders/SimpleLoader";
export interface ProviderCreationModalProps {
  updateCurrentModel: (
    newModel: string,
    provider_type: EmbeddingProvider
  ) => void;
  selectedProvider: CloudEmbeddingProvider;
  onConfirm: () => void;
  onCancel: () => void;
  existingProvider?: CloudEmbeddingProvider;
  isProxy?: boolean;
  isAzure?: boolean;
}

export default function ProviderCreationModal({
  selectedProvider,
  onConfirm,
  onCancel,
  existingProvider,
  isProxy,
  isAzure,
  updateCurrentModel,
}: ProviderCreationModalProps) {
  const useFileUpload =
    selectedProvider.provider_type == EmbeddingProvider.GOOGLE;

  const [errorMsg, setErrorMsg] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const initialValues = {
    provider_type:
      existingProvider?.provider_type || selectedProvider.provider_type,
    api_key: existingProvider?.api_key || "",
    api_url: existingProvider?.api_url || "",
    custom_config: existingProvider?.custom_config
      ? Object.entries(existingProvider.custom_config)
      : [],
    model_id: 0,
    model_name: null,
  };

  const validationSchema = Yup.object({
    provider_type: Yup.string().required("Le type de fournisseur est requis"),
    api_key:
      isProxy || isAzure
        ? Yup.string()
        : useFileUpload
          ? Yup.string()
          : Yup.string().required("La clé API est requise"),
    model_name: isProxy
      ? Yup.string().required("Le nom du modèle est requis")
      : Yup.string().nullable(),
    api_url:
      isProxy || isAzure
        ? Yup.string().required("L'URL de l'API est requise")
        : Yup.string(),
    deployment_name: isAzure
      ? Yup.string().required("Le nom du déploiement est requis")
      : Yup.string(),
    api_version: isAzure
      ? Yup.string().required("La version de l'API est requise")
      : Yup.string(),
    custom_config: Yup.array().of(Yup.array().of(Yup.string()).length(2)),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const file = event.target.files?.[0];
    setFileName("");
    if (file) {
      setFileName(file.name);
      try {
        const fileContent = await file.text();
        let jsonContent;
        try {
          jsonContent = JSON.parse(fileContent);
        } catch (parseError) {
          throw new Error(
            "Échec de l'analyse du fichier JSON. Veuillez vous assurer qu'il est valide."
          );
        }
        setFieldValue("api_key", JSON.stringify(jsonContent));
      } catch (error) {
        setFieldValue("api_key", "");
      }
    }
  };

  const handleSubmit = async (
    values: any,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    setErrorMsg("");
    try {
      const customConfig = Object.fromEntries(values.custom_config);
      const providerType = values.provider_type.toLowerCase().split(" ")[0];
      const isOpenAI = providerType === "openai";

      const testModelName =
        isOpenAI || isAzure ? "text-embedding-3-small" : values.model_name;

      const testEmbeddingPayload = {
        provider_type: providerType,
        api_key: values.api_key,
        api_url: values.api_url,
        model_name: testModelName,
        api_version: values.api_version,
        deployment_name: values.deployment_name,
      };

      const initialResponse = await fetch(
        "/api/admin/embedding/test-embedding",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testEmbeddingPayload),
        }
      );

      if (!initialResponse.ok) {
        const errorMsg = (await initialResponse.json()).detail;
        setErrorMsg(errorMsg);
        setSubmitting(false);
        return;
      }

      const response = await fetch(EMBEDDING_PROVIDERS_ADMIN_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          api_version: values.api_version,
          deployment_name: values.deployment_name,
          provider_type: values.provider_type.toLowerCase().split(" ")[0],
          custom_config: customConfig,
          is_default_provider: false,
          is_configured: true,
        }),
      });

      if (isAzure) {
        updateCurrentModel(values.model_name, EmbeddingProvider.AZURE);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Échec de la mise à jour du fournisseur - vérifiez votre clé API"
        );
      }

      onConfirm();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Une erreur inconnue s'est produite");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onOpenChange={onCancel}>
      <Modal.Content width="sm" height="sm">
        <Modal.Header
          icon={SvgSettings}
          title={markdown(
            `Configure *${getFormattedProviderName(
              selectedProvider.provider_type
            )}*`
          )}
          onClose={onCancel}
        />
        <Modal.Body>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, handleSubmit, setFieldValue }) => (
              <Form onSubmit={handleSubmit} className="space-y-4">
                <Text as="p">
                  Vous configurez les identifiants pour ce fournisseur. Pour accéder
                  à ces informations, suivez les instructions{" "}
                  <a
                    className="cursor-pointer underline"
                    target="_blank"
                    href={selectedProvider.docsLink}
                    rel="noreferrer"
                  >
                    ici
                  </a>{" "}
                  et récupérez votre{" "}
                  <a
                    className="cursor-pointer underline"
                    target="_blank"
                    href={selectedProvider.apiLink}
                    rel="noreferrer"
                  >
                    {isProxy || isAzure ? "URL API" : "CLÉ API"}
                  </a>
                </Text>

                <div className="flex w-full flex-col gap-y-6">
                  {(isProxy || isAzure) && (
                    <TextFormField
                      name="api_url"
                      label="API URL"
                      placeholder="API URL"
                      type="text"
                    />
                  )}

                  {isProxy && (
                    <TextFormField
                      name="model_name"
                      label={`Nom du modèle ${isProxy ? "(pour les tests)" : ""}`}
                      placeholder="Nom du modèle"
                      type="text"
                    />
                  )}

                  {isAzure && (
                    <TextFormField
                      name="deployment_name"
                      label="Nom du déploiement"
                      placeholder="Nom du déploiement"
                      type="text"
                    />
                  )}

                  {isAzure && (
                    <TextFormField
                      name="api_version"
                      label="Version de l'API"
                      placeholder="Version de l'API"
                      type="text"
                    />
                  )}

                  {useFileUpload ? (
                    <>
                      <Label>Téléverser un fichier JSON</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={(e) => handleFileUpload(e, setFieldValue)}
                        className="text-lg w-full p-1"
                      />
                      {fileName && <p>Fichier téléversé : {fileName}</p>}
                    </>
                  ) : (
                    <TextFormField
                      name="api_key"
                      label={`Clé API ${
                        isProxy ? "(pour les déploiements non locaux)" : ""
                      }`}
                      placeholder="Clé API"
                      type="password"
                    />
                  )}

                  <a
                    href={selectedProvider.apiLink}
                    target="_blank"
                    className="underline cursor-pointer"
                    rel="noreferrer"
                  >
                    En savoir plus
                  </a>
                </div>

                {errorMsg && (
                  <Callout title="Erreur" type="danger">
                    {errorMsg}
                  </Callout>
                )}

                <Button
                  disabled={isSubmitting}
                  type="submit"
                  width="full"
                  icon={isSubmitting ? SimpleLoader : undefined}
                >
                  {isSubmitting
                    ? "Envoi..."
                    : existingProvider
                      ? "Mettre à jour"
                      : "Créer"}
                </Button>
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
