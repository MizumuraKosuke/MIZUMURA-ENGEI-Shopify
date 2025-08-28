import { gql } from '@apollo/client'

export const getMenuQuery = gql`
  query getMenu($handle: String!) {
    menu(handle: $handle) {
      items {
        title
        url
      }
    }
  }
`
