import { runConnector } from "@/lib/connector";
import { ValidSources } from "@/lib/types";
import { mutate } from "swr";

export function buildCCPairInfoUrl(ccPairId: string | number) {
  return `/api/manage/admin/cc-pair/${ccPairId}`;
}

export function buildSimilarCredentialInfoURL(
  source_type: ValidSources,
  get_editable: boolean = false
) {
  const base = `/api/manage/admin/similar-credentials/${source_type}`;
  return get_editable ? `${base}?get_editable=True` : base;
}

export async function triggerIndexing(
  fromBeginning: boolean,
  connectorId: number,
  credentialId: number,
  ccPairId: number
): Promise<{ success: boolean; message: string }> {
  const errorMsg = await runConnector(
    connectorId,
    [credentialId],
    fromBeginning
  );

  mutate(buildCCPairInfoUrl(ccPairId));

  if (errorMsg) {
    return {
      success: false,
      message: errorMsg,
    };
  } else {
    return {
      success: true,
      message: "Exécution du connecteur déclenchée",
    };
  }
}

export function getTooltipMessage(
  isInvalid: boolean,
  isDeleting: boolean,
  isIndexing: boolean,
  isDisabled: boolean
): string | undefined {
  if (isInvalid) {
    return "Le connecteur est dans un état invalide. Veuillez mettre à jour les identifiants ou la configuration avant de réindexer.";
  }
  if (isDeleting) {
    return "Impossible d'indexer pendant la suppression du connecteur";
  }
  if (isIndexing) {
    return "L'indexation est déjà en cours";
  }
  if (isDisabled) {
    return "Le connecteur doit être réactivé avant l'indexation";
  }
  return undefined;
}
