import { readFileSync } from "node:fs"

const { dependencies, devDependencies } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
)

const getVersionRule = (packages) => {
  const exceptions = Object.keys(packages || {}).filter(
    (name) =>
      name.startsWith("@dcl/") ||
      name.startsWith("decentraland-") ||
      name.startsWith("dcl-")
  )

  return exceptions.length > 0 ? ["warning", { exceptions }] : "warning"
}

export const rules = {
  "prefer-absolute-version-dependencies": getVersionRule(dependencies),
  "prefer-absolute-version-devDependencies": getVersionRule(devDependencies),
}
