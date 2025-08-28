import { notFound } from 'next/navigation'
import { getPolicy } from 'lib/shopify'
import { Policy } from 'lib/shopify/types'

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const policy: Policy | undefined = await getPolicy(handle)

  if (!policy) {
    notFound()
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">{policy.title}</h1>
      <div 
        className="prose-content"
        dangerouslySetInnerHTML={{ __html: policy.body }}
      />
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const policy = await getPolicy(handle)

  if (!policy) return {}

  return {
    title: policy.title,
    description: `${policy.title} - Our ${handle} policy`,
  }
}