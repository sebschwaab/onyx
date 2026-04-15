"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminPageTitle } from "@/components/admin/Title";
import { Button } from "@opal/components";
import { getSourceMetadata, isValidSource } from "@/lib/sources";
import { ConfluenceAccessibleResource, ValidSources } from "@/lib/types";
import CardSection from "@/components/admin/CardSection";
import {
  handleOAuthConfluenceFinalize,
  handleOAuthPrepareFinalization,
} from "@/lib/oauth_utils";
import { SelectorFormField } from "@/components/Field";
import { ErrorMessage, Field, Form, Formik, useFormikContext } from "formik";
import * as Yup from "yup";
import { SvgKey } from "@opal/icons";
// Helper component to keep the effect logic clean:
function UpdateCloudURLOnCloudIdChange({
  accessibleResources,
}: {
  accessibleResources: ConfluenceAccessibleResource[];
}) {
  const { values, setValues, setFieldValue } = useFormikContext<{
    cloud_id: string;
    cloud_name: string;
    cloud_url: string;
  }>();

  useEffect(() => {
    // Whenever cloud_id changes, find the matching resource and update cloud_url
    if (values.cloud_id) {
      const selectedResource = accessibleResources.find(
        (resource) => resource.id === values.cloud_id
      );
      if (selectedResource) {
        // Update multiple fields together ... somehow setting them in sequence
        // doesn't work with the validator
        // it may also be possible to await each setFieldValue call.
        // https://github.com/jaredpalmer/formik/issues/2266
        setValues((prevValues) => ({
          ...prevValues,
          cloud_name: selectedResource.name,
          cloud_url: selectedResource.url,
        }));
      }
    }
  }, [values.cloud_id, accessibleResources, setFieldValue]);

  // This component doesn't render anything visible:
  return null;
}

