"use client";

import { useState, useEffect, useMemo } from "react";
import { FieldArray, useFormikContext, ErrorMessage } from "formik";
import { DocumentSetSummary } from "@/lib/types";
import { toast } from "@/hooks/useToast";
import {
  Label,
  SelectorFormField,
  SubLabel,
  TextArrayField,
  TextFormField,
} from "@/components/Field";
import { Button } from "@opal/components";
import { MinimalPersonaSnapshot } from "@/app/admin/agents/interfaces";
import DocumentSetCard from "@/sections/cards/DocumentSetCard";
import CollapsibleSection from "@/app/admin/agents/CollapsibleSection";
import { StandardAnswerCategoryResponse } from "@/components/standardAnswers/getStandardAnswerCategoriesIfEE";
import { StandardAnswerCategoryDropdownField } from "@/components/standardAnswers/StandardAnswerCategoryDropdown";
import InputComboBox from "@/refresh-components/inputs/InputComboBox";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioGroupItemField } from "@/components/ui/RadioGroupItemField";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { SourceIcon } from "@/components/SourceIcon";
import Link from "next/link";
import AgentAvatar from "@/refresh-components/avatars/AgentAvatar";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Separator from "@/refresh-components/Separator";
import { CheckboxField } from "@/refresh-components/form/LabeledCheckboxField";

export interface SlackChannelConfigFormFieldsProps {
  isUpdate: boolean;
  isDefault: boolean;
  documentSets: DocumentSetSummary[];
  searchEnabledAgents: MinimalPersonaSnapshot[];
  nonSearchAgents: MinimalPersonaSnapshot[];
  standardAnswerCategoryResponse: StandardAnswerCategoryResponse;
  slack_bot_id: number;
  formikProps: any;
}

