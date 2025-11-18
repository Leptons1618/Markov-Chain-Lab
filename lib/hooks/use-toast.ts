import { toast } from "sonner"

export type ToastType = "success" | "error" | "info" | "warning"

interface ToastOptions {
  title?: string
  description?: string
  duration?: number
}

export function useToast() {
  const showToast = (type: ToastType, message: string, options?: ToastOptions) => {
    const { title, description, duration = 4000 } = options || {}

    const toastOptions = {
      duration,
      description: description || undefined,
    }

    switch (type) {
      case "success":
        toast.success(title || message, toastOptions)
        break
      case "error":
        toast.error(title || message, toastOptions)
        break
      case "warning":
        toast.warning(title || message, toastOptions)
        break
      case "info":
        toast.info(title || message, toastOptions)
        break
      default:
        toast(title || message, toastOptions)
    }
  }

  return {
    toast: showToast,
    success: (message: string, options?: ToastOptions) => showToast("success", message, options),
    error: (message: string, options?: ToastOptions) => showToast("error", message, options),
    warning: (message: string, options?: ToastOptions) => showToast("warning", message, options),
    info: (message: string, options?: ToastOptions) => showToast("info", message, options),
  }
}
