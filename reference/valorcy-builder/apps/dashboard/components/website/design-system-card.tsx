import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'

type DesignSystem = {
  id: string
  projectId: string
  colors: unknown
  typography: unknown
  spacing: unknown
  customCss: string | null
  version: number
  updatedAt: string
} | null

function countKeys (value: unknown) {
  if (!value || typeof value !== 'object') return 0
  return Object.keys(value).length
}

export function DesignSystemCard ({ designSystem }: { designSystem: DesignSystem }) {
  const colorsCount = countKeys(designSystem?.colors)
  const typographyCount = countKeys(designSystem?.typography)

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Design system</CardTitle>
        <CardDescription>
          Tokens used by the builder to keep the site consistent.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Version</span>
          <Badge variant="outline">
            v{designSystem?.version ?? 0}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Colors</span>
            <span className="text-sm font-medium">{colorsCount}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Typography</span>
            <span className="text-sm font-medium">{typographyCount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Custom CSS</span>
          <span className="text-sm font-medium">
            {designSystem?.customCss ? 'Yes' : 'No'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

