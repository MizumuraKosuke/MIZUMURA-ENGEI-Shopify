import { ProductSortKeys, ProductCollectionSortKeys } from '../graphql/generated/graphql'

export type SortFilterItem = {
  title: string;
  slug: string | null;
  sortKey: ProductSortKeys;
  reverse: boolean;
};

export type CollectionSortFilterItem = {
  title: string;
  slug: string | null;
  sortKey: ProductCollectionSortKeys;
  reverse: boolean;
};

export const defaultSort: SortFilterItem = {
  title: 'Relevance',
  slug: null,
  sortKey: ProductSortKeys.Relevance,
  reverse: false
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { title: 'Trending', slug: 'trending-desc', sortKey: ProductSortKeys.BestSelling, reverse: false }, // asc
  { title: 'Latest arrivals', slug: 'latest-desc', sortKey: ProductSortKeys.CreatedAt, reverse: true },
  { title: 'Price: Low to high', slug: 'price-asc', sortKey: ProductSortKeys.Price, reverse: false }, // asc
  { title: 'Price: High to low', slug: 'price-desc', sortKey: ProductSortKeys.Price, reverse: true }
]

export const defaultCollectionSort: CollectionSortFilterItem = {
  title: 'Best Selling',
  slug: null,
  sortKey: ProductCollectionSortKeys.BestSelling,
  reverse: false
}

export const collectionSorting: CollectionSortFilterItem[] = [
  defaultCollectionSort,
  { title: 'Latest', slug: 'latest-desc', sortKey: ProductCollectionSortKeys.Created, reverse: true },
  { title: 'Price: Low to high', slug: 'price-asc', sortKey: ProductCollectionSortKeys.Price, reverse: false },
  { title: 'Price: High to low', slug: 'price-desc', sortKey: ProductCollectionSortKeys.Price, reverse: true }
]

export const TAGS = {
  collections: 'collections',
  products: 'products',
  cart: 'cart',
  pages: 'pages'
}

export const HIDDEN_PRODUCT_TAG = 'nextjs-frontend-hidden'
export const DEFAULT_OPTION = 'Default Title'
export const SHOPIFY_GRAPHQL_API_ENDPOINT = '/api/2023-01/graphql.json'
