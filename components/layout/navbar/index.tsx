import { UserIcon } from '@heroicons/react/24/outline'
import CartModal from 'components/cart/modal'
import LogoSquare from 'components/logo-square'
import { MenuItem } from 'graphql/generated/graphql'
import { getMenu } from 'lib/shopify'
import Link from 'next/link'
import { Suspense } from 'react'
import MobileMenu from './mobile-menu'
import Search, { SearchSkeleton } from './search'

const { SITE_NAME } = process.env

export async function Navbar() {
  const menu = await getMenu('header')

  return (
    <nav className="relative flex items-center justify-between p-4 lg:px-6">
      <div className="block flex-none md:hidden">
        <Suspense fallback={null}>
          <MobileMenu menu={menu} />
        </Suspense>
      </div>
      <div className="flex w-full items-center">
        <div className="flex w-full md:w-1/3">
          <Link
            href="/"
            prefetch={true}
            className="mr-2 flex w-full items-center justify-center md:w-auto lg:mr-6"
          >
            <LogoSquare />
            <div className="ml-2 flex-none text-sm font-medium uppercase md:hidden lg:block">
              {SITE_NAME}
            </div>
          </Link>
          {menu.length ? (
            <ul className="hidden gap-6 text-sm md:flex md:items-center">
              {menu.map((item: MenuItem) => (
                <li key={item.title}>
                  <Link
                    href={item.url || '#'}
                    prefetch={true}
                    className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="hidden justify-center md:flex md:w-1/3">
          <Suspense fallback={<SearchSkeleton />}>
            <Search />
          </Suspense>
        </div>
        <div className="flex justify-end items-center gap-3 md:w-1/3">
          <Link
            href="/account"
            className="flex items-center justify-center rounded-md border border-neutral-200 p-2 text-black transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:text-white dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
            aria-label="Account"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
          <CartModal />
        </div>
      </div>
    </nav>
  )
}
