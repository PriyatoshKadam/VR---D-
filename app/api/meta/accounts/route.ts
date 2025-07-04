import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 })
    }

    const url = "https://graph.facebook.com/v23.0/me/adaccounts"
    const params = new URLSearchParams({
      access_token: accessToken,
    })

    const response = await fetch(`${url}?${params}`)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Failed to fetch ad accounts: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const accounts =
      data.data?.map((acc: any) => ({
        id: acc.id,
        name: acc.name || acc.id,
      })) || []

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("Error fetching ad accounts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
