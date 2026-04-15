"use client";

import * as Yup from "yup";
import { FormikField } from "@/refresh-components/form/FormikField";
import { FormField } from "@/refresh-components/form/FormField";
import InputTypeIn from "@/refresh-components/inputs/InputTypeIn";
import InputFile from "@/refresh-components/inputs/InputFile";
import InlineExternalLink from "@/refresh-components/InlineExternalLink";
import { ImageGenFormWrapper } from "@/refresh-pages/admin/ImageGenerationPage/forms/ImageGenFormWrapper";
import {
  ImageGenFormBaseProps,
  ImageGenFormChildProps,
  ImageGenSubmitPayload,
} from "@/refresh-pages/admin/ImageGenerationPage/forms/types";
import { ImageProvider } from "@/refresh-pages/admin/ImageGenerationPage/constants";
import { ImageGenerationCredentials } from "@/refresh-pages/admin/ImageGenerationPage/svc";

const VERTEXAI_PROVIDER_NAME = "vertex_ai";
const VERTEXAI_DEFAULT_LOCATION = "global";

// Vertex form values
interface VertexImageGenFormValues {
  custom_config: {
    vertex_credentials: string;
    vertex_location: string;
  };
}

const initialValues: VertexImageGenFormValues = {
  custom_config: {
    vertex_credentials: "",
    vertex_location: VERTEXAI_DEFAULT_LOCATION,
  },
};

const validationSchema = Yup.object().shape({
  custom_config: Yup.object().shape({
    vertex_credentials: Yup.string().required("Le fichier d'identifiants est requis"),
    vertex_location: Yup.string().required("La région est requise"),
  }),
});

function getInitialValuesFromCredentials(
  credentials: ImageGenerationCredentials,
  _imageProvider: ImageProvider
): Partial<VertexImageGenFormValues> {
  return {
    custom_config: {
      vertex_credentials: credentials.custom_config?.vertex_credentials || "",
      vertex_location:
        credentials.custom_config?.vertex_location || VERTEXAI_DEFAULT_LOCATION,
    },
  };
}

function transformValues(
  values: VertexImageGenFormValues,
  imageProvider: ImageProvider
): ImageGenSubmitPayload {
  return {
    modelName: imageProvider.model_name,
    imageProviderId: imageProvider.image_provider_id,
    provider: VERTEXAI_PROVIDER_NAME,
    customConfig: {
      vertex_credentials: values.custom_config.vertex_credentials,
      vertex_location: values.custom_config.vertex_location,
    },
  };
}

function VertexFormFields(
  props: ImageGenFormChildProps<VertexImageGenFormValues>
) {
  const { apiStatus, showApiMessage, errorMessage, disabled, imageProvider } =
    props;

  return (
    <>
      {/* Credentials File field */}
      <FormikField<string>
        name="custom_config.vertex_credentials"
        render={(field, helper, meta, state) => (
          <FormField
            name="custom_config.vertex_credentials"
            state={apiStatus === "error" ? "error" : state}
            className="w-full"
          >
            <FormField.Label>Fichier d&apos;identifiants</FormField.Label>
            <FormField.Control>
              <InputFile
                setValue={(value) => helper.setValue(value)}
                error={apiStatus === "error"}
                onBlur={field.onBlur}
                showClearButton={true}
                disabled={disabled}
                accept="application/json"
                placeholder="Téléverser ou coller vos identifiants"
              />
            </FormField.Control>
            {showApiMessage ? (
              <FormField.APIMessage
                state={apiStatus}
                messages={{
                  loading: `Test des identifiants avec ${imageProvider.title}...`,
                  success: "Identifiants valides. Configuration enregistrée.",
                  error: errorMessage || "Identifiants invalides",
                }}
              />
            ) : (
              <FormField.Message
                messages={{
                  idle: (
                    <>
                      {"Téléversez ou collez vos "}
                      <InlineExternalLink href="https://console.cloud.google.com/projectselector2/iam-admin/serviceaccounts?supportedpurview=project">
                        identifiants de compte de service
                      </InlineExternalLink>
                      {" depuis Google Cloud."}
                    </>
                  ),
                  error: meta.error,
                }}
              />
            )}
          </FormField>
        )}
      />

      {/* Location field */}
      <FormikField<string>
        name="custom_config.vertex_location"
        render={(field, helper, meta, state) => (
          <FormField
            name="custom_config.vertex_location"
            state={state}
            className="w-full"
          >
            <FormField.Label>Région</FormField.Label>
            <FormField.Control>
              <InputTypeIn
                value={field.value}
                onChange={(e) => helper.setValue(e.target.value)}
                onBlur={field.onBlur}
                placeholder="global"
                showClearButton={false}
                variant={disabled ? "disabled" : undefined}
              />
            </FormField.Control>
            <FormField.Message
              messages={{
                idle: (
                  <>
                    {"La région Google Cloud pour vos modèles Vertex AI. Consultez la "}
                    <InlineExternalLink href="https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations">
                      documentation Google
                    </InlineExternalLink>
                    {" pour les régions disponibles."}
                  </>
                ),
                error: meta.error,
              }}
            />
          </FormField>
        )}
      />
    </>
  );
}

export function VertexImageGenForm(props: ImageGenFormBaseProps) {
  const { imageProvider, existingConfig } = props;

  return (
    <ImageGenFormWrapper<VertexImageGenFormValues>
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
      {(childProps) => <VertexFormFields {...childProps} />}
    </ImageGenFormWrapper>
  );
}
