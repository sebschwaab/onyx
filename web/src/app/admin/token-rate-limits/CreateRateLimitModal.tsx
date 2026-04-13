"use client";

import * as Yup from "yup";
import { Button } from "@opal/components";
import { useEffect, useState } from "react";
import Modal from "@/refresh-components/Modal";
import { Form, Formik } from "formik";
import { SelectorFormField, TextFormField } from "@/components/Field";
import { UserGroup } from "@/lib/types";
import { Scope } from "./types";
import { toast } from "@/hooks/useToast";
import { SvgSettings } from "@opal/icons";
interface CreateRateLimitModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (
    target_scope: Scope,
    period_hours: number,
    token_budget: number,
    group_id: number
  ) => void;
  forSpecificScope?: Scope;
  forSpecificUserGroup?: number;
}

export default function CreateRateLimitModal({
  isOpen,
  setIsOpen,
  onSubmit,
  forSpecificScope,
  forSpecificUserGroup,
}: CreateRateLimitModalProps) {
  const [modalUserGroups, setModalUserGroups] = useState([]);
  const [shouldFetchUserGroups, setShouldFetchUserGroups] = useState(
    forSpecificScope === Scope.USER_GROUP
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/manage/admin/user-group");
        const data = await response.json();
        const options = data.map((userGroup: UserGroup) => ({
          name: userGroup.name,
          value: userGroup.id,
        }));
        setModalUserGroups(options);
        setShouldFetchUserGroups(false);
      } catch (error) {
        toast.error(`Échec de la récupération des groupes : ${error}`);
      }
    };

    if (shouldFetchUserGroups) {
      fetchData();
    }
  }, [shouldFetchUserGroups]);

  return (
    <Modal open={isOpen} onOpenChange={() => setIsOpen(false)}>
      <Modal.Content width="sm" height="sm">
        <Modal.Header
          icon={SvgSettings}
          title="Créer une limite de jetons"
          onClose={() => setIsOpen(false)}
        />
        <Formik
          initialValues={{
            enabled: true,
            period_hours: "",
            token_budget: "",
            target_scope: forSpecificScope || Scope.GLOBAL,
            user_group_id: forSpecificUserGroup,
          }}
          validationSchema={Yup.object().shape({
            period_hours: Yup.number()
              .required("La fenêtre temporelle est requise")
              .min(1, "La fenêtre temporelle doit être d'au moins 1 heure"),
            token_budget: Yup.number()
              .required("Le budget de jetons est requis")
              .min(1, "Le budget de jetons doit être d'au moins 1"),
            target_scope: Yup.string().required(
              "La portée cible est requise"
            ),
            user_group_id: Yup.string().test(
              "user_group_id",
              "Le groupe d'utilisateurs est requis",
              (value, context) => {
                return (
                  context.parent.target_scope !== "user_group" ||
                  (context.parent.target_scope === "user_group" &&
                    value !== undefined)
                );
              }
            ),
          })}
          onSubmit={async (values, formikHelpers) => {
            formikHelpers.setSubmitting(true);
            onSubmit(
              values.target_scope,
              Number(values.period_hours),
              Number(values.token_budget),
              Number(values.user_group_id)
            );
            return formikHelpers.setSubmitting(false);
          }}
        >
          {({ isSubmitting, values, setFieldValue }) => (
            <Form className="flex flex-col h-full min-h-0 overflow-visible">
              <Modal.Body>
                {!forSpecificScope && (
                  <SelectorFormField
                    name="target_scope"
                    label="Portée cible"
                    options={[
                      { name: "Global", value: Scope.GLOBAL },
                      { name: "Utilisateur", value: Scope.USER },
                      { name: "Groupe d'utilisateurs", value: Scope.USER_GROUP },
                    ]}
                    includeDefault={false}
                    onSelect={(selected) => {
                      setFieldValue("target_scope", selected);
                      if (selected === Scope.USER_GROUP) {
                        setShouldFetchUserGroups(true);
                      }
                    }}
                  />
                )}
                {forSpecificUserGroup === undefined &&
                  values.target_scope === Scope.USER_GROUP && (
                    <SelectorFormField
                      name="user_group_id"
                      label="Groupe d'utilisateurs"
                      options={modalUserGroups}
                      includeDefault={false}
                    />
                  )}
                <TextFormField
                  name="period_hours"
                  label="Fenêtre temporelle (heures)"
                  type="number"
                  placeholder=""
                />
                <TextFormField
                  name="token_budget"
                  label="Budget de jetons (milliers)"
                  type="number"
                  placeholder=""
                />
              </Modal.Body>
              <Modal.Footer>
                <Button disabled={isSubmitting} type="submit">
                  Créer
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal.Content>
    </Modal>
  );
}
