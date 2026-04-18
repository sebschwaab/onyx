import React from "react";
import NumberInput from "./ConnectorInput/NumberInput";
import { TextFormField } from "@/components/Field";
import { Button } from "@opal/components";
import { SvgTrash } from "@opal/icons";
export default function AdvancedFormPage() {
  return (
    <div className="py-4 flex flex-col gap-y-6 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-text-800">
        Configuration avancée
      </h2>

      <NumberInput
        description={`
          Vérifie tous les documents par rapport à la source pour supprimer ceux qui n'existent plus.
          Remarque : ce processus vérifie chaque document, soyez donc prudent en augmentant la fréquence.
          Par défaut : 720 heures (30 jours). Les heures décimales sont prises en charge (ex. : 0,1 heure = 6 minutes).
          Saisissez 0 pour désactiver l'élagage pour ce connecteur.
        `}
        label="Fréquence d'élagage (heures)"
        name="pruneFreq"
      />

      <NumberInput
        description="C'est la fréquence à laquelle nous récupérons de nouveaux documents depuis la source (en minutes). Si vous saisissez 0, nous ne récupérerons jamais de nouveaux documents pour ce connecteur."
        label="Fréquence de rafraîchissement (minutes)"
        name="refreshFreq"
      />

      <TextFormField
        type="date"
        subtext="Les documents antérieurs à cette date ne seront pas récupérés"
        optional
        label="Date de début d'indexation"
        name="indexingStart"
      />
      <div className="mt-4 flex w-full mx-auto max-w-2xl justify-start">
        <Button variant="danger" icon={SvgTrash} type="submit">
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}
