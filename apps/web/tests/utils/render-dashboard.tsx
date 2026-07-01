import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from "@apollo/client";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { ConnectivityProvider } from "@/lib/offline/connectivity-context";

const testGraphqlUri = process.env.NEXT_PUBLIC_API_GRAPHQL_URL ?? "http://localhost:8000/graphql";

function createTestApolloClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: testGraphqlUri }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: "no-cache" },
      query: { fetchPolicy: "no-cache" }
    }
  });
}

type DashboardRenderOptions = Omit<RenderOptions, "wrapper"> & {
  networkOnline?: boolean;
};

export function renderDashboard(ui: ReactElement, options: DashboardRenderOptions = {}) {
  const { networkOnline = true, ...renderOptions } = options;
  const client = createTestApolloClient();
  const connectivityDown = !networkOnline;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ConnectivityProvider value={{ networkOnline, connectivityDown }}>
        <ApolloProvider client={client}>{children}</ApolloProvider>
      </ConnectivityProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