export default function OAuthFinalizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusMessage, setStatusMessage] = useState("Traitement en cours...");
  const [statusDetails, setStatusDetails] = useState(
    "Veuillez patienter pendant que nous finalisons la configuration."
  );
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // New state
  const [pageTitle, setPageTitle] = useState(
    "Finalisation de l'autorisation avec un service tiers"
  );

  const [accessibleResources, setAccessibleResources] = useState<
    ConfluenceAccessibleResource[]
  >([]);

  // Extract query parameters
  const credentialParam = searchParams?.get("credential");
  const credential = credentialParam ? parseInt(credentialParam, 10) : NaN;
  const pathname = usePathname();
  const connector = pathname?.split("/")[3];

  useEffect(() => {
    const onFirstLoad = async () => {
      // Examples
      // connector (url segment)= "google-drive"
      // sourceType (for looking up metadata) = "google_drive"

      if (isNaN(credential) || !connector) {
        setStatusMessage("Requête de finalisation OAuth mal formée.");
        setStatusDetails("Identifiant d'authentification invalide ou manquant.");
        setIsError(true);
        return;
      }

      const sourceType = connector.replaceAll("-", "_");
      if (!isValidSource(sourceType)) {
        setStatusMessage(
          `Le type de source du connecteur spécifié ${sourceType} n'existe pas.`
        );
        setStatusDetails(`${sourceType} n'est pas un type de source valide.`);
        setIsError(true);
        return;
      }

      const sourceMetadata = getSourceMetadata(sourceType as ValidSources);
      setPageTitle(`Finalisation de l'autorisation avec ${sourceMetadata.displayName}`);

      setStatusMessage("Traitement en cours...");
      setStatusDetails(
        "Veuillez patienter pendant que nous récupérons la liste de vos sites accessibles."
      );
      setIsError(false); // Ensure no error state during loading

      try {
        const response = await handleOAuthPrepareFinalization(
          connector,
          credential
        );

        if (!response) {
          throw new Error("Réponse vide du serveur OAuth.");
        }

        setAccessibleResources(response.accessible_resources);

        setStatusMessage("Sélectionnez un site Confluence");
        setStatusDetails("");

        setIsError(false);
      } catch (error) {
        console.error("OAuth finalization error:", error);
        setStatusMessage("Oups, quelque chose s'est mal passé !");
        setStatusDetails(
          "Une erreur s'est produite pendant le processus de finalisation OAuth. Veuillez réessayer."
        );
        setIsError(true);
      }
    };

    onFirstLoad();
  }, [credential, connector]);

  useEffect(() => {}, [redirectUrl]);

  return (
    <div className="mx-auto h-screen flex flex-col">
      <AdminPageTitle title={pageTitle} icon={SvgKey} />

      <div className="flex-1 flex flex-col items-center justify-center">
        <CardSection className="max-w-md w-[500px] h-[250px] p-8">
          <h1 className="text-2xl font-bold mb-4">{statusMessage}</h1>
          <p className="text-text-500">{statusDetails}</p>

          <Formik
            initialValues={{
              credential_id: credential,
              cloud_id: "",
              cloud_name: "",
              cloud_url: "",
            }}
            validationSchema={Yup.object().shape({
              credential_id: Yup.number().required(
                "L'identifiant d'authentification est requis."
              ),
              cloud_id: Yup.string().required(
                "Vous devez sélectionner un site Confluence (id introuvable)."
              ),
              cloud_name: Yup.string().required(
                "Vous devez sélectionner un site Confluence (nom introuvable)."
              ),
              cloud_url: Yup.string().required(
                "Vous devez sélectionner un site Confluence (URL introuvable)."
              ),
            })}
            validateOnMount
            onSubmit={async (values, formikHelpers) => {
              formikHelpers.setSubmitting(true);
              try {
                if (!values.cloud_id) {
                  throw new Error("L'ID cloud est requis.");
                }

                if (!values.cloud_name) {
                  throw new Error("L'URL cloud est requise.");
                }

                if (!values.cloud_url) {
                  throw new Error("L'URL cloud est requise.");
                }

                const response = await handleOAuthConfluenceFinalize(
                  values.credential_id,
                  values.cloud_id,
                  values.cloud_name,
                  values.cloud_url
                );
                formikHelpers.setSubmitting(false);

                if (response) {
                  setRedirectUrl(response.redirect_url);
                  setStatusMessage("Autorisation Confluence finalisée.");
                }

                setIsSubmitted(true); // Mark as submitted
              } catch (error) {
                console.error(error);
                setStatusMessage("Erreur lors de la soumission.");
                setStatusDetails(
                  "Une erreur s'est produite pendant le processus de soumission. Veuillez réessayer."
                );
                setIsError(true);
                formikHelpers.setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, isValid, setFieldValue }) => (
              <Form>
                {/* Debug info
                <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                  <pre>
                    isValid: {String(isValid)}
                    errors: {JSON.stringify(errors, null, 2)}
                    values: {JSON.stringify(values, null, 2)}
                  </pre>
                </div> */}

                {/* Our helper component that reacts to changes in cloud_id */}
                <UpdateCloudURLOnCloudIdChange
                  accessibleResources={accessibleResources}
                />

                <Field type="hidden" name="cloud_name" />
                <ErrorMessage
                  name="cloud_name"
                  component="div"
                  className="error"
                />

                <Field type="hidden" name="cloud_url" />
                <ErrorMessage
                  name="cloud_url"
                  component="div"
                  className="error"
                />

                {!redirectUrl && accessibleResources.length > 0 && (
                  <SelectorFormField
                    name="cloud_id"
                    options={accessibleResources.map((resource) => ({
                      name: `${resource.name} - ${resource.url}`,
                      value: resource.id,
                    }))}
                    onSelect={(selectedValue) => {
                      const selectedResource = accessibleResources.find(
                        (resource) => resource.id === selectedValue
                      );
                      if (selectedResource) {
                        setFieldValue("cloud_id", selectedResource.id);
                      }
                    }}
                  />
                )}
                <br />
                {!redirectUrl && (
                  <Button disabled={!isValid || isSubmitting} type="submit">
                    {isSubmitting ? "Envoi en cours..." : "Envoyer"}
                  </Button>
                )}
              </Form>
            )}
          </Formik>

          {redirectUrl && !isError && (
            <div className="mt-4">
              <p className="text-sm">
                Autorisation finalisée. Cliquez{" "}
                <a href={redirectUrl} className="text-blue-500 underline">
                  ici
                </a>{" "}
                pour continuer.
              </p>
            </div>
          )}
        </CardSection>
      </div>
    </div>
  );
}
