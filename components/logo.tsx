"use client"

import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  variant?: "full" | "icon"
  className?: string
  showText?: boolean
}

export function Logo({ variant = "full", className = "", showText = true }: LogoProps) {
  const logoSrc = variant === "icon" ? "/logo-icon.svg" : "/logo.svg"
  const logoSize = variant === "icon" ? 32 : 40

  const containerClass = variant === "full" && !showText 
    ? `relative ${className}` 
    : `flex items-center gap-2 ${className}`

  return (
    <Link href="/" className={containerClass}>
      <div className="relative flex-shrink-0">
        {variant === "full" && !showText ? (
          <img
            src={logoSrc}
            alt="MarkovLearn Logo"
            className="w-full h-full object-contain"
          />
        ) : (
          <Image
            src={logoSrc}
            alt="MarkovLearn Logo"
            width={logoSize}
            height={logoSize}
            className="object-contain"
            priority
          />
        )}
      </div>
      {showText && (
        <span className="font-semibold text-lg bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
          MarkovLearn
        </span>
      )}
    </Link>
  )
}
