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

async function fetchComprehensiveInsights(
  accountId: string,
  token: string,
  since: string,
  until: string,
  level = "ad",
  breakdowns: string[] = [],
) {
  let baseUrl = `https://graph.facebook.com/v23.0/${accountId}/insights`

  // Only include valid fields for the insights API
  const fields = [
    "spend",
    "impressions",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "actions",
    "action_values",
    "campaign_name",
    "adset_name",
    "ad_name",
    "objective",
  ]

  let params: any = {
    access_token: token,
    level: level,
    time_range: JSON.stringify({ since, until }),
    fields: fields.join(","),
    limit: "500",
  }

  if (breakdowns.length > 0) {
    params.breakdowns = breakdowns.join(",")
  }

  const data: any[] = []

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

function parseComprehensiveData(data: any[], eventName: string) {
  const eventLower = eventName.toLowerCase()

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

    // Parse conversions and values
    let conversions = 0
    let value = 0

    for (const action of item.actions || []) {
      const actionType = action.action_type.toLowerCase()
      if (actionType.includes(eventLower)) {
        conversions += Number.parseInt(action.value || "0")
      }
    }

    for (const actionValue of item.action_values || []) {
      const actionType = actionValue.action_type.toLowerCase()
      if (actionType.includes(eventLower)) {
        value += Number.parseFloat(actionValue.value || "0")
      }
    }

    stats.conversions += conversions
    stats.totalValue += value

    // Aggregate by campaign
    if (item.campaign_name) {
      const campaign = stats.campaigns.get(item.campaign_name) || {
        name: item.campaign_name,
        spend: 0,
        conversions: 0,
        value: 0,
      }
      campaign.spend += spend
      campaign.conversions += conversions
      campaign.value += value
      stats.campaigns.set(item.campaign_name, campaign)
    }

    // Aggregate by ad set
    if (item.adset_name) {
      const adSet = stats.adSets.get(item.adset_name) || {
        name: item.adset_name,
        spend: 0,
        conversions: 0,
        value: 0,
      }
      adSet.spend += spend
      adSet.conversions += conversions
      adSet.value += value
      stats.adSets.set(item.adset_name, adSet)
    }

    // Aggregate by ad
    if (item.ad_name) {
      const ad = stats.ads.get(item.ad_name) || {
        name: item.ad_name,
        spend: 0,
        conversions: 0,
        value: 0,
      }
      ad.spend += spend
      ad.conversions += conversions
      ad.value += value
      stats.ads.set(item.ad_name, ad)
    }

    // Handle breakdown data - these come as separate fields when breakdowns are used
    if (item.publisher_platform) {
      const placement = stats.placements.get(item.publisher_platform) || {
        name: item.publisher_platform,
        spend: 0,
        impressions: 0,
        conversions: 0,
      }
      placement.spend += spend
      placement.impressions += impressions
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

    // Fetch basic data first
    const [preAdData, postAdData] = await Promise.all([
      fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "ad"),
      fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "ad"),
    ])

    // Fetch breakdown data with error handling
    let prePlacementData = [],
      postPlacementData = []
    let preAgeGenderData = [],
      postAgeGenderData = []
    let preCountryData = [],
      postCountryData = []
    let preDeviceData = [],
      postDeviceData = []
    let preCampaignData = [],
      postCampaignData = []
    let preAdSetData = [],
      postAdSetData = []

    try {
      // Try to fetch placement data
      ;[prePlacementData, postPlacementData] = await Promise.all([
        fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "ad", ["publisher_platform"]),
        fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "ad", ["publisher_platform"]),
      ])
    } catch (error) {
      console.warn("Could not fetch placement data:", error)
    }

    try {
      // Try to fetch age/gender data
      ;[preAgeGenderData, postAgeGenderData] = await Promise.all([
        fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "ad", ["age", "gender"]),
        fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "ad", ["age", "gender"]),
      ])
    } catch (error) {
      console.warn("Could not fetch age/gender data:", error)
    }

    try {
      // Try to fetch country data
      ;[preCountryData, postCountryData] = await Promise.all([
        fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "ad", ["country"]),
        fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "ad", ["country"]),
      ])
    } catch (error) {
      console.warn("Could not fetch country data:", error)
    }

    try {
      // Try to fetch device data
      ;[preDeviceData, postDeviceData] = await Promise.all([
        fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "ad", ["device_platform"]),
        fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "ad", ["device_platform"]),
      ])
    } catch (error) {
      console.warn("Could not fetch device data:", error)
    }

    try {
      // Try to fetch campaign and ad set data
      ;[preCampaignData, postCampaignData, preAdSetData, postAdSetData] = await Promise.all([
        fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "campaign"),
        fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "campaign"),
        fetchComprehensiveInsights(accountId, accessToken, preStartDate, preEndDate, "adset"),
        fetchComprehensiveInsights(accountId, accessToken, postStartDate, postEndDate, "adset"),
      ])
    } catch (error) {
      console.warn("Could not fetch campaign/adset data:", error)
    }

    // Parse all the data
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

    // Add this before the existing report object
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

    // Build comprehensive report
    const report = {
      summaryTotals, // Add this line
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
              postRoas: postAdSet.spend > 0 ? postAdSet.value / postAdSet.spend : 0,
            }
          })
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
        interests: [], // Meta API doesn't provide interest breakdown in standard insights
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
        hourly: [], // Would require time breakdown which needs additional API calls
        daily: [], // Would require time breakdown which needs additional API calls
      },
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error("Error generating comprehensive insights report:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
