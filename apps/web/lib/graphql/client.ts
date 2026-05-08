import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

export function getGraphqlClient(token?: string) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_API_GRAPHQL_URL,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
  });
}
