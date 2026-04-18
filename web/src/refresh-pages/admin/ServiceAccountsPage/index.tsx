"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { errorHandlingFetcher } from "@/lib/fetcher";
import { SWR_KEYS } from "@/lib/swr-keys";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import SimpleLoader from "@/refresh-components/loaders/SimpleLoader";
import { toast } from "@/hooks/useToast";
import { Button, Text } from "@opal/components";
import { Content, IllustrationContent } from "@opal/layouts";
import SvgNoResult from "@opal/illustrations/no-result";
import {
  SvgDownload,
  SvgKey,
  SvgLock,
  SvgMoreHorizontal,
  SvgRefreshCw,
  SvgTrash,
  SvgUser,
  SvgUserEdit,
  SvgUserKey,
  SvgUserManage,
} from "@opal/icons";
import { USER_ROLE_LABELS, UserRole } from "@/lib/types";
import { ADMIN_ROUTES } from "@/lib/admin-routes";
import InputSelect from "@/refresh-components/inputs/InputSelect";
import AdminListHeader from "@/sections/admin/AdminListHeader";
import Modal, { BasicModalFooter } from "@/refresh-components/Modal";
import Code from "@/refresh-components/Code";
import Popover, { PopoverMenu } from "@/refresh-components/Popover";
import LineItem from "@/refresh-components/buttons/LineItem";
import ConfirmationModalLayout from "@/refresh-components/layouts/ConfirmationModalLayout";
import { markdown } from "@opal/utils";
import Message from "@/refresh-components/messages/Message";

import { useBillingInformation } from "@/hooks/useBillingInformation";
import { BillingStatus, hasActiveSubscription } from "@/lib/billing/interfaces";
import {
  deleteApiKey,
  regenerateApiKey,
  updateApiKey,
} from "@/refresh-pages/admin/ServiceAccountsPage/svc";
import type { APIKey } from "@/refresh-pages/admin/ServiceAccountsPage/interfaces";
import { DISCORD_SERVICE_API_KEY_NAME } from "@/refresh-pages/admin/ServiceAccountsPage/interfaces";
import ApiKeyFormModal from "@/refresh-pages/admin/ServiceAccountsPage/ApiKeyFormModal";
import { Table } from "@opal/components";
import { createTableColumns } from "@opal/components/table/columns";
import { Section } from "@/layouts/general-layouts";

const API_KEY_SWR_KEY = SWR_KEYS.adminApiKeys;
const route = ADMIN_ROUTES.API_KEYS;

