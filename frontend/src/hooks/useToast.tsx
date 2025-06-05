
import * as React from "react"
import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning"
  duration?: number
}

export function useToast() {
  const toast = React.useCallback((options: ToastOptions) => {
    const { title, description, variant = "default", duration = 4000 } = options

    switch (variant) {
      case "success":
        sonnerToast.success(title || "הפעולה בוצעה בהצלחה", {
          description,
          duration,
          style: { direction: "rtl" }
        })
        break
      case "error":
        sonnerToast.error(title || "אירעה שגיאה", {
          description,
          duration,
          style: { direction: "rtl" }
        })
        break
      case "warning":
        sonnerToast.warning(title || "אזהרה", {
          description,
          duration,
          style: { direction: "rtl" }
        })
        break
      default:
        sonnerToast(title || "הודעה", {
          description,
          duration,
          style: { direction: "rtl" }
        })
    }
  }, [])

  return { toast }
}
