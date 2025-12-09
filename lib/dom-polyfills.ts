// Global DOM polyfills for server-side rendering
if (typeof global !== 'undefined') {
  // DOMMatrix polyfill
  if (!global.DOMMatrix) {
    global.DOMMatrix = class DOMMatrix {
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

      rotateAxisAngle(x: number, y: number, z: number, angle: number): DOMMatrix {
        return this;
      }

      skewX(sx: number): DOMMatrix {
        return this;
      }

      skewY(sy: number): DOMMatrix {
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

      transformPoint(point?: { x: number; y: number; z?: number; w?: number }): { x: number; y: number; z: number; w: number } {
        return { x: 0, y: 0, z: 0, w: 1 };
      }

      toFloat32Array(): Float32Array {
        return new Float32Array([
          this.m11, this.m12, this.m13, this.m14,
          this.m21, this.m22, this.m23, this.m24,
          this.m31, this.m32, this.m33, this.m34,
          this.m41, this.m42, this.m43, this.m44
        ]);
      }

      toFloat64Array(): Float64Array {
        return new Float64Array([
          this.m11, this.m12, this.m13, this.m14,
          this.m21, this.m22, this.m23, this.m24,
          this.m31, this.m32, this.m33, this.m34,
          this.m41, this.m42, this.m43, this.m44
        ]);
      }

      toString(): string {
        return 'matrix(1, 0, 0, 1, 0, 0)';
      }
    } as any;
  }

  // Add to globalThis as well for compatibility
  if (typeof globalThis !== 'undefined' && !globalThis.DOMMatrix) {
    globalThis.DOMMatrix = global.DOMMatrix;
  }
}
