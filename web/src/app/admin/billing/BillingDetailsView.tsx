"use client";

import { useState } from "react";
import Link from "next/link";
import { Section } from "@/layouts/general-layouts";
import { Content } from "@opal/layouts";
import * as InputLayouts from "@/layouts/input-layouts";
import Card from "@/refresh-components/cards/Card";
import Button from "@/refresh-components/buttons/Button";
import { Button as OpalButton } from "@opal/components";
import Text from "@/refresh-components/texts/Text";
import Message from "@/refresh-components/messages/Message";
import InfoBlock from "@/refresh-components/messages/InfoBlock";
import InputNumber from "@/refresh-components/inputs/InputNumber";
import {
  SvgUsers,
  SvgExternalLink,
  SvgArrowRight,
  SvgPlus,
  SvgWallet,
  SvgFileText,
  SvgOrganization,
} from "@opal/icons";
import { BillingInformation, LicenseStatus } from "@/lib/billing/interfaces";
import {
  createCustomerPortalSession,
  resetStripeConnection,
  updateSeatCount,
  claimLicense,
  refreshLicenseCache,
} from "@/lib/billing/svc";
import { formatDateShort } from "@/lib/dateUtils";
import { humanReadableFormatShort } from "@/lib/time";
import { NEXT_PUBLIC_CLOUD_ENABLED } from "@/lib/constants";
import useUsers from "@/hooks/useUsers";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const GRACE_PERIOD_DAYS = 30;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function getExpirationState(
  billing: BillingInformation,
  license?: LicenseStatus
) {
  const isAnnualBilling = billing.billing_period === "annual";

  // Check license expiration for self-hosted
  if (license?.expires_at) {
    const expiresAt = new Date(license.expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 0 || license.status === "expired") {
      const gracePeriodEnd = license.grace_period_end
        ? new Date(license.grace_period_end)
        : new Date(
            expiresAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
          );
      const daysUntilDeletion = Math.max(
        0,
        Math.ceil(
          (gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      return {
        variant: "error" as const,
        daysRemaining: 0,
        daysUntilDeletion,
        expirationDate: humanReadableFormatShort(gracePeriodEnd),
      };
    }

    // Only show warning for annual subscriptions (30 days before expiration)
    if (isAnnualBilling && daysRemaining <= 30) {
      return {
        variant: "warning" as const,
        daysRemaining,
        expirationDate: humanReadableFormatShort(expiresAt),
      };
    }
  }

  // Check billing expiration for cloud (only show warnings for canceled subscriptions)
  if (billing.cancel_at_period_end && billing.current_period_end) {
    const expiresAt = new Date(billing.current_period_end);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 0) {
      const gracePeriodEnd = new Date(
        expiresAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
      );
      const daysUntilDeletion = Math.max(
        0,
        Math.ceil(
          (gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      return {
        variant: "error" as const,
        daysRemaining: 0,
        daysUntilDeletion,
        expirationDate: humanReadableFormatShort(gracePeriodEnd),
      };
    }

    // Only show warning for annual subscriptions (30 days before expiration)
    // Monthly subscriptions auto-renew, so no warning needed
    if (isAnnualBilling && daysRemaining <= 30) {
      return {
        variant: "warning" as const,
        daysRemaining,
        expirationDate: humanReadableFormatShort(expiresAt),
      };
    }
  }

  if (billing.status === "expired" || billing.status === "cancelled") {
    return {
      variant: "error" as const,
      daysRemaining: 0,
      daysUntilDeletion: GRACE_PERIOD_DAYS,
      expirationDate: "",
    };
  }

  return null;
}

// ----------------------------------------------------------------------------
// SubscriptionCard
// ----------------------------------------------------------------------------

function SubscriptionCard({
  billing,
  license,
  onViewPlans,
  disabled,
  isManualLicenseOnly,
  onReconnect,
}: {
  billing?: BillingInformation;
  license?: LicenseStatus;
  onViewPlans: () => void;
  disabled?: boolean;
  isManualLicenseOnly?: boolean;
  onReconnect?: () => Promise<void>;
}) {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const planName = isManualLicenseOnly ? "Enterprise Plan" : "Business Plan";
  const PlanIcon = isManualLicenseOnly ? SvgOrganization : SvgUsers;
  const expirationDate = billing?.current_period_end ?? license?.expires_at;
  const formattedDate = formatDateShort(expirationDate);

  const isExpiredFromBilling =
    billing?.status === "expired" || billing?.status === "cancelled";
  const isExpiredFromLicense =
    license?.status === "expired" ||
    license?.status === "gated_access" ||
    (license?.expires_at && new Date(license.expires_at) < new Date());
  const isExpired = isExpiredFromBilling || isExpiredFromLicense;
  const isCanceling = billing?.cancel_at_period_end;

  let subtitle: string;
  if (isExpired) {
    subtitle = `Expiré le ${formattedDate}`;
  } else if (isCanceling) {
    subtitle = `Valide jusqu'au ${formattedDate}`;
  } else if (billing) {
    subtitle = `Prochain paiement le ${formattedDate}`;
  } else {
    subtitle = `Valide jusqu'au ${formattedDate}`;
  }

  const handleManagePlan = async () => {
    try {
      const response = await createCustomerPortalSession({
        return_url: `${window.location.origin}/admin/billing?portal_return=true`,
      });
      if (response.stripe_customer_portal_url) {
        window.location.href = response.stripe_customer_portal_url;
      }
    } catch (error) {
      console.error("Failed to open customer portal:", error);
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await resetStripeConnection();
      await onReconnect?.();
    } catch (error) {
      console.error("Failed to reconnect to Stripe:", error);
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <Card>
      <Section
        flexDirection="row"
        justifyContent="between"
        alignItems="start"
        height="auto"
      >
        <Section gap={0.25} alignItems="start" height="auto" width="auto">
          <PlanIcon className="w-5 h-5" />
          <Text headingH3Muted text04>
            {planName}
          </Text>
          <Text secondaryBody text03>
            {subtitle}
          </Text>
        </Section>
        <Section
          flexDirection="column"
          gap={0.25}
          alignItems="end"
          height="auto"
          width="fit"
        >
          {isManualLicenseOnly ? (
            <Text secondaryBody text03 className="text-right">
              Votre abonnement est géré par l&apos;équipe commerciale.
              <br />
              <a
                href="mailto:support@onyx.app?subject=Billing%20change%20request"
                className="underline"
              >
                Contacter la facturation
              </a>{" "}
              pour effectuer des modifications.
            </Text>
          ) : disabled ? (
            <OpalButton
              disabled={isReconnecting}
              prominence="secondary"
              onClick={handleReconnect}
              rightIcon={SvgArrowRight}
            >
              {isReconnecting ? "Connexion..." : "Connecter à Stripe"}
            </OpalButton>
          ) : (
            <OpalButton onClick={handleManagePlan} rightIcon={SvgExternalLink}>
              Gérer l&apos;abonnement
            </OpalButton>
          )}
          {/* TODO(@raunakab): migrate to opal Button once className/iconClassName is resolved */}
          <Button tertiary onClick={onViewPlans} className="billing-text-link">
            <Text secondaryBody text03>
              Voir les détails de l&apos;abonnement
            </Text>
          </Button>
        </Section>
      </Section>
    </Card>
  );
}

// ----------------------------------------------------------------------------
// SeatsCard
// ----------------------------------------------------------------------------

function SeatsCard({
  billing,
  license,
  onRefresh,
  disabled,
  hideUpdateSeats,
}: {
  billing?: BillingInformation;
  license?: LicenseStatus;
  onRefresh?: () => Promise<void>;
  disabled?: boolean;
  hideUpdateSeats?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: usersData, isLoading: isLoadingUsers } = useUsers({
    includeApiKeys: false,
  });

  const totalSeats = billing?.seats ?? license?.seats ?? 0;
  const acceptedUsers =
    usersData?.accepted?.filter((u) => u.is_active).length ?? 0;
  const slackUsers =
    usersData?.slack_users?.filter((u) => u.is_active).length ?? 0;
  const usedSeats = acceptedUsers + slackUsers;
  const pendingSeats = usersData?.invited?.length ?? 0;
  const remainingSeats = Math.max(0, totalSeats - usedSeats - pendingSeats);

  const [newSeatCount, setNewSeatCount] = useState(totalSeats);
  const minRequiredSeats = usedSeats + pendingSeats;
  const isBelowMinimum = newSeatCount < minRequiredSeats;

  const handleStartEdit = () => {
    setNewSeatCount(totalSeats);
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleConfirm = async () => {
    if (newSeatCount === totalSeats) {
      setIsEditing(false);
      return;
    }
    if (isBelowMinimum) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateSeatCount({ new_seat_count: newSeatCount });
      if (!NEXT_PUBLIC_CLOUD_ENABLED) {
        // Wait for control plane to process the subscription update before claiming
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await claimLicense();
        // Force refresh the Redis cache from the database
        await refreshLicenseCache();
      }
      await onRefresh?.();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour les sièges");
    } finally {
      setIsSubmitting(false);
    }
  };

  const seatDifference = newSeatCount - totalSeats;
  const isAdding = seatDifference > 0;
  const isRemoving = seatDifference < 0;
  const nextBillingDate = formatDateShort(billing?.current_period_end);
  const seatCount = Math.abs(seatDifference);
  const seatWord = seatCount === 1 ? "siège" : "sièges";

  if (isEditing) {
    return (
      <Card
        padding={0}
        gap={0}
        alignItems="stretch"
        className="billing-card-enter"
      >
        <Section
          flexDirection="row"
          justifyContent="between"
          alignItems="start"
          padding={1}
          height="auto"
        >
          <Content
            title="Modifier les sièges"
            description="Ajoutez ou supprimez des sièges selon la taille de votre équipe."
            sizePreset="main-content"
            variant="section"
          />
          <OpalButton
            disabled={isSubmitting}
            prominence="secondary"
            onClick={handleCancel}
          >
            Annuler
          </OpalButton>
        </Section>

        <div className="billing-content-area">
          <Section
            flexDirection="column"
            alignItems="stretch"
            gap={0.25}
            padding={1}
            height="auto"
          >
            <InputLayouts.Vertical title="Sièges">
              <InputNumber
                value={newSeatCount}
                onChange={(v) => setNewSeatCount(v ?? 1)}
                min={1}
                defaultValue={totalSeats}
                showReset
                variant={isBelowMinimum ? "error" : "primary"}
              />
            </InputLayouts.Vertical>

            {isBelowMinimum ? (
              <InputLayouts.ErrorTextLayout type="error">
                Vous ne pouvez pas descendre en dessous de{" "}
                <span className="font-semibold">{minRequiredSeats}</span> sièges
                actuellement utilisés/en attente.{" "}
                <Link
                  href="/admin/users"
                  className="underline hover:no-underline"
                >
                  Supprimer des utilisateurs
                </Link>{" "}
                avant de réduire les sièges.
              </InputLayouts.ErrorTextLayout>
            ) : seatDifference !== 0 ? (
              <Text secondaryBody text03>
                {Math.abs(seatDifference)} siège
                {Math.abs(seatDifference) !== 1 ? "s" : ""} à{" "}
                {isAdding ? "ajouter" : "supprimer"}
              </Text>
            ) : null}

            {error && (
              <Text secondaryBody className="billing-error-text">
                {error}
              </Text>
            )}
          </Section>
        </div>

        <Section
          flexDirection="row"
          alignItems="center"
          justifyContent="between"
          padding={1}
          height="auto"
        >
          {isAdding ? (
            <Text secondaryBody text03>
              Vous serez facturé pour{" "}
              <Text secondaryBody text04>
                {seatCount}
              </Text>{" "}
              {seatWord} supplémentaire{seatCount !== 1 ? "s" : ""} au prorata.
            </Text>
          ) : isRemoving ? (
            <Text secondaryBody text03>
              <Text secondaryBody text04>
                {seatCount}
              </Text>{" "}
              {seatWord} seront supprimés le{" "}
              <Text secondaryBody text04>
                {nextBillingDate}
              </Text>{" "}
              (après le cycle de facturation en cours).
            </Text>
          ) : (
            <Text secondaryBody text03>
              Aucune modification de votre facturation.
            </Text>
          )}
          <OpalButton
            disabled={
              isSubmitting || newSeatCount === totalSeats || isBelowMinimum
            }
            onClick={handleConfirm}
          >
            {isSubmitting ? "Enregistrement..." : "Confirmer la modification"}
          </OpalButton>
        </Section>
      </Card>
    );
  }

  return (
    <Card>
      <Section
        flexDirection="row"
        justifyContent="between"
        alignItems="center"
        height="auto"
      >
        <Section gap={0.25} alignItems="start" height="auto" width="auto">
          <Text mainContentMuted text04>
            {totalSeats} Sièges
          </Text>
          <Text secondaryBody text03>
            {usedSeats} utilisés • {pendingSeats} en attente • {remainingSeats}{" "}
            disponibles
          </Text>
        </Section>
        <Section
          flexDirection="row"
          gap={0.5}
          justifyContent="end"
          height="auto"
          width="auto"
        >
          <OpalButton
            prominence="tertiary"
            href="/admin/users"
            icon={SvgExternalLink}
          >
            Voir les utilisateurs
          </OpalButton>
          {!hideUpdateSeats && (
            <OpalButton
              disabled={isLoadingUsers || disabled || !billing}
              prominence="secondary"
              onClick={handleStartEdit}
              icon={SvgPlus}
            >
              Modifier les sièges
            </OpalButton>
          )}
        </Section>
      </Section>
    </Card>
  );
}

// ----------------------------------------------------------------------------
// PaymentSection
// ----------------------------------------------------------------------------

function PaymentSection({ billing }: { billing: BillingInformation }) {
  const handleOpenPortal = async () => {
    try {
      const response = await createCustomerPortalSession({
        return_url: `${window.location.origin}/admin/billing?portal_return=true`,
      });
      if (response.stripe_customer_portal_url) {
        window.location.href = response.stripe_customer_portal_url;
      }
    } catch (error) {
      console.error("Failed to open customer portal:", error);
    }
  };

  if (!billing.payment_method_enabled) return null;

  const lastPaymentDate = formatDateShort(billing.current_period_start);

  return (
    <div className="billing-payment-section">
      <Section alignItems="start" height="auto" width="full">
        <Text mainContentEmphasis>Paiement</Text>
        <Section
          flexDirection="row"
          gap={0.5}
          alignItems="stretch"
          height="auto"
        >
          <Card className="billing-payment-card">
            <Section
              flexDirection="row"
              justifyContent="between"
              alignItems="start"
              height="auto"
            >
              <InfoBlock
                icon={SvgWallet}
                title="Visa se terminant par 1234"
                description="Moyen de paiement"
              />
              <OpalButton
                prominence="tertiary"
                onClick={handleOpenPortal}
                rightIcon={SvgExternalLink}
              >
                Mettre à jour
              </OpalButton>
            </Section>
          </Card>
          {lastPaymentDate && (
            <Card className="billing-payment-card">
              <Section
                flexDirection="row"
                justifyContent="between"
                alignItems="start"
                height="auto"
              >
                <InfoBlock
                  icon={SvgFileText}
                  title={lastPaymentDate}
                  description="Dernier paiement"
                />
                <OpalButton
                  prominence="tertiary"
                  onClick={handleOpenPortal}
                  rightIcon={SvgExternalLink}
                >
                  Voir la facture
                </OpalButton>
              </Section>
            </Card>
          )}
        </Section>
      </Section>
    </div>
  );
}

// ----------------------------------------------------------------------------
// BillingDetailsView
// ----------------------------------------------------------------------------

interface BillingDetailsViewProps {
  billing?: BillingInformation;
  license?: LicenseStatus;
  onViewPlans: () => void;
  onRefresh?: () => Promise<void>;
  isAirGapped?: boolean;
  isManualLicenseOnly?: boolean;
  hasStripeError?: boolean;
  licenseCard?: React.ReactNode;
}

export default function BillingDetailsView({
  billing,
  license,
  onViewPlans,
  onRefresh,
  isAirGapped,
  isManualLicenseOnly,
  hasStripeError,
  licenseCard,
}: BillingDetailsViewProps) {
  const expirationState = billing ? getExpirationState(billing, license) : null;
  const disableBillingActions =
    isAirGapped || hasStripeError || isManualLicenseOnly;

  return (
    <Section gap={1} height="auto" width="full">
      {/* Stripe connection error banner */}
      {hasStripeError && (
        <Message
          static
          warning
          text="Impossible de se connecter au portail de paiement Stripe."
          description="Vérifiez votre connexion internet ou fournissez une licence manuellement."
          close={false}
          className="w-full"
        />
      )}

      {/* Air-gapped mode info banner */}
      {isAirGapped && !hasStripeError && !isManualLicenseOnly && (
        <Message
          static
          info
          text="Déploiement hors ligne"
          description="La gestion de facturation en ligne est désactivée. Contactez le support pour mettre à jour votre abonnement."
          close={false}
          className="w-full"
        />
      )}

      {/* Expiration banner */}
      {expirationState && (
        <Message
          static
          warning={expirationState.variant === "warning"}
          error={expirationState.variant === "error"}
          text={
            expirationState.variant === "error"
              ? expirationState.daysUntilDeletion
                ? `Votre abonnement a expiré. Les données seront supprimées dans ${expirationState.daysUntilDeletion} jours.`
                : "Votre abonnement a expiré."
              : `Votre abonnement expire dans ${expirationState.daysRemaining} jours.`
          }
          description={
            expirationState.variant === "error"
              ? expirationState.expirationDate
                ? `Renouvelez votre abonnement avant le ${expirationState.expirationDate} pour rétablir l'accès.`
                : "Renouvelez votre abonnement pour rétablir l'accès aux fonctionnalités payantes."
              : `Renouvelez votre abonnement avant le ${expirationState.expirationDate} pour éviter toute interruption.`
          }
          close={false}
          className="w-full"
        />
      )}

      {/* Subscription card */}
      {(billing || license?.has_license) && (
        <SubscriptionCard
          billing={billing}
          license={license}
          onViewPlans={onViewPlans}
          disabled={disableBillingActions}
          isManualLicenseOnly={isManualLicenseOnly}
          onReconnect={onRefresh}
        />
      )}

      {/* License card (inline for manual license users) */}
      {licenseCard}

      {/* Seats card */}
      <SeatsCard
        billing={billing}
        license={license}
        onRefresh={onRefresh}
        disabled={disableBillingActions}
        hideUpdateSeats={isManualLicenseOnly}
      />

      {/* Payment section */}
      {/* TODO: Re-enable payment section when APIs for fetching payment details are implemented */}
      {/* {billing?.payment_method_enabled && !isAirGapped && <PaymentSection billing={billing} />} */}
    </Section>
  );
}
