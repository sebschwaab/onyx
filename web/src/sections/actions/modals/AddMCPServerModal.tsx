"use client";

import { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Modal from "@/refresh-components/Modal";
import * as InputLayouts from "@/layouts/input-layouts";
import InputTypeInField from "@/refresh-components/form/InputTypeInField";
import InputTextAreaField from "@/refresh-components/form/InputTextAreaField";
import { createMCPServer, updateMCPServer } from "@/lib/tools/mcpService";
import {
  MCPServerCreateRequest,
  MCPServerStatus,
  MCPServer,
} from "@/lib/tools/interfaces";
import { useModal } from "@/refresh-components/contexts/ModalContext";
import Separator from "@/refresh-components/Separator";
import { Button } from "@opal/components";
import { toast } from "@/hooks/useToast";
import { ModalCreationInterface } from "@/refresh-components/contexts/ModalContext";
import { SvgCheckCircle, SvgServer, SvgUnplug } from "@opal/icons";
import { Section } from "@/layouts/general-layouts";
import Text from "@/refresh-components/texts/Text";

interface AddMCPServerModalProps {
  skipOverlay?: boolean;
  activeServer: MCPServer | null;
  setActiveServer: (server: MCPServer | null) => void;
  disconnectModal: ModalCreationInterface;
  manageServerModal: ModalCreationInterface;
  onServerCreated?: (server: MCPServer) => void;
  handleAuthenticate: (serverId: number) => void;
  mutateMcpServers?: () => Promise<void>;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Le nom du serveur est requis"),
  description: Yup.string(),
  server_url: Yup.string()
    .url("Doit être une URL valide")
    .required("L'URL du serveur est requise"),
});

export default function AddMCPServerModal({
  skipOverlay = false,
  activeServer,
  disconnectModal,
  manageServerModal,
  onServerCreated,
  handleAuthenticate,
  mutateMcpServers,
}: AddMCPServerModalProps) {
  const { isOpen, toggle } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use activeServer from props
  const server = activeServer;

  // Handler for disconnect button
  const handleDisconnectClick = () => {
    if (activeServer) {
      // Server stays the same, just toggle modals
      manageServerModal.toggle(false);
      disconnectModal.toggle(true);
    }
  };

  // Determine if we're in edit mode
  const isEditMode = !!server;

  const initialValues: MCPServerCreateRequest = {
    name: server?.name || "",
    description: server?.description || "",
    server_url: server?.server_url || "",
  };

  const handleSubmit = async (values: MCPServerCreateRequest) => {
    setIsSubmitting(true);

    try {
      if (isEditMode && server) {
        // Update existing server
        await updateMCPServer(server.id, values);
        toast.success("Serveur MCP mis à jour avec succès");
        await mutateMcpServers?.();
      } else {
        // Create new server
        const createdServer = await createMCPServer(values);

        toast.success("Serveur MCP créé avec succès");

        await mutateMcpServers?.();

        if (onServerCreated) {
          onServerCreated(createdServer);
        }
      }
      // Close modal. Do NOT clear `activeServer` here because this modal
      // frequently transitions to other modals (authenticate/disconnect), and
      // clearing would race those flows.
      toggle(false);
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} MCP server:`,
        error
      );
      toast.error(
        error instanceof Error
          ? error.message
          : `Échec de la ${isEditMode ? "mise à jour" : "création"} du serveur MCP`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close to clear server state
  const handleModalClose = (open: boolean) => {
    toggle(open);
  };

  return (
    <Modal open={isOpen} onOpenChange={handleModalClose}>
      <Modal.Content
        width="sm"
        height="lg"
        preventAccidentalClose={false}
        skipOverlay={skipOverlay}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isValid, dirty }) => (
            <Form>
              <Modal.Header
                icon={SvgServer}
                title={isEditMode ? "Gérer le serveur MCP" : "Ajouter un serveur MCP"}
                description={
                  isEditMode
                    ? "Mettez à jour la configuration de votre serveur MCP et gérez l'authentification."
                    : "Connectez un serveur MCP (Model Context Protocol) pour ajouter des actions personnalisées."
                }
                onClose={() => handleModalClose(false)}
              />

              <Modal.Body>
                <InputLayouts.Vertical name="name" title="Nom du serveur">
                  <InputTypeInField
                    name="name"
                    placeholder="Nommez votre serveur MCP"
                    autoFocus
                  />
                </InputLayouts.Vertical>

                <InputLayouts.Vertical
                  name="description"
                  title="Description"
                  suffix="optional"
                >
                  <InputTextAreaField
                    name="description"
                    placeholder="Plus de détails sur le serveur MCP"
                    rows={3}
                  />
                </InputLayouts.Vertical>

                <Separator noPadding />

                <InputLayouts.Vertical
                  name="server_url"
                  title="URL du serveur MCP"
                  subDescription="Connectez-vous uniquement aux serveurs auxquels vous faites confiance. Vous êtes responsable des actions effectuées avec cette connexion et de la mise à jour de vos outils."
                >
                  <InputTypeInField
                    name="server_url"
                    placeholder="https://your-mcp-server.com/mcp"
                  />
                </InputLayouts.Vertical>

                {/* Authentication Status Section - Only show in edit mode when authenticated */}
                {isEditMode &&
                  server?.is_authenticated &&
                  server?.status === MCPServerStatus.CONNECTED && (
                    <Section
                      flexDirection="row"
                      justifyContent="between"
                      alignItems="start"
                      gap={1}
                    >
                      <Section gap={0.25} alignItems="start">
                        <Section
                          flexDirection="row"
                          gap={0.5}
                          alignItems="center"
                          width="fit"
                        >
                          <SvgCheckCircle className="w-4 h-4 stroke-status-success-05" />
                          <Text>Authentifié &amp; Connecté</Text>
                        </Section>
                        <Text secondaryBody text03>
                          {server.auth_type === "OAUTH"
                            ? `OAuth connecté à ${server.owner}`
                            : server.auth_type === "API_TOKEN"
                              ? "Jeton API configuré"
                              : "Connecté"}
                        </Text>
                      </Section>
                      <Section
                        flexDirection="row"
                        gap={0.5}
                        alignItems="center"
                        width="fit"
                      >
                        <Button
                          icon={SvgUnplug}
                          prominence="tertiary"
                          type="button"
                          tooltip="Déconnecter le serveur"
                          onClick={handleDisconnectClick}
                        />
                        <Button
                          prominence="secondary"
                          type="button"
                          onClick={() => {
                            // Close this modal and open the auth modal for this server
                            toggle(false);
                            handleAuthenticate(server.id);
                          }}
                        >
                          Modifier les configs
                        </Button>
                      </Section>
                    </Section>
                  )}
              </Modal.Body>

              <Modal.Footer>
                <Button
                  disabled={isSubmitting}
                  prominence="secondary"
                  type="button"
                  onClick={() => handleModalClose(false)}
                >
                  Annuler
                </Button>
                <Button
                  disabled={isSubmitting || !isValid || !dirty}
                  type="submit"
                >
                  {isSubmitting
                    ? isEditMode
                      ? "Enregistrement..."
                      : "Ajout..."
                    : isEditMode
                      ? "Enregistrer les modifications"
                      : "Ajouter le serveur"}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal.Content>
    </Modal>
  );
}
