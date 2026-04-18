import { StandardAnswerCreationForm } from "@/app/ee/admin/standard-answer/StandardAnswerCreationForm";
import { fetchSS } from "@/lib/utilsSS";
import { ErrorCallout } from "@/components/ErrorCallout";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import { ADMIN_ROUTES } from "@/lib/admin-routes";
import { StandardAnswer, StandardAnswerCategory } from "@/lib/types";

const route = ADMIN_ROUTES.STANDARD_ANSWERS;

async function Main({ id }: { id: string }) {
  const tasks = [
    fetchSS("/manage/admin/standard-answer"),
    fetchSS(`/manage/admin/standard-answer/category`),
  ];
  const [standardAnswersResponse, standardAnswerCategoriesResponse] =
    await Promise.all(tasks);

  if (standardAnswersResponse === undefined) {
    return (
      <ErrorCallout
        errorTitle="Une erreur s'est produite :("
        errorMsg={`Impossible de récupérer les réponses standard.`}
      />
    );
  }

  if (!standardAnswersResponse.ok) {
    return (
      <ErrorCallout
        errorTitle="Une erreur s'est produite :("
        errorMsg={`Impossible de récupérer les réponses standard - ${await standardAnswersResponse.text()}`}
      />
    );
  }
  const allStandardAnswers =
    (await standardAnswersResponse.json()) as StandardAnswer[];
  const standardAnswer = allStandardAnswers.find(
    (answer) => answer.id.toString() === id
  );

  if (!standardAnswer) {
    return (
      <ErrorCallout
        errorTitle="Une erreur s'est produite :("
        errorMsg={`Réponse standard introuvable avec l'ID : ${id}`}
      />
    );
  }

  if (standardAnswerCategoriesResponse === undefined) {
    return (
      <ErrorCallout
        errorTitle="Une erreur s'est produite :("
        errorMsg={`Impossible de récupérer les catégories de réponses standard.`}
      />
    );
  }

  if (!standardAnswerCategoriesResponse.ok) {
    return (
      <ErrorCallout
        errorTitle="Une erreur s'est produite :("
        errorMsg={`Impossible de récupérer les catégories de réponses standard - ${await standardAnswerCategoriesResponse.text()}`}
      />
    );
  }

  const standardAnswerCategories =
    (await standardAnswerCategoriesResponse.json()) as StandardAnswerCategory[];

  return (
    <StandardAnswerCreationForm
      standardAnswerCategories={standardAnswerCategories}
      existingStandardAnswer={standardAnswer}
    />
  );
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header
        icon={route.icon}
        title="Modifier la réponse standard"
        backButton
        separator
      />
      <SettingsLayouts.Body>
        <Main id={params.id} />
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}
