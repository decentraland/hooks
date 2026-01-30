const signedFetchFactory = () => {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ notifications: [] }),
  })
}

export { signedFetchFactory }
