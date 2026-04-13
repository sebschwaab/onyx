"use client";

import { useState, useRef } from "react";
import { Button } from "@opal/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Checkbox from "@/refresh-components/inputs/Checkbox";
import {
  updateConnectorFiles,
  type ConnectorFileInfo,
} from "@/lib/fileConnector";
import { toast } from "@/hooks/useToast";
import useSWR from "swr";
import { errorHandlingFetcher } from "@/lib/fetcher";
import { ThreeDotsLoader } from "@/components/Loading";
import Modal from "@/refresh-components/Modal";
import Text from "@/refresh-components/texts/Text";
import {
  SvgCheck,
  SvgEdit,
  SvgFolderPlus,
  SvgPlusCircle,
  SvgX,
} from "@opal/icons";
import { formatBytes } from "@/lib/utils";
import { timestampToReadableDate } from "@/lib/dateUtils";

interface InlineFileManagementProps {
  connectorId: number;
  onRefresh: () => void;
}

export default function InlineFileManagement({
  connectorId,
  onRefresh,
}: InlineFileManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFilesToRemove, setSelectedFilesToRemove] = useState<
    Set<string>
  >(new Set());
  const [filesToAdd, setFilesToAdd] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: filesResponse,
    isLoading,
    error,
    mutate: refreshFiles,
  } = useSWR<{ files: ConnectorFileInfo[] }>(
    `/api/manage/admin/connector/${connectorId}/files`,
    errorHandlingFetcher,
    { refreshInterval: isEditing ? 0 : 5000 } // Disable auto-refresh while editing
  );

  const files = filesResponse?.files || [];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setFilesToAdd((prev) => [...prev, ...Array.from(selectedFiles)]);
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setFilesToAdd((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFileForRemoval = (fileId: string) => {
    setSelectedFilesToRemove((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleSaveClick = () => {
    // Validate that we won't remove all files
    const remainingFiles = files.filter(
      (file) => !selectedFilesToRemove.has(file.file_id)
    ).length;

    if (remainingFiles === 0 && filesToAdd.length === 0) {
      toast.error(
        "Impossible de supprimer tous les fichiers d'un connecteur. Supprimez le connecteur si c'est ce que vous souhaitez."
      );
      return;
    }

    // Show confirmation modal
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirm(false);
    setIsSaving(true);
    try {
      await updateConnectorFiles(
        connectorId,
        Array.from(selectedFilesToRemove),
        filesToAdd
      );

      toast.success(
        "Fichiers mis à jour avec succès ! L'index des documents est mis à jour en arrière-plan. " +
          "Les nouveaux fichiers sont en cours d'indexation et les fichiers supprimés seront retirés des résultats de recherche."
      );

      // Reset editing state
      setIsEditing(false);
      setSelectedFilesToRemove(new Set());
      setFilesToAdd([]);

      // Refresh data
      refreshFiles();
      onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de la mise à jour des fichiers"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFilesToRemove(new Set());
    setFilesToAdd([]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <ThreeDotsLoader />
      </div>
    );
  }

  if (error) {
    return (
      <Text as="p" className="text-error">
        Erreur lors du chargement des fichiers : {error.message}
      </Text>
    );
  }

  const currentFiles = files.filter(
    (file) => !selectedFilesToRemove.has(file.file_id)
  );
  const totalFiles = currentFiles.length + filesToAdd.length;

  return (
    <>
      {/* Header with Edit/Save buttons */}
      <div className="flex justify-between items-center mb-4">
        <Text as="p" mainUiBody>
          Fichiers ({totalFiles} fichier{totalFiles !== 1 ? "s" : ""})
        </Text>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button
              prominence="secondary"
              onClick={() => setIsEditing(true)}
              icon={SvgEdit}
            >
              Modifier
            </Button>
          ) : (
            <>
              <Button
                disabled={isSaving}
                prominence="secondary"
                onClick={handleCancel}
                icon={SvgX}
              >
                Annuler
              </Button>
              <Button
                disabled={
                  isSaving ||
                  (selectedFilesToRemove.size === 0 && filesToAdd.length === 0)
                }
                onClick={handleSaveClick}
                icon={SvgCheck}
              >
                {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length === 0 && filesToAdd.length === 0 ? (
        <Text as="p" mainUiMuted className="text-center py-8">
          Aucun fichier dans ce connecteur
        </Text>
      ) : (
        <div className="border rounded-lg overflow-hidden mb-4">
          {/* Scrollable container with max height */}
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  {isEditing && <TableHead className="w-12"></TableHead>}
                  <TableHead>Nom du fichier</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date d'upload</TableHead>
                  {isEditing && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Existing files */}
                {files.map((file) => {
                  const isMarkedForRemoval = selectedFilesToRemove.has(
                    file.file_id
                  );
                  return (
                    <TableRow
                      key={file.file_id}
                      className={
                        isMarkedForRemoval
                          ? "bg-red-100 dark:bg-red-900/20"
                          : ""
                      }
                    >
                      {isEditing && (
                        <TableCell>
                          <Checkbox
                            checked={isMarkedForRemoval}
                            onCheckedChange={() =>
                              toggleFileForRemoval(file.file_id)
                            }
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <span
                          className={
                            isMarkedForRemoval ? "line-through opacity-60" : ""
                          }
                        >
                          {file.file_name}
                        </span>
                        {isMarkedForRemoval && (
                          <span className="ml-2 text-xs font-semibold text-red-600 dark:text-red-400">
                            Suppression
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={
                          isMarkedForRemoval ? "line-through opacity-60" : ""
                        }
                      >
                        {formatBytes(file.file_size)}
                      </TableCell>
                      <TableCell
                        className={
                          isMarkedForRemoval ? "line-through opacity-60" : ""
                        }
                      >
                        {file.upload_date
                          ? timestampToReadableDate(file.upload_date)
                          : "-"}
                      </TableCell>
                      {isEditing && <TableCell></TableCell>}
                    </TableRow>
                  );
                })}

                {/* New files to be added */}
                {filesToAdd.map((file, index) => (
                  <TableRow
                    key={`new-${index}`}
                    className="bg-green-50 dark:bg-green-900/10"
                  >
                    {isEditing && (
                      <TableCell>
                        <Button
                          icon={SvgX}
                          variant="danger"
                          prominence="tertiary"
                          size="sm"
                          onClick={() => handleRemoveNewFile(index)}
                          tooltip="Retirer le fichier"
                          title="Retirer le fichier"
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {file.name}
                      <Text as="p" figureSmallValue>
                        Nouveau
                      </Text>
                    </TableCell>
                    <TableCell>{formatBytes(file.size)}</TableCell>
                    <TableCell>-</TableCell>
                    {isEditing && <TableCell></TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Add Files Button (only in edit mode) */}
      {isEditing && (
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id={`file-upload-${connectorId}`}
          />
          <Button
            disabled={isSaving}
            prominence="secondary"
            onClick={() => fileInputRef.current?.click()}
            icon={SvgPlusCircle}
          >
            Ajouter des fichiers
          </Button>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <Modal.Content width="sm">
          <Modal.Header
            icon={SvgFolderPlus}
            title="Confirmer les modifications de fichiers"
            description="Lorsque vous enregistrez ces modifications, voici ce qui se passera :"
          />

          <Modal.Body>
            {selectedFilesToRemove.size > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-md">
                <Text
                  as="p"
                  mainUiBody
                  className="font-semibold text-red-800 dark:text-red-200"
                >
                  🗑️ {selectedFilesToRemove.size} fichier(s) seront supprimés
                </Text>
                <Text
                  as="p"
                  secondaryBody
                  className="text-red-700 dark:text-red-300 mt-1"
                >
                  Les documents de ces fichiers seront retirés de l'index des documents
                </Text>
              </div>
            )}

            {filesToAdd.length > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-md">
                <Text
                  as="p"
                  mainUiBody
                  className="font-semibold text-green-800 dark:text-green-200"
                >
                  {filesToAdd.length} fichier(s) seront ajoutés
                </Text>
                <Text
                  as="p"
                  secondaryBody
                  className="text-green-700 dark:text-green-300 mt-1"
                >
                  Les nouveaux fichiers seront téléversés, découpés, vectorisés et indexés dans
                  l'index des documents
                </Text>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              disabled={isSaving}
              prominence="secondary"
              onClick={() => setShowSaveConfirm(false)}
            >
              Annuler
            </Button>
            <Button disabled={isSaving} onClick={handleConfirmSave}>
              {isSaving ? "Enregistrement..." : "Confirmer et enregistrer"}
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
}
