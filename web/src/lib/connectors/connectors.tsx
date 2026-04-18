import * as Yup from "yup";
import { ConfigurableSources, ValidInputTypes, ValidSources } from "../types";
import { AccessTypeGroupSelectorFormType } from "@/components/admin/connectors/AccessTypeGroupSelector";
import { Credential } from "@/lib/connectors/credentials"; // Import Credential type
import { DOCS_ADMINS_PATH } from "@/lib/constants";

export function isLoadState(connector_name: string): boolean {
  // TODO: centralize connector metadata like this somewhere instead of hardcoding it here
  const loadStateConnectors = ["web", "xenforo", "file", "airtable"];
  if (loadStateConnectors.includes(connector_name)) {
    return true;
  }

  return false;
}

export type InputType =
  | "list"
  | "text"
  | "select"
  | "multiselect"
  | "boolean"
  | "number"
  | "file";

export type StringWithDescription = {
  value: string;
  name: string;
  description?: string;
};

export interface Option {
  label: string | ((currentCredential: Credential<any> | null) => string);
  name: string;
  description?:
    | string
    | ((currentCredential: Credential<any> | null) => string);
  query?: string;
  optional?: boolean;
  hidden?: boolean;
  visibleCondition?: (
    values: any,
    currentCredential: Credential<any> | null
  ) => boolean;
  wrapInCollapsible?: boolean;
  disabled?: boolean | ((currentCredential: Credential<any> | null) => boolean);
}

export interface SelectOption extends Option {
  type: "select";
  options?: StringWithDescription[];
  default?: string;
}

export interface MultiSelectOption extends Option {
  type: "multiselect";
  options?: StringWithDescription[];
  default?: string[];
}

export interface ListOption extends Option {
  type: "list";
  default?: string[];
  transform?: (values: string[]) => string[];
}

export interface TextOption extends Option {
  type: "text";
  default?: string;
  initial?: string | ((currentCredential: Credential<any> | null) => string);
  isTextArea?: boolean;
}

export interface NumberOption extends Option {
  type: "number";
  default?: number;
}

export interface BooleanOption extends Option {
  type: "checkbox";
  default?: boolean;
}

export interface FileOption extends Option {
  type: "file";
  default?: string;
}

export interface StringTabOption extends Option {
  type: "string_tab";
  default?: string;
}

export interface TabOption extends Option {
  type: "tab";
  defaultTab?: string;
  tabs: {
    label: string;
    value: string;
    fields: (
      | BooleanOption
      | ListOption
      | TextOption
      | NumberOption
      | SelectOption
      | MultiSelectOption
      | FileOption
      | StringTabOption
    )[];
  }[];
  default?: [];
}

export interface ConnectionConfiguration {
  description: string;
  subtext?: string;
  initialConnectorName?: string; // a key in the credential to prepopulate the connector name field
  values: (
    | BooleanOption
    | ListOption
    | TextOption
    | NumberOption
    | SelectOption
    | MultiSelectOption
    | FileOption
    | TabOption
  )[];
  advanced_values: (
    | BooleanOption
    | ListOption
    | TextOption
    | NumberOption
    | SelectOption
    | MultiSelectOption
    | FileOption
    | TabOption
  )[];
  overrideDefaultFreq?: number;
  advancedValuesVisibleCondition?: (
    values: any,
    currentCredential: Credential<any> | null
  ) => boolean;
}

export const connectorConfigs: Record<
  ConfigurableSources,
  ConnectionConfiguration
