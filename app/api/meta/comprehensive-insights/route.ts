import { type NextRequest, NextResponse } from "next/server"

interface ComprehensiveInsightsParams {
  accessToken: string
  accountId: string
  eventName: string
  preStartDate: string
  preEndDate: string
  postStartDate: string
  postEndDate: string
}

// Helper function to split date range into smaller chunks
function splitDateRange(startDate: string, endDate: string, maxDays = 7): string[][] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const ranges: string[][] = []

  const current = new Date(start)

  while (current < end) {
    const rangeEnd = new Date(current)
    rangeEnd.setDate(rangeEnd.getDate() + maxDays - 1)

    if (rangeEnd > end) {
      rangeEnd.setTime(end.getTime())
    }

    ranges.push([current.toISOString().split("T")[0], rangeEnd.toISOString().split("T")[0]])

    current.setDate(current.getDate() + maxDays)
  }

  return ranges
}

// Add delay between requests to avoid rate limiting
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchComprehensiveInsights(
  accountId: string,
  token: string,
  since: string,
  until: string,
  level = "ad",
  breakdowns: string[] = [],
  retryCount = 0,
) {
  const maxRetries = 3
  const baseDelay = 1000 // 1 second base delay

  try {
    // Split large date ranges into smaller chunks
    const dateRanges = splitDateRange(since, until, 7) // 7-day chunks
    const allData: any[] = []

    console.log(`Fetching ${level} data in ${dateRanges.length} chunks from ${since} to ${until}`)

    for (let i = 0; i < dateRanges.length; i++) {
      const [chunkStart, chunkEnd] = dateRanges[i]
      console.log(`Processing chunk ${i + 1}/${dateRanges.length}: ${chunkStart} to ${chunkEnd}`)

      // Add delay between chunks to avoid rate limiting
      if (i > 0) {
        await delay(500)
      }

      const chunkData = await fetchSingleDateRange(accountId, token, chunkStart, chunkEnd, level, breakdowns)

      allData.push(...chunkData)
    }

    console.log(`Successfully fetched ${allData.length} records for ${level} level`)
    return allData
  } catch (error: any) {
    console.error(`Error fetching ${level} data (attempt ${retryCount + 1}):`, error.message)

    // Retry logic for transient errors
    if (
      retryCount < maxRetries &&
      (error.message.includes("temporarily unavailable") ||
        error.message.includes("timed out") ||
        error.message.includes("rate limit"))
    ) {
      const delayTime = baseDelay * Math.pow(2, retryCount) // Exponential backoff
      console.log(`Retrying in ${delayTime}ms...`)
      await delay(delayTime)
      return fetchComprehensiveInsights(accountId, token, since, until, level, breakdowns, retryCount + 1)
    }

    throw error
  }
}

