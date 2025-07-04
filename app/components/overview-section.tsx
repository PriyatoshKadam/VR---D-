"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, MousePointer, Eye, Target } from "lucide-react"

interface OverviewData {
  preSpend: number
  postSpend: number
  preImpressions: number
  postImpressions: number
  preClicks: number
  postClicks: number
  preConversions: number
  postConversions: number
  preCtr: number
  postCtr: number
  preCpc: number
  postCpc: number
  preCpm: number
  postCpm: number
  preRoas: number
  postRoas: number
  preCostPerConversion: number
  postCostPerConversion: number
  preConversionRate: number
  postConversionRate: number
}

interface OverviewSectionProps {
  data: OverviewData
}

export function OverviewSection({ data }: OverviewSectionProps) {
  const calculateChange = (pre: number, post: number) => {
    if (pre === 0) return post > 0 ? 100 : 0
    return ((post - pre) / pre) * 100
  }

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`
  const formatNumber = (value: number) => value.toLocaleString()
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`

  const metrics = [
    {
      name: "Total Spend",
      icon: DollarSign,
      pre: formatCurrency(data.preSpend),
      post: formatCurrency(data.postSpend),
      change: calculateChange(data.preSpend, data.postSpend),
      isGoodIncrease: false,
    },
    {
      name: "Impressions",
      icon: Eye,
      pre: formatNumber(data.preImpressions),
      post: formatNumber(data.postImpressions),
      change: calculateChange(data.preImpressions, data.postImpressions),
      isGoodIncrease: true,
    },
    {
      name: "Clicks",
      icon: MousePointer,
      pre: formatNumber(data.preClicks),
      post: formatNumber(data.postClicks),
      change: calculateChange(data.preClicks, data.postClicks),
      isGoodIncrease: true,
    },
    {
      name: "Conversions",
      icon: Target,
      pre: formatNumber(data.preConversions),
      post: formatNumber(data.postConversions),
      change: calculateChange(data.preConversions, data.postConversions),
      isGoodIncrease: true,
    },
    {
      name: "CTR",
      icon: MousePointer,
      pre: formatPercentage(data.preCtr),
      post: formatPercentage(data.postCtr),
      change: calculateChange(data.preCtr, data.postCtr),
      isGoodIncrease: true,
    },
    {
      name: "CPC",
      icon: DollarSign,
      pre: formatCurrency(data.preCpc),
      post: formatCurrency(data.postCpc),
      change: calculateChange(data.preCpc, data.postCpc),
      isGoodIncrease: false,
    },
    {
      name: "CPM",
      icon: DollarSign,
      pre: formatCurrency(data.preCpm),
      post: formatCurrency(data.postCpm),
      change: calculateChange(data.preCpm, data.postCpm),
      isGoodIncrease: false,
    },
    {
      name: "ROAS",
      icon: TrendingUp,
      pre: data.preRoas.toFixed(2),
      post: data.postRoas.toFixed(2),
      change: calculateChange(data.preRoas, data.postRoas),
      isGoodIncrease: true,
    },
    {
      name: "Cost per Conversion",
      icon: DollarSign,
      pre: formatCurrency(data.preCostPerConversion),
      post: formatCurrency(data.postCostPerConversion),
      change: calculateChange(data.preCostPerConversion, data.postCostPerConversion),
      isGoodIncrease: false,
    },
    {
      name: "Conversion Rate",
      icon: Target,
      pre: formatPercentage(data.preConversionRate),
      post: formatPercentage(data.postConversionRate),
      change: calculateChange(data.preConversionRate, data.postConversionRate),
      isGoodIncrease: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Performance Overview</h3>
        <p className="text-muted-foreground">Key metrics comparison between pre and post CAPI implementation</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.slice(0, 4).map((metric) => {
          const Icon = metric.icon
          const isPositive = metric.isGoodIncrease ? metric.change > 0 : metric.change < 0
          const isNegative = metric.isGoodIncrease ? metric.change < 0 : metric.change > 0

          return (
            <Card key={metric.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.post}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>vs {metric.pre}</span>
                  <Badge
                    variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {metric.change > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : metric.change < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null}
                    {Math.abs(metric.change).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics Comparison</CardTitle>
          <CardDescription>Complete breakdown of all performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Pre-CAPI</TableHead>
                <TableHead>Post-CAPI</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric) => {
                const isPositive = metric.isGoodIncrease ? metric.change > 0 : metric.change < 0
                const isNegative = metric.isGoodIncrease ? metric.change < 0 : metric.change > 0

                return (
                  <TableRow key={metric.name}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <metric.icon className="h-4 w-4" />
                      {metric.name}
                    </TableCell>
                    <TableCell>{metric.pre}</TableCell>
                    <TableCell>{metric.post}</TableCell>
                    <TableCell
                      className={isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-muted-foreground"}
                    >
                      {metric.change > 0 ? "+" : ""}
                      {metric.change.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"}
                        className="flex items-center gap-1 w-fit"
                      >
                        {isPositive ? (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            Improved
                          </>
                        ) : isNegative ? (
                          <>
                            <TrendingDown className="h-3 w-3" />
                            Declined
                          </>
                        ) : (
                          "No Change"
                        )}
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
