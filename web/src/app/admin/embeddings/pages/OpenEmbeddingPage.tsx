"use client";

import Button from "@/refresh-components/buttons/Button";
import { Text } from "@opal/components";
import { markdown } from "@opal/utils";
import Spacer from "@/refresh-components/Spacer";
import Title from "@/components/ui/title";
import { ModelSelector } from "../../../../components/embedding/ModelSelector";
import {
  AVAILABLE_MODELS,
  CloudEmbeddingModel,
  HostedEmbeddingModel,
} from "../../../../components/embedding/interfaces";
import { CustomModelForm } from "../../../../components/embedding/CustomModelForm";
import { useState } from "react";
import CardSection from "@/components/admin/CardSection";
export default function OpenEmbeddingPage({
  onSelectOpenSource,
  selectedProvider,
}: {
  onSelectOpenSource: (model: HostedEmbeddingModel) => void;
  selectedProvider: HostedEmbeddingModel | CloudEmbeddingModel;
}) {
  const [configureModel, setConfigureModel] = useState(false);
  return (
    <div>
      <Title className="mt-8">
        Voici quelques modèles hébergés localement.
      </Title>
      <Text as="p">
        {
          "Ces modèles peuvent être utilisés sans clé API et peuvent exploiter un GPU pour une inférence plus rapide."
        }
      </Text>
      <Spacer rem={1} />
      <ModelSelector
        modelOptions={AVAILABLE_MODELS}
        setSelectedModel={onSelectOpenSource}
        currentEmbeddingModel={selectedProvider}
      />

      <Spacer rem={1.5} />
      <Text as="p">
        {markdown(
          "Alternativement, (si vous savez ce que vous faites) vous pouvez spécifier un modèle compatible [SentenceTransformers](https://www.sbert.net/) de votre choix ci-dessous. La liste approximative des modèles pris en charge se trouve [ici](https://huggingface.co/models?library=sentence-transformers&sort=trending)."
        )}
      </Text>
      <Text as="p">
        {markdown(
          "**REMARQUE :** tous les modèles listés ne fonctionneront pas avec Onyx, car certains ont des interfaces uniques ou des exigences particulières. En cas de doute, contactez l'équipe Onyx."
        )}
      </Text>
      {!configureModel && (
        // TODO(@raunakab): migrate to opal Button once className/iconClassName is resolved
        <Button
          onClick={() => setConfigureModel(true)}
          className="mt-4"
          secondary
        >
          Configurer un modèle personnalisé
        </Button>
      )}
      {configureModel && (
        <div className="w-full flex">
          <CardSection className="mt-4 2xl:w-4/6 mx-auto">
            <CustomModelForm onSubmit={onSelectOpenSource} />
          </CardSection>
        </div>
      )}
    </div>
  );
}
