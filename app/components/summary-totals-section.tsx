"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Target, Eye, MousePointer, Zap } from "lucide-react"

interface SummaryTotals {
  preSpend: number
  postSpend: number
  preConversions: number
  postConversions: number
  preConversionValue: number
  postConversionValue: number
  preImpressions: number
  postImpressions: number
  preClicks: number
  postClicks: number
  metaACR: number
}

interface SummaryTotalsSectionProps {
  data: SummaryTotals
}

export function SummaryTotalsSection({ data }: SummaryTotalsSectionProps) {
  const calculateChange = (pre: number, post: number) => {
    if (pre === 0) return post > 0 ? 100 : 0
    return ((post - pre) / pre) * 100
  }

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatNumber = (value: number) => value.toLocaleString()

  const summaryMetrics = [
    {
      name: "Total Ad Spend",
      icon: DollarSign,
      pre: data.preSpend,
      post: data.postSpend,
      format: formatCurrency,
      isGoodIncrease: false,
      color: "blue",
    },
    {
      name: "Total Conversions",
      icon: Target,
      pre: data.preConversions,
      post: data.postConversions,
      format: formatNumber,
      isGoodIncrease: true,
      color: "green",
    },
    {
      name: "Total Conversion Value",
      icon: DollarSign,
      pre: data.preConversionValue,
      post: data.postConversionValue,
      format: formatCurrency,
      isGoodIncrease: true,
      color: "purple",
    },
    {
      name: "Total Impressions",
      icon: Eye,
      pre: data.preImpressions,
      post: data.postImpressions,
      format: formatNumber,
      isGoodIncrease: true,
      color: "orange",
    },
    {
      name: "Total Clicks",
      icon: MousePointer,
      pre: data.preClicks,
      post: data.postClicks,
      format: formatNumber,
      isGoodIncrease: true,
      color: "cyan",
    },
    {
      name: "Meta ACR",
      icon: Zap,
      pre: data.metaACR,
      post: data.metaACR,
      format: (value: number) => `${value.toFixed(2)}%`,
      isGoodIncrease: true,
      color: "indigo",
      isStatic: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">📊 Campaign Totals Summary</h2>
        <p className="text-lg text-muted-foreground">
          Complete aggregated performance metrics across all campaigns and ad sets
        </p>
      </div>

      {/* Key Totals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon
          const change = metric.isStatic ? 0 : calculateChange(metric.pre, metric.post)
          const isPositive = metric.isGoodIncrease ? change > 0 : change < 0
          const isNegative = metric.isGoodIncrease ? change < 0 : change > 0

          return (
            <Card key={metric.name} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-${metric.color}-500`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.name}</CardTitle>
                <Icon className={`h-5 w-5 text-${metric.color}-600`} />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Pre vs Post Values */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Pre-CAPI:</span>
                      <span className="text-sm font-medium">{metric.format(metric.pre)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Post-CAPI:</span>
                      <span className="text-lg font-bold">{metric.format(metric.post)}</span>
                    </div>
                  </div>

                  {/* Change Indicator */}
                  {!metric.isStatic && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Change:</span>
                      <Badge
                        variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        {change > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : change < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : null}
                        {change > 0 ? "+" : ""}
                        {change.toFixed(1)}%
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Complete Performance Summary
          </CardTitle>
          <CardDescription>Side-by-side comparison of all key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Metric</th>
                  <th className="text-right py-3 px-4 font-medium">Pre-CAPI</th>
                  <th className="text-right py-3 px-4 font-medium">Post-CAPI</th>
                  <th className="text-right py-3 px-4 font-medium">Difference</th>
                  <th className="text-right py-3 px-4 font-medium">% Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">Total Ad Spend</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(data.preSpend)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(data.postSpend)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(data.postSpend - data.preSpend)}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant={calculateChange(data.preSpend, data.postSpend) < 0 ? "default" : "destructive"}>
                      {calculateChange(data.preSpend, data.postSpend) > 0 ? "+" : ""}
                      {calculateChange(data.preSpend, data.postSpend).toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">Total Conversions</td>
                  <td className="py-3 px-4 text-right">{formatNumber(data.preConversions)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatNumber(data.postConversions)}</td>
                  <td className="py-3 px-4 text-right">+{formatNumber(data.postConversions - data.preConversions)}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge
                      variant={
                        calculateChange(data.preConversions, data.postConversions) > 0 ? "default" : "destructive"
                      }
                    >
                      {calculateChange(data.preConversions, data.postConversions) > 0 ? "+" : ""}
                      {calculateChange(data.preConversions, data.postConversions).toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">Total Conversion Value</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(data.preConversionValue)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(data.postConversionValue)}</td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(data.postConversionValue - data.preConversionValue)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge
                      variant={
                        calculateChange(data.preConversionValue, data.postConversionValue) > 0
                          ? "default"
                          : "destructive"
                      }
                    >
                      {calculateChange(data.preConversionValue, data.postConversionValue) > 0 ? "+" : ""}
                      {calculateChange(data.preConversionValue, data.postConversionValue).toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">Total Impressions</td>
                  <td className="py-3 px-4 text-right">{formatNumber(data.preImpressions)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatNumber(data.postImpressions)}</td>
                  <td className="py-3 px-4 text-right">+{formatNumber(data.postImpressions - data.preImpressions)}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge
                      variant={
                        calculateChange(data.preImpressions, data.postImpressions) > 0 ? "default" : "destructive"
                      }
                    >
                      {calculateChange(data.preImpressions, data.postImpressions) > 0 ? "+" : ""}
                      {calculateChange(data.preImpressions, data.postImpressions).toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">Total Clicks</td>
                  <td className="py-3 px-4 text-right">{formatNumber(data.preClicks)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatNumber(data.postClicks)}</td>
                  <td className="py-3 px-4 text-right">+{formatNumber(data.postClicks - data.preClicks)}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant={calculateChange(data.preClicks, data.postClicks) > 0 ? "default" : "destructive"}>
                      {calculateChange(data.preClicks, data.postClicks) > 0 ? "+" : ""}
                      {calculateChange(data.preClicks, data.postClicks).toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">Meta ACR (Attributed Conversion Rate)</td>
                  <td className="py-3 px-4 text-right" colSpan={4}>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      {data.metaACR.toFixed(2)}%
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Key Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">CAPI Impact Summary:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • Conversion lift:{" "}
                  <strong className="text-foreground">
                    +{calculateChange(data.preConversions, data.postConversions).toFixed(1)}%
                  </strong>
                </li>
                <li>
                  • Revenue impact:{" "}
                  <strong className="text-foreground">
                    {formatCurrency(data.postConversionValue - data.preConversionValue)}
                  </strong>
                </li>
                <li>
                  • Spend efficiency:{" "}
                  <strong className="text-foreground">
                    {calculateChange(data.preSpend, data.postSpend).toFixed(1)}%
                  </strong>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Attribution Quality:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • Meta ACR: <strong className="text-foreground">{data.metaACR.toFixed(2)}%</strong>
                </li>
                <li>
                  • Total conversions tracked:{" "}
                  <strong className="text-foreground">{formatNumber(data.postConversions)}</strong>
                </li>
                <li>
                  • Improved data quality: <strong className="text-foreground">Enhanced</strong>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
