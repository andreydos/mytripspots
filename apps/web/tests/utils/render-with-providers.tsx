import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from "@apollo/client";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

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

type WrapperProps = { children: ReactNode };

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  const client = createTestApolloClient();

  function Wrapper({ children }: WrapperProps) {
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