async function fetchSingleDateRange(
  accountId: string,
  token: string,
  since: string,
  until: string,
  level: string,
  breakdowns: string[] = [],
) {
  const baseUrl = `https://graph.facebook.com/v23.0/${accountId}/insights`

  // THESE ARE THE EXACT API FIELD NAMES USED TO FETCH CONVERSION DATA:
  const fields = [
    "spend", // Ad spend amount
    "impressions", // Number of impressions
    "clicks", // Number of clicks
    "actions", // ← THIS CONTAINS CONVERSION COUNTS (e.g., purchases, leads)
    "action_values", // ← THIS CONTAINS CONVERSION VALUES (e.g., revenue, lead value)
    "campaign_name", // Campaign name for grouping
    "adset_name", // Ad set name for grouping
    "ad_name", // Ad name for grouping
  ]

  console.log(`API Request Fields: ${fields.join(", ")}`)
  console.log(`Key conversion fields: "actions" (for counts) and "action_values" (for revenue/values)`)

  const params: any = {
    access_token: token,
    level: level,
    time_range: JSON.stringify({ since, until }),
    fields: fields.join(","), // ← These fields are sent to Meta's API
    limit: "100",
  }

  if (breakdowns.length > 0) {
    params.breakdowns = breakdowns.join(",")
  }

  const data: any[] = []
  let nextUrl: string | null = null
  let requestCount = 0
  const maxRequests = 5

  while (requestCount < maxRequests) {
    try {
      let requestUrl: string
      let requestParams: any = {}

      if (nextUrl) {
        requestUrl = nextUrl
      } else {
        requestUrl = baseUrl
        requestParams = params
      }

      const urlParams = new URLSearchParams(requestParams)
      const finalUrl = nextUrl || `${requestUrl}?${urlParams}`

      console.log(`Making API request with fields: ${fields.join(", ")}`)

      const response = await fetch(finalUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: { message: errorText } }
        }

        const errorMessage = errorData.error?.message || errorText
        console.error(`API Error (${response.status}):`, errorMessage)

        if (errorMessage.includes("Invalid cursor") || errorMessage.includes("cursor")) {
          console.log("Invalid cursor detected, stopping pagination for this chunk")
          break
        }

        throw new Error(`Meta API error: ${response.status} - ${errorMessage}`)
      }

      const result = await response.json()
      const pageData = result.data || []

      if (pageData.length === 0) {
        console.log("No more data available")
        break
      }

      data.push(...pageData)
      console.log(`Fetched ${pageData.length} records (total: ${data.length})`)

      nextUrl = result.paging?.next || null

      if (!nextUrl) {
        console.log("No more pages available")
        break
      }

      requestCount++
      await delay(300)
    } catch (error: any) {
      console.error(`Pagination error for ${level}:`, error.message)

      if (error.message.includes("Invalid cursor") || error.message.includes("cursor")) {
        console.log("Cursor error encountered, stopping pagination for this chunk")
        break
      }

      if (error.message.includes("timeout") || error.message.includes("temporarily unavailable")) {
        throw error
      }

      console.log("Stopping pagination due to error, returning collected data")
      break
    }
  }

  console.log(`Completed fetching ${data.length} records for ${level} level`)
  return data
}

