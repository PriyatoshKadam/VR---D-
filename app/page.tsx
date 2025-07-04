"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, BarChart3, TrendingUp, Users, Target, Globe, Smartphone, Calculator } from "lucide-react"
import { OverviewSection } from "./components/overview-section"
import { PerformanceSection } from "./components/performance-section"
import { AudienceSection } from "./components/audience-section"
import { PlacementSection } from "./components/placement-section"
import { GeographicSection } from "./components/geographic-section"
import { DeviceSection } from "./components/device-section"
import { SummaryTotalsSection } from "./components/summary-totals-section"
import { AdvancedMetricsSection } from "./components/advanced-metrics-section"

interface AdAccount {
  id: string
  name: string
}

export interface SummaryTotals {
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
  metaACR: number // Attributed Conversion Rate
}

export interface ComprehensiveReportData {
  summaryTotals: SummaryTotals
  overview: {
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
  performance: {
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
  audience: {
    ageGender: Array<{
      age: string
      gender: string
      preSpend: number
      postSpend: number
      preConversions: number
      postConversions: number
    }>
    interests: Array<{
      name: string
      preSpend: number
      postSpend: number
      preConversions: number
      postConversions: number
    }>
  }
  placements: Array<{
    name: string
    preSpend: number
    postSpend: number
    preImpressions: number
    postImpressions: number
    preConversions: number
    postConversions: number
  }>
  geographic: Array<{
    country: string
    region?: string
    preSpend: number
    postSpend: number
    preConversions: number
    postConversions: number
  }>
  devices: Array<{
    platform: string
    preSpend: number
    postSpend: number
    preConversions: number
    postConversions: number
  }>
  timeAnalysis: {
    hourly: Array<{
      hour: number
      preSpend: number
      postSpend: number
      preConversions: number
      postConversions: number
    }>
    daily: Array<{
      dayOfWeek: string
      preSpend: number
      postSpend: number
      preConversions: number
      postConversions: number
    }>
  }
}

export default function MetaAdsCapiTool() {
  const [accessToken, setAccessToken] = useState("")
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState("")
  const [eventName, setEventName] = useState("Purchase")
  const [preStartDate, setPreStartDate] = useState("2025-06-01")
  const [preEndDate, setPreEndDate] = useState("2025-06-15")
  const [postStartDate, setPostStartDate] = useState("2025-06-16")
  const [postEndDate, setPostEndDate] = useState("2025-06-30")
  const [loading, setLoading] = useState(false)
  const [fetchingAccounts, setFetchingAccounts] = useState(false)
  const [error, setError] = useState("")
  const [reportData, setReportData] = useState<ComprehensiveReportData | null>(null)
  const [activeTab, setActiveTab] = useState("summary")

  const fetchAdAccounts = async () => {
    if (!accessToken) {
      setError("Please enter your Meta Access Token")
      return
    }

    setFetchingAccounts(true)
    setError("")

    try {
      const response = await fetch("/api/meta/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch ad accounts")
      }

      setAdAccounts(data.accounts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ad accounts")
    } finally {
      setFetchingAccounts(false)
    }
  }

  const generateComprehensiveReport = async () => {
    if (!selectedAccount || !accessToken) {
      setError("Please select an ad account")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/meta/comprehensive-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          accountId: selectedAccount,
          eventName: eventName.toLowerCase(),
          preStartDate,
          preEndDate,
          postStartDate,
          postEndDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate comprehensive report")
      }

      setReportData(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate comprehensive report")
    } finally {
      setLoading(false)
    }
  }

  const downloadComprehensiveCSV = () => {
    if (!reportData) return

    // Create comprehensive CSV with all data sections
    const csvSections = []

    // Overview section
    csvSections.push("=== OVERVIEW METRICS ===")
    csvSections.push("Metric,Pre-CAPI,Post-CAPI,Change %")
    csvSections.push(
      `Spend,$${reportData.overview.preSpend.toFixed(2)},$${reportData.overview.postSpend.toFixed(2)},${(((reportData.overview.postSpend - reportData.overview.preSpend) / reportData.overview.preSpend) * 100).toFixed(1)}%`,
    )
    csvSections.push(
      `Impressions,${reportData.overview.preImpressions.toLocaleString()},${reportData.overview.postImpressions.toLocaleString()},${(((reportData.overview.postImpressions - reportData.overview.preImpressions) / reportData.overview.preImpressions) * 100).toFixed(1)}%`,
    )
    csvSections.push(
      `Clicks,${reportData.overview.preClicks.toLocaleString()},${reportData.overview.postClicks.toLocaleString()},${(((reportData.overview.postClicks - reportData.overview.preClicks) / reportData.overview.preClicks) * 100).toFixed(1)}%`,
    )
    csvSections.push(
      `Conversions,${reportData.overview.preConversions},${reportData.overview.postConversions},${(((reportData.overview.postConversions - reportData.overview.preConversions) / reportData.overview.preConversions) * 100).toFixed(1)}%`,
    )
    csvSections.push(
      `CTR,${reportData.overview.preCtr.toFixed(2)}%,${reportData.overview.postCtr.toFixed(2)}%,${(((reportData.overview.postCtr - reportData.overview.preCtr) / reportData.overview.preCtr) * 100).toFixed(1)}%`,
    )
    csvSections.push(
      `CPC,$${reportData.overview.preCpc.toFixed(2)},$${reportData.overview.postCpc.toFixed(2)},${(((reportData.overview.postCpc - reportData.overview.preCpc) / reportData.overview.preCpc) * 100).toFixed(1)}%`,
    )
    csvSections.push(
      `CPM,$${reportData.overview.preCpm.toFixed(2)},$${reportData.overview.postCpm.toFixed(2)},${(((reportData.overview.postCpm - reportData.overview.preCpm) / reportData.overview.preCpm) * 100).toFixed(1)}%`,
    )
    csvSections.push(
      `ROAS,${reportData.overview.preRoas.toFixed(2)},${reportData.overview.postRoas.toFixed(2)},${(((reportData.overview.postRoas - reportData.overview.preRoas) / reportData.overview.preRoas) * 100).toFixed(1)}%`,
    )

    // Campaign performance
    csvSections.push("\n=== CAMPAIGN PERFORMANCE ===")
    csvSections.push("Campaign,Pre Spend,Post Spend,Pre Conversions,Post Conversions,Pre ROAS,Post ROAS")
    reportData.performance.campaigns.forEach((campaign) => {
      csvSections.push(
        `${campaign.name},$${campaign.preSpend.toFixed(2)},$${campaign.postSpend.toFixed(2)},${campaign.preConversions},${campaign.postConversions},${campaign.preRoas.toFixed(2)},${campaign.postRoas.toFixed(2)}`,
      )
    })

    // Geographic performance
    csvSections.push("\n=== GEOGRAPHIC PERFORMANCE ===")
    csvSections.push("Country,Region,Pre Spend,Post Spend,Pre Conversions,Post Conversions")
    reportData.geographic.forEach((geo) => {
      csvSections.push(
        `${geo.country},${geo.region || "N/A"},$${geo.preSpend.toFixed(2)},$${geo.postSpend.toFixed(2)},${geo.preConversions},${geo.postConversions}`,
      )
    })

    // Placement performance
    csvSections.push("\n=== PLACEMENT PERFORMANCE ===")
    csvSections.push("Placement,Pre Spend,Post Spend,Pre Impressions,Post Impressions,Pre Conversions,Post Conversions")
    reportData.placements.forEach((placement) => {
      csvSections.push(
        `${placement.name},$${placement.preSpend.toFixed(2)},$${placement.postSpend.toFixed(2)},${placement.preImpressions.toLocaleString()},${placement.postImpressions.toLocaleString()},${placement.preConversions},${placement.postConversions}`,
      )
    })

    const csvContent = csvSections.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "meta_capi_comprehensive_report.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3 mb-3">
          <BarChart3 className="h-10 w-10 text-blue-600" />
          Meta Ads CAPI Analytics Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive performance analysis comparing pre and post Conversions API implementation
        </p>
      </div>

      <div className="grid gap-6">
        {/* Configuration Section */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>Set up your analysis parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Access Token */}
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-medium">
                🔑 Meta Access Token
              </Label>
              <div className="flex gap-3">
                <Input
                  id="token"
                  type="password"
                  placeholder="Enter your Meta Access Token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={fetchAdAccounts} disabled={fetchingAccounts || !accessToken} variant="outline">
                  {fetchingAccounts ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    "Fetch Accounts"
                  )}
                </Button>
              </div>
            </div>

            {/* Account and Event Configuration */}
            {adAccounts.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account">Ad Account</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an ad account" />
                      </SelectTrigger>
                      <SelectContent>
                        {adAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event">Primary Conversion Event</Label>
                    <Input
                      id="event"
                      placeholder="e.g. Purchase, Lead, CompleteRegistration"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Date Range Configuration */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Analysis Periods</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pre-start" className="text-xs text-muted-foreground">
                        Pre-CAPI Start
                      </Label>
                      <Input
                        id="pre-start"
                        type="date"
                        value={preStartDate}
                        onChange={(e) => setPreStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pre-end" className="text-xs text-muted-foreground">
                        Pre-CAPI End
                      </Label>
                      <Input
                        id="pre-end"
                        type="date"
                        value={preEndDate}
                        onChange={(e) => setPreEndDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="post-start" className="text-xs text-muted-foreground">
                        Post-CAPI Start
                      </Label>
                      <Input
                        id="post-start"
                        type="date"
                        value={postStartDate}
                        onChange={(e) => setPostStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="post-end" className="text-xs text-muted-foreground">
                        Post-CAPI End
                      </Label>
                      <Input
                        id="post-end"
                        type="date"
                        value={postEndDate}
                        onChange={(e) => setPostEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={generateComprehensiveReport}
                  disabled={loading || !selectedAccount}
                  className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Comprehensive Report...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Generate Comprehensive Report
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Dashboard */}
        {reportData && (
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    ✅ Comprehensive Report Generated
                    <Badge variant="secondary" className="ml-2">
                      {eventName} Events
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Complete performance analysis across all dimensions
                  </CardDescription>
                </div>
                <Button onClick={downloadComprehensiveCSV} variant="outline" className="shrink-0 bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Download Full Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-8 h-auto p-1 bg-muted/50">
                  <TabsTrigger value="summary" className="flex items-center gap-2 py-3">
                    <Target className="h-4 w-4" />
                    <span className="hidden sm:inline">Summary</span>
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="flex items-center gap-2 py-3">
                    <Calculator className="h-4 w-4" />
                    <span className="hidden sm:inline">Advanced</span>
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="flex items-center gap-2 py-3">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="flex items-center gap-2 py-3">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Performance</span>
                  </TabsTrigger>
                  <TabsTrigger value="audience" className="flex items-center gap-2 py-3">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Audience</span>
                  </TabsTrigger>
                  <TabsTrigger value="placements" className="flex items-center gap-2 py-3">
                    <Target className="h-4 w-4" />
                    <span className="hidden sm:inline">Placements</span>
                  </TabsTrigger>
                  <TabsTrigger value="geographic" className="flex items-center gap-2 py-3">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">Geographic</span>
                  </TabsTrigger>
                  <TabsTrigger value="devices" className="flex items-center gap-2 py-3">
                    <Smartphone className="h-4 w-4" />
                    <span className="hidden sm:inline">Devices</span>
                  </TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="summary" className="mt-0">
                    <SummaryTotalsSection data={reportData.summaryTotals} />
                  </TabsContent>

                  <TabsContent value="advanced" className="mt-0">
                    <AdvancedMetricsSection data={reportData.summaryTotals} />
                  </TabsContent>

                  <TabsContent value="overview" className="mt-0">
                    <OverviewSection data={reportData.overview} />
                  </TabsContent>

                  <TabsContent value="performance" className="mt-0">
                    <PerformanceSection data={reportData.performance} />
                  </TabsContent>

                  <TabsContent value="audience" className="mt-0">
                    <AudienceSection data={reportData.audience} />
                  </TabsContent>

                  <TabsContent value="placements" className="mt-0">
                    <PlacementSection data={reportData.placements} />
                  </TabsContent>

                  <TabsContent value="geographic" className="mt-0">
                    <GeographicSection data={reportData.geographic} />
                  </TabsContent>

                  <TabsContent value="devices" className="mt-0">
                    <DeviceSection data={reportData.devices} />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
