"use client";

import React from "react";
import * as Yup from "yup";
import { FormikField } from "@/refresh-components/form/FormikField";
import { FormField } from "@/refresh-components/form/FormField";
import InputTypeIn from "@/refresh-components/inputs/InputTypeIn";
import InputComboBox from "@/refresh-components/inputs/InputComboBox";
import PasswordInputTypeIn from "@/refresh-components/inputs/PasswordInputTypeIn";
import { ImageGenFormWrapper } from "@/refresh-pages/admin/ImageGenerationPage/forms/ImageGenFormWrapper";
import {
  ImageGenFormBaseProps,
  ImageGenFormChildProps,
  ImageGenSubmitPayload,
} from "@/refresh-pages/admin/ImageGenerationPage/forms/types";
import { ImageGenerationCredentials } from "@/refresh-pages/admin/ImageGenerationPage/svc";
import { ImageProvider } from "@/refresh-pages/admin/ImageGenerationPage/constants";
import {
  parseAzureTargetUri,
  isValidAzureTargetUri,
} from "@/lib/azureTargetUri";

// Azure form values - target URI and API key
interface AzureFormValues {
  target_uri: string;
  api_key: string;
}

const initialValues: AzureFormValues = {
  target_uri: "",
  api_key: "",
};

const validationSchema = Yup.object().shape({
  target_uri: Yup.string()
    .required("L'URI cible est requise")
    .test(
      "valid-target-uri",
      "L'URI cible doit être une URL valide avec api-version et deployment name",
      (value) => (value ? isValidAzureTargetUri(value) : false)
    ),
  api_key: Yup.string().required("La clé API est requise"),
});

function AzureFormFields(props: ImageGenFormChildProps<AzureFormValues>) {
  const {
    formikProps,
    apiStatus,
    showApiMessage,
    errorMessage,
    disabled,
    isLoadingCredentials,
    apiKeyOptions,
    resetApiState,
    imageProvider,
  } = props;

  return (
    <>
      {/* Target URI field */}
      <FormikField<string>
        name="target_uri"
        render={(field, helper, meta, state) => (
          <FormField name="target_uri" state={state} className="w-full">
            <FormField.Label>URI cible</FormField.Label>
            <FormField.Control>
              <InputTypeIn
                {...field}
                placeholder="https://your-resource.cognitiveservices.azure.com/openai/deployments/deployment-name/images/generations?api-version=2025-01-01-preview"
                showClearButton={false}
                variant={disabled ? "disabled" : undefined}
              />
            </FormField.Control>
            <FormField.Message
              messages={{
                idle: (
                  <>
                    Collez l&apos;URI cible de votre endpoint depuis{" "}
                    <a
                      href="https://oai.azure.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Azure OpenAI
                    </a>{" "}
                    (incluant la base de l&apos;endpoint API, le nom du déploiement et la version API).
                  </>
                ),
                error: meta.error,
              }}
            />
          </FormField>
        )}
      />

      {/* API Key field */}
      <FormikField<string>
        name="api_key"
        render={(field, helper, meta, state) => (
          <FormField
            name="api_key"
            state={apiStatus === "error" ? "error" : state}
            className="w-full"
          >
            <FormField.Label>Clé API</FormField.Label>
            <FormField.Control>
              {apiKeyOptions.length > 0 ? (
                <InputComboBox
                  value={field.value}
                  onChange={(e) => {
                    helper.setValue(e.target.value);
                    resetApiState();
                  }}
                  onValueChange={(value) => {
                    helper.setValue(value);
                    resetApiState();
                  }}
                  onBlur={field.onBlur}
                  options={apiKeyOptions}
                  placeholder={
                    isLoadingCredentials
                      ? "Chargement..."
                      : "Saisir une nouvelle clé API ou sélectionner un fournisseur existant"
                  }
                  disabled={disabled || !formikProps.values.target_uri?.trim()}
                  isError={apiStatus === "error"}
                />
              ) : (
                <PasswordInputTypeIn
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    resetApiState();
                  }}
                  placeholder={
                    isLoadingCredentials ? "Chargement..." : "Saisir votre clé API"
                  }
                  showClearButton={false}
                  disabled={disabled || !formikProps.values.target_uri?.trim()}
                  error={apiStatus === "error"}
                />
              )}
            </FormField.Control>
            {showApiMessage ? (
              <FormField.APIMessage
                state={apiStatus}
                messages={{
                  loading: `Test de la clé API avec ${imageProvider.title}...`,
                  success: "Clé API valide. Configuration enregistrée.",
                  error: errorMessage || "Clé API invalide",
                }}
              />
            ) : (
              <FormField.Message
                messages={{
                  idle: (
                    <>
                      {"Collez votre "}
                      <a
                        href="https://oai.azure.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        clé API
                      </a>
                      {" depuis Azure OpenAI pour accéder à vos modèles."}
                    </>
                  ),
                  error: meta.error,
                }}
              />
            )}
          </FormField>
        )}
      />
    </>
  );
}

function getInitialValuesFromCredentials(
  credentials: ImageGenerationCredentials,
  imageProvider: ImageProvider
): Partial<AzureFormValues> {
  // Reconstruct target_uri from credentials
  let targetUri = "";
  if (credentials.api_base && credentials.api_version) {
    const deployment = credentials.deployment_name || imageProvider.model_name;
    targetUri = `${credentials.api_base}/openai/deployments/${deployment}/images/generations?api-version=${credentials.api_version}`;
  }

  return {
    api_key: credentials.api_key || "",
    target_uri: targetUri,
  };
}

function transformValues(
  values: AzureFormValues,
  imageProvider: ImageProvider
): ImageGenSubmitPayload {
  // Parse target_uri to extract api_base, api_version, deployment_name
  let apiBase: string | undefined;
  let apiVersion: string | undefined;
  let deploymentName: string | undefined;
  let modelName = imageProvider.model_name;

  if (values.target_uri) {
    try {
      const parsed = parseAzureTargetUri(values.target_uri);
      apiBase = parsed.url.origin;
      apiVersion = parsed.apiVersion;
      deploymentName = parsed.deploymentName || undefined;
      // For Azure, use deployment name as model name
      modelName = deploymentName || imageProvider.model_name;
    } catch (error) {
      console.error("Failed to parse target_uri:", error);
    }
  }

  return {
    modelName,
    imageProviderId: imageProvider.image_provider_id,
    provider: "azure",
    apiKey: values.api_key,
    apiBase,
    apiVersion,
    deploymentName,
  };
}

export function AzureImageGenForm(props: ImageGenFormBaseProps) {
  const { imageProvider, existingConfig } = props;

  return (
    <ImageGenFormWrapper<AzureFormValues>
      {...props}
      title={
        existingConfig
          ? `Modifier ${imageProvider.title}`
          : `Connecter ${imageProvider.title}`
      }
      description={imageProvider.description}
      initialValues={initialValues}
      validationSchema={validationSchema}
      getInitialValuesFromCredentials={getInitialValuesFromCredentials}
      transformValues={(values) => transformValues(values, imageProvider)}
    >
      {(childProps) => <AzureFormFields {...childProps} />}
    </ImageGenFormWrapper>
  );
}
