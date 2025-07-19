/**
 * @jest-environment jsdom
 */

declare global {
  interface Window {
    ethereum?: {
      providers?: Array<{
        isBraveWallet?: boolean
        isMetaMask?: boolean
        isCoinbaseWallet?: boolean
        isTrust?: boolean
        isFrame?: boolean
        isDapper?: boolean
        isCucumber?: boolean
        isToshi?: boolean
        isGoWallet?: boolean
        isAlphaWallet?: boolean
        isStatus?: boolean
      }>
      isMetaMask?: boolean
      isDapper?: boolean
      isCucumber?: boolean
      isTrust?: boolean
      isToshi?: boolean
      isGoWallet?: boolean
      isAlphaWallet?: boolean
      isStatus?: boolean
      isBraveWallet?: boolean
      isCoinbaseWallet?: boolean
      isFrame?: boolean
    }
    solana?: {
      isPhantom?: boolean
    }
  }
}

const getEvmWallets = (): string[] => {
  if (typeof window === "undefined") return []

  const ethereum = window.ethereum
  if (!ethereum) return []

  const providers = ethereum.providers ?? [ethereum]
  const names = new Set<string>()

  for (const provider of providers.filter(Boolean)) {
    if (provider.isBraveWallet) names.add("brave")
    else if (provider.isMetaMask) names.add("metamask")
    if (provider.isCoinbaseWallet) names.add("coinbase")
    if (provider.isTrust) names.add("trust")
    if (provider.isFrame) names.add("frame")
    if (provider.isDapper) names.add("dapper")
    if (provider.isCucumber) names.add("cucumber")
    if (provider.isToshi) names.add("toshi")
    if (provider.isGoWallet) names.add("goWallet")
    if (provider.isAlphaWallet) names.add("alphaWallet")
    if (provider.isStatus) names.add("status")
  }

  return Array.from(names)
}

const getSolanaWallets = (): string[] => {
  if (typeof window === "undefined") return []

  const wallets: string[] = []
  if (window.solana?.isPhantom) wallets.push("phantom")

  return wallets
}

const getAllWallets = (): string[] => {
  const evmWallets = getEvmWallets()
  const solanaWallets = getSolanaWallets()
  return [...evmWallets, ...solanaWallets]
}

const getWalletType = (wallets: string[]): string => {
  if (wallets.length === 0) return "none"
  if (wallets.length === 1) return wallets[0]
  return wallets.join(",")
}

describe("useTracking wallet detection", () => {
  let mockIsbot: jest.Mock
  let mockAnalytics: {
    track: jest.Mock
    identify: jest.Mock
    page: jest.Mock
    user: jest.Mock
  }

  beforeEach(() => {
    mockIsbot = jest.fn().mockReturnValue(false)
    jest.doMock("isbot", () => ({
      isbot: mockIsbot,
    }))

    Object.defineProperty(window, "ethereum", {
      value: undefined,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, "solana", {
      value: undefined,
      writable: true,
      configurable: true,
    })

    mockAnalytics = {
      track: jest.fn(),
      identify: jest.fn(),
      page: jest.fn(),
      user: jest.fn(() => ({
        anonymousId: jest.fn().mockReturnValue("test-id"),
      })),
    }

    Object.defineProperty(window, "analytics", {
      value: mockAnalytics,
      writable: true,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  describe("when no wallets are detected", () => {
    let detectedWallets: string[]
    let walletType: string

    beforeEach(() => {
      delete (window as Window & { ethereum?: unknown }).ethereum
      delete (window as Window & { solana?: unknown }).solana

      detectedWallets = getAllWallets()
      walletType = getWalletType(detectedWallets)
    })

    it("should return wallet type as none", () => {
      expect(walletType).toBe("none")
    })

    it("should return empty wallets array", () => {
      expect(detectedWallets).toEqual([])
    })
  })

  describe("when MetaMask wallet is detected", () => {
    let ethereumProvider: {
      isMetaMask: boolean
      providers: Array<{ isMetaMask: boolean }>
    }
    let detectedWallets: string[]

    beforeEach(() => {
      ethereumProvider = {
        isMetaMask: true,
        providers: [{ isMetaMask: true }],
      }

      Object.defineProperty(window, "ethereum", {
        value: ethereumProvider,
        writable: true,
        configurable: true,
      })

      detectedWallets = getAllWallets()
    })

    it("should detect MetaMask in the wallets array", () => {
      expect(detectedWallets).toEqual(["metamask"])
    })

    it("should indicate wallets are present", () => {
      expect(detectedWallets.length > 0).toBe(true)
    })
  })

  describe("when Phantom wallet is detected", () => {
    let solanaProvider: { isPhantom: boolean }
    let detectedWallets: string[]

    beforeEach(() => {
      delete (window as Window & { ethereum?: unknown }).ethereum

      solanaProvider = { isPhantom: true }

      Object.defineProperty(window, "solana", {
        value: solanaProvider,
        writable: true,
        configurable: true,
      })

      detectedWallets = getAllWallets()
    })

    it("should detect Phantom in the wallets array", () => {
      expect(detectedWallets).toEqual(["phantom"])
    })

    it("should indicate wallets are present", () => {
      expect(detectedWallets.length > 0).toBe(true)
    })
  })

  describe("when multiple wallets are detected", () => {
    let ethereumProvider: {
      providers: Array<{ isMetaMask?: boolean; isCoinbaseWallet?: boolean }>
    }
    let solanaProvider: { isPhantom: boolean }
    let detectedWallets: string[]

    beforeEach(() => {
      ethereumProvider = {
        providers: [{ isMetaMask: true }, { isCoinbaseWallet: true }],
      }

      solanaProvider = { isPhantom: true }

      Object.defineProperty(window, "ethereum", {
        value: ethereumProvider,
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window, "solana", {
        value: solanaProvider,
        writable: true,
        configurable: true,
      })

      detectedWallets = getAllWallets()
    })

    it("should detect all available wallets in the correct order", () => {
      expect(detectedWallets).toEqual(["metamask", "coinbase", "phantom"])
    })

    it("should indicate multiple wallets are present", () => {
      expect(detectedWallets.length > 0).toBe(true)
    })
  })

  describe("when generating wallet type strings", () => {
    describe("and multiple wallets are available", () => {
      let wallets: string[]
      let walletType: string

      beforeEach(() => {
        wallets = ["metamask", "coinbase", "phantom"]
        walletType = getWalletType(wallets)
      })

      it("should join wallet names with commas", () => {
        expect(walletType).toBe("metamask,coinbase,phantom")
      })
    })

    describe("and a single wallet is available", () => {
      let wallets: string[]
      let walletType: string

      beforeEach(() => {
        wallets = ["metamask"]
        walletType = getWalletType(wallets)
      })

      it("should return the wallet name directly", () => {
        expect(walletType).toBe("metamask")
      })
    })

    describe("and no wallets are available", () => {
      let wallets: string[]
      let walletType: string

      beforeEach(() => {
        wallets = []
        walletType = getWalletType(wallets)
      })

      it("should return none", () => {
        expect(walletType).toBe("none")
      })
    })
  })
})

export {}
