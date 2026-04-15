"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import * as GeneralLayouts from "@/layouts/general-layouts";
import Button from "@/refresh-components/buttons/Button";
import { Button as OpalButton } from "@opal/components";
import { Hoverable } from "@opal/core";
import { FullPersona } from "@/app/admin/agents/interfaces";
import { buildImgUrl } from "@/app/app/components/files/images/utils";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import InputTypeInField from "@/refresh-components/form/InputTypeInField";
import InputTextAreaField from "@/refresh-components/form/InputTextAreaField";
import InputTypeInElementField from "@/refresh-components/form/InputTypeInElementField";
import InputDatePickerField from "@/refresh-components/form/InputDatePickerField";
import Message from "@/refresh-components/messages/Message";
import Separator from "@/refresh-components/Separator";
import * as InputLayouts from "@/layouts/input-layouts";
import { useFormikContext } from "formik";
import LLMSelector from "@/components/llm/LLMSelector";
import { parseLlmDescriptor, structureValue } from "@/lib/llmConfig/utils";
import { useLLMProviders } from "@/hooks/useLLMProviders";
import {
  STARTER_MESSAGES_EXAMPLES,
  MAX_CHARACTERS_STARTER_MESSAGE,
  MAX_CHARACTERS_AGENT_DESCRIPTION,
} from "@/lib/constants";
import {
  IMAGE_GENERATION_TOOL_ID,
  WEB_SEARCH_TOOL_ID,
  PYTHON_TOOL_ID,
  SEARCH_TOOL_ID,
  OPEN_URL_TOOL_ID,
} from "@/app/app/components/tools/constants";
import Text from "@/refresh-components/texts/Text";
import { Card } from "@/refresh-components/cards";
import SimpleCollapsible from "@/refresh-components/SimpleCollapsible";
import SwitchField from "@/refresh-components/form/SwitchField";
import SimpleTooltip from "@/refresh-components/SimpleTooltip";
import { useDocumentSets } from "@/app/admin/documents/sets/hooks";
import { useProjectsContext } from "@/providers/ProjectsContext";
import { useCreateModal } from "@/refresh-components/contexts/ModalContext";
import { toast } from "@/hooks/useToast";
import UserFilesModal from "@/components/modals/UserFilesModal";
import {
  ProjectFile,
  UserFileStatus,
} from "@/app/app/projects/projectsService";
import Popover, { PopoverMenu } from "@/refresh-components/Popover";
import LineItem from "@/refresh-components/buttons/LineItem";
import {
  SvgActions,
  SvgExpand,
  SvgFold,
  SvgImage,
  SvgLock,
  SvgOnyxOctagon,
  SvgSliders,
  SvgUsers,
  SvgTrash,
} from "@opal/icons";
import CustomAgentAvatar, {
  agentAvatarIconMap,
} from "@/refresh-components/avatars/CustomAgentAvatar";
import InputAvatar from "@/refresh-components/inputs/InputAvatar";
import SquareButton from "@/refresh-components/buttons/SquareButton";
import { useAgents } from "@/hooks/useAgents";
import {
  createPersona,
  updatePersona,
  PersonaUpsertParameters,
} from "@/app/admin/agents/lib";
import useMcpServersForAgentEditor from "@/hooks/useMcpServersForAgentEditor";
import useOpenApiTools from "@/hooks/useOpenApiTools";
import { useAvailableTools } from "@/hooks/useAvailableTools";
import * as ActionsLayouts from "@/layouts/actions-layouts";
import * as ExpandableCard from "@/layouts/expandable-card-layouts";
import { getActionIcon } from "@/lib/tools/mcpUtils";
import { MCPServer, MCPTool, ToolSnapshot } from "@/lib/tools/interfaces";
import InputTypeIn from "@/refresh-components/inputs/InputTypeIn";
import useFilter from "@/hooks/useFilter";
import EnabledCount from "@/refresh-components/EnabledCount";
import { useAppRouter } from "@/hooks/appNavigation";
import { isDateInFuture } from "@/lib/dateUtils";
import {
  deleteAgent,
  updateAgentFeaturedStatus,
  updateAgentSharedStatus,
} from "@/lib/agents";
import ConfirmationModalLayout from "@/refresh-components/layouts/ConfirmationModalLayout";
import ShareAgentModal from "@/sections/modals/ShareAgentModal";
import AgentKnowledgePane from "@/sections/knowledge/AgentKnowledgePane";
import { ValidSources } from "@/lib/types";
import { useVectorDbEnabled } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import SimpleLoader from "@/refresh-components/loaders/SimpleLoader";
import { usePaidEnterpriseFeaturesEnabled } from "@/components/settings/usePaidEnterpriseFeaturesEnabled";

interface AgentIconEditorProps {
  existingAgent?: FullPersona | null;
}

function FormWarningsEffect() {
  const { values, setStatus } = useFormikContext<{
    web_search: boolean;
    open_url: boolean;
  }>();

  useEffect(() => {
    const warnings: Record<string, string> = {};
    if (values.web_search && !values.open_url) {
      warnings.open_url =
        "La recherche web sans la possibilité d'ouvrir des URLs peut conduire à des résultats web significativement moins bons.";
    }
    setStatus({ warnings });
  }, [values.web_search, values.open_url, setStatus]);

  return null;
}

