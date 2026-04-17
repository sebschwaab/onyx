import { usePaidEnterpriseFeaturesEnabled } from "@/components/settings/usePaidEnterpriseFeaturesEnabled";
import React, { useState, useEffect } from "react";
import { FormikProps } from "formik";
import { UserRole } from "@/lib/types";
import { useUserGroups } from "@/lib/hooks";
import { BooleanFormField } from "@/components/Field";
import { useUser } from "@/providers/UserProvider";
import { GroupsMultiSelect } from "./GroupsMultiSelect";

export type IsPublicGroupSelectorFormType = {
  is_public: boolean;
  groups: number[];
};

// This should be included for all forms that require groups / public access
// to be set, and access to this / permissioning should be handled within this component itself.
export const IsPublicGroupSelector = <T extends IsPublicGroupSelectorFormType>({
  formikProps,
  objectName,
  publicToWhom = "Users",
  removeIndent = false,
  enforceGroupSelection = true,
  smallLabels = false,
}: {
  formikProps: FormikProps<T>;
  objectName: string;
  publicToWhom?: string;
  removeIndent?: boolean;
  enforceGroupSelection?: boolean;
  smallLabels?: boolean;
}) => {
  const { data: userGroups, isLoading: userGroupsIsLoading } = useUserGroups();
  const { isAdmin, user, isCurator } = useUser();
  const isPaidEnterpriseFeaturesEnabled = usePaidEnterpriseFeaturesEnabled();
  const [shouldHideContent, setShouldHideContent] = useState(false);

  useEffect(() => {
    if (user && userGroups && isPaidEnterpriseFeaturesEnabled) {
      const isUserAdmin = user.role === UserRole.ADMIN;
      if (!isUserAdmin && userGroups.length > 0) {
        formikProps.setFieldValue("is_public", false);
      }
      if (
        userGroups.length === 1 &&
        userGroups[0] !== undefined &&
        !isUserAdmin
      ) {
        formikProps.setFieldValue("groups", [userGroups[0].id]);
        setShouldHideContent(true);
      } else if (formikProps.values.is_public) {
        formikProps.setFieldValue("groups", []);
        setShouldHideContent(false);
      } else {
        setShouldHideContent(false);
      }
    }
  }, [user, userGroups, isPaidEnterpriseFeaturesEnabled]);

  if (userGroupsIsLoading) {
    return <div>Chargement...</div>;
  }
  if (!isPaidEnterpriseFeaturesEnabled) {
    return null;
  }

  let firstUserGroupName = "Inconnu";
  if (userGroups) {
    const userGroup = userGroups[0];
    if (userGroup) {
      firstUserGroupName = userGroup.name;
    }
  }

  if (shouldHideContent && enforceGroupSelection) {
    return (
      <>
        {userGroups && (
          <div className="mb-1 font-medium text-base">
            Cet élément ({objectName}) sera assigné au groupe{" "}
            <b>{firstUserGroupName}</b>.
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      {isAdmin && (
        <>
          <BooleanFormField
            name="is_public"
            removeIndent={removeIndent}
            small={smallLabels}
            label={
              publicToWhom === "Curators"
                ? `Rendre cet élément (${objectName}) accessible aux curateurs ?`
                : `Rendre cet élément (${objectName}) public ?`
            }
            disabled={!isAdmin}
            subtext={
              <span className="block mt-2 text-sm text-text-600 dark:text-neutral-400">
                Si activé, cet élément ({objectName}) sera utilisable par{" "}
                <b>Tous les {publicToWhom}</b>. Sinon, seuls les <b>Administrateurs</b> et les{" "}
                <b>{publicToWhom}</b> ayant explicitement reçu l&apos;accès à
                cet élément ({objectName}) (via un Groupe d&apos;utilisateurs, par exemple) y auront accès.
              </span>
            }
          />
        </>
      )}

      <GroupsMultiSelect
        formikProps={formikProps}
        label={`Attribuer l'accès groupe pour cet élément (${objectName})`}
        subtext={
          isAdmin || !enforceGroupSelection
            ? `Cet élément (${objectName}) sera visible/accessible par les groupes sélectionnés ci-dessous`
            : `Les curateurs doivent sélectionner un ou plusieurs groupes pour donner accès à cet élément (${objectName})`
        }
        disabled={formikProps.values.is_public && !isCurator}
        disabledMessage={`Cet élément (${objectName}) est public et disponible pour tous les utilisateurs.`}
      />
    </div>
  );
};
