"use client";

import AuthFlowContainer from "@/components/auth/AuthFlowContainer";

import { useUser } from "@/providers/UserProvider";
import { redirect, useRouter } from "next/navigation";
import type { Route } from "next";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import { toast } from "@/hooks/useToast";
import { TextFormField } from "@/components/Field";
import { Button } from "@opal/components";
import Text from "@/refresh-components/texts/Text";

const ImpersonateSchema = Yup.object().shape({
  email: Yup.string().email("E-mail invalide").required("Requis"),
  apiKey: Yup.string().required("Requis"),
});

export default function ImpersonatePage() {
  const router = useRouter();
  const { user, isCloudSuperuser } = useUser();
  if (!user) {
    redirect("/auth/login");
  }

  if (!isCloudSuperuser) {
    redirect("/app" as Route);
  }

  const handleImpersonate = async (
    values: { email: string; apiKey: string },
    helpers: FormikHelpers<{ email: string; apiKey: string }>
  ) => {
    try {
      const response = await fetch("/api/tenants/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${values.apiKey}`,
        },
        body: JSON.stringify({ email: values.email }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.detail || "Échec de l'usurpation d'identité");
        helpers.setSubmitting(false);
      } else {
        helpers.setSubmitting(false);
        router.push("/app" as Route);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de l'usurpation d'identité"
      );
      helpers.setSubmitting(false);
    }
  };

  return (
    <AuthFlowContainer>
      <div className="flex flex-col w-full justify-center">
        <div className="w-full flex flex-col items-center justify-center">
          <Text as="p" headingH3 className="mb-6 text-center">
            Usurper l&apos;identité d&apos;un utilisateur
          </Text>
        </div>

        <Formik
          initialValues={{ email: "", apiKey: "" }}
          validationSchema={ImpersonateSchema}
          onSubmit={(values, helpers) => handleImpersonate(values, helpers)}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col gap-4">
              <TextFormField
                name="email"
                type="email"
                label="E-mail"
                placeholder="email@yourcompany.com"
              />

              <TextFormField
                name="apiKey"
                type="password"
                label="Clé API"
                placeholder="Entrez la clé API"
              />

              <Button disabled={isSubmitting} type="submit" width="full">
                Usurper l&apos;identité
              </Button>
            </Form>
          )}
        </Formik>

        <Text
          as="p"
          mainUiMuted
          text03
          className="mt-4 text-center px-4"
        >{`Remarque : Cette fonctionnalité est réservée aux administrateurs @onyx.app`}</Text>
      </div>
    </AuthFlowContainer>
  );
}
