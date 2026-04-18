import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CircleAlert, Info } from "lucide-react";
import { BillingInformation, BillingStatus } from "@/lib/billing/interfaces";

export function BillingAlerts({
  billingInformation,
}: {
  billingInformation: BillingInformation;
}) {
  const isTrialing = billingInformation.status === BillingStatus.TRIALING;
  const isCancelled = billingInformation.cancel_at_period_end;
  const isExpired = billingInformation.current_period_end
    ? new Date(billingInformation.current_period_end) < new Date()
    : false;
  const noPaymentMethod = !billingInformation.payment_method_enabled;

  const messages: string[] = [];

  if (isExpired) {
    messages.push(
      "Votre abonnement a expiré. Veuillez vous réabonner pour continuer à utiliser le service."
    );
  }
  if (isCancelled && !isExpired && billingInformation.current_period_end) {
    messages.push(
      `Votre abonnement sera annulé le ${new Date(
        billingInformation.current_period_end
      ).toLocaleDateString("fr-FR")}. Vous pouvez vous réabonner avant cette date pour rester sans interruption.`
    );
  }
  if (isTrialing) {
    messages.push(
      `Vous êtes actuellement en période d'essai. Votre essai se termine le ${
        billingInformation.trial_end
          ? new Date(billingInformation.trial_end).toLocaleDateString("fr-FR")
          : "N/A"
      }.`
    );
  }
  if (noPaymentMethod) {
    messages.push(
      "Vous n'avez actuellement aucun moyen de paiement enregistré. Veuillez en ajouter un pour éviter une interruption du service."
    );
  }

  const variant = isExpired || noPaymentMethod ? "destructive" : "default";

  if (messages.length === 0) return null;

  return (
    <Alert variant={variant}>
      <AlertTitle className="flex items-center space-x-2">
        {variant === "destructive" ? (
          <CircleAlert className="h-4 w-4" />
        ) : (
          <Info className="h-4 w-4" />
        )}
        <span>
          {variant === "destructive"
            ? "Important Subscription Notice"
            : "Subscription Notice"}
        </span>
      </AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {messages.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
