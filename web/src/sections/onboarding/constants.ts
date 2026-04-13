import { OnboardingStep, FinalStepItemProps } from "@/interfaces/onboarding";
import { SvgGlobe, SvgImage, SvgUsers } from "@opal/icons";

type StepConfig = {
  index: number;
  title: string;
  buttonText: string;
  iconPercentage: number;
};

export const STEP_CONFIG: Record<OnboardingStep, StepConfig> = {
  [OnboardingStep.Welcome]: {
    index: 0,
    title: "Prenons un moment pour vous configurer.",
    buttonText: "Commencer",
    iconPercentage: 10,
  },
  [OnboardingStep.Name]: {
    index: 1,
    title: "Prenons un moment pour vous configurer.",
    buttonText: "Suivant",
    iconPercentage: 40,
  },
  [OnboardingStep.LlmSetup]: {
    index: 2,
    title: "Presque ! Connectez vos modèles pour commencer à discuter.",
    buttonText: "Suivant",
    iconPercentage: 70,
  },
  [OnboardingStep.Complete]: {
    index: 3,
    title: "Vous êtes prêt ! Consultez les paramètres optionnels ou cliquez sur Terminer la configuration",
    buttonText: "Terminer la configuration",
    iconPercentage: 100,
  },
} as const;

export const TOTAL_STEPS = 3;

export const STEP_NAVIGATION: Record<
  OnboardingStep,
  { next?: OnboardingStep; prev?: OnboardingStep }
> = {
  [OnboardingStep.Welcome]: { next: OnboardingStep.Name },
  [OnboardingStep.Name]: {
    next: OnboardingStep.LlmSetup,
    prev: OnboardingStep.Welcome,
  },
  [OnboardingStep.LlmSetup]: {
    next: OnboardingStep.Complete,
    prev: OnboardingStep.Name,
  },
  [OnboardingStep.Complete]: { prev: OnboardingStep.LlmSetup },
};

export const FINAL_SETUP_CONFIG: FinalStepItemProps[] = [
  {
    title: "Sélectionner un fournisseur de recherche web",
    description: "Permettre à Onyx de rechercher des informations sur internet.",
    icon: SvgGlobe,
    buttonText: "Recherche web",
    buttonHref: "/admin/configuration/web-search",
  },
  {
    title: "Activer la génération d'images",
    description: "Configurer des modèles pour créer des images dans vos conversations.",
    icon: SvgImage,
    buttonText: "Génération d'images",
    buttonHref: "/admin/configuration/image-generation",
  },
  {
    title: "Inviter votre équipe",
    description: "Gérer les utilisateurs et les permissions de votre équipe",
    icon: SvgUsers,
    buttonText: "Gérer les utilisateurs",
    buttonHref: "/admin/users",
  },
];
