import { Button } from "@opal/components";
import Text from "@/refresh-components/texts/Text";
import { PreviewVariant } from "@/sections/modals/PreviewModal/interfaces";
import { DownloadButton } from "@/sections/modals/PreviewModal/variants/shared";

export const unsupportedVariant: PreviewVariant = {
  matches: () => true,
  width: "xl",
  height: "full",
  needsTextContent: false,
  codeBackground: false,
  headerDescription: () => "",

  renderContent: (ctx) => (
    <div className="flex flex-col items-center justify-center flex-1 w-full min-h-0 gap-4 p-6">
      <Text as="p" text03 mainUiBody>
        Ce format de fichier n&apos;est pas pris en charge pour la prévisualisation.
      </Text>
      <a href={ctx.fileUrl} download={ctx.fileName}>
        <Button>Télécharger le fichier</Button>
      </a>
    </div>
  ),

  renderFooterLeft: () => null,
  renderFooterRight: (ctx) => (
    <DownloadButton fileUrl={ctx.fileUrl} fileName={ctx.fileName} />
  ),
};
