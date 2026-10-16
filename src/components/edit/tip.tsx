import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Hover text, also the accessible name of the (icon) button it wraps. */
export function Tip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger aria-label={label} render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