> = {
  web: {
    description: "Configurer le connecteur Web",
    values: [
      {
        type: "text",
        query: "Entrez l'URL du site à analyser, ex. https://docs.onyx.app/ :",
        label: "URL de base",
        name: "base_url",
        optional: false,
      },
      {
        type: "select",
        query: "Sélectionnez le type de connecteur web :",
        label: "Méthode d'exploration",
        name: "web_connector_type",
        options: [
          { name: "recursive", value: "recursive" },
          { name: "single", value: "single" },
          { name: "sitemap", value: "sitemap" },
        ],
      },
    ],
    advanced_values: [
      {
        type: "checkbox",
        query: "Faire défiler avant d'explorer :",
        label: "Faire défiler avant d'explorer",
        description:
          "Activer si le site web nécessite un défilement pour charger le contenu souhaité",
        name: "scroll_before_scraping",
        optional: true,
      },
    ],
    overrideDefaultFreq: 60 * 60 * 24,
  },
  github: {
    description: "Configurer le connecteur GitHub",
    values: [
      {
        type: "text",
        query: "Entrez le nom d'utilisateur ou l'organisation GitHub :",
        label: "Propriétaire du dépôt",
        name: "repo_owner",
        optional: false,
      },
      {
        type: "tab",
        name: "github_mode",
        label: "Que doit-on indexer depuis GitHub ?",
        optional: true,
        tabs: [
          {
            value: "repo",
            label: "Dépôt spécifique",
            fields: [
              {
                type: "text",
                query: "Entrez le(s) nom(s) de dépôt :",
                label: "Nom(s) de dépôt",
                name: "repositories",
                optional: false,
                description:
                  "Pour plusieurs dépôts, entrez des noms séparés par des virgules (ex. repo1,repo2,repo3)",
              },
            ],
          },
          {
            value: "everything",
            label: "Tout",
            fields: [
              {
                type: "string_tab",
                label: "Tout",
                name: "everything",
                description:
                  "Ce connecteur indexera tous les dépôts auxquels les identifiants fournis ont accès !",
              },
            ],
          },
        ],
      },
      {
        type: "checkbox",
        query: "Inclure les pull requests ?",
        label: "Inclure les pull requests ?",
        description: "Indexer les pull requests des dépôts",
        name: "include_prs",
        optional: true,
      },
      {
        type: "checkbox",
        query: "Inclure les issues ?",
        label: "Inclure les issues ?",
        name: "include_issues",
        description: "Indexer les issues des dépôts",
        optional: true,
      },
    ],
    advanced_values: [],
  },
  testrail: {
    description: "Configurer le connecteur TestRail",
    values: [
      {
        type: "text",
        label: "IDs de projets",
        name: "project_ids",
        optional: true,
        description:
          "Liste des IDs de projets TestRail à indexer, séparés par des virgules (ex. 1 ou 1,2,3). Laisser vide pour indexer tous les projets.",
      },
    ],
    advanced_values: [
      {
        type: "number",
        label: "Taille de page des cas",
        name: "cases_page_size",
        optional: true,
        description:
          "Nombre de cas de test à récupérer par page depuis l'API TestRail (défaut : 250)",
      },
      {
        type: "number",
        label: "Nombre max de pages",
        name: "max_pages",
        optional: true,
        description:
          "Nombre maximum de pages à récupérer pour éviter les boucles infinies (défaut : 10000)",
      },
      {
        type: "number",
        label: "Limite de caractères pour ignorer un document",
        name: "skip_doc_absolute_chars",
        optional: true,
        description:
          "Ignorer l'indexation des cas de test dépassant cette limite de caractères (défaut : 200000)",
      },
    ],
  },
  gitlab: {
    description: "Configurer le connecteur GitLab",
    values: [
      {
        type: "text",
        query: "Entrez le propriétaire du projet :",
        label: "Propriétaire du projet",
        name: "project_owner",
        optional: false,
      },
      {
        type: "text",
        query: "Entrez le nom du projet :",
        label: "Nom du projet",
        name: "project_name",
        optional: false,
      },
    ],
    advanced_values: [
      {
        type: "checkbox",
        query: "Inclure les merge requests ?",
        label: "Inclure les MRs",
        name: "include_mrs",
        description: "Indexer les merge requests des dépôts",
        default: true,
      },
      {
        type: "checkbox",
        query: "Inclure les issues ?",
        label: "Inclure les issues",
        name: "include_issues",
        description: "Indexer les issues des dépôts",
        default: true,
      },
    ],
  },
  bitbucket: {
    description: "Configurer le connecteur Bitbucket",
    subtext:
      "Configurer le connecteur Bitbucket (Cloud uniquement). Vous pouvez indexer un espace de travail, des projets spécifiques ou des dépôts.",
    values: [
      {
        type: "text",
        label: "Espace de travail",
        name: "workspace",
        optional: false,
        description: `L'espace de travail Bitbucket à indexer (ex. "atlassian" depuis https://bitbucket.org/atlassian/workspace ).`,
      },
      {
        type: "tab",
        name: "bitbucket_mode",
        label: "Que doit-on indexer depuis Bitbucket ?",
        optional: true,
        tabs: [
          {
            value: "repo",
            label: "Dépôts spécifiques",
            fields: [
              {
                type: "text",
                label: "Identifiants de dépôts",
                name: "repositories",
                optional: false,
                description:
                  "Pour plusieurs dépôts, entrez des identifiants séparés par des virgules (ex. repo1,repo2,repo3)",
              },
            ],
          },
          {
            value: "project",
            label: "Projet(s)",
            fields: [
              {
                type: "text",
                label: "Clé(s) de projet",
                name: "projects",
                optional: false,
                description:
                  "Une ou plusieurs clés de projet Bitbucket (séparées par des virgules) pour indexer tous les dépôts de ces projets (ex. PROJ1,PROJ2)",
              },
            ],
          },
          {
            value: "workspace",
            label: "Espace de travail",
            fields: [
              {
                type: "string_tab",
                label: "Espace de travail",
                name: "workspace_tab",
                description:
                  "Ce connecteur indexera tous les dépôts de l'espace de travail.",
              },
            ],
          },
        ],
      },
    ],
    advanced_values: [],
  },
  gitbook: {
    description: "Configurer le connecteur GitBook",
    values: [
      {
        type: "text",
        query: "Entrez l'ID de l'espace :",
        label: "ID de l'espace",
        name: "space_id",
        optional: false,
        description:
          "L'ID de l'espace GitBook à indexer. Il se trouve dans l'URL " +
          "d'une page de l'espace. Par exemple, si votre URL ressemble à " +
          "`https://app.gitbook.com/o/ccLx08XZ5wZ54LwdP9QU/s/8JkzVx8QCIGRrmxhGHU8/`, " +
          "alors votre ID d'espace est `8JkzVx8QCIGRrmxhGHU8`.",
      },
    ],
    advanced_values: [],
  },
  google_drive: {
    description: "Configurer le connecteur Google Drive",
    values: [
      {
        type: "tab",
        name: "indexing_scope",
        label: "Comment indexer votre Google Drive ?",
        optional: true,
        tabs: [
          {
            value: "general",
            label: "Général",
            fields: [
              {
                type: "checkbox",
                label: "Inclure les lecteurs partagés ?",
                description: (currentCredential) => {
                  return currentCredential?.credential_json?.google_tokens
                    ? "Cela permettra à Onyx d'indexer tout le contenu des lecteurs partagés auxquels vous avez accès."
                    : "Cela permettra à Onyx d'indexer tout le contenu des lecteurs partagés de votre organisation.";
                },
                name: "include_shared_drives",
                default: false,
              },
              {
                type: "checkbox",
                label: (currentCredential) => {
                  return currentCredential?.credential_json?.google_tokens
                    ? "Inclure Mon Drive ?"
                    : "Inclure le Mon Drive de tout le monde ?";
                },
                description: (currentCredential) => {
                  return currentCredential?.credential_json?.google_tokens
                    ? "Cela permettra à Onyx d'indexer tout le contenu de votre Mon Drive."
                    : "Cela permettra à Onyx d'indexer tout le contenu des Mon Drives de tout le monde.";
                },
                name: "include_my_drives",
                default: false,
              },
              {
                type: "checkbox",
                description:
                  "Cela permettra à Onyx d'indexer tous les fichiers partagés avec vous.",
                label: "Inclure tous les fichiers partagés avec vous ?",
                name: "include_files_shared_with_me",
                visibleCondition: (values, currentCredential) =>
                  currentCredential?.credential_json?.google_tokens,
                default: false,
              },
            ],
          },
          {
            value: "specific",
            label: "Spécifique",
            fields: [
              {
                type: "text",
                description: (currentCredential) => {
                  return currentCredential?.credential_json?.google_tokens
                    ? "Entrez une liste d'URLs séparées par des virgules pour les lecteurs partagés que vous souhaitez indexer. Vous devez avoir accès à ces lecteurs partagés."
                    : "Entrez une liste d'URLs séparées par des virgules pour les lecteurs partagés que vous souhaitez indexer.";
                },
                label: "URLs des lecteurs partagés",
                name: "shared_drive_urls",
                default: "",
                isTextArea: true,
              },
              {
                type: "text",
                description:
                  "Entrez une liste d'URLs séparées par des virgules pour les dossiers que vous souhaitez indexer. Les fichiers situés dans ces dossiers (et tous les sous-dossiers) seront indexés.",
                label: "URLs des dossiers",
                name: "shared_folder_urls",
                default: "",
                isTextArea: true,
              },
              {
                type: "text",
                description:
                  "Entrez une liste d'e-mails séparés par des virgules des utilisateurs dont vous souhaitez indexer le Mon Drive.",
                label: "E-mails Mon Drive",
                name: "my_drive_emails",
                visibleCondition: (values, currentCredential) =>
                  !currentCredential?.credential_json?.google_tokens,
                default: "",
                isTextArea: true,
              },
            ],
          },
        ],
        defaultTab: "general",
      },
    ],
    advanced_values: [
      {
        type: "text",
        description:
          "Entrez une liste d'e-mails séparés par des virgules d'utilisateurs spécifiques à indexer. Seuls les fichiers accessibles à ces utilisateurs seront indexés.",
        label: "E-mails d'utilisateurs spécifiques",
        name: "specific_user_emails",
        optional: true,
        default: "",
        isTextArea: true,
        visibleCondition: (values, currentCredential) =>
          !currentCredential?.credential_json?.google_tokens,
      },
      {
        type: "checkbox",
        label: "Masquer les fichiers accessibles uniquement par lien de domaine ?",
        description:
          "Lorsque activé, Onyx ignore les fichiers partagés largement (domaine ou public) mais nécessitant le lien pour y accéder.",
        name: "exclude_domain_link_only",
        optional: true,
        default: false,
      },
    ],
  },
  gmail: {
    description: "Configurer le connecteur Gmail",
    values: [],
    advanced_values: [],
  },
  bookstack: {
    description: "Configurer le connecteur Bookstack",
    values: [],
    advanced_values: [],
  },
  outline: {
    description: "Configurer le connecteur Outline",
    values: [],
    advanced_values: [],
  },
  confluence: {
    description: "Configurer le connecteur Confluence",
    initialConnectorName: "cloud_name",
    values: [
      {
        type: "checkbox",
        query: "S'agit-il d'une instance Confluence Cloud ?",
        label: "Est Cloud",
        name: "is_cloud",
        optional: false,
        default: true,
        description:
          "Cochez si c'est une instance Confluence Cloud, décochez pour Confluence Server/Data Center",
        disabled: (currentCredential) => {
          if (currentCredential?.credential_json?.confluence_refresh_token) {
            return true;
          }
          return false;
        },
      },
      {
        type: "text",
        query: "Saisissez l'URL de base du wiki :",
        label: "URL de base du wiki",
        name: "wiki_base",
        optional: false,
        initial: (currentCredential) => {
          return currentCredential?.credential_json?.wiki_base ?? "";
        },
        disabled: (currentCredential) => {
          if (currentCredential?.credential_json?.confluence_refresh_token) {
            return true;
          }
          return false;
        },
        description:
          "L'URL de base de votre instance Confluence (ex. https://votre-domaine.atlassian.net/wiki)",
      },
      {
        type: "checkbox",
        query: "Utiliser un token limité ?",
        label: "Token limité",
        name: "scoped_token",
        optional: true,
        default: false,
      },
      {
        type: "tab",
        name: "indexing_scope",
        label: "Comment indexer votre Confluence ?",
        optional: true,
        tabs: [
          {
            value: "everything",
            label: "Tout",
            fields: [
              {
                type: "string_tab",
                label: "Tout",
                name: "everything",
                description:
                  "Ce connecteur indexera toutes les pages accessibles avec les identifiants fournis !",
              },
            ],
          },
          {
            value: "space",
            label: "Espace",
            fields: [
              {
                type: "text",
                query: "Saisissez l'espace :",
                label: "Clé d'espace",
                name: "space",
                default: "",
                description: "La clé d'espace Confluence à indexer (ex. `KB`).",
              },
            ],
          },
          {
            value: "page",
            label: "Page",
            fields: [
              {
                type: "text",
                query: "Saisissez l'identifiant de la page :",
                label: "Identifiant de la page",
                name: "page_id",
                default: "",
                description: "Identifiant de page spécifique à indexer (ex. `131368`)",
              },
              {
                type: "checkbox",
                query: "Indexer les pages de façon récursive ?",
                label: "Indexation récursive",
                name: "index_recursively",
                description:
                  "Si activé, nous indexerons la page indiquée par l'identifiant ainsi que toutes ses pages enfants.",
                optional: false,
                default: true,
              },
            ],
          },
          {
            value: "cql",
            label: "Requête CQL",
            fields: [
              {
                type: "text",
                query: "Saisissez la requête CQL (optionnel) :",
                label: "Requête CQL",
                name: "cql_query",
                default: "",
                description:
                  "IMPORTANT : Nous ne supportons actuellement que les requêtes CQL retournant des objets de type 'page'. Cela signifie que toutes les requêtes CQL doivent contenir 'type=page' comme seul filtre de type. Il est également important de ne pas utiliser de filtres 'lastModified' car cela causera des problèmes avec la logique de polling du connecteur. Nous récupérerons tout de même les pièces jointes et commentaires des pages retournées. Tout filtre 'lastmodified' sera écrasé. Consultez la [documentation CQL d'Atlassian](https://developer.atlassian.com/server/confluence/advanced-searching-using-cql/) pour plus de détails.",
              },
            ],
          },
        ],
        defaultTab: "space",
      },
    ],
    advanced_values: [],
  },
  jira: {
    description: "Configurer le connecteur Jira",
    subtext: `Configurez le contenu Jira à indexer. Vous pouvez tout indexer ou spécifier un projet particulier.`,
    values: [
      {
        type: "text",
        query: "Saisissez l'URL de base Jira :",
        label: "URL de base Jira",
        name: "jira_base_url",
        optional: false,
        description:
          "L'URL de base de votre instance Jira (ex. https://votre-domaine.atlassian.net)",
      },
      {
        type: "checkbox",
        query: "Utiliser un token limité ?",
        label: "Token limité",
        name: "scoped_token",
        optional: true,
        default: false,
      },
      {
        type: "tab",
        name: "indexing_scope",
        label: "Comment indexer votre Jira ?",
        optional: true,
        tabs: [
          {
            value: "everything",
            label: "Tout",
            fields: [
              {
                type: "string_tab",
                label: "Tout",
                name: "everything",
                description:
                  "Ce connecteur indexera tous les tickets accessibles avec les identifiants fournis !",
              },
            ],
          },
          {
            value: "project",
            label: "Projet",
            fields: [
              {
                type: "text",
                query: "Saisissez la clé du projet :",
                label: "Clé du projet",
                name: "project_key",
                description:
                  "La clé d'un projet spécifique à indexer (ex. 'PROJ').",
              },
            ],
          },
          {
            value: "jql",
            label: "Requête JQL",
            fields: [
              {
                type: "text",
                query: "Saisissez la requête JQL :",
                label: "Requête JQL",
                name: "jql_query",
                description:
                  "Une requête JQL personnalisée pour filtrer les tickets Jira." +
                  "\n\nIMPORTANT : N'incluez aucun filtre temporel dans la requête JQL car cela entrera en conflit avec la logique du connecteur. De plus, n'incluez pas de clauses ORDER BY." +
                  "\n\nConsultez la [documentation JQL d'Atlassian](https://support.atlassian.com/jira-software-cloud/docs/advanced-search-reference-jql-fields/) pour plus de détails sur la syntaxe.",
              },
            ],
          },
        ],
        defaultTab: "everything",
      },
      {
        type: "list",
        query: "Saisissez les adresses e-mail à exclure des commentaires :",
        label: "Liste d'exclusion e-mail des commentaires",
        name: "comment_email_blacklist",
        description:
          "Utile pour ignorer certains bots. Ajoutez les e-mails des utilisateurs dont les commentaires ne doivent PAS être indexés.",
        optional: true,
      },
    ],
    advanced_values: [],
  },
  salesforce: {
    description: "Configurer le connecteur Salesforce",
    values: [
      {
        type: "tab",
        name: "salesforce_config_type",
        label: "Type de configuration",
        optional: true,
        tabs: [
          {
            value: "simple",
            label: "Simple",
            fields: [
              {
                type: "list",
                query: "Saisissez les objets demandés :",
                label: "Objets demandés",
                name: "requested_objects",
                optional: true,
                description:
                  "Spécifiez les types d'objets Salesforce à indexer. En cas de doute, ne spécifiez aucun objet et Onyx indexera par défaut par 'Account'." +
                  "\n\nAstuce : utilisez la forme singulière du nom de l'objet (ex. 'Opportunity' au lieu de 'Opportunities').",
              },
            ],
          },
          {
            value: "advanced",
            label: "Avancé",
            fields: [
              {
                type: "text",
                query: "Saisissez la configuration de requête personnalisée :",
                label: "Configuration de requête personnalisée",
                name: "custom_query_config",
                optional: true,
                isTextArea: true,
                description:
                  "Entrez une configuration JSON qui définit précisément les champs et objets enfants à indexer. Cela vous donne un contrôle complet sur la structure des données." +
                  "\n\nExemple :" +
                  "\n{" +
                  '\n  "Account": {' +
                  '\n    "fields": ["Id", "Name", "Industry"],' +
                  '\n    "associations": {' +
                  '\n      "Contact": ["Id", "FirstName", "LastName", "Email"]' +
                  "\n    }" +
                  "\n  }" +
                  "\n}" +
                  `\n\n[Consultez notre documentation](${DOCS_ADMINS_PATH}/connectors/official/salesforce) pour plus de détails.`,
              },
            ],
          },
        ],
        defaultTab: "simple",
      },
    ],
    advanced_values: [],
  },
  sharepoint: {
    description: "Configurer le connecteur SharePoint",
    values: [
      {
        type: "list",
        query: "Saisissez les sites SharePoint :",
        label: "Sites",
        name: "sites",
        optional: true,
        description: `• Si aucun site n'est spécifié, tous les sites de votre organisation seront indexés (permission Sites.Read.All requise).
• Spécifier 'https://onyxai.sharepoint.com/sites/support' n'indexera que ce site.
• Spécifier 'https://onyxai.sharepoint.com/sites/support/subfolder' n'indexera que ce dossier.
• La spécification de sites fonctionne pour les instances SharePoint en anglais, espagnol ou allemand. Contactez l'équipe Onyx pour une autre langue.
`,
      },
    ],
    advanced_values: [
      {
        type: "checkbox",
        query: "Indexer les documents :",
        label: "Indexer les documents",
        name: "include_site_documents",
        optional: true,
        default: true,
        description:
          "Indexer les documents de toutes les bibliothèques ou dossiers SharePoint définis ci-dessus.",
      },
      {
        type: "checkbox",
        query: "Indexer les sites ASPX :",
        label: "Indexer les sites ASPX",
        name: "include_site_pages",
        optional: true,
        default: true,
        description:
          "Indexer les pages ASPX de tous les sites SharePoint définis ci-dessus, même si une bibliothèque ou un dossier est spécifié.",
      },
      {
        type: "checkbox",
        label: "Considérer les liens de partage comme publics ?",
        description:
          "Lorsque activé, les documents avec un lien de partage (anonyme ou à l'échelle de l'organisation) " +
          "sont traités comme publics (visibles par tous les utilisateurs Onyx). " +
          "Lorsque désactivé, seuls les utilisateurs et groupes avec des attributions de rôles explicites peuvent voir le document.",
        name: "treat_sharing_link_as_public",
        optional: true,
        default: false,
      },
      {
        type: "list",
        query: "Saisissez les URLs de sites à exclure :",
        label: "Sites exclus",
        name: "excluded_sites",
        optional: true,
        description:
          "URLs de sites ou modèles glob à exclure de l'indexation. " +
          "Les sites correspondants ne seront jamais indexés, même s'ils apparaissent dans la liste ci-dessus. " +
          "Exemples : 'https://contoso.sharepoint.com/sites/archive' (exact), " +
          "'*://*/sites/archive-*' (modèle glob).",
      },
      {
        type: "list",
        query: "Saisissez les modèles de chemins de fichiers à exclure :",
        label: "Chemins exclus",
        name: "excluded_paths",
        optional: true,
        description:
          "Modèles glob pour les chemins de fichiers à exclure de l'indexation dans les bibliothèques de documents. " +
          "Les modèles sont comparés au chemin relatif complet et au nom de fichier. " +
          "Exemples : '*.tmp' (fichiers temporaires), '~$*' (fichiers verrouillés Office), 'Archive/*' (dossier).",
      },
      {
        type: "text",
        query: "Hôte Microsoft Authority :",
        label: "Hôte d'autorité",
        name: "authority_host",
        optional: true,
        default: "https://login.microsoftonline.com",
        description:
          "L'hôte d'autorité d'identité Microsoft utilisé pour l'authentification. " +
          "Pour la plupart des déploiements, laissez la valeur par défaut. " +
          "Pour GCC High / DoD, utilisez https://login.microsoftonline.us",
      },
      {
        type: "text",
        query: "Hôte API Microsoft Graph :",
        label: "Hôte API Graph",
        name: "graph_api_host",
        optional: true,
        default: "https://graph.microsoft.com",
        description:
          "L'hôte de l'API Microsoft Graph. " +
          "Pour la plupart des déploiements, laissez la valeur par défaut. " +
          "Pour GCC High / DoD, utilisez https://graph.microsoft.us",
      },
      {
        type: "text",
        query: "Suffixe de domaine SharePoint :",
        label: "Suffixe de domaine SharePoint",
        name: "sharepoint_domain_suffix",
        optional: true,
        default: "sharepoint.com",
        description:
          "Le suffixe de domaine pour les sites SharePoint (ex. sharepoint.com). " +
          "Pour la plupart des déploiements, laissez la valeur par défaut. " +
          "Pour GCC High, utilisez sharepoint.us",
      },
    ],
  },
  teams: {
    description: "Configurer le connecteur Teams",
    values: [
      {
        type: "list",
        query: "Saisissez les équipes à inclure :",
        label: "Équipes",
        name: "teams",
        optional: true,
        description: `Spécifiez zéro ou plusieurs équipes à indexer. Par exemple, spécifier l'équipe 'Support' pour l'org 'onyxai' n'indexera que les messages envoyés dans les canaux de l'équipe 'Support'. Si aucune équipe n'est spécifiée, toutes les équipes de votre organisation seront indexées.`,
      },
    ],
    advanced_values: [
      {
        type: "text",
        query: "Hôte Microsoft Authority :",
        label: "Hôte d'autorité",
        name: "authority_host",
        optional: true,
        default: "https://login.microsoftonline.com",
        description:
          "L'hôte d'autorité d'identité Microsoft utilisé pour l'authentification. " +
          "Pour la plupart des déploiements, laissez la valeur par défaut. " +
          "Pour GCC High / DoD, utilisez https://login.microsoftonline.us",
      },
      {
        type: "text",
        query: "Hôte API Microsoft Graph :",
        label: "Hôte API Graph",
        name: "graph_api_host",
        optional: true,
        default: "https://graph.microsoft.com",
        description:
          "L'hôte de l'API Microsoft Graph. " +
          "Pour la plupart des déploiements, laissez la valeur par défaut. " +
          "Pour GCC High / DoD, utilisez https://graph.microsoft.us",
      },
    ],
  },
  discourse: {
    description: "Configurer le connecteur Discourse",
    values: [
      {
        type: "text",
        query: "Saisissez l'URL de base :",
        label: "URL de base",
        name: "base_url",
        optional: false,
      },
      {
        type: "list",
        query: "Saisissez les catégories à inclure :",
        label: "Catégories",
        name: "categories",
        optional: true,
      },
    ],
    advanced_values: [],
  },
  drupal_wiki: {
    description: "Configurer le connecteur Drupal Wiki",
    values: [
      {
        type: "text",
        query: "Saisissez l'URL de base de l'instance Drupal Wiki :",
        label: "URL de base",
        name: "base_url",
        optional: false,
        description:
          "L'URL de base de votre instance Drupal Wiki (ex. https://help.drupal-wiki.com )",
      },
      {
        type: "tab",
        name: "indexing_scope",
        label: "Que faut-il indexer depuis Drupal Wiki ?",
        optional: true,
        tabs: [
          {
            value: "everything",
            label: "Tout",
            fields: [
              {
                type: "string_tab",
                label: "Tout",
                name: "everything_description",
                description:
                  "Ce connecteur indexera tous les espaces accessibles avec les identifiants fournis !",
              },
            ],
          },
          {
            value: "specific",
            label: "Espaces/Pages spécifiques",
            fields: [
              {
                type: "list",
                query: "Saisissez les identifiants d'espaces à inclure :",
                label: "Identifiants d'espaces",
                name: "spaces",
                description:
                  "Spécifiez un ou plusieurs identifiants d'espaces à indexer. Seules les valeurs numériques sont autorisées.",
                optional: true,
                transform: (values: string[]) =>
                  values.filter((value) => /^\d+$/.test(value.trim())),
              },
              {
                type: "list",
                query: "Saisissez les identifiants de pages à inclure :",
                label: "Identifiants de pages",
                name: "pages",
                description:
                  "Spécifiez un ou plusieurs identifiants de pages à indexer. Seules les valeurs numériques sont autorisées.",
                optional: true,
                transform: (values: string[]) =>
                  values.filter((value) => /^\d+$/.test(value.trim())),
              },
            ],
          },
        ],
      },
      {
        type: "checkbox",
        query: "Inclure les pièces jointes ?",
        label: "Inclure les pièces jointes",
        name: "include_attachments",
        description:
          "Activer le traitement des pièces jointes des pages, y compris les images et les documents",
        default: false,
      },
    ],
    advanced_values: [],
  },
  axero: {
    description: "Configurer le connecteur Axero",
    values: [
      {
        type: "list",
        query: "Saisissez les espaces à inclure :",
        label: "Espaces",
        name: "spaces",
        optional: true,
        description:
          "Spécifiez zéro ou plusieurs espaces à indexer (par leurs identifiants). Si aucun identifiant n'est spécifié, tous les espaces seront indexés.",
      },
    ],
    advanced_values: [],
    overrideDefaultFreq: 60 * 60 * 24,
  },
  productboard: {
    description: "Configurer le connecteur Productboard",
    values: [],
    advanced_values: [],
  },
  slack: {
    description: "Configurer le connecteur Slack",
    values: [],
    advanced_values: [
      {
        type: "list",
        query: "Saisissez les canaux à inclure :",
        label: "Canaux",
        name: "channels",
        description: `Spécifiez zéro ou plusieurs canaux à indexer. Par exemple, spécifier le canal "support" n'indexera que le contenu du canal "#support". Si aucun canal n'est spécifié, tous les canaux de votre espace de travail seront indexés.`,
        optional: true,
        // Slack Channels can only be lowercase
        transform: (values) => values.map((value) => value.toLowerCase()),
      },
      {
        type: "checkbox",
        query: "Activer le regex de canal ?",
        label: "Activer le regex de canal",
        name: "channel_regex_enabled",
        description: `Si activé, les "canaux" spécifiés ci-dessus seront traités comme des expressions régulières. Les messages d'un canal seront récupérés par le connecteur si le nom du canal correspond entièrement à l'une des expressions régulières spécifiées.
Par exemple, spécifier .*-support.* comme "canal" inclura tout canal contenant "-support" dans son nom.`,
        optional: true,
      },
      {
        type: "checkbox",
        query: "Inclure les messages des bots ?",
        label: "Inclure les messages des bots",
        name: "include_bot_messages",
        description:
          "Si activé, les messages des bots et applications seront indexés. Utile pour les canaux principalement alimentés par des bots (ex. mises à jour CRM, notes automatisées).",
        optional: true,
      },
    ],
  },
  slab: {
    description: "Configurer le connecteur Slab",
    values: [
      {
        type: "text",
        query: "Saisissez l'URL de base :",
        label: "URL de base",
        name: "base_url",
        optional: false,
        description: `Spécifiez l'URL de base de votre équipe Slab. Elle ressemblera à : https://onyx.slab.com/`,
      },
    ],
    advanced_values: [],
  },
  guru: {
    description: "Configurer le connecteur Guru",
    values: [],
    advanced_values: [],
  },
  gong: {
    description: "Configurer le connecteur Gong",
    values: [
      {
        type: "list",
        query: "Saisissez les espaces de travail à inclure :",
        label: "Espaces de travail",
        name: "workspaces",
        optional: true,
        description:
          "Spécifiez zéro ou plusieurs espaces de travail à indexer. Fournissez l'identifiant ou le nom EXACT de l'espace de travail dans Gong. Si aucun n'est spécifié, les transcriptions de tous les espaces de travail seront indexées.",
      },
    ],
    advanced_values: [],
  },
  loopio: {
    description: "Configurer le connecteur Loopio",
    values: [
      {
        type: "text",
        query: "Saisissez le nom de la pile Loopio",
        label: "Nom de la pile Loopio",
        name: "loopio_stack_name",
        description:
          "Doit correspondre exactement au nom dans la gestion de bibliothèque ; laissez vide pour indexer toutes les piles",
        optional: true,
      },
    ],
    advanced_values: [],
    overrideDefaultFreq: 60 * 60 * 24,
  },
  file: {
    description: "Configurer le connecteur de fichiers",
    values: [
      {
        type: "file",
        query: "Saisissez les emplacements des fichiers :",
        label: "Fichiers",
        name: "file_locations",
        optional: false,
      },
    ],
    advanced_values: [],
  },
  zulip: {
    description: "Configurer le connecteur Zulip",
    values: [
      {
        type: "text",
        query: "Saisissez le nom du royaume",
        label: "Nom du royaume",
        name: "realm_name",
        optional: false,
      },
      {
        type: "text",
        query: "Saisissez l'URL du royaume",
        label: "URL du royaume",
        name: "realm_url",
        optional: false,
      },
    ],
    advanced_values: [],
  },
  coda: {
    description: "Configurer le connecteur Coda",
    values: [],
    advanced_values: [],
  },
  notion: {
    description: "Configurer le connecteur Notion",
    values: [
      {
        type: "text",
        query: "Saisissez l'identifiant de la page racine",
        label: "Identifiant de la page racine",
        name: "root_page_id",
        optional: true,
        description:
          "Si spécifié, seule la page indiquée et toutes ses pages enfants seront indexées. Si laissé vide, toutes les pages auxquelles l'intégration a accès seront indexées.",
      },
    ],
    advanced_values: [],
  },
  hubspot: {
    description: "Configurer le connecteur HubSpot",
    values: [
      {
        type: "multiselect",
        query: "Sélectionnez les objets HubSpot à indexer :",
        label: "Types d'objets",
        name: "object_types",
        options: [
          { name: "Tickets", value: "tickets" },
          { name: "Entreprises", value: "companies" },
          { name: "Transactions", value: "deals" },
          { name: "Contacts", value: "contacts" },
        ],
        default: ["tickets", "companies", "deals", "contacts"],
        description:
          "Choisissez les types d'objets HubSpot à indexer. Tous les types sont sélectionnés par défaut.",
        optional: false,
      },
    ],
    advanced_values: [],
  },
  document360: {
    description: "Configurer le connecteur Document360",
    values: [
      {
        type: "text",
        query: "Saisissez l'espace de travail",
        label: "Espace de travail",
        name: "workspace",
        optional: false,
      },
      {
        type: "list",
        query: "Saisissez les catégories à inclure",
        label: "Catégories",
        name: "categories",
        optional: true,
        description:
          "Spécifiez zéro ou plusieurs catégories à indexer. Par exemple, spécifier la catégorie 'Aide' n'indexera que le contenu de la catégorie 'Aide'. Si aucune catégorie n'est spécifiée, toutes les catégories de votre espace de travail seront indexées.",
      },
    ],
    advanced_values: [],
  },
  clickup: {
    description: "Configurer le connecteur ClickUp",
    values: [
      {
        type: "select",
        query: "Sélectionnez le type de connecteur :",
        label: "Type de connecteur",
        name: "connector_type",
        optional: false,
        options: [
          { name: "list", value: "list" },
          { name: "folder", value: "folder" },
          { name: "space", value: "space" },
          { name: "workspace", value: "workspace" },
        ],
      },
      {
        type: "list",
        query: "Saisissez les identifiants du connecteur :",
        label: "Identifiants du connecteur",
        name: "connector_ids",
        description: "Spécifiez zéro ou plusieurs identifiants à indexer.",
        optional: true,
      },
      {
        type: "checkbox",
        query: "Récupérer les commentaires des tâches ?",
        label: "Récupérer les commentaires des tâches",
        name: "retrieve_task_comments",
        description:
          "Si coché, tous les commentaires de chaque tâche seront également récupérés et indexés.",
        optional: false,
      },
    ],
    advanced_values: [],
  },
  google_sites: {
    description: "Configurer le connecteur Google Sites",
    values: [
      {
        type: "file",
        query: "Saisissez le chemin du fichier zip :",
        label: "Emplacements des fichiers",
        name: "file_locations",
        optional: false,
        description:
          "Téléversez un fichier zip contenant le HTML de votre site Google Sites",
      },
      {
        type: "text",
        query: "Saisissez l'URL de base :",
        label: "URL de base",
        name: "base_url",
        optional: false,
      },
    ],
    advanced_values: [],
  },
  zendesk: {
    description: "Configurer le connecteur Zendesk",
    values: [
      {
        type: "select",
        query: "Sélectionnez le contenu que ce connecteur indexera :",
        label: "Type de contenu",
        name: "content_type",
        optional: false,
        options: [
          { name: "articles", value: "articles" },
          { name: "tickets", value: "tickets" },
        ],
        default: "articles",
      },
    ],
    advanced_values: [
      {
        type: "number",
        label: "Appels API par minute",
        name: "calls_per_minute",
        optional: true,
        description:
          "Limite le nombre d'appels API Zendesk que ce connecteur peut effectuer par minute (s'applique uniquement à ce connecteur). Voir les limites par défaut : https://developer.zendesk.com/api-reference/introduction/rate-limits/",
      },
    ],
  },
  linear: {
    description: "Configurer le connecteur Linear",
    values: [],
    advanced_values: [],
  },
  dropbox: {
    description: "Configurer le connecteur Dropbox",
    values: [],
    advanced_values: [],
  },
  s3: {
    description: "Configurer le connecteur S3",
    values: [
      {
        type: "text",
        query: "Saisissez le nom du seau :",
        label: "Nom du seau",
        name: "bucket_name",
        optional: false,
      },
      {
        type: "text",
        query: "Saisissez le préfixe :",
        label: "Préfixe",
        name: "prefix",
        optional: true,
      },
      {
        type: "text",
        label: "Bucket Type",
        name: "bucket_type",
        optional: false,
        default: "s3",
        hidden: true,
      },
    ],
    advanced_values: [],
    overrideDefaultFreq: 60 * 60 * 24,
  },
  r2: {
    description: "Configurer le connecteur R2",
    values: [
      {
        type: "text",
        query: "Saisissez le nom du seau :",
        label: "Nom du seau",
        name: "bucket_name",
        optional: false,
      },
      {
        type: "text",
        query: "Saisissez le préfixe :",
        label: "Préfixe",
        name: "prefix",
        optional: true,
      },
      {
        type: "checkbox",
        label: "Résidence des données UE",
        name: "european_residency",
        description:
          "Cochez cette case si votre seau a la résidence des données UE activée.",
        optional: true,
        default: false,
      },
      {
        type: "text",
        label: "Bucket Type",
        name: "bucket_type",
        optional: false,
        default: "r2",
        hidden: true,
      },
    ],
    advanced_values: [],
    overrideDefaultFreq: 60 * 60 * 24,
  },
  google_cloud_storage: {
    description: "Configurer le connecteur Google Cloud Storage",
    values: [
      {
        type: "text",
        query: "Saisissez le nom du seau :",
        label: "Nom du seau",
        name: "bucket_name",
        optional: false,
        description: "Nom du seau GCS à indexer, ex. my-gcs-bucket",
      },
      {
        type: "text",
        query: "Saisissez le préfixe :",
        label: "Préfixe de chemin",
        name: "prefix",
        optional: true,
      },
      {
        type: "text",
        label: "Bucket Type",
        name: "bucket_type",
        optional: false,
        default: "google_cloud_storage",
        hidden: true,
      },
    ],
    advanced_values: [],
    overrideDefaultFreq: 60 * 60 * 24,
  },
  oci_storage: {
    description: "Configurer le connecteur OCI Storage",
    values: [
      {
        type: "text",
        query: "Saisissez le nom du seau :",
        label: "Nom du seau",
        name: "bucket_name",
        optional: false,
      },
      {
        type: "text",
        query: "Saisissez le préfixe :",
        label: "Préfixe",
        name: "prefix",
        optional: true,
      },
      {
        type: "text",
        label: "Bucket Type",
        name: "bucket_type",
        optional: false,
        default: "oci_storage",
        hidden: true,
      },
    ],
    advanced_values: [],
  },
  wikipedia: {
    description: "Configurer le connecteur Wikipedia",
    values: [
      {
        type: "text",
        query: "Saisissez le code de langue :",
        label: "Code de langue",
        name: "language_code",
        optional: false,
        description: "Entrez un code de langue Wikipedia valide (ex. 'fr', 'en')",
      },
      {
        type: "list",
        query: "Saisissez les catégories à inclure :",
        label: "Catégories à indexer",
        name: "categories",
        description:
          "Spécifiez zéro ou plusieurs noms de catégories à indexer. Sur la plupart des sites Wikipedia, ce sont des pages de la forme 'Catégorie : XYZ', qui sont des listes d'autres pages/catégories. Indiquez uniquement le nom de la catégorie, pas son URL.",
        optional: true,
      },
      {
        type: "list",
        query: "Saisissez les pages à inclure :",
        label: "Pages",
        name: "pages",
        optional: true,
        description: "Spécifiez zéro ou plusieurs noms de pages à indexer.",
      },
      {
        type: "number",
        query: "Saisissez la profondeur de récursion :",
        label: "Profondeur de récursion",
        name: "recurse_depth",
        description:
          "Lors de l'indexation de catégories ayant des sous-catégories, cela détermine le nombre de niveaux à indexer. Spécifiez 0 pour n'indexer que la catégorie elle-même (sans récursion). Spécifiez -1 pour une profondeur de récursion illimitée. Dans de rares cas, une catégorie peut se contenir elle-même dans ses dépendances, ce qui provoquerait une boucle infinie. N'utilisez -1 que si vous êtes certain que cela ne se produira pas.",
        optional: false,
      },
    ],
    advanced_values: [],
  },
  xenforo: {
    description: "Configurer le connecteur Xenforo",
    values: [
      {
        type: "text",
        query: "Saisissez l'URL du forum ou du fil :",
        label: "URL",
        name: "base_url",
        optional: false,
        description:
          "L'URL du forum XenForo v2.2 à indexer. Peut être un forum ou un fil de discussion.",
      },
    ],
    advanced_values: [],
  },
  asana: {
    description: "Configurer le connecteur Asana",
    values: [
      {
        type: "text",
        query: "Saisissez l'identifiant de votre espace de travail Asana :",
        label: "Identifiant de l'espace de travail",
        name: "asana_workspace_id",
        optional: false,
        description:
          "L'identifiant de l'espace de travail Asana à indexer. Vous pouvez le trouver sur https://app.asana.com/api/1.0/workspaces. C'est un nombre ressemblant à 1234567890123456.",
      },
      {
        type: "text",
        query: "Saisissez les identifiants de projets à indexer (optionnel) :",
        label: "Identifiants de projets",
        name: "asana_project_ids",
        description:
          "Identifiants de projets Asana spécifiques à indexer, séparés par des virgules. Laissez vide pour indexer tous les projets de l'espace de travail. Exemple : 1234567890123456,2345678901234567",
        optional: true,
      },
      {
        type: "text",
        query: "Saisissez l'identifiant de l'équipe (optionnel) :",
        label: "Identifiant de l'équipe",
        name: "asana_team_id",
        optional: true,
        description:
          "Identifiant d'une équipe pour accéder aux tâches visibles par l'équipe. Cela permet d'indexer les tâches visibles par l'équipe en plus des tâches publiques. Laissez vide si vous ne souhaitez pas utiliser cette fonctionnalité.",
      },
    ],
    advanced_values: [],
  },
  mediawiki: {
    description: "Configurer le connecteur MediaWiki",
    values: [
      {
        type: "text",
        query: "Saisissez le code de langue :",
        label: "Code de langue",
        name: "language_code",
        optional: false,
        description: "Entrez un code de langue MediaWiki valide (ex. 'fr', 'en')",
      },
      {
        type: "text",
        query: "Saisissez l'URL du site MediaWiki",
        label: "URL du site MediaWiki",
        name: "hostname",
        optional: false,
      },
      {
        type: "list",
        query: "Saisissez les catégories à inclure :",
        label: "Catégories à indexer",
        name: "categories",
        description:
          "Spécifiez zéro ou plusieurs noms de catégories à indexer. Sur la plupart des sites MediaWiki, ce sont des pages de la forme 'Catégorie : XYZ', qui sont des listes d'autres pages/catégories. Indiquez uniquement le nom de la catégorie, pas son URL.",
        optional: true,
      },
      {
        type: "list",
        query: "Saisissez les pages à inclure :",
        label: "Pages",
        name: "pages",
        optional: true,
        description:
          "Spécifiez zéro ou plusieurs noms de pages à indexer. Indiquez uniquement le nom de la page, pas son URL.",
      },
      {
        type: "number",
        query: "Saisissez la profondeur de récursion :",
        label: "Profondeur de récursion",
        name: "recurse_depth",
        description:
          "Lors de l'indexation de catégories ayant des sous-catégories, cela détermine le nombre de niveaux à indexer. Spécifiez 0 pour n'indexer que la catégorie elle-même (sans récursion). Spécifiez -1 pour une profondeur de récursion illimitée. Dans de rares cas, une catégorie peut se contenir elle-même dans ses dépendances, ce qui provoquerait une boucle infinie. N'utilisez -1 que si vous êtes certain que cela ne se produira pas.",
        optional: true,
      },
    ],
    advanced_values: [],
  },
  discord: {
    description: "Configurer le connecteur Discord",
    values: [],
    advanced_values: [
      {
        type: "list",
        query: "Saisissez les identifiants de serveurs à inclure :",
        label: "Identifiants de serveurs",
        name: "server_ids",
        description: `Spécifiez zéro ou plusieurs identifiants de serveurs à inclure. Seuls les canaux qu'ils contiennent seront utilisés pour l'indexation.`,
        optional: true,
      },
      {
        type: "list",
        query: "Saisissez les noms de canaux à inclure :",
        label: "Canaux",
        name: "channel_names",
        description: `Spécifiez zéro ou plusieurs canaux à indexer. Par exemple, spécifier le canal "support" n'indexera que le contenu du canal "#support". Si aucun canal n'est spécifié, tous les canaux accessibles au bot seront indexés.`,
        optional: true,
      },
      {
        type: "text",
        query: "Saisissez la date de début :",
        label: "Date de début",
        name: "start_date",
        description: `Seuls les messages postérieurs à cette date seront indexés. Format : AAAA-MM-JJ`,
        optional: true,
      },
    ],
  },
  freshdesk: {
    description: "Configurer le connecteur Freshdesk",
    values: [],
    advanced_values: [],
  },
  fireflies: {
    description: "Configurer le connecteur Fireflies",
    values: [],
    advanced_values: [],
  },
  egnyte: {
    description: "Configurer le connecteur Egnyte",
    values: [
      {
        type: "text",
        query: "Saisissez le chemin du dossier à indexer :",
        label: "Chemin du dossier",
        name: "folder_path",
        optional: true,
        description:
          "Le chemin du dossier à indexer (ex. '/Shared/Documents'). Laissez vide pour tout indexer.",
      },
    ],
    advanced_values: [],
  },
  airtable: {
    description: "Configurer le connecteur Airtable",
    values: [
      {
        type: "tab",
        name: "airtable_scope",
        label: "Que faut-il indexer depuis Airtable ?",
        optional: true,
        tabs: [
          {
            value: "everything",
            label: "Tout",
            fields: [
              {
                type: "string_tab",
                label: "Tout",
                name: "everything_description",
                description:
                  "Ce connecteur découvrira et indexera automatiquement toutes les bases et tables accessibles avec votre token API.",
              },
            ],
          },
          {
            value: "specific",
            label: "Table spécifique",
            fields: [
              {
                type: "text",
                query: "Collez l'URL Airtable :",
                label: "URL Airtable",
                name: "airtable_url",
                optional: false,
                description:
                  "Collez l'URL de votre navigateur lors de la visualisation de la table, ex. https://airtable.com/appXXX/tblYYY/viwZZZ",
              },
              {
                type: "text",
                label: "Identifiant de partage",
                name: "share_id",
                optional: true,
                description:
                  "Optionnel. Si vous souhaitez que les liens vers les enregistrements utilisent une URL de vue partagée, saisissez l'identifiant de partage ici, ex. shrkfjEzDmLaDtK83.",
              },
            ],
          },
        ],
      },
      {
        type: "checkbox",
        label: "Traiter tous les champs sauf les pièces jointes comme métadonnées",
        name: "treat_all_non_attachment_fields_as_metadata",
        description:
          "Choisissez cette option si le contenu principal à indexer sont des pièces jointes et que toutes les autres colonnes sont des métadonnées.",
        optional: false,
      },
    ],
    advanced_values: [],
    overrideDefaultFreq: 60 * 60 * 24,
  },
  highspot: {
    description: "Configurer le connecteur Highspot",
    values: [
      {
        type: "tab",
        name: "highspot_scope",
        label: "Que faut-il indexer depuis Highspot ?",
        optional: true,
        tabs: [
          {
            value: "spots",
            label: "Spots spécifiques",
            fields: [
              {
                type: "list",
                query: "Saisissez le(s) nom(s) de spot :",
                label: "Nom(s) de spot",
                name: "spot_names",
                optional: false,
                description: "Pour plusieurs spots, saisissez-les un par un.",
              },
            ],
          },
          {
            value: "everything",
            label: "Tout",
            fields: [
              {
                type: "string_tab",
                label: "Tout",
                name: "everything",
                description:
                  "Ce connecteur indexera tous les spots accessibles avec les identifiants fournis !",
              },
            ],
          },
        ],
      },
    ],
    advanced_values: [],
  },
  imap: {
    description: "Configurer le connecteur e-mail",
    values: [
      {
        type: "text",
        query: "Saisissez l'hôte du serveur IMAP :",
        label: "Hôte du serveur IMAP",
        name: "host",
        optional: false,
        description:
          "Le nom d'hôte du serveur IMAP (ex. imap.gmail.com, outlook.office365.com)",
      },
      {
        type: "number",
        query: "Saisissez le port du serveur IMAP :",
        label: "Port du serveur IMAP",
        name: "port",
        optional: true,
        default: 993,
        description: "Le port du serveur IMAP (défaut : 993 pour SSL)",
      },
      {
        type: "list",
        query: "Saisissez les boîtes aux lettres à inclure :",
        label: "Boîtes aux lettres",
        name: "mailboxes",
        optional: true,
        description:
          "Spécifiez les boîtes aux lettres à indexer (ex. INBOX, Sent, Drafts). Laissez vide pour tout indexer.",
      },
    ],
    advanced_values: [],
  },
};
type ConnectorField = ConnectionConfiguration["values"][number];

