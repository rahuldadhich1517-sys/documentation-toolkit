/**
 * Test setup for DOM and Browser API mocks in JSDOM / Node environment.
 */

if (typeof window !== 'undefined') {
  // Polyfill CSSStyleSheet for Mermaid if not defined in JSDOM
  if (typeof globalThis.CSSStyleSheet === 'undefined') {
    (globalThis as any).CSSStyleSheet = class CSSStyleSheet {
      public cssRules: any[] = [];
      public insertRule() { return 0; }
      public deleteRule() {}
    };
  }

  // Polyfill SVG getBBox for Mermaid diagram dimension calculations
  if (typeof (window as any).SVGElement !== 'undefined') {
    if (!SVGElement.prototype.getBBox) {
      SVGElement.prototype.getBBox = function () {
        return {
          x: 0,
          y: 0,
          width: 120,
          height: 40,
          top: 0,
          right: 120,
          bottom: 40,
          left: 0,
          toJSON() { return this; },
        };
      };
    }

    if (!(SVGElement.prototype as any).getScreenCTM) {
      (SVGElement.prototype as any).getScreenCTM = function () {
        return {
          a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
          inverse() { return this; },
          multiply() { return this; },
        };
      };
    }
  }

  // Polyfill Canvas 2D context and toBlob for Canvas rasterization tests
  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = function (contextId: string): any {
      if (contextId === '2d') {
        return {
          scale: () => {},
          drawImage: () => {},
          fillRect: () => {},
          clearRect: () => {},
          getImageData: () => ({ data: new Uint8ClampedArray(4) }),
          putImageData: () => {},
          createImageData: () => [],
          setTransform: () => {},
          canvas: this,
        };
      }
      return null;
    } as any;

    HTMLCanvasElement.prototype.toBlob = function (callback: (blob: Blob | null) => void, type?: string) {
      const mime = type || 'image/png';
      const fakePngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const blob = new Blob([fakePngBytes], { type: mime });
      setTimeout(() => callback(blob), 0);
    };
  }

  // Polyfill URL.createObjectURL and revokeObjectURL
  if (typeof URL.createObjectURL === 'undefined') {
    URL.createObjectURL = () => 'blob:mock-url-' + Math.random().toString(36).slice(2);
    URL.revokeObjectURL = () => {};
  }

  // Polyfill Image load trigger for Canvas SVG rendering
  if (typeof window.HTMLImageElement !== 'undefined') {
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      set(this: HTMLImageElement, srcVal: string) {
        this.setAttribute('src', srcVal);
        setTimeout(() => {
          if (typeof this.onload === 'function') {
            this.onload(new Event('load'));
          }
        }, 10);
      },
      get(this: HTMLImageElement) {
        return this.getAttribute('src') || '';
      },
      configurable: true,
    });
  }
}
