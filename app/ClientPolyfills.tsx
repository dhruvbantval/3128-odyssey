"use client";

import { useEffect } from "react";
import "../lib/client-polyfills";

export function ClientPolyfills() {
  useEffect(() => {
    // Client polyfills are loaded via the import above
    // This component ensures they run on the client side
  }, []);
  
  return null;
}
