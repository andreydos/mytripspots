"use client";

import { useMemo, useRef } from "react";
import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  from
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { useAuth } from "@clerk/nextjs";

const graphqlUri = process.env.NEXT_PUBLIC_API_GRAPHQL_URL ?? "";

export function ApolloProviderWithClerk({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const client = useMemo(() => {
    const httpLink = new HttpLink({
      uri: graphqlUri
    });

    const authLink = setContext(async (_, { headers }) => {
      const token = await getTokenRef.current?.();
      return {
        headers: {
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      };
    });

    return new ApolloClient({
      link: from([authLink, httpLink]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: { fetchPolicy: "no-cache" },
        query: { fetchPolicy: "no-cache" }
      }
    });
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
