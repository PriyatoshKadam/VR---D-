import { type NextRequest, NextResponse } from "next/server"

interface MetaInsightsParams {
  accessToken: string
  accountId: string
  eventName: string
  preStartDate: string
  preEndDate: string
  postStartDate: string
  postEndDate: string
}

interface MetaAdData {
  spend?: string
  actions?: Array<{
    action_type: string
    value: string
  }>
  action_values?: Array<{
    action_type: string
    value: string
  }>
}

interface ParsedStats {
  spend: number
  totalConversions: number
  websiteValue: number
  inappValue: number
  offlineValue: number
  websiteRoas: number
  inappRoas: number
  offlineRoas: number
  totalValue: number
  roas: number
}

async function fetchMetaAdsInsights(
  accountId: string,
  token: string,
  since: string,
  until: string,
): Promise<MetaAdData[]> {
  let baseUrl = `https://graph.facebook.com/v23.0/${accountId}/insights`
  let params: any = {
    access_token: token,
    level: "ad",
    time_range: JSON.stringify({ since, until }),
    fields: "spend,actions,action_values",
    limit: "500",
  }

  const data: MetaAdData[] = []

  while (true) {
    const urlParams = new URLSearchParams(params)
    const response = await fetch(`${baseUrl}?${urlParams}`)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Meta API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    data.push(...(result.data || []))

    const nextPage = result.paging?.next
    if (!nextPage) break

    baseUrl = nextPage
    params = {}
  }

  return data
}

function parseMetaData(data: MetaAdData[], event: string): ParsedStats {
  const eventLower = event.toLowerCase()

  const stats: ParsedStats = {
    spend: 0,
    totalConversions: 0,
    websiteValue: 0,
    inappValue: 0,
    offlineValue: 0,
    websiteRoas: 0,
    inappRoas: 0,
    offlineRoas: 0,
    totalValue: 0,
    roas: 0,
  }

  for (const ad of data) {
    stats.spend += Number.parseFloat(ad.spend || "0")

    // Parse actions (conversions)
    for (const action of ad.actions || []) {
      const actionType = action.action_type.toLowerCase()
      if (actionType.includes(eventLower)) {
        stats.totalConversions += Number.parseInt(action.value || "0")
      }
    }

    // Parse action values (revenue)
    for (const value of ad.action_values || []) {
      const actionType = value.action_type.toLowerCase()
      const actionValue = Number.parseFloat(value.value || "0")

      if (actionType.includes("offsite_conversion") && actionType.includes(eventLower)) {
        stats.websiteValue += actionValue
      } else if (actionType.includes("app_custom_event") && actionType.includes(eventLower)) {
        stats.inappValue += actionValue
      } else if (actionType.includes("offline_conversion") && actionType.includes(eventLower)) {
        stats.offlineValue += actionValue
      }
    }
  }

  stats.totalValue = stats.websiteValue + stats.inappValue + stats.offlineValue

  if (stats.spend > 0) {
    stats.roas = stats.totalValue / stats.spend
    stats.websiteRoas = stats.websiteValue / stats.spend
    stats.inappRoas = stats.inappValue / stats.spend
    stats.offlineRoas = stats.offlineValue / stats.spend
  }

  return stats
}

export async function POST(request: NextRequest) {
  try {
    const {
      accessToken,
      accountId,
      eventName,
      preStartDate,
      preEndDate,
      postStartDate,
      postEndDate,
    }: MetaInsightsParams = await request.json()

    if (!accessToken || !accountId || !eventName) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Fetch pre and post CAPI data
    const [preData, postData] = await Promise.all([
      fetchMetaAdsInsights(accountId, accessToken, preStartDate, preEndDate),
      fetchMetaAdsInsights(accountId, accessToken, postStartDate, postEndDate),
    ])

    // Parse the data
    const preStats = parseMetaData(preData, eventName)
    const postStats = parseMetaData(postData, eventName)

    const comparison = {
      event: eventName,
      preSpend: preStats.spend,
      postSpend: postStats.spend,
      preConversions: preStats.totalConversions,
      postConversions: postStats.totalConversions,
      preWebsiteValue: preStats.websiteValue,
      postWebsiteValue: postStats.websiteValue,
      preInAppValue: preStats.inappValue,
      postInAppValue: postStats.inappValue,
      preOfflineValue: preStats.offlineValue,
      postOfflineValue: postStats.offlineValue,
      preTotalValue: preStats.totalValue,
      postTotalValue: postStats.totalValue,
      preRoas: preStats.roas,
      postRoas: postStats.roas,
      preWebsiteRoas: preStats.websiteRoas,
      postWebsiteRoas: postStats.websiteRoas,
      preInAppRoas: preStats.inappRoas,
      postInAppRoas: postStats.inappRoas,
      preOfflineRoas: preStats.offlineRoas,
      postOfflineRoas: postStats.offlineRoas,
    }

    return NextResponse.json({ comparison })
  } catch (error) {
    console.error("Error generating insights report:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
