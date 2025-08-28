import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { SHOPIFY_GRAPHQL_API_ENDPOINT } from 'lib/constants'
import { ensureStartsWith } from 'lib/utils'

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? ensureStartsWith(process.env.SHOPIFY_STORE_DOMAIN, 'https://')
  : ''
const endpoint = `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}`

// Simple Apollo Client configuration
export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: endpoint,
    headers: {
      'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
      'Content-Type': 'application/json',
    }
  }),
  cache: new InMemoryCache({
    typePolicies: {
      Product: {
        fields: {
          variants: {
            merge: false,
          },
          images: {
            merge: false,
          },
        },
      },
      Cart: {
        fields: {
          lines: {
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
})

export { apolloClient as client }