const tc = createTableColumns<APIKey>();

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ServiceAccountsPage() {
  const {
    data: apiKeys,
    isLoading,
    error,
  } = useSWR<APIKey[]>(API_KEY_SWR_KEY, errorHandlingFetcher);

  const { data: billingData } = useBillingInformation();
  const isTrialing =
    billingData !== undefined &&
    hasActiveSubscription(billingData) &&
    billingData.status === BillingStatus.TRIALING;

  const [fullApiKey, setFullApiKey] = useState<string | null>(null);
  const [showCreateUpdateForm, setShowCreateUpdateForm] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<APIKey | undefined>();
  const [search, setSearch] = useState("");
  const [regenerateTarget, setRegenerateTarget] = useState<APIKey | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<APIKey | null>(null);

  const visibleApiKeys = (apiKeys ?? []).filter(
    (key) => key.api_key_name !== DISCORD_SERVICE_API_KEY_NAME
  );

  const filteredApiKeys = visibleApiKeys.filter(
    (key) =>
      !search ||
      (key.api_key_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      key.api_key_display.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (apiKey: APIKey, newRole: UserRole) => {
    try {
      const response = await updateApiKey(apiKey.api_key_id, {
        name: apiKey.api_key_name ?? undefined,
        role: newRole,
      });
      if (!response.ok) {
        const errorMsg = await response.text();
        toast.error(`Impossible de mettre à jour le rôle : ${errorMsg}`);
        return;
      }
      mutate(API_KEY_SWR_KEY);
      toast.success("Rôle mis à jour.");
    } catch {
      toast.error("Impossible de mettre à jour le rôle.");
    }
  };

  const handleRegenerate = async (apiKey: APIKey) => {
    try {
      const response = await regenerateApiKey(apiKey);
      if (!response.ok) {
        const errorMsg = await response.text();
        toast.error(`Impossible de régénérer la clé API : ${errorMsg}`);
        return;
      }
      const newKey = (await response.json()) as APIKey;
      setFullApiKey(newKey.api_key);
      mutate(API_KEY_SWR_KEY);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Impossible de régénérer la clé API."
      );
    }
  };

  const handleDelete = async (apiKey: APIKey) => {
    try {
      const response = await deleteApiKey(apiKey.api_key_id);
      if (!response.ok) {
        const errorMsg = await response.text();
        toast.error(`Impossible de supprimer la clé API : ${errorMsg}`);
        return;
      }
      mutate(API_KEY_SWR_KEY);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de supprimer la clé API.");
    }
  };

  const columns = useMemo(
    () => [
      tc.qualifier({
        content: "icon",
        getContent: () => SvgUserKey,
      }),
      tc.column("api_key_name", {
        header: "Nom",
        weight: 25,
        cell: (value) => (
          <Content
            title={value || "Sans nom"}
            sizePreset="main-ui"
            variant="body"
          />
        ),
      }),
      tc.column("api_key_display", {
        header: "Clé API",
        weight: 30,
        cell: (value) => (
          <Text font="secondary-mono" color="text-03">
            {value}
          </Text>
        ),
      }),
      tc.displayColumn({
        id: "account_type",
        header: "Type de compte",
        width: { weight: 25, minWidth: 160 },
        cell: (row) => (
          <InputSelect
            value={row.api_key_role}
            onValueChange={(value) => handleRoleChange(row, value as UserRole)}
          >
            <InputSelect.Trigger />
            <InputSelect.Content>
              <InputSelect.Item
                value={UserRole.ADMIN.toString()}
                icon={SvgUserManage}
                description="Accès administrateur complet à tous les endpoints."
              >
                {USER_ROLE_LABELS[UserRole.ADMIN]}
              </InputSelect.Item>
              <InputSelect.Item
                value={UserRole.BASIC.toString()}
                icon={SvgUser}
                description="Accès utilisateur standard aux endpoints non-administrateur."
              >
                {USER_ROLE_LABELS[UserRole.BASIC]}
              </InputSelect.Item>
              <InputSelect.Item
                value={UserRole.LIMITED.toString()}
                icon={SvgLock}
                description="Pour les agents : publication de messages et accès en lecture seule aux autres endpoints."
              >
                {USER_ROLE_LABELS[UserRole.LIMITED]}
              </InputSelect.Item>
            </InputSelect.Content>
          </InputSelect>
        ),
      }),
      tc.actions({
        cell: (row) => (
          <div className="flex flex-row gap-1">
            <Button
              icon={SvgRefreshCw}
              prominence="tertiary"
              tooltip="Régénérer"
              onClick={() => setRegenerateTarget(row)}
            />
            <Popover>
              <Popover.Trigger asChild>
                <Button
                  icon={SvgMoreHorizontal}
                  prominence="tertiary"
                  tooltip="Plus"
                />
              </Popover.Trigger>
              <Popover.Content side="bottom" align="end" width="md">
                <PopoverMenu>
                  <LineItem
                    icon={SvgUserEdit}
                    onClick={() => {
                      setSelectedApiKey(row);
                      setShowCreateUpdateForm(true);
                    }}
                  >
                    Modifier le compte
                  </LineItem>
                  <LineItem
                    icon={SvgTrash}
                    danger
                    onClick={() => setDeleteTarget(row)}
                  >
                    Supprimer le compte
                  </LineItem>
                </PopoverMenu>
              </Popover.Content>
            </Popover>
          </div>
        ),
      }),
    ],
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (error) {
    return (
      <SettingsLayouts.Root>
        <SettingsLayouts.Header
          title={route.title}
          icon={route.icon}
          description="Utilisez les comptes de service pour accéder à l'API Onyx par programmation."
          separator
        />
        <SettingsLayouts.Body>
          <IllustrationContent
            illustration={SvgNoResult}
            title="Impossible de charger les comptes de service."
            description="Veuillez consulter la console pour plus de détails."
          />
        </SettingsLayouts.Body>
      </SettingsLayouts.Root>
    );
  }

  if (isLoading) {
    return (
      <SettingsLayouts.Root>
        <SettingsLayouts.Header
          title={route.title}
          icon={route.icon}
          description="Utilisez les comptes de service pour accéder à l'API Onyx par programmation."
          separator
        />
        <SettingsLayouts.Body>
          <SimpleLoader />
        </SettingsLayouts.Body>
      </SettingsLayouts.Root>
    );
  }

  const hasKeys = visibleApiKeys.length > 0;

  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header
        title={route.title}
        icon={route.icon}
        description="Utilisez les comptes de service pour accéder à l'API Onyx par programmation."
        separator
      />

      <SettingsLayouts.Body>
        {isTrialing && (
          <Message
            static
            warning
            close={false}
            className="w-full"
            text="Passez à un abonnement payant pour créer des clés API."
            description="Les comptes en période d'essai n'incluent pas l'accès aux clés API — souscrivez un abonnement payant pour débloquer cette fonctionnalité."
          />
        )}

        <div className="flex flex-col">
          <AdminListHeader
            hasItems={hasKeys}
            searchQuery={search}
            onSearchQueryChange={setSearch}
            placeholder="Rechercher des comptes de service..."
            emptyStateText="Créez des clés API de compte de service avec un accès utilisateur."
            onAction={() => {
              setSelectedApiKey(undefined);
              setShowCreateUpdateForm(true);
            }}
            actionLabel="Nouveau compte de service"
          />

          {hasKeys && (
            <Table
              data={filteredApiKeys}
              getRowId={(row) => String(row.api_key_id)}
              columns={columns}
              searchTerm={search}
            />
          )}
        </div>
      </SettingsLayouts.Body>

      <Modal open={!!fullApiKey}>
        <Modal.Content width="sm" height="sm">
          <Modal.Header
            title="Clé API du compte de service"
            icon={SvgKey}
            onClose={() => setFullApiKey(null)}
            description="Enregistrez cette clé avant de continuer. Elle ne sera plus affichée."
          />
          <Modal.Body>
            <Code showCopyButton={false}>{fullApiKey ?? ""}</Code>
          </Modal.Body>
          <Modal.Footer>
            <BasicModalFooter
              left={
                <Button
                  prominence="secondary"
                  icon={SvgDownload}
                  onClick={() => {
                    if (!fullApiKey) return;
                    const blob = new Blob([fullApiKey], {
                      type: "text/plain",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "onyx-api-key.txt";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Télécharger
                </Button>
              }
              submit={
                // TODO(@raunakab): Create an opalified copy-button and replace it here
                <Button
                  onClick={() => {
                    if (fullApiKey) {
                      navigator.clipboard.writeText(fullApiKey);
                      toast.success("Clé API copiée dans le presse-papiers.");
                    }
                  }}
                >
                  Copier la clé API
                </Button>
              }
            />
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {showCreateUpdateForm && (
        <ApiKeyFormModal
          onCreateApiKey={(apiKey) => {
            setFullApiKey(apiKey.api_key);
          }}
          onClose={() => {
            setShowCreateUpdateForm(false);
            setSelectedApiKey(undefined);
            mutate(API_KEY_SWR_KEY);
          }}
          apiKey={selectedApiKey}
        />
      )}

      {regenerateTarget && (
        <ConfirmationModalLayout
          icon={SvgRefreshCw}
          title="Régénérer la clé API"
          onClose={() => setRegenerateTarget(null)}
          submit={
            <Button
              variant="danger"
              onClick={async () => {
                const target = regenerateTarget;
                setRegenerateTarget(null);
                await handleRegenerate(target);
              }}
            >
              Régénérer la clé
            </Button>
          }
        >
          <Text as="p" color="text-03">
            {markdown(
              `Votre clé API actuelle *${
                regenerateTarget.api_key_name || "Sans nom"
              }* (\`${
                regenerateTarget.api_key_display
              }\`) sera révoquée et une nouvelle clé sera générée. Vous devrez mettre à jour toutes les applications utilisant cette clé avec la nouvelle.`
            )}
          </Text>
        </ConfirmationModalLayout>
      )}

      {deleteTarget && (
        <ConfirmationModalLayout
          icon={SvgTrash}
          title="Supprimer le compte"
          onClose={() => setDeleteTarget(null)}
          submit={
            <Button
              variant="danger"
              onClick={async () => {
                await handleDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Supprimer
            </Button>
          }
        >
          <Section alignItems="start" gap={0.5}>
            <Text as="p" color="text-03">
              {markdown(
                `Toute application utilisant la clé API du compte *${
                  deleteTarget.api_key_name || "Sans nom"
                }* (\`${
                  deleteTarget.api_key_display
                }\`) perdra l'accès à Onyx.`
              )}
            </Text>
            <Text as="p" color="text-03">
              La suppression est irréversible.
            </Text>
          </Section>
        </ConfirmationModalLayout>
      )}
    </SettingsLayouts.Root>
  );
}
