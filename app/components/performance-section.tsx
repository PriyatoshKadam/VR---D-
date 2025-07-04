"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PerformanceData {
  campaigns: Array<{
    name: string
    preSpend: number
    postSpend: number
    preConversions: number
    postConversions: number
    preRoas: number
    postRoas: number
  }>
  adSets: Array<{
    name: string
    preSpend: number
    postSpend: number
    preConversions: number
    postConversions: number
    preRoas: number
    postRoas: number
  }>
  topAds: Array<{
    name: string
    preSpend: number
    postSpend: number
    preConversions: number
    postConversions: number
    preRoas: number
    postRoas: number
  }>
}

interface PerformanceSectionProps {
  data: PerformanceData
}

export function PerformanceSection({ data }: PerformanceSectionProps) {
  const calculateChange = (pre: number, post: number) => {
    if (pre === 0) return post > 0 ? 100 : 0
    return ((post - pre) / pre) * 100
  }

  // Add this function at the top of the component
  const calculateTotals = (items: any[]) => {
    return items.reduce(
      (totals, item) => ({
        preSpend: totals.preSpend + item.preSpend,
        postSpend: totals.postSpend + item.postSpend,
        preConversions: totals.preConversions + item.preConversions,
        postConversions: totals.postConversions + item.postConversions,
        preRoas: 0, // Will calculate separately
        postRoas: 0, // Will calculate separately
      }),
      { preSpend: 0, postSpend: 0, preConversions: 0, postConversions: 0, preRoas: 0, postRoas: 0 },
    )
  }

  // Update the renderPerformanceTable function to include totals
  const renderPerformanceTable = (items: any[], title: string) => {
    const totals = calculateTotals(items)
    totals.preRoas = totals.preSpend > 0 ? totals.preConversions / totals.preSpend : 0
    totals.postRoas = totals.postSpend > 0 ? totals.postConversions / totals.postSpend : 0

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Performance comparison by {title.toLowerCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Pre Spend</TableHead>
                <TableHead>Post Spend</TableHead>
                <TableHead>Pre Conv.</TableHead>
                <TableHead>Post Conv.</TableHead>
                <TableHead>Pre ROAS</TableHead>
                <TableHead>Post ROAS</TableHead>
                <TableHead>ROAS Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const roasChange = calculateChange(item.preRoas, item.postRoas)
                const convChange = calculateChange(item.preConversions, item.postConversions)

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={item.name}>
                      {item.name}
                    </TableCell>
                    <TableCell>${item.preSpend.toFixed(2)}</TableCell>
                    <TableCell>${item.postSpend.toFixed(2)}</TableCell>
                    <TableCell>{item.preConversions}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.postConversions}
                        {convChange !== 0 && (
                          <Badge variant={convChange > 0 ? "default" : "destructive"} className="text-xs">
                            {convChange > 0 ? "+" : ""}
                            {convChange.toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.preRoas.toFixed(2)}</TableCell>
                    <TableCell>{item.postRoas.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={roasChange > 0 ? "text-green-600" : roasChange < 0 ? "text-red-600" : ""}>
                          {roasChange > 0 ? "+" : ""}
                          {roasChange.toFixed(1)}%
                        </span>
                        {roasChange > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : roasChange < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {/* Add totals row */}
              <TableRow className="border-t-2 bg-muted/50 font-semibold">
                <TableCell className="font-bold">
                  TOTAL ({items.length} {title.toLowerCase()})
                </TableCell>
                <TableCell>${totals.preSpend.toFixed(2)}</TableCell>
                <TableCell>${totals.postSpend.toFixed(2)}</TableCell>
                <TableCell>{totals.preConversions}</TableCell>
                <TableCell>{totals.postConversions}</TableCell>
                <TableCell>{totals.preRoas.toFixed(2)}</TableCell>
                <TableCell>{totals.postRoas.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={totals.postRoas > totals.preRoas ? "default" : "destructive"}>
                    {(((totals.postRoas - totals.preRoas) / totals.preRoas) * 100).toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Campaign Performance Analysis</h3>
        <p className="text-muted-foreground">Detailed breakdown by campaigns, ad sets, and individual ads</p>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns ({data.campaigns.length})</TabsTrigger>
          <TabsTrigger value="adsets">Ad Sets ({data.adSets.length})</TabsTrigger>
          <TabsTrigger value="ads">Top Ads ({data.topAds.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-6">
          {renderPerformanceTable(data.campaigns, "Campaigns")}
        </TabsContent>

        <TabsContent value="adsets" className="mt-6">
          {renderPerformanceTable(data.adSets, "Ad Sets")}
        </TabsContent>

        <TabsContent value="ads" className="mt-6">
          {renderPerformanceTable(data.topAds, "Top Performing Ads")}
        </TabsContent>
      </Tabs>
    </div>
  )
}
