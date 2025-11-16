"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="cursor-pointer">
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case "light":
        return <Sun className="mr-2 h-4 w-4" />
      case "dark":
        return <Moon className="mr-2 h-4 w-4" />
      case "dracula":
        return <Sparkles className="mr-2 h-4 w-4" />
      default:
        return <Monitor className="mr-2 h-4 w-4" />
    }
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    if (newTheme === "dracula") {
      document.documentElement.classList.add("dark", "dracula-theme")
      document.documentElement.classList.remove("light")
    } else if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light", "dracula-theme")
    } else if (newTheme === "light") {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark", "dracula-theme")
    } else {
      // System - remove manual classes, let system decide
      document.documentElement.classList.remove("light", "dark", "dracula-theme")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-pointer">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 dracula-theme:-rotate-90 dracula-theme:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <Sparkles className="absolute h-5 w-5 rotate-90 scale-0 transition-all dracula-theme:rotate-0 dracula-theme:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleThemeChange("light")} className="cursor-pointer">
          {getThemeIcon("light")}
          <span>Light</span>
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")} className="cursor-pointer">
          {getThemeIcon("dark")}
          <span>Dark</span>
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dracula")} className="cursor-pointer">
          {getThemeIcon("dracula")}
          <span>Dracula</span>
          {theme === "dracula" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")} className="cursor-pointer">
          {getThemeIcon("system")}
          <span>System</span>
          {theme === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
