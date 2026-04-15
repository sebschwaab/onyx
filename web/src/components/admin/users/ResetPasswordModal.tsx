import { useState } from "react";
import Modal from "@/refresh-components/Modal";
import Button from "@/refresh-components/buttons/Button";
import { User } from "@/lib/types";
import { toast } from "@/hooks/useToast";
import Text from "@/refresh-components/texts/Text";
import { LoadingAnimation } from "@/components/Loading";
import CopyIconButton from "@/refresh-components/buttons/CopyIconButton";
import { SvgKey, SvgRefreshCw } from "@opal/icons";

export interface ResetPasswordModalProps {
  user: User;
  onClose: () => void;
}

export default function ResetPasswordModal({
  user,
  onClose,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/password/reset_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_email: user.email }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewPassword(data.new_password);
        toast.success("Mot de passe réinitialisé avec succès");
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Impossible de réinitialiser le mot de passe");
      }
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la réinitialisation du mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open onOpenChange={onClose}>
      <Modal.Content width="sm" height="sm">
        <Modal.Header
          icon={SvgKey}
          title="Réinitialiser le mot de passe"
          onClose={onClose}
          description={
            newPassword
              ? undefined
              : `Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${user.email} ?`
          }
        />
        <Modal.Body>
          {newPassword ? (
            <div>
              <Text as="p">Nouveau mot de passe :</Text>
              <div className="flex items-center bg-background-tint-03 p-2 rounded gap-2">
                <Text as="p" data-testid="new-password" className="flex-grow">
                  {newPassword}
                </Text>
                <CopyIconButton getCopyText={() => newPassword} />
              </div>
              <Text as="p" text02>
                Veuillez communiquer ce mot de passe à l&apos;utilisateur de manière sécurisée.
              </Text>
            </div>
          ) : (
            // TODO(@raunakab): migrate to opal Button once it supports ReactNode children
            <Button
              onClick={handleResetPassword}
              disabled={isLoading}
              leftIcon={SvgRefreshCw}
            >
              {isLoading ? (
                <Text as="p">
                  <LoadingAnimation text="Réinitialisation" />
                </Text>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </Button>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
