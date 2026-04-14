"use client";

import Modal from "@/refresh-components/Modal";
import { Button } from "@opal/components";
import Text from "@/refresh-components/texts/Text";
import { useUser } from "@/providers/UserProvider";
import { SvgUser } from "@opal/icons";

export default function NoAgentModal() {
  const { isAdmin } = useUser();

  return (
    <Modal open>
      <Modal.Content width="sm" height="sm">
        <Modal.Header icon={SvgUser} title="Aucun agent disponible" />
        <Modal.Body>
          <Text as="p">
            Vous n&apos;avez actuellement aucun agent configuré. Pour utiliser cette
            fonctionnalité, vous devez effectuer une action.
          </Text>
          {isAdmin ? (
            <>
              <Text as="p">
                En tant qu&apos;administrateur, vous pouvez créer un nouvel agent en
                visitant le panneau d&apos;administration.
              </Text>
              <Button width="full" href="/admin/agents">
                Aller au panneau d&apos;administration
              </Button>
            </>
          ) : (
            <Text as="p">
              Veuillez contacter votre administrateur pour configurer un agent.
            </Text>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
