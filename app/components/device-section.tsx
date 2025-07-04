"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Monitor, Tablet } from "lucide-react"

interface DeviceData {
  platform: string
  preSpend: number
  postSpend: number
  preConversions: number
  postConversions: number
}

interface DeviceSectionProps {
  data: DeviceData[]
}

export function DeviceSection({ data }: DeviceSectionProps) {
  const calculateChange = (pre: number, post: number) => {
    if (pre === 0) return post > 0 ? 100 : 0
    return ((post - pre) / pre) * 100
  }

  const getDeviceIcon = (platform: string) => {
    const platformLower = platform.toLowerCase()
    if (platformLower.includes("mobile") || platformLower.includes("android") || platformLower.includes("ios")) {
      return Smartphone
    } else if (platformLower.includes("tablet") || platformLower.includes("ipad")) {
      return Tablet
    } else {
      return Monitor
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Device & Platform Performance</h3>
        <p className="text-muted-foreground">Performance breakdown by device types and platforms</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Performance</CardTitle>
          <CardDescription>Conversion performance across different devices and platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Pre Spend</TableHead>
                <TableHead>Post Spend</TableHead>
                <TableHead>Pre Conv.</TableHead>
                <TableHead>Post Conv.</TableHead>
                <TableHead>Conv. Change</TableHead>
                <TableHead>Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((device, index) => {
                const convChange = calculateChange(device.preConversions, device.postConversions)
                const preEfficiency = device.preSpend > 0 ? device.preConversions / device.preSpend : 0
                const postEfficiency = device.postSpend > 0 ? device.postConversions / device.postSpend : 0
                const efficiencyChange = calculateChange(preEfficiency, postEfficiency)
                const DeviceIcon = getDeviceIcon(device.platform)

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <DeviceIcon className="h-4 w-4" />
                        {device.platform}
                      </div>
                    </TableCell>
                    <TableCell>${device.preSpend.toFixed(2)}</TableCell>
                    <TableCell>${device.postSpend.toFixed(2)}</TableCell>
                    <TableCell>{device.preConversions}</TableCell>
                    <TableCell>{device.postConversions}</TableCell>
                    <TableCell>
                      <Badge variant={convChange > 0 ? "default" : convChange < 0 ? "destructive" : "secondary"}>
                        {convChange > 0 ? "+" : ""}
                        {convChange.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{postEfficiency.toFixed(3)} conv/$</span>
                        <Badge
                          variant={
                            efficiencyChange > 0 ? "default" : efficiencyChange < 0 ? "destructive" : "secondary"
                          }
                          className="text-xs"
                        >
                          {efficiencyChange > 0 ? "+" : ""}
                          {efficiencyChange.toFixed(1)}%
                        </Badge>
                      </div>
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
