// src/test/setup.ts
// Global test setup for Vitest + Testing Library
import "@testing-library/jest-dom/vitest";

// ─── Mock browser APIs not available in jsdom ────────────────────────────────

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock matchMedia (used by theme logic)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock confirm (used by PWA update prompt)
window.confirm = () => true;

// Mock navigator.geolocation
Object.defineProperty(navigator, "geolocation", {
  value: {
    getCurrentPosition: (success: PositionCallback) => {
      success({
        coords: {
          latitude: 19.4326,
          longitude: -99.1332,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    },
    watchPosition: () => 0,
    clearWatch: () => {},
  },
  writable: true,
});
