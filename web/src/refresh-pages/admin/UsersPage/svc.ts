import { UserRole } from "@/lib/types";

async function parseErrorDetail(
  res: Response,
  fallback: string
): Promise<string> {
  try {
    const body = await res.json();
    return body?.detail ?? fallback;
  } catch {
    return fallback;
  }
}

export async function deactivateUser(email: string): Promise<void> {
  const res = await fetch("/api/manage/admin/deactivate-user", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_email: email }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Échec de la désactivation de l'utilisateur"));
  }
}

export async function activateUser(email: string): Promise<void> {
  const res = await fetch("/api/manage/admin/activate-user", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_email: email }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Échec de l'activation de l'utilisateur"));
  }
}

export async function deleteUser(email: string): Promise<void> {
  const res = await fetch("/api/manage/admin/delete-user", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_email: email }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Échec de la suppression de l'utilisateur"));
  }
}

export async function setUserRole(
  email: string,
  newRole: UserRole
): Promise<void> {
  const res = await fetch("/api/manage/set-user-role", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_email: email, new_role: newRole }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Échec de la mise à jour du rôle de l'utilisateur"));
  }
}

export async function addUserToGroup(
  groupId: number,
  userId: string
): Promise<void> {
  const res = await fetch(`/api/manage/admin/user-group/${groupId}/add-users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_ids: [userId] }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Échec de l'ajout de l'utilisateur au groupe"));
  }
}

export async function removeUserFromGroup(
  groupId: number,
  currentUserIds: string[],
  userIdToRemove: string,
  ccPairIds: number[]
): Promise<void> {
  const res = await fetch(`/api/manage/admin/user-group/${groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_ids: currentUserIds.filter((id) => id !== userIdToRemove),
      cc_pair_ids: ccPairIds,
    }),
  });
  if (!res.ok) {
    throw new Error(
      await parseErrorDetail(res, "Échec du retrait de l'utilisateur du groupe")
    );
  }
}

export async function cancelInvite(email: string): Promise<void> {
  const res = await fetch("/api/manage/admin/remove-invited-user", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_email: email }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Échec de l'annulation de l'invitation"));
  }
}

export async function approveRequest(email: string): Promise<void> {
  const res = await fetch("/api/tenants/users/invite/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Échec de l'approbation de la demande"));
  }
}

export async function inviteUsers(emails: string[]): Promise<void> {
  const res = await fetch("/api/manage/admin/users", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emails }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Échec de l'envoi des invitations"));
  }
}

export async function resetPassword(
  email: string
): Promise<{ user_id: string; new_password: string }> {
  const res = await fetch("/api/password/reset_password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_email: email }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Échec de la réinitialisation du mot de passe"));
  }
  return res.json();
}

export async function downloadUsersCsv(): Promise<void> {
  const res = await fetch("/api/manage/users/download");
  if (!res.ok) {
    throw new Error(
      await parseErrorDetail(res, "Échec du téléchargement du CSV des utilisateurs")
    );
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.download = `onyx_users_${ts}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
