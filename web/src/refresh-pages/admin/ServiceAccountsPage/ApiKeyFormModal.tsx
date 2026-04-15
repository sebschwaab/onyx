"use client";

import { Form, Formik } from "formik";
import { toast } from "@/hooks/useToast";
import {
  createApiKey,
  updateApiKey,
} from "@/refresh-pages/admin/ServiceAccountsPage/svc";
import type { APIKey } from "@/refresh-pages/admin/ServiceAccountsPage/interfaces";
import Modal from "@/refresh-components/Modal";
import { Button } from "@opal/components";
import InputTypeIn from "@/refresh-components/inputs/InputTypeIn";
import InputSelect from "@/refresh-components/inputs/InputSelect";
import { FormikField } from "@/refresh-components/form/FormikField";
import { Vertical as VerticalInput } from "@/layouts/input-layouts";
import { USER_ROLE_LABELS, UserRole } from "@/lib/types";
import { SvgKey, SvgLock, SvgUser, SvgUserManage } from "@opal/icons";

interface ApiKeyFormModalProps {
  onClose: () => void;
  onCreateApiKey: (apiKey: APIKey) => void;
  apiKey?: APIKey;
}

export default function ApiKeyFormModal({
  onClose,
  onCreateApiKey,
  apiKey,
}: ApiKeyFormModalProps) {
  const isUpdate = apiKey !== undefined;

  return (
    <Modal open onOpenChange={onClose}>
      <Modal.Content width="sm" height="lg">
        <Modal.Header
          icon={SvgKey}
          title={isUpdate ? "Modifier le compte de service" : "Créer un compte de service"}
          description={
            isUpdate
              ? undefined
              : "Utilisez la clé API du compte de service pour accéder à l'API Onyx par programmation avec des permissions utilisateur. Vous pouvez modifier les détails du compte ultérieurement."
          }
          onClose={onClose}
        />
        <Formik
          initialValues={{
            name: apiKey?.api_key_name || "",
            role: apiKey?.api_key_role || UserRole.BASIC.toString(),
          }}
          onSubmit={async (values, formikHelpers) => {
            formikHelpers.setSubmitting(true);

            const payload = {
              ...values,
              role: values.role as UserRole,
            };

            try {
              let response;
              if (isUpdate) {
                response = await updateApiKey(apiKey.api_key_id, payload);
              } else {
                response = await createApiKey(payload);
              }
              if (response.ok) {
                toast.success(
                  isUpdate
                    ? "Compte de service mis à jour avec succès !"
                    : "Compte de service créé avec succès !"
                );
                if (!isUpdate) {
                  onCreateApiKey(await response.json());
                }
                onClose();
              } else {
                const responseJson = await response.json();
                const errorMsg = responseJson.detail || responseJson.message;
                toast.error(
                  isUpdate
                    ? `Erreur lors de la mise à jour du compte de service - ${errorMsg}`
                    : `Erreur lors de la création du compte de service - ${errorMsg}`
                );
              }
            } catch (e) {
              toast.error(
                e instanceof Error ? e.message : "Une erreur inattendue s'est produite."
              );
            } finally {
              formikHelpers.setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, values }) => (
            <Form className="w-full overflow-visible">
              <Modal.Body>
                <VerticalInput
                  name="name"
                  title="Nom"
                  nonInteractive
                  sizePreset="main-ui"
                >
                  <FormikField<string>
                    name="name"
                    render={(field, helper) => (
                      <InputTypeIn
                        {...field}
                        placeholder="Saisir un nom"
                        onClear={() => helper.setValue("")}
                        showClearButton={false}
                      />
                    )}
                  />
                </VerticalInput>

                <VerticalInput
                  name="role"
                  title="Permissions du compte"
                  nonInteractive
                  sizePreset="main-ui"
                >
                  <FormikField<string>
                    name="role"
                    render={(field, helper) => (
                      <InputSelect
                        value={field.value}
                        onValueChange={(value) => helper.setValue(value)}
                      >
                        <InputSelect.Trigger placeholder="Sélectionner les permissions" />
                        <InputSelect.Content>
                          <InputSelect.Item
                            value={UserRole.ADMIN.toString()}
                            icon={SvgUserManage}
                            description="Accès administrateur complet à tous les endpoints."
                          >
                            {USER_ROLE_LABELS[UserRole.ADMIN]}
                          </InputSelect.Item>
                          <InputSelect.Item
                            value={UserRole.BASIC.toString()}
                            icon={SvgUser}
                            description="Accès utilisateur standard aux endpoints non-administrateur."
                          >
                            {USER_ROLE_LABELS[UserRole.BASIC]}
                          </InputSelect.Item>
                          <InputSelect.Item
                            value={UserRole.LIMITED.toString()}
                            icon={SvgLock}
                            description="Pour les agents : publication de messages et accès en lecture seule aux autres endpoints."
                          >
                            {USER_ROLE_LABELS[UserRole.LIMITED]}
                          </InputSelect.Item>
                        </InputSelect.Content>
                      </InputSelect>
                    )}
                  />
                </VerticalInput>
              </Modal.Body>

              <Modal.Footer>
                <Button prominence="secondary" type="button" onClick={onClose}>
                  Annuler
                </Button>
                <Button
                  disabled={isSubmitting || !values.name.trim()}
                  type="submit"
                >
                  {isUpdate ? "Mettre à jour" : "Créer le compte"}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal.Content>
    </Modal>
  );
}