function AgentIconEditor({ existingAgent }: AgentIconEditorProps) {
  const { values, setFieldValue } = useFormikContext<{
    name: string;
    icon_name: string | null;
    uploaded_image_id: string | null;
    remove_image: boolean | null;
  }>();
  const [uploadedImagePreview, setUploadedImagePreview] = useState<
    string | null
  >(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous preview to free memory
    setUploadedImagePreview(null);

    // Clear selected icon and remove_image flag when uploading an image
    setFieldValue("icon_name", null);
    setFieldValue("remove_image", false);

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/persona/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Failed to upload image");
        setUploadedImagePreview(null);
        return;
      }

      const { file_id } = await response.json();
      setFieldValue("uploaded_image_id", file_id);
      setPopoverOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadedImagePreview(null);
    }
  }

  const imageSrc = uploadedImagePreview
    ? uploadedImagePreview
    : values.uploaded_image_id
      ? buildImgUrl(values.uploaded_image_id)
      : values.icon_name
        ? undefined
        : values.remove_image
          ? undefined
          : existingAgent?.uploaded_image_id
            ? buildImgUrl(existingAgent.uploaded_image_id)
            : undefined;

  function handleIconClick(iconName: string | null) {
    setFieldValue("icon_name", iconName);
    setFieldValue("uploaded_image_id", null);
    setFieldValue("remove_image", true);
    setUploadedImagePreview(null);
    setPopoverOpen(false);

    // Reset the file input so the same file can be uploaded again later
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Popover.Trigger asChild>
          <Hoverable.Root group="inputAvatar" widthVariant="fit">
            <InputAvatar className="relative flex flex-col items-center justify-center h-[7.5rem] w-[7.5rem]">
              {/* We take the `InputAvatar`'s height/width (in REM) and multiply it by 16 (the REM -> px conversion factor). */}
              <CustomAgentAvatar
                size={imageSrc ? 7.5 * 16 : 40}
                src={imageSrc}
                iconName={values.icon_name ?? undefined}
                name={values.name}
              />
              {/* TODO(@raunakab): migrate to opal Button once className/iconClassName is resolved */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-2">
                <Hoverable.Item group="inputAvatar" variant="opacity-on-hover">
                  <Button className="h-[1.75rem]" secondary>
                    Modifier
                  </Button>
                </Hoverable.Item>
              </div>
            </InputAvatar>
          </Hoverable.Root>
        </Popover.Trigger>
        <Popover.Content>
          <PopoverMenu>
            {[
              <LineItem
                key="upload-image"
                icon={SvgImage}
                onClick={() => fileInputRef.current?.click()}
                emphasized
              >
                Télécharger une image
              </LineItem>,
              null,
              <div className="grid grid-cols-4 gap-1">
                <SquareButton
                  key="default-icon"
                  icon={() => (
                    <CustomAgentAvatar name={values.name} size={30} />
                  )}
                  onClick={() => handleIconClick(null)}
                  transient={!imageSrc && values.icon_name === null}
                />
                {Object.keys(agentAvatarIconMap).map((iconName) => (
                  <SquareButton
                    key={iconName}
                    onClick={() => handleIconClick(iconName)}
                    icon={() => (
                      <CustomAgentAvatar iconName={iconName} size={30} />
                    )}
                    transient={values.icon_name === iconName}
                  />
                ))}
              </div>,
            ]}
          </PopoverMenu>
        </Popover.Content>
      </Popover>
    </>
  );
}

interface OpenApiToolCardProps {
  tool: ToolSnapshot;
}

function OpenApiToolCard({ tool }: OpenApiToolCardProps) {
  const toolFieldName = `openapi_tool_${tool.id}`;

  return (
    <ExpandableCard.Root defaultFolded>
      <ActionsLayouts.Header
        title={tool.display_name || tool.name}
        description={tool.description}
        icon={SvgActions}
        rightChildren={<SwitchField name={toolFieldName} />}
      />
    </ExpandableCard.Root>
  );
}

interface MCPServerCardProps {
  server: MCPServer;
  tools: MCPTool[];
  isLoading: boolean;
}

function MCPServerCard({
  server,
  tools: enabledTools,
  isLoading,
}: MCPServerCardProps) {
  const [isFolded, setIsFolded] = useState(false);
  const { values, setFieldValue, getFieldMeta } = useFormikContext<any>();
  const serverFieldName = `mcp_server_${server.id}`;
  const isServerEnabled = values[serverFieldName]?.enabled ?? false;
  const {
    query,
    setQuery,
    filtered: filteredTools,
  } = useFilter(enabledTools, (tool) => `${tool.name} ${tool.description}`);

  // Calculate enabled and total tool counts
  const enabledCount = enabledTools.filter((tool) => {
    const toolFieldValue = values[serverFieldName]?.[`tool_${tool.id}`];
    return toolFieldValue === true;
  }).length;

  return (
    <ExpandableCard.Root isFolded={isFolded} onFoldedChange={setIsFolded}>
      <ActionsLayouts.Header
        title={server.name}
        description={server.description}
        icon={getActionIcon(server.server_url, server.name)}
        rightChildren={
          <GeneralLayouts.Section
            flexDirection="row"
            gap={0.5}
            alignItems="start"
          >
            <EnabledCount
              enabledCount={enabledCount}
              totalCount={enabledTools.length}
            />
            <SwitchField
              name={`${serverFieldName}.enabled`}
              onCheckedChange={(checked) => {
                enabledTools.forEach((tool) => {
                  setFieldValue(`${serverFieldName}.tool_${tool.id}`, checked);
                });
                if (!checked) return;
                setIsFolded(false);
              }}
            />
          </GeneralLayouts.Section>
        }
      >
        <GeneralLayouts.Section flexDirection="row" gap={0.5}>
          <InputTypeIn
            placeholder="Rechercher des outils..."
            variant="internal"
            leftSearchIcon
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {enabledTools.length > 0 && (
            <OpalButton
              prominence="internal"
              rightIcon={isFolded ? SvgExpand : SvgFold}
              onClick={() => setIsFolded((prev) => !prev)}
            >
              {isFolded ? "Développer" : "Réduire"}
            </OpalButton>
          )}
        </GeneralLayouts.Section>
      </ActionsLayouts.Header>
      {isLoading ? (
        <ActionsLayouts.Content>
          <GeneralLayouts.Section padding={1}>
            <SimpleLoader />
          </GeneralLayouts.Section>
        </ActionsLayouts.Content>
      ) : (
        enabledTools.length > 0 &&
        filteredTools.length > 0 && (
          <ActionsLayouts.Content>
            {filteredTools.map((tool) => (
              <ActionsLayouts.Tool
                key={tool.id}
                name={`${serverFieldName}.tool_${tool.id}`}
                title={tool.name}
                description={tool.description}
                icon={tool.icon ?? SvgSliders}
                disabled={
                  !tool.isAvailable ||
                  !getFieldMeta<boolean>(`${serverFieldName}.enabled`).value
                }
                rightChildren={
                  <SwitchField
                    name={`${serverFieldName}.tool_${tool.id}`}
                    disabled={!isServerEnabled}
                  />
                }
              />
            ))}
          </ActionsLayouts.Content>
        )
      )}
    </ExpandableCard.Root>
  );
}

