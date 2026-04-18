"use client";

import { Label, SubLabel } from "@/components/Field";
import { toast } from "@/hooks/useToast";
import { SettingsContext } from "@/providers/SettingsProvider";
import { Button, Text } from "@opal/components";
import { markdown } from "@opal/utils";
import { Callout } from "@/components/ui/callout";
import { useContext, useState } from "react";
import InputTextArea from "@/refresh-components/inputs/InputTextArea";
import Spacer from "@/refresh-components/Spacer";

export function CustomAnalyticsUpdateForm() {
  const settings = useContext(SettingsContext);
  const customAnalyticsScript = settings?.customAnalyticsScript;

  const [newCustomAnalyticsScript, setNewCustomAnalyticsScript] =
    useState<string>(customAnalyticsScript || "");
  const [secretKey, setSecretKey] = useState<string>("");

  if (!settings) {
    return <Callout type="danger" title="Impossible de récupérer les paramètres"></Callout>;
  }

  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          const response = await fetch(
            "/api/admin/enterprise-settings/custom-analytics-script",
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                script: newCustomAnalyticsScript.trim(),
                secret_key: secretKey,
              }),
            }
          );
          if (response.ok) {
            toast.success("Script d'analytics personnalisé mis à jour avec succès !");
          } else {
            const errorMsg = (await response.json()).detail;
            toast.error(
              `Échec de la mise à jour du script d'analytics personnalisé : "${errorMsg}"`
            );
          }
          setSecretKey("");
        }}
      >
        <div className="mb-4">
          <Label>Script</Label>
          <Text as="p">
            Spécifiez le JavaScript qui doit s&apos;exécuter au chargement de la page afin
            d&apos;initialiser votre suivi/analytics personnalisé.
          </Text>
          <Spacer rem={0.75} />
          <Text as="p">
            {markdown(
              "N'incluez pas les balises `<script></script>`. Si vous téléversez un script ci-dessous mais ne recevez aucun événement dans votre plateforme d'analytics, essayez de supprimer tous les espaces superflus avant chaque ligne de JavaScript."
            )}
          </Text>
          <Spacer rem={0.5} />
          <InputTextArea
            value={newCustomAnalyticsScript}
            onChange={(event) =>
              setNewCustomAnalyticsScript(event.target.value)
            }
          />
        </div>

        <Label>Clé secrète</Label>
        <SubLabel>
          <>
            Pour des raisons de sécurité, vous devez fournir une clé secrète pour mettre à jour ce
            script. Il doit s&apos;agir de la valeur de la variable d&apos;environnement{" "}
            <i>CUSTOM_ANALYTICS_SECRET_KEY</i> définie lors de la configuration initiale d&apos;Onyx.
          </>
        </SubLabel>
        <input
          className={`
            border
            border-border
            rounded
            w-full
            py-2
            px-3
            mt-1`}
          type="password"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
        />
        <Spacer rem={1} />
        <Button type="submit">Mettre à jour</Button>
      </form>
    </div>
  );
}
