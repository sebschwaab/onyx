"use client";

import { FeedbackType } from "@/app/app/interfaces";
import { Button } from "@opal/components";
import useFeedbackController from "@/hooks/useFeedbackController";
import { useModal } from "@/refresh-components/contexts/ModalContext";
import { SvgThumbsDown, SvgThumbsUp } from "@opal/icons";
import Modal from "@/refresh-components/Modal";
import { Formik } from "formik";
import * as Yup from "yup";
import * as InputLayouts from "@/layouts/input-layouts";
import InputTextAreaField from "@/refresh-components/form/InputTextAreaField";

export interface FeedbackModalProps {
  feedbackType: FeedbackType;
  messageId: number;
}

interface FeedbackFormValues {
  additional_feedback: string;
}

export default function FeedbackModal({
  feedbackType,
  messageId,
}: FeedbackModalProps) {
  const modal = useModal();
  const { handleFeedbackChange } = useFeedbackController();

  const initialValues: FeedbackFormValues = {
    additional_feedback: "",
  };

  const validationSchema = Yup.object({
    additional_feedback:
      feedbackType === "dislike"
        ? Yup.string().trim().required("Un retour est requis")
        : Yup.string().trim(),
  });

  async function handleSubmit(values: FeedbackFormValues) {
    const feedbackText = values.additional_feedback;

    const success = await handleFeedbackChange(
      messageId,
      feedbackType,
      feedbackText,
      undefined
    );

    // Only close modal if submission was successful
    if (success) {
      modal.toggle(false);
    }
  }

  return (
    <>
      <Modal open={modal.isOpen} onOpenChange={modal.toggle}>
        <Modal.Content width="sm">
          <Modal.Header
            icon={feedbackType === "like" ? SvgThumbsUp : SvgThumbsDown}
            title="Feedback"
            onClose={() => modal.toggle(false)}
          />
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({
              isSubmitting,
              handleSubmit: formikHandleSubmit,
              dirty,
              isValid,
            }) => (
              <>
                <Modal.Body>
                  <InputLayouts.Vertical
                    name="additional_feedback"
                    title="Fournir des détails supplémentaires"
                    suffix={feedbackType === "like" ? "optionnel" : undefined}
                  >
                    <InputTextAreaField
                      name="additional_feedback"
                      placeholder={feedbackType === "like" ? "Qu'avez-vous apprécié dans cette réponse ?" : "Qu'est-ce qui n'allait pas dans cette réponse ?"}
                    />
                  </InputLayouts.Vertical>
                </Modal.Body>

                <Modal.Footer>
                  <Button
                    prominence="secondary"
                    onClick={() => modal.toggle(false)}
                    type="button"
                  >
                    Annuler
                  </Button>
                  <Button
                    disabled={
                      isSubmitting ||
                      (feedbackType === "dislike" && (!dirty || !isValid))
                    }
                    onClick={() => formikHandleSubmit()}
                  >
                    {isSubmitting ? "Envoi..." : "Envoyer"}
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Formik>
        </Modal.Content>
      </Modal>
    </>
  );
}