function StarterMessages() {
  const max_starters = STARTER_MESSAGES_EXAMPLES.length;

  const { values } = useFormikContext<{
    starter_messages: string[];
  }>();

  const starters = values.starter_messages || [];

  // Count how many non-empty starters we have
  const filledStarters = starters.filter((s) => s).length;
  const canAddMore = filledStarters < max_starters;

  // Show at least 1, or all filled ones, or filled + 1 empty (up to max)
  const visibleCount = Math.min(
    max_starters,
    Math.max(
      1,
      filledStarters === 0 ? 1 : filledStarters + (canAddMore ? 1 : 0)
    )
  );

  return (
    <FieldArray name="starter_messages">
      {(arrayHelpers) => (
        <GeneralLayouts.Section gap={0.5}>
          {Array.from({ length: visibleCount }, (_, i) => (
            <InputTypeInElementField
              key={`starter_messages.${i}`}
              name={`starter_messages.${i}`}
              placeholder={
                STARTER_MESSAGES_EXAMPLES[i] ||
                "Saisir un début de conversation..."
              }
              onRemove={() => arrayHelpers.remove(i)}
            />
          ))}
        </GeneralLayouts.Section>
      )}
    </FieldArray>
  );
}

export interface AgentEditorPageProps {
  agent?: FullPersona;
  refreshAgent?: () => void;
}