export function SlackChannelConfigFormFields({
  isUpdate,
  isDefault,
  documentSets,
  searchEnabledAgents,
  nonSearchAgents,
  standardAnswerCategoryResponse,
  slack_bot_id,
  formikProps,
}: SlackChannelConfigFormFieldsProps) {
  const router = useRouter();
  const { values, setFieldValue } = useFormikContext<any>();
  const [viewUnselectableSets, setViewUnselectableSets] = useState(false);
  const [viewSyncEnabledAgents, setViewSyncEnabledAgents] = useState(false);

  // Helper function to check if a document set contains sync connectors
  const documentSetContainsSync = (documentSet: DocumentSetSummary) => {
    return documentSet.cc_pair_summaries.some(
      (summary) => summary.access_type === "sync"
    );
  };

  // Helper function to check if a document set contains private connectors
  const documentSetContainsPrivate = (documentSet: DocumentSetSummary) => {
    return documentSet.cc_pair_summaries.some(
      (summary) => summary.access_type === "private"
    );
  };

  // Helper function to get cc_pair_summaries from DocumentSetSummary
  const getCcPairSummaries = (documentSet: DocumentSetSummary) => {
    return documentSet.cc_pair_summaries;
  };

  const [syncEnabledAgents, availableAgents] = useMemo(() => {
    const sync: MinimalPersonaSnapshot[] = [];
    const available: MinimalPersonaSnapshot[] = [];

    searchEnabledAgents.forEach((persona) => {
      const hasSyncSet = persona.document_sets.some(documentSetContainsSync);
      if (hasSyncSet) {
        sync.push(persona);
      } else {
        available.push(persona);
      }
    });

    return [sync, available];
  }, [searchEnabledAgents]);

  const unselectableSets = useMemo(() => {
    return documentSets.filter(documentSetContainsSync);
  }, [documentSets]);

  const memoizedPrivateConnectors = useMemo(() => {
    const uniqueDescriptors = new Map();
    documentSets.forEach((ds: DocumentSetSummary) => {
      const ccPairSummaries = getCcPairSummaries(ds);
      ccPairSummaries.forEach((summary: any) => {
        if (
          summary.access_type === "private" &&
          !uniqueDescriptors.has(summary.id)
        ) {
          uniqueDescriptors.set(summary.id, summary);
        }
      });
    });
    return Array.from(uniqueDescriptors.values());
  }, [documentSets]);

  const selectableSets = useMemo(() => {
    return documentSets.filter((ds) => !documentSetContainsSync(ds));
  }, [documentSets]);

  const searchAgentOptions = useMemo(
    () =>
      availableAgents.map((persona) => ({
        label: persona.name,
        value: String(persona.id),
      })),
    [availableAgents]
  );

  const nonSearchAgentOptions = useMemo(
    () =>
      nonSearchAgents.map((persona) => ({
        label: persona.name,
        value: String(persona.id),
      })),
    [nonSearchAgents]
  );

  useEffect(() => {
    const invalidSelected = values.document_sets.filter((dsId: number) =>
      unselectableSets.some((us) => us.id === dsId)
    );
    if (invalidSelected.length > 0) {
      setFieldValue(
        "document_sets",
        values.document_sets.filter(
          (dsId: number) => !invalidSelected.includes(dsId)
        )
      );
      toast.warning(
        "Nous avons supprimé un ou plusieurs ensembles de documents de votre sélection car ils ne sont plus valides. Veuillez vérifier et mettre à jour votre configuration."
      );
    }
  }, [unselectableSets, values.document_sets, setFieldValue]);

  const shouldShowPrivacyAlert = useMemo(() => {
    if (values.knowledge_source === "document_sets") {
      const selectedSets = documentSets.filter((ds) =>
        values.document_sets.includes(ds.id)
      );
      return selectedSets.some((ds) => documentSetContainsPrivate(ds));
    } else if (values.knowledge_source === "assistant") {
      const chosenAgent = searchEnabledAgents.find(
        (p) => p.id == values.persona_id
      );
      return chosenAgent?.document_sets.some((ds) =>
        documentSetContainsPrivate(ds)
      );
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.knowledge_source, values.document_sets, values.persona_id]);

  return (
    <>
      <div className="w-full">
        {isDefault && (
          <>
            <Badge variant="agent" className="bg-blue-100 text-blue-800">
              Configuration par défaut
            </Badge>
            <p className="mt-2 text-sm">
              Cette configuration par défaut s&apos;appliquera à tous les canaux et messages directs (DMs) de votre espace de travail Slack.
            </p>
            <div className="mt-4 p-4 bg-background rounded-md border border-neutral-300">
              <CheckboxField
                name="disabled"
                label="Désactiver la configuration par défaut"
                labelClassName="text-text"
              />
              <p className="mt-2 text-sm italic">
                Avertissement : désactiver la configuration par défaut signifie qu&apos;OnyxBot
                ne répondra pas dans les canaux Slack sauf s&apos;ils sont explicitement
                configurés. De plus, OnyxBot ne répondra pas aux DMs.
              </p>
            </div>
          </>
        )}
        {!isDefault && (
          <>
            <TextFormField
              name="channel_name"
              label="Nom du canal Slack"
              placeholder="Entrez le nom du canal (ex. : general, support)"
              subtext="Entrez le nom du canal Slack (sans le symbole #)"
            />
          </>
        )}
        <div className="space-y-2 mt-4">
          <Label>Source de connaissances</Label>
          <RadioGroup
            className="flex flex-col gap-y-4"
            value={values.knowledge_source}
            onValueChange={(value: string) => {
              setFieldValue("knowledge_source", value);
            }}
          >
            <RadioGroupItemField
              value="all_public"
              id="all_public"
              label="Toutes les connaissances publiques"
              sublabel="OnyxBot répond en se basant sur les informations de tous les connecteurs publics"
            />
            {selectableSets.length + unselectableSets.length > 0 && (
              <RadioGroupItemField
                value="document_sets"
                id="document_sets"
                label="Ensembles de documents spécifiques"
                sublabel="Contrôlez quels documents utiliser pour répondre aux questions"
              />
            )}
            <RadioGroupItemField
              value="assistant"
              id="assistant"
              label="Agent de recherche"
              sublabel="Contrôlez à la fois les documents et le prompt pour répondre aux questions"
            />
            <RadioGroupItemField
              value="non_search_agent"
              id="non_search_agent"
              label="Agent sans recherche"
              sublabel="Discutez avec un agent qui n'utilise pas de documents"
            />
          </RadioGroup>
        </div>
        {values.knowledge_source === "document_sets" &&
          documentSets.length > 0 && (
            <div className="mt-4">
              <SubLabel>
                <>
                  Sélectionnez les ensembles de documents qu&apos;OnyxBot utilisera pour répondre aux questions dans Slack.
                  <br />
                  {unselectableSets.length > 0 ? (
                    <span>
                      Certains ensembles de documents incompatibles sont{" "}
                      {viewUnselectableSets ? "visibles" : "masqués"}.{" "}
                      <button
                        type="button"
                        onClick={() =>
                          setViewUnselectableSets(
                            (viewUnselectableSets) => !viewUnselectableSets
                          )
                        }
                        className="text-sm text-action-link-05"
                      >
                        {viewUnselectableSets
                          ? "Masquer les non-sélectionnables "
                          : "Tout afficher "}
                        ensembles de documents
                      </button>
                    </span>
                  ) : (
                    ""
                  )}
                </>
              </SubLabel>
              <FieldArray
                name="document_sets"
                render={(arrayHelpers) => (
                  <>
                    {selectableSets.length > 0 && (
                      <div className="mb-3 mt-2 flex gap-2 flex-wrap text-sm">
                        {selectableSets.map((documentSet) => {
                          const selectedIndex = values.document_sets.indexOf(
                            documentSet.id
                          );
                          const isSelected = selectedIndex !== -1;

                          return (
                            <DocumentSetCard
                              key={documentSet.id}
                              documentSet={documentSet}
                              isSelected={isSelected}
                              onSelectToggle={(selected) => {
                                if (selected) arrayHelpers.push(documentSet.id);
                                else arrayHelpers.remove(selectedIndex);
                              }}
                            />
                          );
                        })}
                      </div>
                    )}

                    {viewUnselectableSets && unselectableSets.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-text-dark/80">
                          Ces ensembles de documents ne peuvent pas être attachés car ils contiennent des documents synchronisés automatiquement :
                        </p>
                        <div className="mb-3 mt-2 flex gap-2 flex-wrap text-sm">
                          {unselectableSets.map((documentSet) => (
                            <DocumentSetCard
                              key={documentSet.id}
                              documentSet={documentSet}
                              disabled
                              disabledTooltip="Impossible d'utiliser cet ensemble de documents car il contient un connecteur avec des permissions de synchronisation automatique. Les réponses d'OnyxBot dans ce canal sont visibles par tous les utilisateurs Slack, donc reproduire les permissions du demandeur pourrait exposer involontairement des informations privées."
                              isSelected={false}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <ErrorMessage
                      className="text-red-500 text-sm mt-1"
                      name="document_sets"
                      component="div"
                    />
                  </>
                )}
              />
            </div>
          )}
        {values.knowledge_source === "assistant" && (
          <div className="mt-4">
            <SubLabel>
              <>
                Sélectionnez l&apos;agent de recherche qu&apos;OnyxBot utilisera pour répondre aux questions dans Slack.
                {syncEnabledAgents.length > 0 && (
                  <>
                    <br />
                    <span className="text-sm text-text-dark/80">
                      Note : certains de vos agents ont des connecteurs synchronisés automatiquement dans leurs ensembles de documents. Vous ne pouvez pas sélectionner ces agents car ils ne pourront pas répondre aux questions dans Slack.{" "}
                      <button
                        type="button"
                        onClick={() =>
                          setViewSyncEnabledAgents(
                            (viewSyncEnabledAgents) => !viewSyncEnabledAgents
                          )
                        }
                        className="text-sm text-action-link-05"
                      >
                        {viewSyncEnabledAgents
                          ? "Masquer les non-sélectionnables "
                          : "Tout afficher "}
                        agents
                      </button>
                    </span>
                  </>
                )}
              </>
            </SubLabel>

            <InputComboBox
              placeholder="Rechercher un agent..."
              value={String(values.persona_id ?? "")}
              onValueChange={(val) =>
                setFieldValue("persona_id", val ? Number(val) : null)
              }
              options={searchAgentOptions}
              strict
            />
            {viewSyncEnabledAgents && syncEnabledAgents.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-text-dark/80">
                  Agents non sélectionnables :
                </p>
                <div className="mb-3 mt-2 flex gap-2 flex-wrap text-sm">
                  {syncEnabledAgents.map((persona: MinimalPersonaSnapshot) => (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/app/agents/edit/${persona.id}` as Route)
                      }
                      key={persona.id}
                      className="p-2 bg-background-100 cursor-pointer rounded-md flex items-center gap-2"
                    >
                      <AgentAvatar agent={persona} size={16} />
                      {persona.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {values.knowledge_source === "non_search_agent" && (
          <div className="mt-4">
            <SubLabel>
              <>
                Sélectionnez l&apos;agent sans recherche qu&apos;OnyxBot utilisera pour répondre aux questions dans Slack.
                {syncEnabledAgents.length > 0 && (
                  <>
                    <br />
                    <span className="text-sm text-text-dark/80">
                      Note : certains de vos agents ont des connecteurs synchronisés automatiquement dans leurs ensembles de documents. Vous ne pouvez pas sélectionner ces agents car ils ne pourront pas répondre aux questions dans Slack.{" "}
                      <button
                        type="button"
                        onClick={() =>
                          setViewSyncEnabledAgents(
                            (viewSyncEnabledAgents) => !viewSyncEnabledAgents
                          )
                        }
                        className="text-sm text-action-link-05"
                      >
                        {viewSyncEnabledAgents
                          ? "Masquer les non-sélectionnables "
                          : "Tout afficher "}
                        agents
                      </button>
                    </span>
                  </>
                )}
              </>
            </SubLabel>

            <InputComboBox
              placeholder="Rechercher un agent..."
              value={String(values.persona_id ?? "")}
              onValueChange={(val) =>
                setFieldValue("persona_id", val ? Number(val) : null)
              }
              options={nonSearchAgentOptions}
              strict
            />
          </div>
        )}
      </div>
      <Separator className="my-4" />
      <Accordion type="multiple" className="gap-y-2 w-full">
        {values.knowledge_source !== "non_search_agent" && (
          <AccordionItem value="search-options">
            <AccordionTrigger className="text-text">
              Configuration de la recherche
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pb-3">
                <div className="w-64">
                  <SelectorFormField
                    name="response_type"
                    label="Type de réponse"
                    tooltip="Contrôle le format des réponses d'OnyxBot."
                    options={[
                      { name: "Standard", value: "citations" },
                      { name: "Détaillé", value: "quotes" },
                    ]}
                  />
                </div>
                <CheckboxField
                  name="answer_validity_check_enabled"
                  label="Répondre uniquement si des citations sont trouvées"
                  tooltip="Si activé, répondra uniquement aux questions où le modèle produit des citations"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem className="mt-4" value="general-options">
          <AccordionTrigger>Configuration générale</AccordionTrigger>
          <AccordionContent className="overflow-visible">
            <div className="space-y-4">
              <CheckboxField
                name="show_continue_in_web_ui"
                label="Afficher le bouton Continuer dans l'interface Web"
                tooltip="Si activé, affiche un bouton en bas de la réponse permettant à l'utilisateur de continuer la conversation dans l'interface Web d'Onyx"
              />

              <CheckboxField
                name="still_need_help_enabled"
                onChange={(checked: boolean) => {
                  setFieldValue("still_need_help_enabled", checked);
                  if (!checked) {
                    setFieldValue("follow_up_tags", []);
                  }
                }}
                label={'Afficher un bouton "Encore besoin d\'aide ?"'}
                tooltip={`La réponse d'OnyxBot inclura un bouton en bas
                      demandant à l'utilisateur s'il a encore besoin d'aide.`}
              />
              {values.still_need_help_enabled && (
                <CollapsibleSection prompt="Configurer le bouton Encore besoin d'aide">
                  <TextArrayField
                    name="follow_up_tags"
                    label="(Optionnel) Utilisateurs / Groupes à mentionner"
                    values={values}
                    subtext={
                      <div>
                        Les utilisateurs / groupes Slack à mentionner si l&apos;utilisateur clique sur le bouton &quot;Encore besoin d&apos;aide ?&quot;. Si aucun email n&apos;est fourni, nous ne mentionnerons personne et réagirons simplement avec un emoji 🆘 au message original.
                      </div>
                    }
                    placeholder="Email d'utilisateur ou nom de groupe..."
                  />
                </CollapsibleSection>
              )}

              <CheckboxField
                name="questionmark_prefilter_enabled"
                label="Répondre uniquement aux questions"
                tooltip="Si activé, OnyxBot répondra uniquement aux messages contenant un point d'interrogation"
              />
              <CheckboxField
                name="respond_tag_only"
                label="Répondre uniquement à @OnyxBot"
                tooltip="Si activé, OnyxBot répondra uniquement lorsqu'il est directement mentionné"
              />
              <CheckboxField
                name="respond_to_bots"
                label="Répondre aux messages des bots"
                tooltip="Si désactivé, OnyxBot ignorera toujours les messages provenant des bots"
              />
              <CheckboxField
                name="is_ephemeral"
                label="Répondre à l'utilisateur en message privé (éphémère)"
                tooltip="Si activé, OnyxBot répondra uniquement à l'utilisateur en message privé (éphémère). Si vous avez également choisi l'agent 'Recherche' ci-dessus, cette option rendra les documents privés de l'utilisateur disponibles pour ses requêtes."
              />

              <TextArrayField
                name="respond_member_group_list"
                label="(Optionnel) Répondre à certains utilisateurs / groupes"
                subtext={
                  "Si spécifié, les réponses d'OnyxBot ne seront visibles " +
                  "que par les membres ou groupes de cette liste."
                }
                values={values}
                placeholder="Email d'utilisateur ou nom de groupe..."
              />

              <StandardAnswerCategoryDropdownField
                standardAnswerCategoryResponse={standardAnswerCategoryResponse}
                categories={values.standard_answer_categories}
                setCategories={(categories: any) =>
                  setFieldValue("standard_answer_categories", categories)
                }
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex mt-8 gap-x-2 w-full justify-end">
        {shouldShowPrivacyAlert && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex hover:bg-background-150 cursor-pointer p-2 rounded-lg items-center">
                  <AlertCircle className="h-5 w-5 text-alert" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-background p-4 w-80">
                <Label className="text-text mb-2 font-semibold">
                  Alerte de confidentialité
                </Label>
                <p className="text-sm text-text-darker mb-4">
                  Veuillez noter que si la réponse privée (éphémère) n&apos;est *pas sélectionnée*, seuls les documents publics des ensembles sélectionnés seront accessibles. Si la réponse privée (éphémère) *est sélectionnée*, les requêtes peuvent également utiliser les documents auxquels l&apos;utilisateur a déjà accès. Les utilisateurs pourront partager la réponse dans le canal — assurez-vous que cela est conforme aux politiques de partage de votre entreprise.
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm text-text font-medium">
                    Connecteurs concernés :
                  </h4>
                  <div className="max-h-40 overflow-y-auto border-t border-text-subtle flex-col gap-y-2">
                    {memoizedPrivateConnectors.map((ccpairinfo: any) => (
                      <Link
                        key={ccpairinfo.id}
                        href={`/admin/connector/${ccpairinfo.id}`}
                        className="flex items-center p-2 rounded-md hover:bg-background-100 transition-colors"
                      >
                        <div className="mr-2">
                          <SourceIcon
                            iconSize={16}
                            sourceType={ccpairinfo.source}
                          />
                        </div>
                        <span className="text-sm text-text-darker font-medium">
                          {ccpairinfo.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Button type="submit">{isUpdate ? "Mettre à jour" : "Créer"}</Button>
        <Button prominence="secondary" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </>
  );
}
