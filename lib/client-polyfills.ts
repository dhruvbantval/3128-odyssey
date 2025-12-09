"use client";

// Client-side DOM polyfills
// This file only runs in the browser
if (typeof window !== "undefined") {
  // DOMMatrix polyfill for browsers that don't support it
  if (!(window as any).DOMMatrix) {
    // Check if it exists in global scope first
    const existingDOMMatrix = (typeof global !== 'undefined' && (global as any).DOMMatrix) || 
                               (typeof globalThis !== 'undefined' && (globalThis as any).DOMMatrix);
    
    if (existingDOMMatrix) {
      (window as any).DOMMatrix = existingDOMMatrix;
    } else {
      // Create a minimal polyfill
      (window as any).DOMMatrix = class DOMMatrix {
        a: number = 1;
        b: number = 0;
        c: number = 0;
        d: number = 1;
        e: number = 0;
        f: number = 0;
        m11: number = 1;
        m12: number = 0;
        m13: number = 0;
        m14: number = 0;
        m21: number = 0;
        m22: number = 1;
        m23: number = 0;
        m24: number = 0;
        m31: number = 0;
        m32: number = 0;
        m33: number = 1;
        m34: number = 0;
        m41: number = 0;
        m42: number = 0;
        m43: number = 0;
        m44: number = 1;
        is2D: boolean = true;
        isIdentity: boolean = true;

        constructor(init?: string | number[]) {
          // Identity matrix by default
        }

        translate(tx: number, ty: number, tz?: number): DOMMatrix {
          return this;
        }

        scale(scaleX: number, scaleY?: number, scaleZ?: number, originX?: number, originY?: number, originZ?: number): DOMMatrix {
          return this;
        }

        rotate(rotX: number, rotY?: number, rotZ?: number): DOMMatrix {
          return this;
        }

        rotateFromVector(x: number, y: number): DOMMatrix {
          return this;
        }

        multiply(other: DOMMatrix): DOMMatrix {
          return this;
        }

        flipX(): DOMMatrix {
          return this;
        }

        flipY(): DOMMatrix {
          return this;
        }

        inverse(): DOMMatrix {
          return this;
        }

        transformPoint(point: { x: number; y: number; z?: number; w?: number }): any {
          return point;
        }

        toFloat32Array(): Float32Array {
          return new Float32Array(16);
        }

        toFloat64Array(): Float64Array {
          return new Float64Array(16);
        }

        toString(): string {
          return 'matrix(1, 0, 0, 1, 0, 0)';
        }
      };
    }
  }
}

export {};
