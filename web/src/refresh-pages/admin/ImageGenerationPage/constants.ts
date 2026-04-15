export interface ImageProvider {
  image_provider_id: string; // Static unique key for UI-DB mapping
  model_name: string; // Actual model name for LLM API
  provider_name: string;
  title: string;
  description: string;
}

export interface ProviderGroup {
  name: string;
  providers: ImageProvider[];
}

export const IMAGE_PROVIDER_GROUPS: ProviderGroup[] = [
  {
    name: "OpenAI",
    providers: [
      {
        image_provider_id: "openai_gpt_image_1_5",
        model_name: "gpt-image-1.5",
        provider_name: "openai",
        title: "GPT Image 1.5",
        description:
          "Le dernier modèle de génération d'images d'OpenAI avec la meilleure fidélité aux prompts.",
      },
      {
        image_provider_id: "openai_gpt_image_1",
        model_name: "gpt-image-1",
        provider_name: "openai",
        title: "GPT Image 1",
        description:
          "Un modèle de génération d'images performant d'OpenAI avec une forte adhérence aux prompts.",
      },
      {
        image_provider_id: "openai_dalle_3",
        model_name: "dall-e-3",
        provider_name: "openai",
        title: "DALL-E 3",
        description:
          "Modèle de génération d'images OpenAI capable de créer des images riches et expressives.",
      },
    ],
  },
  {
    name: "Azure OpenAI",
    providers: [
      {
        image_provider_id: "azure_gpt_image_1_5",
        model_name: "", // Extracted from deployment in target URI
        provider_name: "azure",
        title: "Azure OpenAI GPT Image 1.5",
        description:
          "Modèle de génération d'images GPT Image 1.5 hébergé sur Microsoft Azure.",
      },
      {
        image_provider_id: "azure_gpt_image_1",
        model_name: "", // Extracted from deployment in target URI
        provider_name: "azure",
        title: "Azure OpenAI GPT Image 1",
        description:
          "Modèle de génération d'images GPT Image 1 hébergé sur Microsoft Azure.",
      },
      {
        image_provider_id: "azure_dalle_3",
        model_name: "", // Extracted from deployment in target URI
        provider_name: "azure",
        title: "Azure OpenAI DALL-E 3",
        description:
          "Modèle de génération d'images DALL-E 3 hébergé sur Microsoft Azure.",
      },
    ],
  },
  {
    name: "Google Cloud Vertex AI",
    providers: [
      {
        image_provider_id: "gemini-2.5-flash-image",
        model_name: "gemini-2.5-flash-image",
        provider_name: "vertex_ai",
        title: "Gemini 2.5 Flash Image",
        description:
          "Le modèle Gemini 2.5 Flash Image est conçu pour la rapidité et l'efficacité.",
      },
      {
        image_provider_id: "gemini-3-pro-image-preview",
        model_name: "gemini-3-pro-image-preview",
        provider_name: "vertex_ai",
        title: "Gemini 3 Pro Image Preview",
        description:
          "Le modèle Gemini 3 Pro Image Preview est conçu pour la production d'assets professionnels.",
      },
    ],
  },
];