export default function AgentEditorPage({
  agent: existingAgent,
  refreshAgent,
}: AgentEditorPageProps) {
  const router = useRouter();
  const appRouter = useAppRouter();
  const { refresh: refreshAgents } = useAgents();
  const shareAgentModal = useCreateModal();
  const deleteAgentModal = useCreateModal();
  const { isAdmin, isCurator } = useUser();
  const canUpdateFeaturedStatus = isAdmin || isCurator;
  const vectorDbEnabled = useVectorDbEnabled();
  const isPaidEnterpriseFeaturesEnabled = usePaidEnterpriseFeaturesEnabled();

  // LLM Model Selection
  const getCurrentLlm = useCallback(
    (values: any, llmProviders: any) =>
      values.llm_model_version_override && values.llm_model_provider_override
        ? (() => {
            const provider = llmProviders?.find(
              (p: any) => p.name === values.llm_model_provider_override
            );
            return structureValue(
              values.llm_model_provider_override,
              provider?.provider || "",
              values.llm_model_version_override
            );
          })()
        : null,
    []
  );

  const onLlmSelect = useCallback(
    (selected: string | null, setFieldValue: any) => {
      if (selected === null) {
        setFieldValue("llm_model_version_override", null);
        setFieldValue("llm_model_provider_override", null);
      } else {
        const { modelName, name } = parseLlmDescriptor(selected);
        if (modelName && name) {
          setFieldValue("llm_model_version_override", modelName);
          setFieldValue("llm_model_provider_override", name);
        }
      }
    },
    []
  );

  // Hooks for Knowledge section
  const { allRecentFiles, beginUpload } = useProjectsContext();
  const { data: documentSets } = useDocumentSets();
  const userFilesModal = useCreateModal();
  const [presentingDocument, setPresentingDocument] = useState<{
    document_id: string;
    semantic_identifier: string;
  } | null>(null);

  const { mcpData, isLoading: isMcpLoading } = useMcpServersForAgentEditor();
  const { openApiTools: openApiToolsRaw, isLoading: isOpenApiLoading } =
    useOpenApiTools();
  const { llmProviders } = useLLMProviders(existingAgent?.id);
  const mcpServers = mcpData?.mcp_servers ?? [];
  const openApiTools = openApiToolsRaw ?? [];

  // Check if the *BUILT-IN* tools are available.
  // The built-in tools are:
  // - image-gen
  // - web-search
  // - code-interpreter
  const { tools: availableTools, isLoading: isToolsLoading } =
    useAvailableTools();
  const searchTool = availableTools?.find(
    (t) => t.in_code_tool_id === SEARCH_TOOL_ID
  );
  const imageGenTool = availableTools?.find(
    (t) => t.in_code_tool_id === IMAGE_GENERATION_TOOL_ID
  );
  const webSearchTool = availableTools?.find(
    (t) => t.in_code_tool_id === WEB_SEARCH_TOOL_ID
  );
  const openURLTool = availableTools?.find(
    (t) => t.in_code_tool_id === OPEN_URL_TOOL_ID
  );
  const codeInterpreterTool = availableTools?.find(
    (t) => t.in_code_tool_id === PYTHON_TOOL_ID
  );
  const isImageGenerationAvailable = !!imageGenTool;
  const imageGenerationDisabledTooltip = isImageGenerationAvailable
    ? undefined
    : "La génération d'images nécessite un modèle configuré. Si vous y avez accès, configurez-en un dans Paramètres > Génération d'images, ou contactez un administrateur.";

  // Group MCP server tools from availableTools by server ID
  const mcpServersWithTools = mcpServers.map((server) => {
    const serverTools: MCPTool[] = (availableTools || [])
      .filter((tool) => tool.mcp_server_id === server.id)
      .map((tool) => ({
        id: tool.id.toString(),
        icon: getActionIcon(server.server_url, server.name),
        name: tool.display_name || tool.name,
        description: tool.description,
        isAvailable: true,
        isEnabled: tool.enabled,
      }));

    return { server, tools: serverTools, isLoading: false };
  });

  const initialValues = {
    // General
    icon_name: existingAgent?.icon_name ?? null,
    uploaded_image_id: existingAgent?.uploaded_image_id ?? null,
    remove_image: false,
    name: existingAgent?.name ?? "",
    description: existingAgent?.description ?? "",

    // Prompts
    instructions: existingAgent?.system_prompt ?? "",
    starter_messages: Array.from(
      { length: STARTER_MESSAGES_EXAMPLES.length },
      (_, i) => existingAgent?.starter_messages?.[i]?.message ?? ""
    ),

    // Knowledge - enabled if agent has any knowledge sources attached
    enable_knowledge:
      (existingAgent?.document_sets?.length ?? 0) > 0 ||
      (existingAgent?.hierarchy_nodes?.length ?? 0) > 0 ||
      (existingAgent?.attached_documents?.length ?? 0) > 0 ||
      (existingAgent?.user_file_ids?.length ?? 0) > 0,
    document_set_ids: existingAgent?.document_sets?.map((ds) => ds.id) ?? [],
    // Individual document IDs from hierarchy browsing
    document_ids: existingAgent?.attached_documents?.map((doc) => doc.id) ?? [],
    // Hierarchy node IDs (folders/spaces/channels) for scoped search
    hierarchy_node_ids:
      existingAgent?.hierarchy_nodes?.map((node) => node.id) ?? [],
    user_file_ids: existingAgent?.user_file_ids ?? [],
    // Selected sources for the new knowledge UI - derived from document sets
    selected_sources: [] as ValidSources[],

    // Advanced
    llm_model_provider_override:
      existingAgent?.llm_model_provider_override ?? null,
    llm_model_version_override:
      existingAgent?.llm_model_version_override ?? null,
    knowledge_cutoff_date: existingAgent?.search_start_date
      ? new Date(existingAgent.search_start_date)
      : null,
    replace_base_system_prompt:
      existingAgent?.replace_base_system_prompt ?? false,
    reminders: existingAgent?.task_prompt ?? "",
    // For new agents, default to false for optional tools to avoid
    // "Tool not available" errors when the tool isn't configured.
    // For existing agents, preserve the current tool configuration.
    image_generation:
      !!imageGenTool &&
      (existingAgent?.tools?.some(
        (tool) => tool.in_code_tool_id === IMAGE_GENERATION_TOOL_ID
      ) ??
        false),
    web_search:
      !!webSearchTool &&
      (existingAgent?.tools?.some(
        (tool) => tool.in_code_tool_id === WEB_SEARCH_TOOL_ID
      ) ??
        false),
    open_url:
      !!openURLTool &&
      (existingAgent?.tools?.some(
        (tool) => tool.in_code_tool_id === OPEN_URL_TOOL_ID
      ) ??
        false),
    code_interpreter:
      !!codeInterpreterTool &&
      (existingAgent?.tools?.some(
        (tool) => tool.in_code_tool_id === PYTHON_TOOL_ID
      ) ??
        false),
    // MCP servers - dynamically add fields for each server with nested tool fields
    ...Object.fromEntries(
      mcpServersWithTools.map(({ server, tools }) => {
        // Find all tools from existingAgent that belong to this MCP server
        const serverToolsFromAgent =
          existingAgent?.tools?.filter(
            (tool) => tool.mcp_server_id === server.id
          ) ?? [];

        // Build the tool field object with tool_{id} for ALL available tools
        const toolFields: Record<string, boolean> = {};
        tools.forEach((tool) => {
          // Set to true if this tool was enabled in existingAgent, false otherwise
          toolFields[`tool_${tool.id}`] = serverToolsFromAgent.some(
            (t) => t.id === Number(tool.id)
          );
        });

        return [
          `mcp_server_${server.id}`,
          {
            enabled: serverToolsFromAgent.length > 0, // Server is enabled if it has any tools
            ...toolFields, // Add individual tool states for ALL tools
          },
        ];
      })
    ),

    // OpenAPI tools - add a boolean field for each tool
    ...Object.fromEntries(
      openApiTools.map((openApiTool) => [
        `openapi_tool_${openApiTool.id}`,
        existingAgent?.tools?.some((t) => t.id === openApiTool.id) ?? false,
      ])
    ),

    // Sharing
    shared_user_ids: existingAgent?.users?.map((user) => user.id) ?? [],
    shared_group_ids: existingAgent?.groups ?? [],
    is_public: existingAgent?.is_public ?? false,
    label_ids: existingAgent?.labels?.map((l) => l.id) ?? [],
    is_featured: existingAgent?.is_featured ?? false,
  };

  const validationSchema = Yup.object().shape({
    // General
    icon_name: Yup.string().nullable(),
    remove_image: Yup.boolean().optional(),
    uploaded_image_id: Yup.string().nullable(),
    name: Yup.string().required("Le nom de l'agent est requis."),
    description: Yup.string()
      .max(
        MAX_CHARACTERS_AGENT_DESCRIPTION,
        `La description doit contenir ${MAX_CHARACTERS_AGENT_DESCRIPTION} caractères ou moins`
      )
      .optional(),

    // Prompts
    instructions: Yup.string().optional(),
    starter_messages: Yup.array().of(
      Yup.string().max(
        MAX_CHARACTERS_STARTER_MESSAGE,
        `Le début de conversation doit contenir ${MAX_CHARACTERS_STARTER_MESSAGE} caractères ou moins`
      )
    ),

    // Knowledge
    enable_knowledge: Yup.boolean(),
    document_set_ids: Yup.array().of(Yup.number()),
    document_ids: Yup.array().of(Yup.string()),
    hierarchy_node_ids: Yup.array().of(Yup.number()),
    user_file_ids: Yup.array().of(Yup.string()),
    selected_sources: Yup.array().of(Yup.string()),

    // Advanced
    llm_model_provider_override: Yup.string().nullable().optional(),
    llm_model_version_override: Yup.string().nullable().optional(),
    knowledge_cutoff_date: Yup.date()
      .nullable()
      .optional()
      .test(
        "knowledge-cutoff-date-not-in-future",
        "La date limite de connaissance doit être aujourd'hui ou antérieure.",
        (value) => !value || !isDateInFuture(value)
      ),
    replace_base_system_prompt: Yup.boolean(),
    reminders: Yup.string().optional(),

    // MCP servers - dynamically add validation for each server with nested tool validation
    ...Object.fromEntries(
      mcpServers.map((server) => [
        `mcp_server_${server.id}`,
        Yup.object(), // Allow any nested tool fields as booleans
      ])
    ),

    // OpenAPI tools - add boolean validation for each tool
    ...Object.fromEntries(
      openApiTools.map((openApiTool) => [
        `openapi_tool_${openApiTool.id}`,
        Yup.boolean(),
      ])
    ),
  });

  async function handleSubmit(values: typeof initialValues) {
    try {
      // Map conversation starters
      const starterMessages = values.starter_messages
        .filter((message: string) => message.trim() !== "")
        .map((message: string) => ({
          message: message,
          name: message,
        }));

      // Send null instead of empty array if no starter messages
      const finalStarterMessages =
        starterMessages.length > 0 ? starterMessages : null;

      // Always look up tools in availableTools to ensure we can find all tools

      const toolIds = [];
      if (values.enable_knowledge) {
        if (vectorDbEnabled && searchTool) {
          toolIds.push(searchTool.id);
        }
      }
      if (values.image_generation && imageGenTool) {
        toolIds.push(imageGenTool.id);
      }
      if (values.web_search && webSearchTool) {
        toolIds.push(webSearchTool.id);
      }
      if (values.open_url && openURLTool) {
        toolIds.push(openURLTool.id);
      }
      if (values.code_interpreter && codeInterpreterTool) {
        toolIds.push(codeInterpreterTool.id);
      }

      // Collect enabled MCP tool IDs
      mcpServers.forEach((server) => {
        const serverFieldName = `mcp_server_${server.id}`;
        const serverData = (values as any)[serverFieldName];

        if (
          serverData &&
          typeof serverData === "object" &&
          serverData.enabled
        ) {
          // Server is enabled, collect all enabled tools
          Object.keys(serverData).forEach((key) => {
            if (key.startsWith("tool_") && serverData[key] === true) {
              // Extract tool ID from key (e.g., "tool_123" -> 123)
              const toolId = parseInt(key.replace("tool_", ""), 10);
              if (!isNaN(toolId)) {
                toolIds.push(toolId);
              }
            }
          });
        }
      });

      // Collect enabled OpenAPI tool IDs
      openApiTools.forEach((openApiTool) => {
        const toolFieldName = `openapi_tool_${openApiTool.id}`;
        if ((values as any)[toolFieldName] === true) {
          toolIds.push(openApiTool.id);
        }
      });

      // Build submission data
      const submissionData: PersonaUpsertParameters = {
        name: values.name,
        description: values.description,
        document_set_ids: values.enable_knowledge
          ? values.document_set_ids
          : [],
        is_public: values.is_public,
        llm_model_provider_override: values.llm_model_provider_override || null,
        llm_model_version_override: values.llm_model_version_override || null,
        starter_messages: finalStarterMessages,
        users: values.shared_user_ids,
        groups: values.shared_group_ids,
        tool_ids: toolIds,
        // uploaded_image: null, // Already uploaded separately
        remove_image: values.remove_image ?? false,
        uploaded_image_id: values.uploaded_image_id,
        icon_name: values.icon_name,
        search_start_date: values.knowledge_cutoff_date || null,
        label_ids: values.label_ids,
        is_featured: values.is_featured,
        // display_priority: ...,

        user_file_ids: values.enable_knowledge ? values.user_file_ids : [],
        hierarchy_node_ids: values.enable_knowledge
          ? values.hierarchy_node_ids
          : [],
        document_ids: values.enable_knowledge ? values.document_ids : [],

        system_prompt: values.instructions,
        replace_base_system_prompt: values.replace_base_system_prompt,
        task_prompt: values.reminders || "",
        datetime_aware: false,
      };

      // Call API
      let personaResponse;
      if (!!existingAgent) {
        personaResponse = await updatePersona(existingAgent.id, submissionData);
      } else {
        personaResponse = await createPersona(submissionData);
      }

      // Handle response
      if (!personaResponse || !personaResponse.ok) {
        const error = personaResponse
          ? await personaResponse.text()
          : "Aucune réponse reçue";
        toast.error(
          `Échec de la ${existingAgent ? "mise à jour" : "création"} de l'agent - ${error}`
        );
        return;
      }

      // Success
      const agent = await personaResponse.json();
      toast.success(
        `Agent "${agent.name}" ${
          existingAgent ? "mis à jour" : "créé"
        } avec succès`
      );

      // Refresh agents list and the specific agent
      await refreshAgents();
      if (refreshAgent) {
        refreshAgent();
      }

      // Immediately start a chat with this agent.
      appRouter({ agentId: agent.id });
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(`Une erreur est survenue : ${error}`);
    }
  }

  // Delete agent handler
  async function handleDeleteAgent() {
    if (!existingAgent) return;

    const error = await deleteAgent(existingAgent.id);

    if (error) {
      toast.error(`Échec de la suppression de l'agent : ${error}`);
    } else {
      toast.success("Agent supprimé avec succès");

      deleteAgentModal.toggle(false);
      await refreshAgents();
      router.push("/app/agents");
    }
  }

  // FilePickerPopover callbacks for Knowledge section
  function handlePickRecentFile(
    file: ProjectFile,
    currentFileIds: string[],
    setFieldValue: (field: string, value: unknown) => void
  ) {
    if (!currentFileIds.includes(file.id)) {
      setFieldValue("user_file_ids", [...currentFileIds, file.id]);
    }
  }

  function handleUnpickRecentFile(
    file: ProjectFile,
    currentFileIds: string[],
    setFieldValue: (field: string, value: unknown) => void
  ) {
    setFieldValue(
      "user_file_ids",
      currentFileIds.filter((id) => id !== file.id)
    );
  }

  function handleFileClick(file: ProjectFile) {
    setPresentingDocument({
      document_id: `project_file__${file.file_id}`,
      semantic_identifier: file.name,
    });
  }

  async function handleUploadChange(
    e: React.ChangeEvent<HTMLInputElement>,
    currentFileIds: string[],
    setFieldValue: (field: string, value: unknown) => void
  ) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      let selectedIds = [...(currentFileIds || [])];
      const optimistic = await beginUpload(
        Array.from(files),
        null,
        (result) => {
          const uploadedFiles = result.user_files || [];
          if (uploadedFiles.length === 0) return;
          const tempToFinal = new Map(
            uploadedFiles
              .filter((f) => f.temp_id)
              .map((f) => [f.temp_id as string, f.id])
          );
          const replaced = (selectedIds || []).map(
            (id: string) => tempToFinal.get(id) ?? id
          );
          selectedIds = replaced;
          setFieldValue("user_file_ids", replaced);
        }
      );
      if (optimistic) {
        const optimisticIds = optimistic.map((f) => f.id);
        selectedIds = [...selectedIds, ...optimisticIds];
        setFieldValue("user_file_ids", selectedIds);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  }

  // Wait for async tool data before rendering the form. Formik captures
  // initialValues on mount — if tools haven't loaded yet, the initial values
  // won't include MCP tool fields. Later, toggling those fields would make
  // the form permanently dirty since they have no baseline to compare against.
  if (isToolsLoading || isMcpLoading || isOpenApiLoading) {
    return null;
  }

  return (
    <>
      <div
        data-testid="AgentsEditorPage/container"
        aria-label="Agents Editor Page"
        className="h-full w-full"
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange
          validateOnBlur
          validateOnMount
          initialTouched={{
            description:
              initialValues.description.length >
              MAX_CHARACTERS_AGENT_DESCRIPTION,
            starter_messages: initialValues.starter_messages.map(
              (msg) => msg.length > MAX_CHARACTERS_STARTER_MESSAGE
            ) as unknown as boolean,
          }}
          initialStatus={{ warnings: {} }}
        >
          {({ isSubmitting, isValid, dirty, values, setFieldValue }) => {
            const fileStatusMap = new Map(
              allRecentFiles.map((f) => [f.id, f.status])
            );

            const hasUploadingFiles = values.user_file_ids.some(
              (fileId: string) => {
                const status = fileStatusMap.get(fileId);
                if (status === undefined) {
                  return fileId.startsWith("temp_");
                }
                return status === UserFileStatus.UPLOADING;
              }
            );

            const hasProcessingFiles = values.user_file_ids.some(
              (fileId: string) =>
                fileStatusMap.get(fileId) === UserFileStatus.PROCESSING
            );
            const isShared =
              values.is_public ||
              values.shared_user_ids.length > 0 ||
              values.shared_group_ids.length > 0;

            return (
              <>
                <FormWarningsEffect />

                <userFilesModal.Provider>
                  <UserFilesModal
                    title="Fichiers utilisateur"
                    description="Tous les fichiers sélectionnés pour cet agent"
                    recentFiles={values.user_file_ids
                      .map((userFileId: string) => {
                        const rf = allRecentFiles.find(
                          (f) => f.id === userFileId
                        );
                        if (rf) return rf;
                        return {
                          id: userFileId,
                          name: `File ${userFileId.slice(0, 8)}`,
                          status: UserFileStatus.COMPLETED,
                          file_id: userFileId,
                          created_at: new Date().toISOString(),
                          project_id: null,
                          user_id: null,
                          file_type: "",
                          last_accessed_at: new Date().toISOString(),
                          chat_file_type: "file" as const,
                        } as unknown as ProjectFile;
                      })
                      .filter((f): f is ProjectFile => f !== null)}
                    selectedFileIds={values.user_file_ids}
                    onPickRecent={(file: ProjectFile) => {
                      if (!values.user_file_ids.includes(file.id)) {
                        setFieldValue("user_file_ids", [
                          ...values.user_file_ids,
                          file.id,
                        ]);
                      }
                    }}
                    onUnpickRecent={(file: ProjectFile) => {
                      setFieldValue(
                        "user_file_ids",
                        values.user_file_ids.filter((id) => id !== file.id)
                      );
                    }}
                    onView={(file: ProjectFile) => {
                      setPresentingDocument({
                        document_id: `project_file__${file.file_id}`,
                        semantic_identifier: file.name,
                      });
                    }}
                  />
                </userFilesModal.Provider>

                <shareAgentModal.Provider>
                  <ShareAgentModal
                    agentId={existingAgent?.id}
                    userIds={values.shared_user_ids}
                    groupIds={values.shared_group_ids}
                    isPublic={values.is_public}
                    isFeatured={values.is_featured}
                    labelIds={values.label_ids}
                    onShare={async (
                      userIds,
                      groupIds,
                      isPublic,
                      isFeatured,
                      labelIds
                    ) => {
                      if (!existingAgent) {
                        // New agents are not persisted until the main Create action.
                        setFieldValue("shared_user_ids", userIds);
                        setFieldValue("shared_group_ids", groupIds);
                        setFieldValue("is_public", isPublic);
                        setFieldValue("is_featured", isFeatured);
                        setFieldValue("label_ids", labelIds);
                        shareAgentModal.toggle(false);
                        return;
                      }

                      const applySharingFields = () => {
                        setFieldValue("shared_user_ids", userIds);
                        setFieldValue("shared_group_ids", groupIds);
                        setFieldValue("is_public", isPublic);
                        setFieldValue("label_ids", labelIds);
                      };

                      const refreshSharedUi = async () => {
                        try {
                          await refreshAgents();
                          refreshAgent?.();
                        } catch (error) {
                          console.error(
                            "Refresh failed after successful share:",
                            error
                          );
                          toast.error(
                            "Le partage de l'agent a été enregistré, mais le rechargement a échoué. Veuillez recharger la page."
                          );
                        }
                      };

                      let shareError: string | null;
                      try {
                        shareError = await updateAgentSharedStatus(
                          existingAgent.id,
                          userIds,
                          groupIds,
                          isPublic,
                          isPaidEnterpriseFeaturesEnabled,
                          labelIds
                        );
                      } catch (error) {
                        console.error(
                          "Share agent mutation failed unexpectedly:",
                          error
                        );
                        toast.error("Échec du partage de l'agent. Veuillez réessayer.");
                        return;
                      }

                      if (shareError) {
                        toast.error(`Échec du partage de l'agent : ${shareError}`);
                        return;
                      }

                      if (canUpdateFeaturedStatus) {
                        let featuredError: string | null;
                        try {
                          featuredError = await updateAgentFeaturedStatus(
                            existingAgent.id,
                            isFeatured
                          );
                        } catch (error) {
                          console.error(
                            "Featured mutation failed unexpectedly:",
                            error
                          );
                          // Share succeeded; sync form and UI before returning.
                          applySharingFields();
                          await refreshSharedUi();
                          toast.error(
                            "Échec de la mise à jour du statut mis en avant. Veuillez réessayer."
                          );
                          return;
                        }

                        if (featuredError) {
                          // Share succeeded, featured failed: keep modal open for retry.
                          applySharingFields();
                          await refreshSharedUi();
                          toast.error(
                            `Échec de la mise à jour du statut mis en avant : ${featuredError}`
                          );
                          return;
                        }

                        applySharingFields();
                        setFieldValue("is_featured", isFeatured);
                        shareAgentModal.toggle(false);
                        await refreshSharedUi();
                        return;
                      }

                      applySharingFields();
                      shareAgentModal.toggle(false);
                      await refreshSharedUi();
                    }}
                  />
                </shareAgentModal.Provider>
                <deleteAgentModal.Provider>
                  {deleteAgentModal.isOpen && (
                    <ConfirmationModalLayout
                      icon={SvgTrash}
                      title="Supprimer l'agent"
                      submit={
                        <OpalButton
                          variant="danger"
                          onClick={handleDeleteAgent}
                        >
                          Supprimer l&apos;agent
                        </OpalButton>
                      }
                      onClose={() => deleteAgentModal.toggle(false)}
                    >
                      <GeneralLayouts.Section alignItems="start" gap={0.5}>
                        <Text>
                          Toute personne utilisant cet agent ne pourra plus y
                          accéder. La suppression est irréversible.
                        </Text>
                        <Text>Êtes-vous sûr de vouloir supprimer cet agent ?</Text>
                      </GeneralLayouts.Section>
                    </ConfirmationModalLayout>
                  )}
                </deleteAgentModal.Provider>

                <Form className="h-full w-full">
                  <SettingsLayouts.Root>
                    <SettingsLayouts.Header
                      icon={SvgOnyxOctagon}
                      title={existingAgent ? "Modifier l'agent" : "Créer un agent"}
                      rightChildren={
                        <div className="flex gap-2">
                          <OpalButton
                            prominence="secondary"
                            type="button"
                            onClick={() => router.back()}
                          >
                            Annuler
                          </OpalButton>
                          <SimpleTooltip
                            tooltip={
                              isSubmitting
                                ? "Enregistrement en cours..."
                                : !isValid
                                  ? "Veuillez corriger les erreurs dans le formulaire avant d'enregistrer."
                                  : !dirty
                                    ? "Aucune modification n'a été effectuée."
                                    : hasUploadingFiles
                                      ? "Veuillez attendre la fin du téléchargement des fichiers."
                                      : undefined
                            }
                            side="bottom"
                          >
                            <OpalButton
                              disabled={
                                isSubmitting ||
                                !isValid ||
                                !dirty ||
                                hasUploadingFiles
                              }
                              type="submit"
                            >
                              {existingAgent ? "Enregistrer" : "Créer"}
                            </OpalButton>
                          </SimpleTooltip>
                        </div>
                      }
                      backButton
                      separator
                    />

                    {/* Agent Form Content */}
                    <SettingsLayouts.Body>
                      <GeneralLayouts.Section
                        flexDirection="row"
                        gap={2.5}
                        alignItems="start"
                      >
                        <GeneralLayouts.Section>
                          <InputLayouts.Vertical name="name" title="Nom">
                            <InputTypeInField
                              name="name"
                              placeholder="Nommer votre agent"
                            />
                          </InputLayouts.Vertical>

                          <InputLayouts.Vertical
                            name="description"
                            title="Description"
                            suffix="optionnel"
                          >
                            <InputTextAreaField
                              name="description"
                              placeholder="Que fait cet agent ?"
                            />
                          </InputLayouts.Vertical>
                        </GeneralLayouts.Section>

                        <GeneralLayouts.Section width="fit">
                          <InputLayouts.Vertical
                            name="agent_avatar"
                            title="Avatar de l'agent"
                          >
                            <AgentIconEditor existingAgent={existingAgent} />
                          </InputLayouts.Vertical>
                        </GeneralLayouts.Section>
                      </GeneralLayouts.Section>

                      <Separator noPadding />

                      <GeneralLayouts.Section>
                        <InputLayouts.Vertical
                          name="instructions"
                          title="Instructions"
                          suffix="optionnel"
                          description="Ajoutez des instructions pour personnaliser les réponses de cet agent."
                        >
                          <InputTextAreaField
                            name="instructions"
                            placeholder="Pensez étape par étape et montrez le raisonnement pour les problèmes complexes. Utilisez des exemples spécifiques. Mettez en avant les points d'action, et laissez des espaces à remplir par l'utilisateur si vous ne connaissez pas. Utilisez un ton poli et enthousiaste."
                          />
                        </InputLayouts.Vertical>

                        <InputLayouts.Vertical
                          name="starter_messages"
                          title="Débuts de conversation"
                          description="Messages exemples qui aident les utilisateurs à comprendre ce que cet agent peut faire et comment interagir avec lui efficacement."
                          suffix="optionnel"
                        >
                          <StarterMessages />
                        </InputLayouts.Vertical>
                      </GeneralLayouts.Section>

                      <Separator noPadding />

                      <AgentKnowledgePane
                        enableKnowledge={values.enable_knowledge}
                        onEnableKnowledgeChange={(enabled) =>
                          setFieldValue("enable_knowledge", enabled)
                        }
                        selectedSources={values.selected_sources}
                        onSourcesChange={(sources) =>
                          setFieldValue("selected_sources", sources)
                        }
                        documentSets={documentSets ?? []}
                        selectedDocumentSetIds={values.document_set_ids}
                        onDocumentSetIdsChange={(ids) =>
                          setFieldValue("document_set_ids", ids)
                        }
                        selectedDocumentIds={values.document_ids}
                        onDocumentIdsChange={(ids) =>
                          setFieldValue("document_ids", ids)
                        }
                        selectedFolderIds={values.hierarchy_node_ids}
                        onFolderIdsChange={(ids) =>
                          setFieldValue("hierarchy_node_ids", ids)
                        }
                        selectedFileIds={values.user_file_ids}
                        onFileIdsChange={(ids) =>
                          setFieldValue("user_file_ids", ids)
                        }
                        allRecentFiles={allRecentFiles}
                        onFileClick={handleFileClick}
                        onUploadChange={(e) =>
                          handleUploadChange(
                            e,
                            values.user_file_ids,
                            setFieldValue
                          )
                        }
                        hasProcessingFiles={hasProcessingFiles}
                        initialAttachedDocuments={
                          existingAgent?.attached_documents
                        }
                        initialHierarchyNodes={existingAgent?.hierarchy_nodes}
                        vectorDbEnabled={vectorDbEnabled}
                      />

                      <Separator noPadding />

                      <SimpleCollapsible>
                        <SimpleCollapsible.Header
                          title="Actions"
                          description="Outils et capacités disponibles pour cet agent."
                        />
                        <SimpleCollapsible.Content>
                          <GeneralLayouts.Section gap={0.5}>
                            <SimpleTooltip
                              tooltip={imageGenerationDisabledTooltip}
                              side="top"
                            >
                              <Card
                                variant={
                                  isImageGenerationAvailable
                                    ? undefined
                                    : "disabled"
                                }
                              >
                                <InputLayouts.Horizontal
                                  name="image_generation"
                                  title="Génération d'images"
                                  description="Générez et manipulez des images à l'aide d'outils alimentés par l'IA."
                                  disabled={!isImageGenerationAvailable}
                                >
                                  <SwitchField
                                    name="image_generation"
                                    disabled={!isImageGenerationAvailable}
                                  />
                                </InputLayouts.Horizontal>
                              </Card>
                            </SimpleTooltip>

                            <Card
                              variant={!!webSearchTool ? undefined : "disabled"}
                            >
                              <InputLayouts.Horizontal
                                name="web_search"
                                title="Recherche web"
                                description="Recherchez sur le web des informations en temps réel et des résultats à jour."
                                disabled={!webSearchTool}
                              >
                                <SwitchField
                                  name="web_search"
                                  disabled={!webSearchTool}
                                />
                              </InputLayouts.Horizontal>
                            </Card>

                            <Card
                              variant={!!openURLTool ? undefined : "disabled"}
                            >
                              <InputLayouts.Horizontal
                                name="open_url"
                                title="Ouvrir une URL"
                                description="Récupérez et lisez le contenu de pages web."
                                disabled={!openURLTool}
                              >
                                <SwitchField
                                  name="open_url"
                                  disabled={!openURLTool}
                                />
                              </InputLayouts.Horizontal>
                            </Card>

                            <Card
                              variant={
                                !!codeInterpreterTool ? undefined : "disabled"
                              }
                            >
                              <InputLayouts.Horizontal
                                name="code_interpreter"
                                title="Interpréteur de code"
                                description="Générez et exécutez du code."
                                disabled={!codeInterpreterTool}
                              >
                                <SwitchField
                                  name="code_interpreter"
                                  disabled={!codeInterpreterTool}
                                />
                              </InputLayouts.Horizontal>
                            </Card>

                            {/* Tools */}
                            <>
                              {/* render the separator if there is at least one mcp-server or open-api-tool */}
                              {(mcpServers.length > 0 ||
                                openApiTools.length > 0) && (
                                <Separator noPadding className="py-1" />
                              )}

                              {/* MCP tools */}
                              {mcpServersWithTools.length > 0 && (
                                <GeneralLayouts.Section gap={0.5}>
                                  {mcpServersWithTools.map(
                                    ({ server, tools, isLoading }) => (
                                      <MCPServerCard
                                        key={server.id}
                                        server={server}
                                        tools={tools}
                                        isLoading={isLoading}
                                      />
                                    )
                                  )}
                                </GeneralLayouts.Section>
                              )}

                              {/* OpenAPI tools */}
                              {openApiTools.length > 0 && (
                                <GeneralLayouts.Section gap={0.5}>
                                  {openApiTools.map((tool) => (
                                    <OpenApiToolCard
                                      key={tool.id}
                                      tool={tool}
                                    />
                                  ))}
                                </GeneralLayouts.Section>
                              )}
                            </>
                          </GeneralLayouts.Section>
                        </SimpleCollapsible.Content>
                      </SimpleCollapsible>

                      <Separator noPadding />

                      <SimpleCollapsible>
                        <SimpleCollapsible.Header
                          title="Options avancées"
                          description="Affinez les prompts et les connaissances de l'agent."
                        />
                        <SimpleCollapsible.Content>
                          <GeneralLayouts.Section>
                            <Card>
                              <InputLayouts.Horizontal
                                title="Partager cet agent"
                                description="avec d'autres utilisateurs, groupes, ou toute votre organisation."
                                center
                              >
                                <OpalButton
                                  prominence="secondary"
                                  icon={isShared ? SvgUsers : SvgLock}
                                  onClick={() => shareAgentModal.toggle(true)}
                                >
                                  Partager
                                </OpalButton>
                              </InputLayouts.Horizontal>
                              {canUpdateFeaturedStatus && (
                                <>
                                  <InputLayouts.Horizontal
                                    name="is_featured"
                                    title="Mettre en avant cet agent"
                                    description="Affiche cet agent en haut de la liste des agents et l'épingle automatiquement à la barre latérale pour les nouveaux utilisateurs ayant accès."
                                  >
                                    <SwitchField name="is_featured" />
                                  </InputLayouts.Horizontal>
                                  {values.is_featured && !isShared && (
                                    <Message
                                      static
                                      close={false}
                                      className="w-full"
                                      text="Cet agent est privé et ne sera mis en avant que pour vous."
                                    />
                                  )}
                                </>
                              )}
                            </Card>

                            <Card>
                              <InputLayouts.Horizontal
                                name="llm_model"
                                title="Modèle par défaut"
                                description="Ce modèle sera utilisé par Onyx par défaut dans vos conversations."
                              >
                                <LLMSelector
                                  name="llm_model"
                                  llmProviders={llmProviders ?? []}
                                  currentLlm={getCurrentLlm(
                                    values,
                                    llmProviders
                                  )}
                                  onSelect={(selected) =>
                                    onLlmSelect(selected, setFieldValue)
                                  }
                                />
                              </InputLayouts.Horizontal>
                              <InputLayouts.Horizontal
                                name="knowledge_cutoff_date"
                                title="Date limite de connaissance"
                                suffix="optionnel"
                                description="Les documents mis à jour avant cette date seront ignorés."
                              >
                                <InputDatePickerField
                                  name="knowledge_cutoff_date"
                                  maxDate={new Date()}
                                />
                              </InputLayouts.Horizontal>
                              <InputLayouts.Horizontal
                                name="replace_base_system_prompt"
                                title="Écraser le prompt système"
                                suffix="(Déconseillé)"
                                description='Supprime le prompt système de base qui inclut des instructions utiles (ex. "Vous pouvez utiliser des tableaux Markdown"). Cela peut affecter la qualité des réponses.'
                              >
                                <SwitchField name="replace_base_system_prompt" />
                              </InputLayouts.Horizontal>
                            </Card>

                            <GeneralLayouts.Section gap={0.25}>
                              <InputLayouts.Vertical
                                name="reminders"
                                title="Rappels"
                                suffix="optionnel"
                              >
                                <InputTextAreaField
                                  name="reminders"
                                  placeholder="N'oubliez pas, je veux que vous formatiez toujours votre réponse sous forme de liste numérotée."
                                />
                              </InputLayouts.Vertical>
                              <Text text03 secondaryBody>
                                Ajoutez un bref rappel aux messages du prompt.
                                Utilisez ceci pour rappeler à l'agent s'il tend
                                à oublier certaines instructions au fil de la
                                conversation. Cela doit être bref et ne pas
                                interférer avec les messages de l'utilisateur.
                              </Text>
                            </GeneralLayouts.Section>
                          </GeneralLayouts.Section>
                        </SimpleCollapsible.Content>
                      </SimpleCollapsible>

                      {existingAgent && (
                        <>
                          <Separator noPadding />

                          <Card>
                            <InputLayouts.Horizontal
                              title="Supprimer cet agent"
                              description="Toute personne utilisant cet agent ne pourra plus y accéder."
                              center
                            >
                              <OpalButton
                                variant="danger"
                                prominence="secondary"
                                onClick={() => deleteAgentModal.toggle(true)}
                              >
                                Supprimer l&apos;agent
                              </OpalButton>
                            </InputLayouts.Horizontal>
                          </Card>
                        </>
                      )}
                    </SettingsLayouts.Body>
                  </SettingsLayouts.Root>
                </Form>
              </>
            );
          }}
        </Formik>
      </div>
    </>
  );
}
