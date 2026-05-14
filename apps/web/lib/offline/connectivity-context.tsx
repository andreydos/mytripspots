"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ConnectivityValue = {
  /**
   * True when the browser reports online and the reachability probe has not
   * marked the connection as down (same signal as the signed-in dashboard).
   */
  networkOnline: boolean;
  /**
   * True when we treat the app as offline for the top banner and bypass logic
   * (navigator offline, probe failed, or sync store offline).
   */
  connectivityDown: boolean;
};

const ConnectivityContext = createContext<ConnectivityValue | null>(null);

export function ConnectivityProvider({
  value,
  children
}: {
  value: ConnectivityValue;
  children: ReactNode;
}) {
  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity(): ConnectivityValue {
  const v = useContext(ConnectivityContext);
  if (!v) {
    throw new Error("useConnectivity must be used within ConnectivityProvider");
  }
  return v;
}