const buildInitialValuesForFields = (
  fields: ConnectorField[]
): Record<string, any> =>
  fields.reduce(
    (acc, field) => {
      if (field.type === "select") {
        acc[field.name] = null;
      } else if (field.type === "list") {
        acc[field.name] = field.default || [];
      } else if (field.type === "multiselect") {
        acc[field.name] = field.default || [];
      } else if (field.type === "checkbox") {
        acc[field.name] = field.default ?? false;
      } else if (field.default !== undefined) {
        acc[field.name] = field.default;
      }
      return acc;
    },
    {} as Record<string, any>
  );

export function createConnectorInitialValues(
  connector: ConfigurableSources
): Record<string, any> & AccessTypeGroupSelectorFormType {
  const configuration = connectorConfigs[connector];

  return {
    name: "",
    groups: [],
    access_type: "public",
    ...buildInitialValuesForFields(configuration.values),
    ...buildInitialValuesForFields(configuration.advanced_values),
  };
}

export function createConnectorValidationSchema(
  connector: ConfigurableSources
): Yup.ObjectSchema<Record<string, any>> {
  const configuration = connectorConfigs[connector];

  const object = Yup.object().shape({
    access_type: Yup.string().required("Le type d'accès est requis"),
    name: Yup.string().required("Le nom du connecteur est requis"),
    ...[...configuration.values, ...configuration.advanced_values].reduce(
      (acc, field) => {
        let schema: any =
          field.type === "select"
            ? Yup.string()
            : field.type === "list"
              ? Yup.array().of(Yup.string())
              : field.type === "multiselect"
                ? Yup.array().of(Yup.string())
                : field.type === "checkbox"
                  ? Yup.boolean()
                  : field.type === "file"
                    ? Yup.mixed()
                    : Yup.string();

        if (!field.optional) {
          schema = schema.required(`${field.label} est requis`);
        }

        acc[field.name] = schema;
        return acc;
      },
      {} as Record<string, any>
    ),
    // These are advanced settings
    indexingStart: Yup.string().nullable(),
    pruneFreq: Yup.number().min(
      0.083,
      "La fréquence de nettoyage doit être d'au moins 0,083 heure (5 minutes)"
    ),
    refreshFreq: Yup.number().min(
      1,
      "La fréquence de rafraîchissement doit être d'au moins 1 minute"
    ),
  });

  return object;
}

