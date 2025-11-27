import { act, renderHook } from "@testing-library/react/pure"
import React, { ReactNode } from "react"
import { AuthProvider, useAuthContext } from "../../src/hooks/useWallet"

jest.mock("../../src/utils/development/sentry", () => ({
  sentry: jest.fn((callback) => {
    callback({
      captureException: jest.fn(),
    })
  }),
}))

jest.mock("@dcl/crypto", () => ({
  Authenticator: {
    initializeAuthChain: jest.fn().mockResolvedValue({
      address: "0xephemeral",
      authChain: [],
    }),
  },
}))

jest.mock("@dcl/single-sign-on-client", () => ({
  LocalStorageUtils: {
    getIdentity: jest.fn().mockReturnValue(null),
    setIdentity: jest.fn(),
  },
}))

describe("useAuthContext", () => {
  let mockEthereum: {
    request: jest.Mock
    on: jest.Mock
    removeListener: jest.Mock
    isMetaMask?: boolean
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()

    mockEthereum = {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
      isMetaMask: true,
    }

    Object.defineProperty(window, "ethereum", {
      value: mockEthereum,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    delete (window as { ethereum?: unknown }).ethereum
    localStorage.clear()
  })

  describe("when AuthProvider is not present", () => {
    it("should throw error when used outside provider", () => {
      const errorMessage = "useAuthContext must be used within an AuthProvider"
      expect(() => renderHook(() => useAuthContext())).toThrow(errorMessage)
    })
  })

  describe("when AuthProvider is present", () => {
    interface WrapperProps {
      children: ReactNode
    }

    const wrapper = ({ children }: WrapperProps) => (
      <AuthProvider>{children}</AuthProvider>
    )

    describe("and wallet is not connected", () => {
      beforeEach(() => {
        mockEthereum.request.mockResolvedValue([])
      })

      it("should return disconnected state", async () => {
        const { result } = renderHook(() => useAuthContext(), { wrapper })

        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
        })

        expect(result.current.address).toBe(null)
        expect(result.current.identity).toBe(null)
        expect(result.current.isAuthenticating).toBe(false)
      })
    })

    describe("and connect is called", () => {
      const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

      beforeEach(() => {
        mockEthereum.request.mockResolvedValue([mockAddress])
      })

      it("should connect wallet and create identity", async () => {
        const { result } = renderHook(() => useAuthContext(), { wrapper })

        await act(async () => {
          await result.current.connect()
        })

        expect(result.current.address).toBe(mockAddress)
        expect(result.current.identity).toBeDefined()
      })

      it("should set isAuthenticating to false after connection", async () => {
        const { result } = renderHook(() => useAuthContext(), { wrapper })

        await act(async () => {
          await result.current.connect()
        })

        expect(result.current.isAuthenticating).toBe(false)
      })
    })

    describe("and logout is called", () => {
      const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

      beforeEach(() => {
        mockEthereum.request.mockResolvedValue([mockAddress])
      })

      it("should disconnect wallet and clear identity", async () => {
        const { result } = renderHook(() => useAuthContext(), { wrapper })

        await act(async () => {
          await result.current.connect()
        })

        expect(result.current.address).toBeDefined()

        await act(async () => {
          result.current.logout()
        })

        expect(result.current.address).toBe(null)
        expect(result.current.identity).toBe(null)
      })
    })

    describe("and wallet connection fails", () => {
      const mockError = new Error("User rejected request")

      beforeEach(() => {
        mockEthereum.request.mockRejectedValue(mockError)
      })

      it("should set error state", async () => {
        const { result } = renderHook(() => useAuthContext(), { wrapper })

        await act(async () => {
          await result.current.connect()
        })

        expect(result.current.error).toBeDefined()
        expect(result.current.isAuthenticating).toBe(false)
      })
    })
  })
})
