"use client";

import Text from "@/refresh-components/texts/Text";
import { SvgAlertTriangle } from "@opal/icons";
import { UsageLimits } from "@/app/craft/types/streamingTypes";

interface UpgradePlanModalProps {
  open: boolean;
  onClose: () => void;
  limits: UsageLimits | null;
}

/**
 * Modal shown when users hit their message limit.
 * Shows different messaging for free (total limit) vs paid (weekly limit) users.
 */
export default function UpgradePlanModal({
  open,
  onClose,
  limits,
}: UpgradePlanModalProps) {
  if (!open) return null;

  const isPaidUser = limits?.limitType === "weekly";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl mx-4 bg-background-tint-01 rounded-16 shadow-lg border border-border-01">
        <div className="p-6 flex flex-col gap-6 min-h-[300px]">
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <SvgAlertTriangle className="w-16 h-16 text-status-warning-02" />

            <div className="flex flex-col items-center gap-2 text-center">
              <Text headingH2 text05>
                Vous avez atteint votre limite de messages
              </Text>
              <Text mainUiBody text03 className="max-w-sm">
                {isPaidUser ? (
                  <>
                    Vous avez utilisé les {limits?.limit ?? 25} messages de cette
                    semaine. Votre limite de messages sera automatiquement réinitialisée
                    au début de chaque semaine, vous permettant de continuer à créer avec Onyx.
                  </>
                ) : (
                  <>
                    Vous avez utilisé les {limits?.limit ?? 5} messages gratuits
                    disponibles dans votre essai. Vous avez atteint la limite de votre compte gratuit.
                  </>
                )}
              </Text>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-12 border border-border-01 bg-background-tint-00 text-text-04 hover:bg-background-tint-02 transition-colors"
            >
              <Text mainUiAction>Compris</Text>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
