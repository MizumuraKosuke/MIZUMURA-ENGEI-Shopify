import { gql } from '@apollo/client'
import policyFragment from '../fragments/policy'

export const getPolicyQuery = gql`
  ${policyFragment}
  query getPolicy(
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
    }
  }
`