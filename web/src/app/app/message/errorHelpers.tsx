import { AlertCircle, Clock, Lock, Wifi, Server } from "lucide-react";

/**
 * Get the appropriate icon for a given error code
 */
export const getErrorIcon = (errorCode?: string) => {
  switch (errorCode) {
    case "RATE_LIMIT":
      return <Clock className="h-4 w-4" />;
    case "AUTH_ERROR":
    case "PERMISSION_DENIED":
      return <Lock className="h-4 w-4" />;
    case "CONNECTION_ERROR":
      return <Wifi className="h-4 w-4" />;
    case "SERVICE_UNAVAILABLE":
      return <Server className="h-4 w-4" />;
    case "BUDGET_EXCEEDED":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

/**
 * Get a human-readable title for a given error code
 */
export const getErrorTitle = (errorCode?: string) => {
  switch (errorCode) {
    case "RATE_LIMIT":
      return "Limite de débit dépassée";
    case "AUTH_ERROR":
      return "Erreur d'authentification";
    case "PERMISSION_DENIED":
      return "Permission refusée";
    case "CONTEXT_TOO_LONG":
      return "Message trop long";
    case "TOOL_CALL_FAILED":
      return "Erreur d'outil";
    case "CONNECTION_ERROR":
      return "Erreur de connexion";
    case "SERVICE_UNAVAILABLE":
      return "Service indisponible";
    case "INIT_FAILED":
      return "Erreur d'initialisation";
    case "VALIDATION_ERROR":
      return "Erreur de validation";
    case "BUDGET_EXCEEDED":
      return "Budget dépassé";
    case "CONTENT_POLICY":
      return "Violation de la politique de contenu";
    case "BAD_REQUEST":
      return "Requête invalide";
    case "NOT_FOUND":
      return "Ressource introuvable";
    case "API_ERROR":
      return "Erreur API";
    default:
      return "Erreur";
  }
};
