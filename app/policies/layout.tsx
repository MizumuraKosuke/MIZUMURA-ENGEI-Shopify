export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        {children}
      </div>
    </div>
  )
}