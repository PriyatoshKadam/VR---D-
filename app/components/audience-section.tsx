"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AudienceData {
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

interface AudienceSectionProps {
  data: AudienceData
}

export function AudienceSection({ data }: AudienceSectionProps) {
  const calculateChange = (pre: number, post: number) => {
    if (pre === 0) return post > 0 ? 100 : 0
    return ((post - pre) / pre) * 100
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Audience Analysis</h3>
        <p className="text-muted-foreground">Performance breakdown by demographics and interests</p>
      </div>

      <Tabs defaultValue="demographics" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="demographics">Age & Gender ({data.ageGender.length})</TabsTrigger>
          <TabsTrigger value="interests">Interests ({data.interests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Age & Gender Performance</CardTitle>
              <CardDescription>Conversion performance by demographic segments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Age Range</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Pre Spend</TableHead>
                    <TableHead>Post Spend</TableHead>
                    <TableHead>Pre Conv.</TableHead>
                    <TableHead>Post Conv.</TableHead>
                    <TableHead>Conv. Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ageGender.map((segment, index) => {
                    const convChange = calculateChange(segment.preConversions, segment.postConversions)

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{segment.age}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{segment.gender}</Badge>
                        </TableCell>
                        <TableCell>${segment.preSpend.toFixed(2)}</TableCell>
                        <TableCell>${segment.postSpend.toFixed(2)}</TableCell>
                        <TableCell>{segment.preConversions}</TableCell>
                        <TableCell>{segment.postConversions}</TableCell>
                        <TableCell>
                          <Badge variant={convChange > 0 ? "default" : convChange < 0 ? "destructive" : "secondary"}>
                            {convChange > 0 ? "+" : ""}
                            {convChange.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Interest-Based Performance</CardTitle>
              <CardDescription>Performance by audience interests and behaviors</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interest/Behavior</TableHead>
                    <TableHead>Pre Spend</TableHead>
                    <TableHead>Post Spend</TableHead>
                    <TableHead>Pre Conv.</TableHead>
                    <TableHead>Post Conv.</TableHead>
                    <TableHead>Conv. Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.interests.map((interest, index) => {
                    const convChange = calculateChange(interest.preConversions, interest.postConversions)

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-[250px] truncate" title={interest.name}>
                          {interest.name}
                        </TableCell>
                        <TableCell>${interest.preSpend.toFixed(2)}</TableCell>
                        <TableCell>${interest.postSpend.toFixed(2)}</TableCell>
                        <TableCell>{interest.preConversions}</TableCell>
                        <TableCell>{interest.postConversions}</TableCell>
                        <TableCell>
                          <Badge variant={convChange > 0 ? "default" : convChange < 0 ? "destructive" : "secondary"}>
                            {convChange > 0 ? "+" : ""}
                            {convChange.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
