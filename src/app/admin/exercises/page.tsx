import { ExerciseCatalogProvider } from "@/components/ExerciseCatalogProvider";
import { ExerciseAdmin } from "@/components/admin/ExerciseAdmin";

export default function AdminExercisesPage() {
  return (
    <ExerciseCatalogProvider>
      <ExerciseAdmin />
    </ExerciseCatalogProvider>
  );
}
