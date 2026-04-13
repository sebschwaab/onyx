"use client";

import { TextFormField } from "@/components/Field";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { createSlackBot, updateSlackBot } from "./new/lib";
import { Button } from "@opal/components";
import Separator from "@/refresh-components/Separator";
import { useEffect } from "react";
import { DOCS_ADMINS_PATH } from "@/lib/constants";
import { toast } from "@/hooks/useToast";

export const SlackTokensForm = ({
  isUpdate,
  initialValues,
  existingSlackBotId,
  refreshSlackBot,
  router,
  onValuesChange,
}: {
  isUpdate: boolean;
  initialValues: any;
  existingSlackBotId?: number;
  refreshSlackBot?: () => void;
  router: any;
  onValuesChange?: (values: any) => void;
}) => {
  useEffect(() => {
    if (onValuesChange) {
      onValuesChange(initialValues);
    }
  }, [initialValues, onValuesChange]);

  return (
    <Formik
      initialValues={{
        ...initialValues,
      }}
      validationSchema={Yup.object().shape({
        bot_token: Yup.string().required(),
        app_token: Yup.string().required(),
        name: Yup.string().required(),
        user_token: Yup.string().optional(),
      })}
      onSubmit={async (values, formikHelpers) => {
        formikHelpers.setSubmitting(true);

        let response;
        if (isUpdate) {
          response = await updateSlackBot(existingSlackBotId!, values);
        } else {
          response = await createSlackBot(values);
        }
        formikHelpers.setSubmitting(false);
        if (response.ok) {
          if (refreshSlackBot) {
            refreshSlackBot();
          }
          const responseJson = await response.json();
          const botId = isUpdate ? existingSlackBotId : responseJson.id;
          toast.success(
            isUpdate
              ? "Bot Slack mis à jour avec succès !"
              : "Bot Slack créé avec succès !"
          );
          router.push(`/admin/bots/${encodeURIComponent(botId)}`);
        } else {
          const responseJson = await response.json();
          let errorMsg = responseJson.detail || responseJson.message;

          if (errorMsg.includes("Invalid bot token:")) {
            errorMsg = "Le token du bot Slack est invalide";
          } else if (errorMsg.includes("Invalid app token:")) {
            errorMsg = "Le token de l'application Slack est invalide";
          }
          toast.error(
            isUpdate
              ? `Erreur lors de la mise à jour du bot Slack - ${errorMsg}`
              : `Erreur lors de la création du bot Slack - ${errorMsg}`
          );
        }
      }}
      enableReinitialize={true}
    >
      {({ isSubmitting, setFieldValue, values }) => (
        <Form className="w-full">
          {!isUpdate && (
            <div className="">
              <TextFormField
                name="name"
                label="Nommer ce bot Slack :"
                type="text"
              />
            </div>
          )}

          {!isUpdate && (
            <div className="mt-4">
              <Separator />
              Consultez notre{" "}
              <a
                className="text-blue-500 hover:underline"
                href={`${DOCS_ADMINS_PATH}/getting_started/slack_bot_setup`}
                target="_blank"
                rel="noopener noreferrer"
              >
                guide
              </a>{" "}
              si vous ne savez pas comment obtenir ces tokens !
            </div>
          )}
          <TextFormField
            name="bot_token"
            label="Token du bot Slack"
            type="password"
          />
          <TextFormField
            name="app_token"
            label="Token de l'application Slack"
            type="password"
          />
          <TextFormField
            name="user_token"
            label="Token utilisateur Slack (Optionnel)"
            type="password"
            subtext="Optionnel : token OAuth utilisateur pour un accès amélioré aux canaux privés"
          />
          <div className="flex justify-end w-full mt-4">
            <Button
              disabled={
                isSubmitting ||
                !values.bot_token ||
                !values.app_token ||
                !values.name
              }
              type="submit"
            >
              {isUpdate ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};
