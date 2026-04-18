import { IconFunctionComponent } from "@opal/types";
import {
  SvgActions,
  SvgActivity,
  SvgArrowExchange,
  SvgAudio,
  SvgShareWebhook,
  SvgBarChart,
  SvgBookOpen,
  SvgBubbleText,
  SvgClipboard,
  SvgCpu,
  SvgDownload,
  SvgEmpty,
  SvgFileText,
  SvgFiles,
  SvgGlobe,
  SvgHistory,
  SvgImage,
  SvgMcp,
  SvgNetworkGraph,
  SvgOnyxOctagon,
  SvgPaintBrush,
  SvgProgressBars,
  SvgSearchMenu,
  SvgTerminal,
  SvgThumbsUp,
  SvgUploadCloud,
  SvgUser,
  SvgUserKey,
  SvgUserSync,
  SvgUsers,
  SvgWallet,
  SvgZoomIn,
  SvgDiscord,
  SvgSlack,
} from "@opal/icons";

export interface AdminRouteEntry {
  path: string;
  icon: IconFunctionComponent;
  title: string;
  sidebarLabel: string;
}

/**
 * Single source of truth for every admin route: path, icon, page-header
 * title, and sidebar label.
 */
export const ADMIN_ROUTES = {
  INDEXING_STATUS: {
    path: "/admin/indexing/status",
    icon: SvgBookOpen,
    title: "Connecteurs existants",
    sidebarLabel: "Connecteurs existants",
  },
  ADD_CONNECTOR: {
    path: "/admin/add-connector",
    icon: SvgUploadCloud,
    title: "Ajouter un connecteur",
    sidebarLabel: "Ajouter un connecteur",
  },
  DOCUMENT_SETS: {
    path: "/admin/documents/sets",
    icon: SvgFiles,
    title: "Ensembles de documents",
    sidebarLabel: "Ensembles de documents",
  },
  DOCUMENT_EXPLORER: {
    path: "/admin/documents/explorer",
    icon: SvgZoomIn,
    title: "Explorateur de documents",
    sidebarLabel: "Explorateur",
  },
  DOCUMENT_FEEDBACK: {
    path: "/admin/documents/feedback",
    icon: SvgThumbsUp,
    title: "Avis sur les documents",
    sidebarLabel: "Avis",
  },
  AGENTS: {
    path: "/admin/agents",
    icon: SvgOnyxOctagon,
    title: "Agents",
    sidebarLabel: "Agents",
  },
  SLACK_BOTS: {
    path: "/admin/bots",
    icon: SvgSlack,
    title: "Intégration Slack",
    sidebarLabel: "Intégration Slack",
  },
  DISCORD_BOTS: {
    path: "/admin/discord-bot",
    icon: SvgDiscord,
    title: "Intégration Discord",
    sidebarLabel: "Intégration Discord",
  },
  MCP_ACTIONS: {
    path: "/admin/actions/mcp",
    icon: SvgMcp,
    title: "Actions MCP",
    sidebarLabel: "Actions MCP",
  },
  OPENAPI_ACTIONS: {
    path: "/admin/actions/open-api",
    icon: SvgActions,
    title: "Actions OpenAPI",
    sidebarLabel: "Actions OpenAPI",
  },
  STANDARD_ANSWERS: {
    path: "/admin/standard-answer",
    icon: SvgClipboard,
    title: "Réponses standard",
    sidebarLabel: "Réponses standard",
  },
  GROUPS: {
    path: "/admin/groups",
    icon: SvgUsers,
    title: "Gérer les groupes d'utilisateurs",
    sidebarLabel: "Groupes",
  },
  CHAT_PREFERENCES: {
    path: "/admin/configuration/chat-preferences",
    icon: SvgBubbleText,
    title: "Préférences de chat",
    sidebarLabel: "Préférences de chat",
  },
  LLM_MODELS: {
    path: "/admin/configuration/llm",
    icon: SvgCpu,
    title: "Modèles de langage",
    sidebarLabel: "Modèles de langage",
  },
  WEB_SEARCH: {
    path: "/admin/configuration/web-search",
    icon: SvgGlobe,
    title: "Recherche web",
    sidebarLabel: "Recherche web",
  },
  IMAGE_GENERATION: {
    path: "/admin/configuration/image-generation",
    icon: SvgImage,
    title: "Génération d'images",
    sidebarLabel: "Génération d'images",
  },
  VOICE: {
    path: "/admin/configuration/voice",
    icon: SvgAudio,
    title: "Voix",
    sidebarLabel: "Voix",
  },
  CODE_INTERPRETER: {
    path: "/admin/configuration/code-interpreter",
    icon: SvgTerminal,
    title: "Interpréteur de code",
    sidebarLabel: "Interpréteur de code",
  },
  INDEX_SETTINGS: {
    path: "/admin/configuration/search",
    icon: SvgSearchMenu,
    title: "Paramètres d'index",
    sidebarLabel: "Paramètres d'index",
  },
  DOCUMENT_PROCESSING: {
    path: "/admin/configuration/document-processing",
    icon: SvgFileText,
    title: "Traitement des documents",
    sidebarLabel: "Traitement des documents",
  },
  KNOWLEDGE_GRAPH: {
    path: "/admin/kg",
    icon: SvgNetworkGraph,
    title: "Graphe de connaissances",
    sidebarLabel: "Graphe de connaissances",
  },
  USERS: {
    path: "/admin/users",
    icon: SvgUser,
    title: "Utilisateurs & Demandes",
    sidebarLabel: "Utilisateurs",
  },
  API_KEYS: {
    path: "/admin/service-accounts",
    icon: SvgUserKey,
    title: "Comptes de service",
    sidebarLabel: "Comptes de service",
  },
  TOKEN_RATE_LIMITS: {
    path: "/admin/token-rate-limits",
    icon: SvgProgressBars,
    title: "Limites de dépenses",
    sidebarLabel: "Limites de dépenses",
  },
  USAGE: {
    path: "/admin/performance/usage",
    icon: SvgActivity,
    title: "Statistiques d'utilisation",
    sidebarLabel: "Statistiques d'utilisation",
  },
  QUERY_HISTORY: {
    path: "/admin/performance/query-history",
    icon: SvgHistory,
    title: "Historique des requêtes",
    sidebarLabel: "Historique des requêtes",
  },
  CUSTOM_ANALYTICS: {
    path: "/admin/performance/custom-analytics",
    icon: SvgBarChart,
    title: "Analytiques personnalisées",
    sidebarLabel: "Analytiques personnalisées",
  },
  THEME: {
    path: "/admin/theme",
    icon: SvgPaintBrush,
    title: "Apparence & Thèmes",
    sidebarLabel: "Apparence & Thèmes",
  },
  BILLING: {
    path: "/admin/billing",
    icon: SvgWallet,
    title: "Forfaits & Facturation",
    sidebarLabel: "Forfaits & Facturation",
  },
  INDEX_MIGRATION: {
    path: "/admin/document-index-migration",
    icon: SvgArrowExchange,
    title: "Migration d'index de documents",
    sidebarLabel: "Migration d'index de documents",
  },
  HOOKS: {
    path: "/admin/hooks",
    icon: SvgShareWebhook,
    title: "Extensions hook",
    sidebarLabel: "Extensions hook",
  },
  SCIM: {
    path: "/admin/scim",
    icon: SvgUserSync,
    title: "SCIM",
    sidebarLabel: "SCIM",
  },
  DEBUG: {
    path: "/admin/debug",
    icon: SvgDownload,
    title: "Journaux de débogage",
    sidebarLabel: "Journaux de débogage",
  },
  // Prefix-only entries used for layout matching — not rendered as sidebar
  // items or page headers.
  DOCUMENTS: {
    path: "/admin/documents",
    icon: SvgEmpty,
    title: "",
    sidebarLabel: "",
  },
  PERFORMANCE: {
    path: "/admin/performance",
    icon: SvgEmpty,
    title: "",
    sidebarLabel: "",
  },
} as const satisfies Record<string, AdminRouteEntry>;

/**
 * Helper that converts a route entry into the `{ name, icon, link }`
 * shape expected by the sidebar.
 */
export function sidebarItem(route: AdminRouteEntry) {
  return { name: route.sidebarLabel, icon: route.icon, link: route.path };
}
