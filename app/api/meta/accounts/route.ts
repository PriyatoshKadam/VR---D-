import { type NextRequest, NextResponse } from "next/server"

interface AccountsParams {
  accessToken: string
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken }: AccountsParams = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 })
    }

    // Fetch ad accounts with timeout and error handling
    const response = await fetch(
      `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${accessToken}&limit=100`,
      {
        timeout: 15000, // 15 second timeout
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: { message: errorText } }
      }

      console.error("Meta API error:", errorData)
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to fetch ad accounts" },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Filter for active accounts only
    const activeAccounts = (data.data || [])
      .filter((account: any) => account.account_status === 1) // Only active accounts
      .map((account: any) => ({
        id: account.id,
        name: account.name,
        currency: account.currency,
        timezone: account.timezone_name,
      }))

    console.log(`Found ${activeAccounts.length} active ad accounts`)

    return NextResponse.json({ accounts: activeAccounts })
  } catch (error) {
    console.error("Error fetching ad accounts:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
