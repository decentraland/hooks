import { act, renderHook } from "@testing-library/react/pure"
import { useBackgroundDownload } from "../../src/hooks/useBackgroundDownload"

jest.mock("../__mocks__/sentry")

describe("useBackgroundDownload", () => {
  let mockFetch: jest.Mock
  let mockFileReader: jest.Mock
  let mockReadAsDataURL: jest.Mock
  let mockCreateObjectURL: jest.Mock
  let mockRevokeObjectURL: jest.Mock
  let localStorageMock: Storage

  beforeEach(() => {
    jest.clearAllMocks()

    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    }

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    })

    mockCreateObjectURL = jest.fn().mockReturnValue("blob:test-url")
    mockRevokeObjectURL = jest.fn()
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

    mockReadAsDataURL = jest.fn()
    mockFileReader = jest.fn().mockImplementation(() => ({
      readAsDataURL: mockReadAsDataURL,
      result: "data:application/octet-stream;base64,dGVzdA==",
      onloadend: null,
      onerror: null,
    }))

    global.FileReader = mockFileReader as unknown as typeof FileReader

    mockFetch = jest.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when initialized", () => {
    it("should return idle state", () => {
      const { result } = renderHook(() =>
        useBackgroundDownload({
          urls: {
            mac: "https://decentraland.org/explorer/launcher.dmg",
            win: "https://decentraland.org/explorer/launcher.exe",
          },
        })
      )

      expect(result.current.state).toBe("idle")
    })

    describe("and cache exists", () => {
      let cachedData: { data: string; type: string; timestamp: number }

      beforeEach(() => {
        cachedData = {
          data: "dGVzdA==",
          type: "application/octet-stream",
          timestamp: Date.now(),
        }
        localStorageMock.getItem = jest
          .fn()
          .mockReturnValue(JSON.stringify(cachedData))
      })

      it("should return finished state", () => {
        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            cacheKey: "test-cache",
          })
        )

        expect(result.current.state).toBe("finished")
      })

      it("should return progress as 100", () => {
        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            cacheKey: "test-cache",
          })
        )

        expect(result.current.progress).toBe(100)
      })

      describe("and cache is not expired", () => {
        beforeEach(() => {
          cachedData = {
            data: "dGVzdA==",
            type: "application/octet-stream",
            timestamp: Date.now() - 1000,
          }
          localStorageMock.getItem = jest
            .fn()
            .mockReturnValue(JSON.stringify(cachedData))
        })

        it("should return finished state", () => {
          const { result } = renderHook(() =>
            useBackgroundDownload({
              urls: {
                mac: "https://example.com/mac",
                win: "https://example.com/win",
              },
              cacheKey: "test-cache",
              cacheTTL: 5000,
            })
          )

          expect(result.current.state).toBe("finished")
        })
      })

      describe("and cache is expired", () => {
        beforeEach(() => {
          cachedData = {
            data: "dGVzdA==",
            type: "application/octet-stream",
            timestamp: Date.now() - 10000,
          }
          localStorageMock.getItem = jest
            .fn()
            .mockReturnValue(JSON.stringify(cachedData))
        })

        it("should return idle state", () => {
          const { result } = renderHook(() =>
            useBackgroundDownload({
              urls: {
                mac: "https://example.com/mac",
                win: "https://example.com/win",
              },
              cacheKey: "test-cache",
              cacheTTL: 5000,
            })
          )

          expect(result.current.state).toBe("idle")
        })

        it("should remove expired cache from localStorage", () => {
          renderHook(() =>
            useBackgroundDownload({
              urls: {
                mac: "https://example.com/mac",
                win: "https://example.com/win",
              },
              cacheKey: "test-cache",
              cacheTTL: 5000,
            })
          )

          expect(localStorageMock.removeItem).toHaveBeenCalled()
        })
      })
    })

    describe("and cache is disabled", () => {
      let cachedData: { data: string; type: string; timestamp: number }

      beforeEach(() => {
        cachedData = {
          data: "dGVzdA==",
          type: "application/octet-stream",
          timestamp: Date.now(),
        }
        localStorageMock.getItem = jest
          .fn()
          .mockReturnValue(JSON.stringify(cachedData))
      })

      it("should return idle state", () => {
        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            enableCache: false,
          })
        )

        expect(result.current.state).toBe("idle")
      })
    })
  })

  describe("when starting download", () => {
    describe("and the download succeeds", () => {
      let mockResponse: Response
      let mockReader: {
        read: jest.Mock
        cancel: jest.Mock
      }

      beforeEach(() => {
        mockReader = {
          read: jest.fn(),
          cancel: jest.fn(),
        }

        mockResponse = {
          ok: true,
          status: 200,
          headers: new Headers({
            "content-length": "100",
          }),
          body: {
            getReader: jest.fn().mockReturnValue(mockReader),
          },
        } as unknown as Response

        mockFetch.mockResolvedValue(mockResponse)
      })

      it("should update state to downloading", async () => {
        const chunks = [
          new Uint8Array([1, 2, 3, 4, 5]),
          new Uint8Array([6, 7, 8, 9, 10]),
        ]

        mockReader.read
          .mockResolvedValueOnce({ done: false, value: chunks[0] })
          .mockResolvedValueOnce({ done: false, value: chunks[1] })
          .mockResolvedValueOnce({ done: true, value: undefined })

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
          })
        )

        await act(async () => {
          await result.current.start()
        })

        expect(result.current.state).toBe("finished")
        expect(result.current.progress).toBe(100)
      })

      it("should call onProgress callback during download", async () => {
        const onProgress = jest.fn()
        const chunks = [new Uint8Array([1, 2, 3, 4, 5])]

        mockReader.read
          .mockResolvedValueOnce({ done: false, value: chunks[0] })
          .mockResolvedValueOnce({ done: true, value: undefined })

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            onProgress,
          })
        )

        await act(async () => {
          await result.current.start()
        })

        expect(onProgress).toHaveBeenCalled()
      })

      it("should call onDone callback when download completes", async () => {
        const onDone = jest.fn()
        const chunks = [new Uint8Array([1, 2, 3, 4, 5])]

        mockReader.read
          .mockResolvedValueOnce({ done: false, value: chunks[0] })
          .mockResolvedValueOnce({ done: true, value: undefined })

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            onDone,
          })
        )

        await act(async () => {
          await result.current.start()
        })

        expect(onDone).toHaveBeenCalled()
        expect(onDone.mock.calls[0][0]).toBeInstanceOf(Blob)
      })

      it("should save to cache when enabled", async () => {
        const chunks = [new Uint8Array([1, 2, 3, 4, 5])]

        mockReader.read
          .mockResolvedValueOnce({ done: false, value: chunks[0] })
          .mockResolvedValueOnce({ done: true, value: undefined })

        mockReadAsDataURL.mockImplementation(function (this: FileReader) {
          setTimeout(() => {
            if (this.onloadend) {
              this.onloadend({} as ProgressEvent<FileReader>)
            }
          }, 0)
        })

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            cacheKey: "test-cache",
          })
        )

        await act(async () => {
          await result.current.start()
          await new Promise((resolve) => setTimeout(resolve, 10))
        })

        expect(localStorageMock.setItem).toHaveBeenCalled()
      })
    })

    describe("and the download fails", () => {
      it("should update state to error", async () => {
        const mockError = new Error("Network error")
        mockFetch.mockRejectedValue(mockError)

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
          })
        )

        await act(async () => {
          await result.current.start()
        })

        expect(result.current.state).toBe("error")
        expect(result.current.error).toBe(mockError)
      })

      it("should call onError callback", async () => {
        const onError = jest.fn()
        const mockError = new Error("Network error")
        mockFetch.mockRejectedValue(mockError)

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            onError,
          })
        )

        await act(async () => {
          await result.current.start()
        })

        expect(onError).toHaveBeenCalledWith(mockError)
      })

      it("should handle HTTP error status", async () => {
        const mockResponse = {
          ok: false,
          status: 404,
          headers: new Headers(),
          body: null,
        } as unknown as Response

        mockFetch.mockResolvedValue(mockResponse)

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
          })
        )

        await act(async () => {
          await result.current.start()
        })

        expect(result.current.state).toBe("error")
      })
    })

    describe("and the download is aborted", () => {
      it("should update state to aborted", async () => {
        const mockResponse = {
          ok: true,
          status: 200,
          headers: new Headers({
            "content-length": "100",
          }),
          body: {
            getReader: jest.fn().mockReturnValue({
              read: jest
                .fn()
                .mockRejectedValue(
                  Object.assign(new Error("Aborted"), { name: "AbortError" })
                ),
            }),
          },
        } as unknown as Response

        mockFetch.mockResolvedValue(mockResponse)

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
          })
        )

        await act(async () => {
          await result.current.start()
        })

        expect(result.current.state).toBe("aborted")
      })
    })
  })

  describe("when aborting download", () => {
    it("should abort the download", () => {
      const mockAbortController = {
        abort: jest.fn(),
        signal: {} as AbortSignal,
      }

      jest
        .spyOn(global, "AbortController")
        .mockImplementation(
          () => mockAbortController as unknown as AbortController
        )

      const { result } = renderHook(() =>
        useBackgroundDownload({
          urls: {
            mac: "https://decentraland.org/explorer/launcher.dmg",
            win: "https://decentraland.org/explorer/launcher.exe",
          },
        })
      )

      act(() => {
        result.current.abort()
      })

      expect(mockAbortController.abort).toHaveBeenCalled()
    })
  })

  describe("when saving file", () => {
    describe("and blob is available", () => {
      let mockAnchor: {
        href: string
        download: string
        click: jest.Mock
        remove: jest.Mock
      }
      let cachedData: { data: string; type: string; timestamp: number }

      beforeEach(() => {
        cachedData = {
          data: "dGVzdA==",
          type: "application/octet-stream",
          timestamp: Date.now(),
        }
        localStorageMock.getItem = jest
          .fn()
          .mockReturnValue(JSON.stringify(cachedData))

        mockAnchor = {
          href: "",
          download: "",
          click: jest.fn(),
          remove: jest.fn(),
        }

        jest
          .spyOn(document, "createElement")
          .mockReturnValue(mockAnchor as unknown as HTMLElement)
        jest.spyOn(document.body, "appendChild").mockImplementation()
        jest.spyOn(mockAnchor, "remove").mockImplementation()
      })

      it("should create download link", () => {
        const createElementSpy = jest.spyOn(document, "createElement")

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            cacheKey: "test-cache",
          })
        )

        act(() => {
          result.current.save("test-file.dmg")
        })

        expect(createElementSpy).toHaveBeenCalledWith("a")
      })

      it("should set download filename", () => {
        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            cacheKey: "test-cache",
          })
        )

        act(() => {
          result.current.save("test-file.dmg")
        })

        expect(mockAnchor.download).toBe("test-file.dmg")
      })

      it("should trigger click on anchor", () => {
        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            cacheKey: "test-cache",
          })
        )

        act(() => {
          result.current.save("test-file.dmg")
        })

        expect(mockAnchor.click).toHaveBeenCalled()
      })

      it("should revoke blob URL", () => {
        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            cacheKey: "test-cache",
          })
        )

        act(() => {
          result.current.save("test-file.dmg")
        })

        expect(mockRevokeObjectURL).toHaveBeenCalled()
      })
    })

    describe("and blob is not available", () => {
      it("should not create download link", () => {
        const createElementSpy = jest.spyOn(document, "createElement")

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
          })
        )

        act(() => {
          result.current.save("test-file.dmg")
        })

        expect(createElementSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe("when clearing cache", () => {
    let cachedData: { data: string; type: string; timestamp: number }

    beforeEach(() => {
      cachedData = {
        data: "dGVzdA==",
        type: "application/octet-stream",
        timestamp: Date.now(),
      }
      localStorageMock.getItem = jest
        .fn()
        .mockReturnValue(JSON.stringify(cachedData))
    })

    it("should remove cache from localStorage", () => {
      const { result } = renderHook(() =>
        useBackgroundDownload({
          urls: {
            mac: "https://decentraland.org/explorer/launcher.dmg",
            win: "https://decentraland.org/explorer/launcher.exe",
          },
          cacheKey: "test-cache",
        })
      )

      act(() => {
        result.current.clearCache()
      })

      expect(localStorageMock.removeItem).toHaveBeenCalled()
    })

    it("should reset state to idle", () => {
      const { result } = renderHook(() =>
        useBackgroundDownload({
          urls: {
            mac: "https://decentraland.org/explorer/launcher.dmg",
            win: "https://decentraland.org/explorer/launcher.exe",
          },
          cacheKey: "test-cache",
        })
      )

      act(() => {
        result.current.clearCache()
      })

      expect(result.current.state).toBe("idle")
    })

    it("should reset progress to 0", () => {
      const { result } = renderHook(() =>
        useBackgroundDownload({
          urls: {
            mac: "https://decentraland.org/explorer/launcher.dmg",
            win: "https://decentraland.org/explorer/launcher.exe",
          },
          cacheKey: "test-cache",
        })
      )

      act(() => {
        result.current.clearCache()
      })

      expect(result.current.progress).toBe(0)
    })

    it("should revoke blob URL", () => {
      const { result } = renderHook(() =>
        useBackgroundDownload({
          urls: {
            mac: "https://decentraland.org/explorer/launcher.dmg",
            win: "https://decentraland.org/explorer/launcher.exe",
          },
          cacheKey: "test-cache",
        })
      )

      act(() => {
        result.current.clearCache()
      })

      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe("when using getUrl option", () => {
    it("should use getUrl function instead of urls", () => {
      const getUrl = jest.fn().mockReturnValue("https://example.com/custom")

      const { result } = renderHook(() =>
        useBackgroundDownload({
          getUrl,
        })
      )

      expect(result.current.state).toBe("idle")
    })
  })

  describe("when missing URLs and getUrl", () => {
    it("should throw error", () => {
      expect(() => {
        renderHook(() => useBackgroundDownload({}))
      }).toThrow("Missing URLs or getUrl()")
    })
  })

  describe("when cache TTL is set", () => {
    describe("and cache is saved", () => {
      let mockResponse: Response
      let mockReader: {
        read: jest.Mock
        cancel: jest.Mock
      }

      beforeEach(() => {
        jest.useFakeTimers()

        mockReader = {
          read: jest.fn(),
          cancel: jest.fn(),
        }

        mockResponse = {
          ok: true,
          status: 200,
          headers: new Headers({
            "content-length": "100",
          }),
          body: {
            getReader: jest.fn().mockReturnValue(mockReader),
          },
        } as unknown as Response

        mockFetch.mockResolvedValue(mockResponse)
      })

      afterEach(() => {
        jest.useRealTimers()
      })

      it("should schedule automatic cache deletion", async () => {
        const chunks = [new Uint8Array([1, 2, 3, 4, 5])]

        mockReader.read
          .mockResolvedValueOnce({ done: false, value: chunks[0] })
          .mockResolvedValueOnce({ done: true, value: undefined })

        mockReadAsDataURL.mockImplementation(function (this: FileReader) {
          setTimeout(() => {
            if (this.onloadend) {
              this.onloadend({} as ProgressEvent<FileReader>)
            }
          }, 0)
        })

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            cacheKey: "test-cache",
            cacheTTL: 5000,
          })
        )

        await act(async () => {
          await result.current.start()
          await new Promise((resolve) => setTimeout(resolve, 10))
        })

        expect(
          localStorageMock.getItem("useBackgroundDownload_test-cache")
        ).toBeTruthy()

        act(() => {
          jest.advanceTimersByTime(5000)
        })

        expect(localStorageMock.removeItem).toHaveBeenCalledWith(
          "useBackgroundDownload_test-cache"
        )
      })

      it("should cancel timeout when cache is cleared manually", async () => {
        const chunks = [new Uint8Array([1, 2, 3, 4, 5])]

        mockReader.read
          .mockResolvedValueOnce({ done: false, value: chunks[0] })
          .mockResolvedValueOnce({ done: true, value: undefined })

        mockReadAsDataURL.mockImplementation(function (this: FileReader) {
          setTimeout(() => {
            if (this.onloadend) {
              this.onloadend({} as ProgressEvent<FileReader>)
            }
          }, 0)
        })

        const { result } = renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            cacheKey: "test-cache",
            cacheTTL: 5000,
          })
        )

        await act(async () => {
          await result.current.start()
          await new Promise((resolve) => setTimeout(resolve, 10))
        })

        const removeItemCallCount = (localStorageMock.removeItem as jest.Mock)
          .mock.calls.length

        act(() => {
          result.current.clearCache()
        })

        act(() => {
          jest.advanceTimersByTime(5000)
        })

        expect(
          (localStorageMock.removeItem as jest.Mock).mock.calls.length
        ).toBe(removeItemCallCount + 1)
      })
    })

    describe("and cache is loaded from storage", () => {
      beforeEach(() => {
        jest.useFakeTimers()
      })

      afterEach(() => {
        jest.useRealTimers()
      })

      it("should schedule deletion based on remaining TTL", () => {
        const cachedData = {
          data: "dGVzdA==",
          type: "application/octet-stream",
          timestamp: Date.now() - 2000,
        }
        localStorageMock.getItem = jest
          .fn()
          .mockReturnValue(JSON.stringify(cachedData))

        renderHook(() =>
          useBackgroundDownload({
            urls: {
              mac: "https://example.com/mac",
              win: "https://example.com/win",
            },
            cacheKey: "test-cache",
            cacheTTL: 5000,
          })
        )

        act(() => {
          jest.advanceTimersByTime(3000)
        })

        expect(localStorageMock.removeItem).toHaveBeenCalledWith(
          "useBackgroundDownload_test-cache"
        )
      })
    })
  })
})