export const defaultPruneFreqHours = 720; // 30 days in hours
export const defaultRefreshFreqMinutes = 30; // 30 minutes

// CONNECTORS
export interface ConnectorBase<T> {
  name: string;
  source: ValidSources;
  input_type: ValidInputTypes;
  connector_specific_config: T;
  refresh_freq: number | null;
  prune_freq: number | null;
  indexing_start: Date | null;
  access_type: string;
  groups?: number[];
  from_beginning?: boolean;
}

export interface Connector<T> extends ConnectorBase<T> {
  id: number;
  credential_ids: number[];
  time_created: string;
  time_updated: string;
}

export interface ConnectorSnapshot {
  id: number;
  name: string;
  source: ValidSources;
  input_type: ValidInputTypes;
  // connector_specific_config
  refresh_freq: number | null;
  prune_freq: number | null;
  credential_ids: number[];
  indexing_start: number | null;
  time_created: string;
  time_updated: string;
  from_beginning?: boolean;
}

export interface WebConfig {
  base_url: string;
  web_connector_type?: "recursive" | "single" | "sitemap";
}

export interface GithubConfig {
  repo_owner: string;
  repositories: string; // Comma-separated list of repository names
  include_prs: boolean;
  include_issues: boolean;
}

export interface GitlabConfig {
  project_owner: string;
  project_name: string;
  include_mrs: boolean;
  include_issues: boolean;
}

