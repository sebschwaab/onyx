"use client";

import Text from "@/refresh-components/texts/Text";

interface ToggleWarningModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ToggleWarningModal({
  open,
  onConfirm,
  onCancel,
}: ToggleWarningModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-xl mx-4 bg-background-tint-01 rounded-16 shadow-lg border border-border-01">
        <div className="p-6 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-center">
            <Text headingH2 text05>
              Afficher tous les modèles ?
            </Text>
          </div>

          {/* Message */}
          <div className="flex justify-center">
            <Text mainUiBody text04 className="text-center">
              Nous recommandons d&apos;utiliser <strong>Claude Opus 4.6</strong> pour la création.
              <br />
              D&apos;autres modèles peuvent avoir des capacités réduites pour la création de code,
              <br />
              l&apos;analyse de données et la génération d&apos;artefacts.
            </Text>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              className="px-4 py-2 rounded-12 bg-background-neutral-01 border border-border-02 hover:opacity-90 transition-colors"
            >
              <Text mainUiBody text05>
                Afficher tous les modèles
              </Text>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="px-4 py-2 rounded-12 bg-black dark:bg-white hover:opacity-90 transition-colors"
            >
              <Text
                mainUiAction
                className="text-text-light-05 dark:text-text-dark-05"
              >
                Garder le recommandé
              </Text>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
