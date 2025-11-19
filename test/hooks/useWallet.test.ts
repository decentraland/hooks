import { act, renderHook } from "@testing-library/react/pure"
import { useWallet } from "../../src/hooks/useWallet"

jest.mock("../../src/utils/development/sentry", () => ({
  sentry: jest.fn((callback) => {
    callback({
      captureException: jest.fn(),
    })
  }),
}))

describe("useWallet", () => {
  let mockEthereum: {
    request: jest.Mock
    on: jest.Mock
    removeListener: jest.Mock
    isMetaMask?: boolean
    selectedAddress?: string
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

  describe("when wallet provider is not available", () => {
    beforeEach(() => {
      delete (window as { ethereum?: unknown }).ethereum
    })

    it("should return disconnected state", () => {
      const { result } = renderHook(() => useWallet())

      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBe(null)
      expect(result.current.isConnecting).toBe(false)
    })

    describe("and connect is called", () => {
      let onError: jest.Mock
      let result: ReturnType<
        typeof renderHook<ReturnType<typeof useWallet>, unknown>
      >["result"]

      beforeEach(() => {
        onError = jest.fn()
        const hook = renderHook(() =>
          useWallet({
            onError,
          })
        )
        result = hook.result

        act(() => {
          result.current.connect()
        })
      })

      it("should call onError callback", () => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Wallet provider not available",
          })
        )
      })

      it("should set error state", () => {
        expect(result.current.error).toEqual(
          expect.objectContaining({
            message: "Wallet provider not available",
          })
        )
      })
    })
  })

  describe("when wallet provider is available", () => {
    describe("and no accounts are connected", () => {
      beforeEach(() => {
        mockEthereum.request.mockResolvedValue([])
      })

      it("should return disconnected state", async () => {
        const { result } = renderHook(() => useWallet())

        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
        })

        expect(result.current.isConnected).toBe(false)
        expect(result.current.address).toBe(null)
      })

      describe("and autoConnect is false", () => {
        it("should not attempt to connect", async () => {
          renderHook(() =>
            useWallet({
              autoConnect: false,
            })
          )

          await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 100))
          })

          expect(mockEthereum.request).toHaveBeenCalledWith({
            method: "eth_accounts",
          })
          expect(mockEthereum.request).not.toHaveBeenCalledWith({
            method: "eth_requestAccounts",
          })
        })
      })

      describe("and autoConnect is true with stored address", () => {
        beforeEach(() => {
          localStorage.setItem("wallet_address", "0x123")
        })

        it("should attempt to connect", async () => {
          mockEthereum.request
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(["0x123"])

          renderHook(() =>
            useWallet({
              autoConnect: true,
            })
          )

          await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 100))
          })

          expect(mockEthereum.request).toHaveBeenCalledWith({
            method: "eth_requestAccounts",
          })
        })
      })
    })

    describe("and accounts are already connected", () => {
      const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

      beforeEach(() => {
        mockEthereum.request.mockResolvedValue([mockAddress])
      })

      it("should return connected state with address", async () => {
        const { result } = renderHook(() => useWallet())

        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
        })

        expect(result.current.isConnected).toBe(true)
        expect(result.current.address).toBe(mockAddress.toLowerCase())
      })

      it("should store address in localStorage", async () => {
        renderHook(() => useWallet())

        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
        })

        expect(localStorage.getItem("wallet_address")).toBe(
          mockAddress.toLowerCase()
        )
      })
    })

    describe("and connect is called", () => {
      const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      let onConnect: jest.Mock

      beforeEach(() => {
        mockEthereum.request.mockResolvedValue([mockAddress])
        onConnect = jest.fn()
      })

      it("should connect wallet and return address", async () => {
        const { result } = renderHook(() =>
          useWallet({
            onConnect,
          })
        )

        await act(async () => {
          await result.current.connect()
        })

        expect(result.current.isConnected).toBe(true)
        expect(result.current.address).toBe(mockAddress.toLowerCase())
        expect(mockEthereum.request).toHaveBeenCalledWith({
          method: "eth_requestAccounts",
        })
      })

      it("should call onConnect callback", async () => {
        const { result } = renderHook(() =>
          useWallet({
            onConnect,
          })
        )

        await act(async () => {
          await result.current.connect()
        })

        expect(onConnect).toHaveBeenCalledWith(mockAddress.toLowerCase())
      })

      it("should store address in localStorage", async () => {
        const { result } = renderHook(() => useWallet())

        await act(async () => {
          await result.current.connect()
        })

        expect(localStorage.getItem("wallet_address")).toBe(
          mockAddress.toLowerCase()
        )
      })

      describe("and request fails", () => {
        let onError: jest.Mock
        const mockError = new Error("User rejected request")

        beforeEach(() => {
          mockEthereum.request.mockRejectedValue(mockError)
          onError = jest.fn()
        })

        it("should set error state", async () => {
          const { result } = renderHook(() =>
            useWallet({
              onError,
            })
          )

          await act(async () => {
            await result.current.connect()
          })

          expect(result.current.error).toBe(mockError)
          expect(result.current.isConnecting).toBe(false)
        })

        it("should call onError callback", async () => {
          const { result } = renderHook(() =>
            useWallet({
              onError,
            })
          )

          await act(async () => {
            await result.current.connect()
          })

          expect(onError).toHaveBeenCalledWith(mockError)
        })
      })

      describe("and no address is returned", () => {
        beforeEach(() => {
          mockEthereum.request.mockResolvedValue([])
        })

        it("should set error state", async () => {
          const { result } = renderHook(() => useWallet())

          await act(async () => {
            await result.current.connect()
          })

          expect(result.current.error).toEqual(
            expect.objectContaining({
              message: "No accounts found",
            })
          )
        })
      })
    })

    describe("and disconnect is called", () => {
      const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      let onDisconnect: jest.Mock

      beforeEach(() => {
        mockEthereum.request.mockResolvedValue([mockAddress])
        onDisconnect = jest.fn()
      })

      it("should disconnect wallet", async () => {
        const { result } = renderHook(() =>
          useWallet({
            onDisconnect,
          })
        )

        await act(async () => {
          await result.current.connect()
        })

        expect(result.current.isConnected).toBe(true)

        await act(async () => {
          await result.current.disconnect()
        })

        expect(result.current.isConnected).toBe(false)
        expect(result.current.address).toBe(null)
      })

      it("should call onDisconnect callback", async () => {
        const { result } = renderHook(() =>
          useWallet({
            onDisconnect,
          })
        )

        await act(async () => {
          await result.current.connect()
        })

        await act(async () => {
          await result.current.disconnect()
        })

        expect(onDisconnect).toHaveBeenCalled()
      })

      it("should remove address from localStorage", async () => {
        const { result } = renderHook(() => useWallet())

        await act(async () => {
          await result.current.connect()
        })

        expect(localStorage.getItem("wallet_address")).toBe(
          mockAddress.toLowerCase()
        )

        await act(async () => {
          await result.current.disconnect()
        })

        expect(localStorage.getItem("wallet_address")).toBe(null)
      })
    })

    describe("and reconnect is called", () => {
      const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

      beforeEach(() => {
        mockEthereum.request.mockResolvedValue([mockAddress])
      })

      it("should disconnect and reconnect wallet", async () => {
        const { result } = renderHook(() => useWallet())

        await act(async () => {
          await result.current.connect()
        })

        expect(result.current.isConnected).toBe(true)

        await act(async () => {
          await result.current.reconnect()
        })

        expect(result.current.isConnected).toBe(true)
        expect(result.current.address).toBe(mockAddress.toLowerCase())
      })
    })

    describe("and accountsChanged event is fired", () => {
      const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      let accountsChangedHandler: (accounts: string[]) => void

      beforeEach(() => {
        mockEthereum.request.mockResolvedValue([mockAddress])
        mockEthereum.on.mockImplementation((event, handler) => {
          if (event === "accountsChanged") {
            accountsChangedHandler = handler
          }
        })
      })

      it("should update address when account changes", async () => {
        const { result } = renderHook(() => useWallet())

        await act(async () => {
          await result.current.connect()
        })

        const newAddress = "0xNewAddress"

        act(() => {
          accountsChangedHandler([newAddress])
        })

        expect(result.current.address).toBe(newAddress.toLowerCase())
        expect(result.current.isConnected).toBe(true)
      })

      it("should disconnect when accounts array is empty", async () => {
        const { result } = renderHook(() => useWallet())

        await act(async () => {
          await result.current.connect()
        })

        act(() => {
          accountsChangedHandler([])
        })

        expect(result.current.address).toBe(null)
        expect(result.current.isConnected).toBe(false)
      })

      it("should clean up event listener on unmount", () => {
        const { unmount } = renderHook(() => useWallet())

        unmount()

        expect(mockEthereum.removeListener).toHaveBeenCalledWith(
          "accountsChanged",
          expect.any(Function)
        )
      })
    })
  })
})
