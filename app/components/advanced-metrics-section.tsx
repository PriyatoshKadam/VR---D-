"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  TrendingUp,
  DollarSign,
  Target,
  Calculator,
  PiggyBank,
  TrendingUpIcon,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

interface AdvancedMetrics {
  preSpend: number
  postSpend: number
  preConversions: number
  postConversions: number
  preConversionValue: number
  postConversionValue: number
}

interface AdvancedMetricsSectionProps {
  data: AdvancedMetrics
}

export function AdvancedMetricsSection({ data }: AdvancedMetricsSectionProps) {
  const [subscriptionAmount, setSubscriptionAmount] = useState<number>(0)
  const [netSavingOnQualifiedLead, setNetSavingOnQualifiedLead] = useState<number>(0)

  // Core Calculations
  const preRoas = data.preSpend > 0 ? data.preConversionValue / data.preSpend : 0
  const postRoas = data.postSpend > 0 ? data.postConversionValue / data.postSpend : 0

  const preCostPerConversion = data.preConversions > 0 ? data.preSpend / data.preConversions : 0
  const postCostPerConversion = data.postConversions > 0 ? data.postSpend / data.postConversions : 0

  const decreaseInCostPerConversion =
    preCostPerConversion > 0 ? ((preCostPerConversion - postCostPerConversion) / preCostPerConversion) * 100 : 0

  const savingOnOnePurchase = preCostPerConversion - postCostPerConversion
  const percentageSaving = preCostPerConversion > 0 ? (savingOnOnePurchase / preCostPerConversion) * 100 : 0
  const netSaving = savingOnOnePurchase * data.postConversions

  const preAverage = data.preConversions > 0 ? data.preConversionValue / data.preConversions : 0
  const postAverage = data.postConversions > 0 ? data.postConversionValue / data.postConversions : 0
  const additional = postAverage - preAverage
  const percentageAdditional = preAverage > 0 ? (additional / preAverage) * 100 : 0
  const additionalRevenue = additional * data.postConversions

  // ROI Calculations
  const roiOnAddRevenue = postAverage > 0 ? additionalRevenue / postAverage : 0
  const roiOnSaving =
    subscriptionAmount > 0
      ? (netSaving > netSavingOnQualifiedLead ? data.postConversionValue : netSavingOnQualifiedLead) /
        subscriptionAmount
      : 0

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "blue",
    size = "default",
  }: {
    title: string
    value: string
    subtitle?: string
    icon: any
    trend?: "up" | "down" | "neutral"
    color?: string
    size?: "default" | "large"
  }) => (
    <Card className={`relative overflow-hidden ${size === "large" ? "col-span-2" : ""}`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${color}-400 to-${color}-600`} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`${size === "large" ? "text-lg" : "text-sm"} font-medium text-muted-foreground`}>
            {title}
          </CardTitle>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`${size === "large" ? "text-3xl" : "text-2xl"} font-bold mb-1`}>{value}</div>
        {subtitle && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{subtitle}</span>
            {trend && (
              <Badge variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"}>
                {trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : trend === "down" ? (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                ) : null}
                {trend === "up" ? "Improved" : trend === "down" ? "Declined" : "Stable"}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🧮 Advanced Performance Metrics
        </h2>
        <p className="text-lg text-muted-foreground">
          Detailed ROAS, cost efficiency, and ROI analysis with custom calculations
        </p>
      </div>

      {/* ROAS & Cost Efficiency Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUpIcon className="h-6 w-6 text-green-600" />
          <h3 className="text-xl font-semibold">ROAS & Cost Efficiency</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Pre-CAPI ROAS"
            value={preRoas.toFixed(2)}
            subtitle="Return on Ad Spend"
            icon={DollarSign}
            color="orange"
          />
          <MetricCard
            title="Post-CAPI ROAS"
            value={postRoas.toFixed(2)}
            subtitle={`${(((postRoas - preRoas) / preRoas) * 100).toFixed(1)}% change`}
            icon={DollarSign}
            trend={postRoas > preRoas ? "up" : postRoas < preRoas ? "down" : "neutral"}
            color="green"
          />
          <MetricCard
            title="Pre Cost Per Conversion"
            value={formatCurrency(preCostPerConversion)}
            subtitle="Cost efficiency before CAPI"
            icon={Target}
            color="red"
          />
          <MetricCard
            title="Post Cost Per Conversion"
            value={formatCurrency(postCostPerConversion)}
            subtitle={formatPercentage(decreaseInCostPerConversion) + " decrease"}
            icon={Target}
            trend={postCostPerConversion < preCostPerConversion ? "up" : "down"}
            color="green"
          />
        </div>
      </div>

      {/* Savings Analysis Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <PiggyBank className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold">Cost Savings Analysis</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Saving on 1 Purchase"
            value={formatCurrency(savingOnOnePurchase)}
            subtitle={formatPercentage(percentageSaving) + " saving per conversion"}
            icon={Calculator}
            trend={savingOnOnePurchase > 0 ? "up" : "down"}
            color="emerald"
          />
          <MetricCard
            title="Total Net Saving"
            value={formatCurrency(netSaving)}
            subtitle={`Across ${data.postConversions} conversions`}
            icon={PiggyBank}
            trend={netSaving > 0 ? "up" : "down"}
            color="emerald"
            size="large"
          />
        </div>
      </div>

      {/* Revenue Enhancement Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-6 w-6 text-purple-600" />
          <h3 className="text-xl font-semibold">Revenue Enhancement</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Pre-CAPI Average Order"
            value={formatCurrency(preAverage)}
            subtitle="Average conversion value"
            icon={DollarSign}
            color="orange"
          />
          <MetricCard
            title="Post-CAPI Average Order"
            value={formatCurrency(postAverage)}
            subtitle={formatPercentage(percentageAdditional) + " increase"}
            icon={DollarSign}
            trend={postAverage > preAverage ? "up" : "down"}
            color="purple"
          />
          <MetricCard
            title="Additional Revenue Per Order"
            value={formatCurrency(additional)}
            subtitle="Incremental value per conversion"
            icon={TrendingUp}
            trend={additional > 0 ? "up" : "down"}
            color="indigo"
          />
          <MetricCard
            title="Total Additional Revenue"
            value={formatCurrency(additionalRevenue)}
            subtitle={`From ${data.postConversions} conversions`}
            icon={Zap}
            trend={additionalRevenue > 0 ? "up" : "down"}
            color="violet"
          />
        </div>
      </div>

      {/* ROI Calculator Section */}
      <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-6 w-6 text-blue-600" />
            ROI Calculator
          </CardTitle>
          <CardDescription>Enter your subscription details to calculate comprehensive ROI metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="subscription">D# Subscription Amount ($)</Label>
              <Input
                id="subscription"
                type="number"
                placeholder="Enter subscription amount"
                value={subscriptionAmount || ""}
                onChange={(e) => setSubscriptionAmount(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualified-lead">Net Saving on Qualified Lead ($)</Label>
              <Input
                id="qualified-lead"
                type="number"
                placeholder="Enter qualified lead saving"
                value={netSavingOnQualifiedLead || ""}
                onChange={(e) => setNetSavingOnQualifiedLead(Number(e.target.value))}
                className="text-lg"
              />
            </div>
          </div>

          <Separator />

          {subscriptionAmount > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                title="ROI on Additional Revenue"
                value={roiOnAddRevenue.toFixed(2) + "x"}
                subtitle="Return on additional revenue generated"
                icon={TrendingUp}
                trend={roiOnAddRevenue > 1 ? "up" : "down"}
                color="emerald"
                size="large"
              />
              <MetricCard
                title="ROI on Cost Savings"
                value={roiOnSaving.toFixed(2) + "x"}
                subtitle="Return on subscription investment"
                icon={PiggyBank}
                trend={roiOnSaving > 1 ? "up" : "down"}
                color="blue"
                size="large"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Insights */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            Performance Summary & Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">💰 Cost Efficiency</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • Cost per conversion:{" "}
                  <strong>
                    {formatPercentage(Math.abs(decreaseInCostPerConversion))}{" "}
                    {decreaseInCostPerConversion > 0 ? "decrease" : "increase"}
                  </strong>
                </li>
                <li>
                  • Saving per purchase: <strong>{formatCurrency(savingOnOnePurchase)}</strong>
                </li>
                <li>
                  • Total net savings: <strong>{formatCurrency(netSaving)}</strong>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">📈 Revenue Growth</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • ROAS improvement: <strong>{formatPercentage(((postRoas - preRoas) / preRoas) * 100)}</strong>
                </li>
                <li>
                  • Average order increase: <strong>{formatPercentage(percentageAdditional)}</strong>
                </li>
                <li>
                  • Additional revenue: <strong>{formatCurrency(additionalRevenue)}</strong>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-purple-700">🎯 ROI Impact</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • Revenue ROI: <strong>{roiOnAddRevenue.toFixed(2)}x return</strong>
                </li>
                <li>
                  • Savings ROI: <strong>{roiOnSaving.toFixed(2)}x return</strong>
                </li>
                <li>
                  • Overall efficiency: <strong>{postRoas > preRoas ? "Improved" : "Needs attention"}</strong>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