function parseComprehensiveData(data: any[], eventName: string) {
  const eventLower = eventName.toLowerCase()
  console.log(`Parsing ${data.length} records for event: ${eventName}`)

  const stats = {
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    totalValue: 0,
    campaigns: new Map(),
    adSets: new Map(),
    ads: new Map(),
    placements: new Map(),
    ageGender: new Map(),
    countries: new Map(),
    devices: new Map(),
  }

  for (const item of data) {
    const spend = Number.parseFloat(item.spend || "0")
    const impressions = Number.parseInt(item.impressions || "0")
    const clicks = Number.parseInt(item.clicks || "0")

    stats.spend += spend
    stats.impressions += impressions
    stats.clicks += clicks

    let conversions = 0
    let value = 0

    // PARSING THE "actions" FIELD FOR CONVERSION COUNTS
    console.log(`Processing "actions" field for conversion counts...`)
    if (item.actions && Array.isArray(item.actions)) {
      console.log(`Found ${item.actions.length} action types in "actions" field:`)

      for (const action of item.actions) {
        const actionType = (action.action_type || "").toLowerCase()
        const actionValue = Number.parseInt(action.value || "0")

        console.log(`  - Action Type: "${action.action_type}" | Value: ${actionValue}`)

        // Match the user's specified event
        let isMatch = false

        if (actionType === eventLower) {
          isMatch = true
          console.log(`    ✓ EXACT MATCH for "${eventName}"`)
        } else if (actionType.includes(eventLower)) {
          isMatch = true
          console.log(`    ✓ CONTAINS MATCH for "${eventName}"`)
        } else if (eventLower === "purchase" && actionType === "offsite_conversion.fb_pixel_purchase") {
          isMatch = true
          console.log(`    ✓ PIXEL PURCHASE MATCH`)
        } else if (eventLower === "lead" && actionType === "offsite_conversion.fb_pixel_lead") {
          isMatch = true
          console.log(`    ✓ PIXEL LEAD MATCH`)
        } else if (
          eventLower === "complete_registration" &&
          actionType === "offsite_conversion.fb_pixel_complete_registration"
        ) {
          isMatch = true
          console.log(`    ✓ PIXEL REGISTRATION MATCH`)
        } else if (eventLower === "add_to_cart" && actionType === "offsite_conversion.fb_pixel_add_to_cart") {
          isMatch = true
          console.log(`    ✓ PIXEL ADD TO CART MATCH`)
        } else if (
          eventLower === "initiate_checkout" &&
          actionType === "offsite_conversion.fb_pixel_initiate_checkout"
        ) {
          isMatch = true
          console.log(`    ✓ PIXEL CHECKOUT MATCH`)
        } else if (eventLower === "view_content" && actionType === "offsite_conversion.fb_pixel_view_content") {
          isMatch = true
          console.log(`    ✓ PIXEL VIEW CONTENT MATCH`)
        }

        if (isMatch) {
          conversions += actionValue
          console.log(`    → Added ${actionValue} conversions (Total: ${conversions})`)
        }
      }
    } else {
      console.log(`No "actions" field found in this record`)
    }

    // PARSING THE "action_values" FIELD FOR CONVERSION VALUES/REVENUE
    console.log(`Processing "action_values" field for conversion values...`)
    if (item.action_values && Array.isArray(item.action_values)) {
      console.log(`Found ${item.action_values.length} action value types in "action_values" field:`)

      for (const actionValue of item.action_values) {
        const actionType = (actionValue.action_type || "").toLowerCase()
        const conversionValue = Number.parseFloat(actionValue.value || "0")

        console.log(`  - Action Value Type: "${actionValue.action_type}" | Value: $${conversionValue}`)

        // Same matching logic as above
        let isMatch = false

        if (actionType === eventLower) {
          isMatch = true
          console.log(`    ✓ EXACT VALUE MATCH for "${eventName}"`)
        } else if (actionType.includes(eventLower)) {
          isMatch = true
          console.log(`    ✓ CONTAINS VALUE MATCH for "${eventName}"`)
        } else if (eventLower === "purchase" && actionType === "offsite_conversion.fb_pixel_purchase") {
          isMatch = true
          console.log(`    ✓ PIXEL PURCHASE VALUE MATCH`)
        } else if (eventLower === "lead" && actionType === "offsite_conversion.fb_pixel_lead") {
          isMatch = true
          console.log(`    ✓ PIXEL LEAD VALUE MATCH`)
        } else if (
          eventLower === "complete_registration" &&
          actionType === "offsite_conversion.fb_pixel_complete_registration"
        ) {
          isMatch = true
          console.log(`    ✓ PIXEL REGISTRATION VALUE MATCH`)
        } else if (eventLower === "add_to_cart" && actionType === "offsite_conversion.fb_pixel_add_to_cart") {
          isMatch = true
          console.log(`    ✓ PIXEL ADD TO CART VALUE MATCH`)
        } else if (
          eventLower === "initiate_checkout" &&
          actionType === "offsite_conversion.fb_pixel_initiate_checkout"
        ) {
          isMatch = true
          console.log(`    ✓ PIXEL CHECKOUT VALUE MATCH`)
        } else if (eventLower === "view_content" && actionType === "offsite_conversion.fb_pixel_view_content") {
          isMatch = true
          console.log(`    ✓ PIXEL VIEW CONTENT VALUE MATCH`)
        }

        if (isMatch) {
          value += conversionValue
          console.log(`    → Added $${conversionValue} value (Total: $${value})`)
        }
      }
    } else {
      console.log(`No "action_values" field found in this record`)
    }

    stats.conversions += conversions
    stats.totalValue += value

    // Aggregate by campaign
    if (item.campaign_name) {
      const campaign = stats.campaigns.get(item.campaign_name) || {
        name: item.campaign_name,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        value: 0,
      }
      campaign.spend += spend
      campaign.impressions += impressions
      campaign.clicks += clicks
      campaign.conversions += conversions
      campaign.value += value
      stats.campaigns.set(item.campaign_name, campaign)
    }

    // Aggregate by ad set
    if (item.adset_name) {
      const adSet = stats.adSets.get(item.adset_name) || {
        name: item.adset_name,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        value: 0,
      }
      adSet.spend += spend
      adSet.impressions += impressions
      adSet.clicks += clicks
      adSet.conversions += conversions
      adSet.value += value
      stats.adSets.set(item.adset_name, adSet)
    }

    // Aggregate by ad
    if (item.ad_name) {
      const ad = stats.ads.get(item.ad_name) || {
        name: item.ad_name,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        value: 0,
      }
      ad.spend += spend
      ad.impressions += impressions
      ad.clicks += clicks
      ad.conversions += conversions
      ad.value += value
      stats.ads.set(item.ad_name, ad)
    }

    // Handle breakdown data
    if (item.publisher_platform) {
      const placement = stats.placements.get(item.publisher_platform) || {
        name: item.publisher_platform,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      }
      placement.spend += spend
      placement.impressions += impressions
      placement.clicks += clicks
      placement.conversions += conversions
      stats.placements.set(item.publisher_platform, placement)
    }

    if (item.age && item.gender) {
      const key = `${item.age}-${item.gender}`
      const segment = stats.ageGender.get(key) || {
        age: item.age,
        gender: item.gender,
        spend: 0,
        conversions: 0,
      }
      segment.spend += spend
      segment.conversions += conversions
      stats.ageGender.set(key, segment)
    }

    if (item.country) {
      const country = stats.countries.get(item.country) || {
        country: item.country,
        region: item.region,
        spend: 0,
        conversions: 0,
      }
      country.spend += spend
      country.conversions += conversions
      stats.countries.set(item.country, country)
    }

    if (item.device_platform) {
      const device = stats.devices.get(item.device_platform) || {
        platform: item.device_platform,
        spend: 0,
        conversions: 0,
      }
      device.spend += spend
      device.conversions += conversions
      stats.devices.set(item.device_platform, device)
    }
  }

  console.log(
    `Final parsed totals - Spend: $${stats.spend.toFixed(2)}, Conversions: ${stats.conversions}, Value: $${stats.totalValue.toFixed(2)}`,
  )
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
    }: ComprehensiveInsightsParams = await request.json()

    if (!accessToken || !accountId || !eventName) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log(`=== META API CONVERSION TRACKING ===`)
    console.log(`Target Event: "${eventName}"`)
    console.log(`API Fields Used: actions, action_values`)
    console.log(`Account: ${accountId}`)
    console.log(`Pre period: ${preStartDate} to ${preEndDate}`)
    console.log(`Post period: ${postStartDate} to ${postEndDate}`)

    // Fetch basic ad-level data first (most comprehensive)
    console.log("Fetching ad-level data...")
    const [preAdData, postAdData] = await Promise.all([
      fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "ad"),
      fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "ad"),
    ])

    // Fetch campaign and ad set level data for additional accuracy
    console.log("Fetching campaign and ad set data...")
    let preCampaignData = [],
      postCampaignData = []
    let preAdSetData = [],
      postAdSetData = []

    try {
      const campaignPromises = [
        fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "campaign"),
        fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "campaign"),
      ]

      const adsetPromises = [
        fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "adset"),
        fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "adset"),
      ]
      ;[preCampaignData, postCampaignData] = await Promise.all(campaignPromises)
      ;[preAdSetData, postAdSetData] = await Promise.all(adsetPromises)
    } catch (error) {
      console.warn("Could not fetch campaign/adset data:", error)
    }

    // Fetch breakdown data with error handling (optional data)
    console.log("Fetching breakdown data...")
    let prePlacementData = [],
      postPlacementData = []
    const preAgeGenderData = [],
      postAgeGenderData = []
    let preCountryData = [],
      postCountryData = []
    let preDeviceData = [],
      postDeviceData = []

    // Try placement breakdown (most important)
    try {
      ;[prePlacementData, postPlacementData] = await Promise.all([
        fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "ad", ["publisher_platform"]),
        fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "ad", ["publisher_platform"]),
      ])
    } catch (error) {
      console.warn("Could not fetch placement data:", error)
    }

    // Try other breakdowns (less critical)
    try {
      ;[preCountryData, postCountryData] = await Promise.all([
        fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "ad", ["country"]),
        fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "ad", ["country"]),
      ])
    } catch (error) {
      console.warn("Could not fetch country data:", error)
    }

    try {
      ;[preDeviceData, postDeviceData] = await Promise.all([
        fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "ad", ["device_platform"]),
        fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "ad", ["device_platform"]),
      ])
    } catch (error) {
      console.warn("Could not fetch device data:", error)
    }

    // Skip age/gender for now as it's most likely to timeout
    console.log("Skipping age/gender breakdown to avoid timeouts")

    // Parse all the data
    console.log("Parsing data...")
    const preStats = parseComprehensiveData(preAdData, eventName)
    const postStats = parseComprehensiveData(postAdData, eventName)
    const prePlacementStats = parseComprehensiveData(prePlacementData, eventName)
    const postPlacementStats = parseComprehensiveData(postPlacementData, eventName)
    const preAgeGenderStats = parseComprehensiveData(preAgeGenderData, eventName)
    const postAgeGenderStats = parseComprehensiveData(postAgeGenderData, eventName)
    const preCountryStats = parseComprehensiveData(preCountryData, eventName)
    const postCountryStats = parseComprehensiveData(postCountryData, eventName)
    const preDeviceStats = parseComprehensiveData(preDeviceData, eventName)
    const postDeviceStats = parseComprehensiveData(postDeviceData, eventName)
    const preCampaignStats = parseComprehensiveData(preCampaignData, eventName)
    const postCampaignStats = parseComprehensiveData(postCampaignData, eventName)
    const preAdSetStats = parseComprehensiveData(preAdSetData, eventName)
    const postAdSetStats = parseComprehensiveData(postAdSetData, eventName)

    // Calculate derived metrics
    const calculateMetrics = (stats: any) => ({
      ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0,
      cpc: stats.clicks > 0 ? stats.spend / stats.clicks : 0,
      cpm: stats.impressions > 0 ? (stats.spend / stats.impressions) * 1000 : 0,
      roas: stats.spend > 0 ? stats.totalValue / stats.spend : 0,
      costPerConversion: stats.conversions > 0 ? stats.spend / stats.conversions : 0,
      conversionRate: stats.clicks > 0 ? (stats.conversions / stats.clicks) * 100 : 0,
    })

    const preMetrics = calculateMetrics(preStats)
    const postMetrics = calculateMetrics(postStats)

    // Create summary totals
    const summaryTotals = {
      preSpend: preStats.spend,
      postSpend: postStats.spend,
      preConversions: preStats.conversions,
      postConversions: postStats.conversions,
      preConversionValue: preStats.totalValue,
      postConversionValue: postStats.totalValue,
      preImpressions: preStats.impressions,
      postImpressions: postStats.impressions,
      preClicks: preStats.clicks,
      postClicks: postStats.clicks,
      metaACR: postStats.conversions > 0 && postStats.clicks > 0 ? (postStats.conversions / postStats.clicks) * 100 : 0,
    }

    console.log("=== FINAL SUMMARY TOTALS ===")
    console.log("Pre-CAPI Conversions:", summaryTotals.preConversions)
    console.log("Post-CAPI Conversions:", summaryTotals.postConversions)
    console.log("Pre-CAPI Value:", summaryTotals.preConversionValue)
    console.log("Post-CAPI Value:", summaryTotals.postConversionValue)

    // Build comprehensive report
    const report = {
      summaryTotals,
      overview: {
        preSpend: preStats.spend,
        postSpend: postStats.spend,
        preImpressions: preStats.impressions,
        postImpressions: postStats.impressions,
        preClicks: preStats.clicks,
        postClicks: postStats.clicks,
        preConversions: preStats.conversions,
        postConversions: postStats.conversions,
        preCtr: preMetrics.ctr,
        postCtr: postMetrics.ctr,
        preCpc: preMetrics.cpc,
        postCpc: postMetrics.cpc,
        preCpm: preMetrics.cpm,
        postCpm: postMetrics.cpm,
        preRoas: preMetrics.roas,
        postRoas: postMetrics.roas,
        preCostPerConversion: preMetrics.costPerConversion,
        postCostPerConversion: postMetrics.costPerConversion,
        preConversionRate: preMetrics.conversionRate,
        postConversionRate: postMetrics.conversionRate,
      },
      performance: {
        campaigns: Array.from(preCampaignStats.campaigns.values())
          .map((preCampaign: any) => {
            const postCampaign = postCampaignStats.campaigns.get(preCampaign.name) || {
              spend: 0,
              conversions: 0,
              value: 0,
            }
            return {
              name: preCampaign.name,
              preSpend: preCampaign.spend,
              postSpend: postCampaign.spend,
              preConversions: preCampaign.conversions,
              postConversions: postCampaign.conversions,
              preRoas: preCampaign.spend > 0 ? preCampaign.value / preCampaign.spend : 0,
              postRoas: postCampaign.spend > 0 ? postCampaign.value / postCampaign.spend : 0,
            }
          })
          .sort((a, b) => b.preSpend + b.postSpend - (a.preSpend + a.postSpend))
          .slice(0, 20),
        adSets: Array.from(preAdSetStats.adSets.values())
          .map((preAdSet: any) => {
            const postAdSet = postAdSetStats.adSets.get(preAdSet.name) || { spend: 0, conversions: 0, value: 0 }
            return {
              name: preAdSet.name,
              preSpend: preAdSet.spend,
              postSpend: postAdSet.spend,
              preConversions: preAdSet.conversions,
              postConversions: postAdSet.conversions,
              preRoas: preAdSet.spend > 0 ? preAdSet.value / preAdSet.spend : 0,
              postRoas: preAdSet.spend > 0 ? postAdSet.value / postAdSet.spend : 0,
            }
          })
          .sort((a, b) => b.preSpend + b.postSpend - (a.preSpend + a.postSpend))
          .slice(0, 20),
        topAds: Array.from(preStats.ads.values())
          .map((preAd: any) => {
            const postAd = postStats.ads.get(preAd.name) || { spend: 0, conversions: 0, value: 0 }
            return {
              name: preAd.name,
              preSpend: preAd.spend,
              postSpend: postAd.spend,
              preConversions: preAd.conversions,
              postConversions: postAd.conversions,
              preRoas: preAd.spend > 0 ? preAd.value / preAd.spend : 0,
              postRoas: postAd.spend > 0 ? postAd.value / postAd.spend : 0,
            }
          })
          .sort((a, b) => b.preSpend + b.postSpend - (a.preSpend + a.postSpend))
          .slice(0, 15),
      },
      audience: {
        ageGender: Array.from(preAgeGenderStats.ageGender.values()).map((preSegment: any) => {
          const postSegment = postAgeGenderStats.ageGender.get(`${preSegment.age}-${preSegment.gender}`) || {
            spend: 0,
            conversions: 0,
          }
          return {
            age: preSegment.age,
            gender: preSegment.gender,
            preSpend: preSegment.spend,
            postSpend: postSegment.spend,
            preConversions: preSegment.conversions,
            postConversions: postSegment.conversions,
          }
        }),
        interests: [],
      },
      placements: Array.from(prePlacementStats.placements.values()).map((prePlacement: any) => {
        const postPlacement = postPlacementStats.placements.get(prePlacement.name) || {
          spend: 0,
          impressions: 0,
          conversions: 0,
        }
        return {
          name: prePlacement.name,
          preSpend: prePlacement.spend,
          postSpend: postPlacement.spend,
          preImpressions: prePlacement.impressions,
          postImpressions: postPlacement.impressions,
          preConversions: prePlacement.conversions,
          postConversions: postPlacement.conversions,
        }
      }),
      geographic: Array.from(preCountryStats.countries.values()).map((preCountry: any) => {
        const postCountry = postCountryStats.countries.get(preCountry.country) || { spend: 0, conversions: 0 }
        return {
          country: preCountry.country,
          region: preCountry.region,
          preSpend: preCountry.spend,
          postSpend: postCountry.spend,
          preConversions: preCountry.conversions,
          postConversions: postCountry.conversions,
        }
      }),
      devices: Array.from(preDeviceStats.devices.values()).map((preDevice: any) => {
        const postDevice = postDeviceStats.devices.get(preDevice.platform) || { spend: 0, conversions: 0 }
        return {
          platform: preDevice.platform,
          preSpend: preDevice.spend,
          postSpend: postDevice.spend,
          preConversions: preDevice.conversions,
          postConversions: postDevice.conversions,
        }
      }),
      timeAnalysis: {
        hourly: [],
        daily: [],
      },
    }

    console.log("Report generated successfully")
    return NextResponse.json({ report })
  } catch (error) {
    console.error("Error generating comprehensive insights report:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
