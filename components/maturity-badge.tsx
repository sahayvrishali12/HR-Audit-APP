import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Maturity } from "@/lib/audit-types"

const STYLES: Record<Maturity, string> = {
  "Non Compliant": "bg-red-100 text-red-700 border-red-200",
  "Partially Compliant": "bg-amber-100 text-amber-700 border-amber-200",
  Compliant: "bg-blue-100 text-blue-700 border-blue-200",
  "Highly Compliant": "bg-green-100 text-green-700 border-green-200",
}

export function MaturityBadge({ maturity }: { maturity: Maturity }) {
  return <Badge className={cn("border", STYLES[maturity])}>{maturity}</Badge>
}

const PRIORITY_STYLES: Record<number, string> = {
  1: "bg-red-100 text-red-700 border-red-200",
  2: "bg-orange-100 text-orange-700 border-orange-200",
  3: "bg-amber-100 text-amber-700 border-amber-200",
  4: "bg-blue-100 text-blue-700 border-blue-200",
  5: "bg-slate-100 text-slate-700 border-slate-200",
}

export function PriorityBadge({ priority }: { priority: number }) {
  return <Badge className={cn("border", PRIORITY_STYLES[priority])}>P{priority}</Badge>
}
