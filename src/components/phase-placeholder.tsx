import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PhasePlaceholder({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <Card>
        <CardContent className="flex items-center gap-4 pt-6 text-muted-foreground">
          <Construction className="h-6 w-6 shrink-0" aria-hidden="true" />
          <p>Denna modul levereras i {phase}. Grunden (Fas 0) är på plats.</p>
        </CardContent>
      </Card>
    </div>
  );
}
