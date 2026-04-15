import { type User } from "@/lib/types";
import { toast } from "@/hooks/useToast";
import userMutationFetcher from "@/lib/admin/users/userMutationFetcher";
import useSWRMutation from "swr/mutation";
import Button from "@/refresh-components/buttons/Button";
import { useState } from "react";
import { ConfirmEntityModal } from "@/components/modals/ConfirmEntityModal";

const DeleteUserButton = ({
  user,
  mutate,
  className,
  children,
}: {
  user: User;
  mutate: () => void;
  className?: string;
  children?: React.ReactNode;
}) => {
  const { trigger, isMutating } = useSWRMutation(
    "/api/manage/admin/delete-user",
    userMutationFetcher,
    {
      onSuccess: () => {
        mutate();
        toast.success("Utilisateur supprimé avec succès !");
      },
      onError: (errorMsg) =>
        toast.error(`Unable to delete user - ${errorMsg.message}`),
    }
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  return (
    <>
      {showDeleteModal && (
        <ConfirmEntityModal
          entityType="user"
          entityName={user.email}
          onClose={() => setShowDeleteModal(false)}
          onSubmit={() => trigger({ user_email: user.email, method: "DELETE" })}
          additionalDetails="Toutes les données associées à cet utilisateur seront supprimées (y compris les agents, outils et sessions de chat)."
        />
      )}

      {/* TODO(@raunakab): migrate to opal Button once className/iconClassName is resolved */}
      <Button
        className={className}
        onClick={() => setShowDeleteModal(true)}
        disabled={isMutating}
        danger
      >
        {children}
      </Button>
    </>
  );
};

export default DeleteUserButton;