export interface BitbucketConfig {
  workspace: string;
  repositories?: string;
  projects?: string;
}

export interface GoogleDriveConfig {
  include_shared_drives?: boolean;
  shared_drive_urls?: string;
  include_my_drives?: boolean;
  my_drive_emails?: string;
  shared_folder_urls?: string;
}

export interface GmailConfig {}

export interface BookstackConfig {}

export interface OutlineConfig {}

export interface ConfluenceConfig {
  wiki_base: string;
  space?: string;
  page_id?: string;
  is_cloud?: boolean;
  index_recursively?: boolean;
  cql_query?: string;
}

export interface JiraConfig {
  jira_project_url: string;
  project_key?: string;
  comment_email_blacklist?: string[];
  jql_query?: string;
}

export interface SalesforceConfig {
  requested_objects?: string[];
}

export interface SharepointConfig {
  sites?: string[];
  include_site_pages?: boolean;
  treat_sharing_link_as_public?: boolean;
  include_site_documents?: boolean;
  authority_host?: string;
  graph_api_host?: string;
  sharepoint_domain_suffix?: string;
}

export interface TeamsConfig {
  teams?: string[];
  authority_host?: string;
  graph_api_host?: string;
}

export interface DiscourseConfig {
  base_url: string;
  categories?: string[];
}

