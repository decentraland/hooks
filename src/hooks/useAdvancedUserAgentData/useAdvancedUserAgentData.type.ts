export type AdvancedNavigatorUAData = {
  browser: {
    name: string
    version: string
  }
  engine: {
    name: string
    version: string
  }
  os: {
    name: string
    version: string
  }
  cpu: {
    architecture: string
  }
  mobile: boolean
  tablet: boolean
}
