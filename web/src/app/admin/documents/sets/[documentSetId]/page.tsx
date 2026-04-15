"use client";
import { use } from "react";

import { ErrorCallout } from "@/components/ErrorCallout";
import { refreshDocumentSets, useDocumentSets } from "../hooks";
import { useConnectorStatus, useUserGroups } from "@/lib/hooks";
import { ThreeDotsLoader } from "@/components/Loading";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import { ADMIN_ROUTES } from "@/lib/admin-routes";
import CardSection from "@/components/admin/CardSection";
import { DocumentSetCreationForm } from "../DocumentSetCreationForm";
import { useRouter } from "next/navigation";
import { useVectorDbEnabled } from "@/providers/SettingsProvider";

const route = ADMIN_ROUTES.DOCUMENT_SETS;

function Main({ documentSetId }: { documentSetId: number }) {
  const router = useRouter();
  const vectorDbEnabled = useVectorDbEnabled();

  const {
    data: documentSets,
    isLoading: isDocumentSetsLoading,
    error: documentSetsError,
  } = useDocumentSets();

  const {
    data: ccPairs,
    isLoading: isCCPairsLoading,
    error: ccPairsError,
  } = useConnectorStatus(30000, vectorDbEnabled);

  // EE only
  const { data: userGroups, isLoading: userGroupsIsLoading } = useUserGroups();

  if (
    isDocumentSetsLoading ||
    (vectorDbEnabled && isCCPairsLoading) ||
    userGroupsIsLoading
  ) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <ThreeDotsLoader />
      </div>
    );
  }

  if (documentSetsError || !documentSets) {
    return (
      <ErrorCallout
        errorTitle="Impossible de récupérer les ensembles de documents"
        errorMsg={documentSetsError}
      />
    );
  }

  if (vectorDbEnabled && (ccPairsError || !ccPairs)) {
    return (
      <ErrorCallout
        errorTitle="Impossible de récupérer les connecteurs"
        errorMsg={ccPairsError}
      />
    );
  }

  const documentSet = documentSets.find(
    (documentSet) => documentSet.id === documentSetId
  );
  if (!documentSet) {
    return (
      <ErrorCallout
        errorTitle="Ensemble de documents introuvable"
        errorMsg={`Ensemble de documents avec l'id ${documentSetId} introuvable`}
      />
    );
  }

  return (
    <CardSection>
      <DocumentSetCreationForm
        ccPairs={ccPairs ?? []}
        userGroups={userGroups}
        onClose={() => {
          refreshDocumentSets();
          router.push("/admin/documents/sets");
        }}
        existingDocumentSet={documentSet}
      />
    </CardSection>
  );
}

export default function Page(props: {
  params: Promise<{ documentSetId: string }>;
}) {
  const params = use(props.params);
  const documentSetId = parseInt(params.documentSetId);

  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header
        icon={route.icon}
        title="Modifier l'ensemble de documents"
        separator
        backButton
      />
      <SettingsLayouts.Body>
        <Main documentSetId={documentSetId} />
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}