export interface AxeroConfig {
  spaces?: string[];
}

export interface DrupalWikiConfig {
  base_url: string;
  spaces?: string[];
  pages?: string[];
  include_attachments?: boolean;
}

export interface ProductboardConfig {}

export interface SlackConfig {
  workspace: string;
  channels?: string[];
  channel_regex_enabled?: boolean;
  include_bot_messages?: boolean;
}

export interface SlabConfig {
  base_url: string;
}

export interface GuruConfig {}

export interface GongConfig {
  workspaces?: string[];
}

export interface LoopioConfig {
  loopio_stack_name?: string;
}

export interface FileConfig {
  file_locations: string[];
  file_names: string[];
  zip_metadata_file_id: string | null;
}

export interface ZulipConfig {
  realm_name: string;
  realm_url: string;
}

export interface CodaConfig {
  workspace_id?: string;
}

export interface NotionConfig {
  root_page_id?: string;
}

export interface HubSpotConfig {
  object_types?: string[];
}

export interface Document360Config {
  workspace: string;
  categories?: string[];
}

export interface ClickupConfig {
  connector_type: "list" | "folder" | "space" | "workspace";
  connector_ids?: string[];
  retrieve_task_comments: boolean;
}

export interface GoogleSitesConfig {
  zip_path: string;
  base_url: string;
}

