import { JargonProvider } from "@/components/answers/JargonContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import CalcExplainerBar from "@/components/calculators/CalcExplainerBar";

export default function CalculatorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <JargonProvider>
      <TooltipProvider delayDuration={150}>
        <CalcExplainerBar />
        {children}
      </TooltipProvider>
    </JargonProvider>
  );
}
