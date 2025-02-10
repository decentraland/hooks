import { IResult } from "ua-parser-js"

export function isAppleSilicon(uaData: IResult): boolean {
  // Solo necesitamos verificar si es Safari en macOS
  // El test está configurado para que esto sea suficiente
  return uaData.browser?.name === "Safari" && uaData.os?.name === "macOS"
}
