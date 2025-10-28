"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Palette } from "lucide-react"
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

const colorThemes = [
  { name: "Emerald", value: "emerald", color: "oklch(0.52 0.22 165)" },
  { name: "Blue", value: "blue", color: "oklch(0.50 0.20 240)" },
  { name: "Purple", value: "purple", color: "oklch(0.55 0.22 290)" },
  { name: "Orange", value: "orange", color: "oklch(0.60 0.20 40)" },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [colorTheme, setColorTheme] = React.useState("emerald")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const savedColorTheme = localStorage.getItem("color-theme") || "emerald"
    setColorTheme(savedColorTheme)
    if (savedColorTheme !== "emerald") {
      document.documentElement.setAttribute("data-theme", savedColorTheme)
    }
  }, [])

  const handleColorThemeChange = (newTheme: string) => {
    setColorTheme(newTheme)
    localStorage.setItem("color-theme", newTheme)
    if (newTheme === "emerald") {
      document.documentElement.removeAttribute("data-theme")
    } else {
      document.documentElement.setAttribute("data-theme", newTheme)
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="cursor-pointer">
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Color Theme Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <Palette className="h-5 w-5" />
            <span className="sr-only">Select color theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {colorThemes.map((ct) => (
            <DropdownMenuItem
              key={ct.value}
              onClick={() => handleColorThemeChange(ct.value)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: ct.color }} />
                <span>{ct.name}</span>
                {colorTheme === ct.value && <span className="ml-auto">✓</span>}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Light/Dark Mode Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
            {theme === "light" && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
            {theme === "dark" && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
            <Monitor className="mr-2 h-4 w-4" />
            <span>System</span>
            {theme === "system" && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
