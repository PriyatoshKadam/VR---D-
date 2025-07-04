"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface GeographicData {
  country: string
  region?: string
  preSpend: number
  postSpend: number
  preConversions: number
  postConversions: number
}

interface GeographicSectionProps {
  data: GeographicData[]
}

export function GeographicSection({ data }: GeographicSectionProps) {
  const calculateChange = (pre: number, post: number) => {
    if (pre === 0) return post > 0 ? 100 : 0
    return ((post - pre) / pre) * 100
  }

  const calculateRoas = (conversions: number, spend: number) => {
    return spend > 0 ? conversions / spend : 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Geographic Performance</h3>
        <p className="text-muted-foreground">Performance breakdown by countries and regions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geographic Breakdown</CardTitle>
          <CardDescription>Conversion performance by geographic location</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Pre Spend</TableHead>
                <TableHead>Post Spend</TableHead>
                <TableHead>Pre Conv.</TableHead>
                <TableHead>Post Conv.</TableHead>
                <TableHead>Pre ROAS</TableHead>
                <TableHead>Post ROAS</TableHead>
                <TableHead>Conv. Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((location, index) => {
                const convChange = calculateChange(location.preConversions, location.postConversions)
                const preRoas = calculateRoas(location.preConversions, location.preSpend)
                const postRoas = calculateRoas(location.postConversions, location.postSpend)

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{location.country}</span>
                        {location.region && <span className="text-sm text-muted-foreground">{location.region}</span>}
                      </div>
                    </TableCell>
                    <TableCell>${location.preSpend.toFixed(2)}</TableCell>
                    <TableCell>${location.postSpend.toFixed(2)}</TableCell>
                    <TableCell>{location.preConversions}</TableCell>
                    <TableCell>{location.postConversions}</TableCell>
                    <TableCell>{preRoas.toFixed(2)}</TableCell>
                    <TableCell>{postRoas.toFixed(2)}</TableCell>
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
