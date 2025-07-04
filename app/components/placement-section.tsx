"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface PlacementData {
  name: string
  preSpend: number
  postSpend: number
  preImpressions: number
  postImpressions: number
  preConversions: number
  postConversions: number
}

interface PlacementSectionProps {
  data: PlacementData[]
}

export function PlacementSection({ data }: PlacementSectionProps) {
  const calculateChange = (pre: number, post: number) => {
    if (pre === 0) return post > 0 ? 100 : 0
    return ((post - pre) / pre) * 100
  }

  const totalPostSpend = data.reduce((sum, placement) => sum + placement.postSpend, 0)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Placement Performance</h3>
        <p className="text-muted-foreground">Performance across different ad placements and platforms</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Placement Breakdown</CardTitle>
          <CardDescription>Detailed performance metrics by ad placement</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placement</TableHead>
                <TableHead>Spend Share</TableHead>
                <TableHead>Pre Spend</TableHead>
                <TableHead>Post Spend</TableHead>
                <TableHead>Pre Impr.</TableHead>
                <TableHead>Post Impr.</TableHead>
                <TableHead>Pre Conv.</TableHead>
                <TableHead>Post Conv.</TableHead>
                <TableHead>Conv. Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((placement, index) => {
                const convChange = calculateChange(placement.preConversions, placement.postConversions)
                const spendShare = totalPostSpend > 0 ? (placement.postSpend / totalPostSpend) * 100 : 0

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{placement.name}</span>
                        <Progress value={spendShare} className="h-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{spendShare.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell>${placement.preSpend.toFixed(2)}</TableCell>
                    <TableCell>${placement.postSpend.toFixed(2)}</TableCell>
                    <TableCell>{placement.preImpressions.toLocaleString()}</TableCell>
                    <TableCell>{placement.postImpressions.toLocaleString()}</TableCell>
                    <TableCell>{placement.preConversions}</TableCell>
                    <TableCell>{placement.postConversions}</TableCell>
                    <TableCell>
                      <Badge variant={convChange > 0 ? "default" : convChange < 0 ? "destructive" : "secondary"}>
                        {convChange > 0 ? "+" : ""}
                        {convChange.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
