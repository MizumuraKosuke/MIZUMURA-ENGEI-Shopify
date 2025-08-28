import { gql } from '@apollo/client'
import cartFragment from '../fragments/cart'

export const getCartQuery = gql`
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      ...cart
    }
  }
  ${cartFragment}
`