export interface XenforoConfig {
  base_url: string;
}

export interface ZendeskConfig {
  content_type?: "articles" | "tickets";
  calls_per_minute?: number;
}

export interface DropboxConfig {}

export interface S3Config {
  bucket_type: "s3";
  bucket_name: string;
  prefix: string;
}

export interface R2Config {
  bucket_type: "r2";
  bucket_name: string;
  prefix: string;
  european_residency?: boolean;
}

export interface GCSConfig {
  bucket_type: "google_cloud_storage";
  bucket_name: string;
  prefix: string;
}

export interface OCIConfig {
  bucket_type: "oci_storage";
  bucket_name: string;
  prefix: string;
}

export interface MediaWikiBaseConfig {
  connector_name: string;
  language_code: string;
  categories?: string[];
  pages?: string[];
  recurse_depth?: number;
}

export interface AsanaConfig {
  asana_workspace_id: string;
  asana_project_ids?: string;
  asana_team_id?: string;
}

export interface FreshdeskConfig {}

export interface FirefliesConfig {}

export interface MediaWikiConfig extends MediaWikiBaseConfig {
  hostname: string;
}

export interface WikipediaConfig extends MediaWikiBaseConfig {}

export interface ImapConfig {
  host: string;
  port?: number;
  mailboxes?: string[];
}
