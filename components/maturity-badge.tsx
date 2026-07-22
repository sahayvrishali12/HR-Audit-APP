import { CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Maturity } from "@/lib/audit-types"

const STYLES: Record<Maturity, string> = {
  "Non Compliant": "bg-red-100 text-red-700 border-red-200",
  "Partially Compliant": "bg-amber-100 text-amber-800 border-amber-200",
  Compliant: "bg-lime-100 text-lime-800 border-lime-200",
  "Highly Compliant": "bg-green-100 text-green-800 border-green-200",
}

export function MaturityBadge({ maturity }: { maturity: Maturity }) {
  return <Badge className={cn("border", STYLES[maturity])}>{maturity}</Badge>
}

export function DocStatusBadge({ available }: { available: boolean }) {
  return (
    <Badge
      className={cn(
        "border gap-1",
        available ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200",
      )}
    >
      {available ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
      {available ? "Available" : "Not Available"}
    </Badge>
  )
}
