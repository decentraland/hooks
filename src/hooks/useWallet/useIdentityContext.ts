import { useContext } from "react"
import { IdentityContext } from "./IdentityContext"
import { IdentityContextType } from "./types"

export const useIdentityContext = (): IdentityContextType => {
  const context = useContext(IdentityContext)
  if (context === undefined) {
    throw new Error(
      "useIdentityContext must be used within an IdentityProvider"
    )
  }
  return context
}
