// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncTaskIdentity = (id: string, ...extra: any[]) => Promise<any>

export { AsyncTaskIdentity }
