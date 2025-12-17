"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Train, Bus, Plane, Clock, IndianRupee, Users, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { TOURIST_DESTINATIONS, getTransportOptions, type TransportOption } from "@/lib/tourist-destinations"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function BookTransportPage() {
  const router = useRouter()
  const [from, setFrom] = useState<string>("")
  const [destination, setDestination] = useState<string>("")
  const [travelDate, setTravelDate] = useState<Date>()
  const [transportType, setTransportType] = useState<"train" | "bus" | "flight">("train")
  const [searchResults, setSearchResults] = useState<TransportOption[]>([])
  const [selectedTransport, setSelectedTransport] = useState<TransportOption | null>(null)

  const handleSearch = () => {
    if (!from || !destination || !travelDate) {
      alert("Please fill in all fields")
      return
    }
    
    const results = getTransportOptions(from, destination, transportType, travelDate)
    setSearchResults(results)
  }

  const handleBooking = (transport: TransportOption) => {
    const destinationData = TOURIST_DESTINATIONS.find(d => d.id === destination)
    
    // Store booking data in sessionStorage
    sessionStorage.setItem("bookingData", JSON.stringify({
      transport,
      destination: destinationData,
      from,
      travelDate: travelDate?.toISOString(),
      bookedAt: new Date().toISOString()
    }))
    
    // Navigate to confirmation page
    router.push("/booking-confirmation")
  }

  const getTransportIcon = (type: string) => {
    switch (type) {
      case "train":
        return <Train className="w-5 h-5" />
      case "bus":
        return <Bus className="w-5 h-5" />
      case "flight":
        return <Plane className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Book Your Journey</h1>
          <p className="text-muted-foreground">
            Search and book trains, buses, or flights to top Indian tourist destinations
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Transportation</CardTitle>
            <CardDescription>Enter your travel details to find available options</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={transportType} onValueChange={(v) => setTransportType(v as any)}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="train" className="flex items-center gap-2">
                  <Train className="w-4 h-4" />
                  Train
                </TabsTrigger>
                <TabsTrigger value="bus" className="flex items-center gap-2">
                  <Bus className="w-4 h-4" />
                  Bus
                </TabsTrigger>
                <TabsTrigger value="flight" className="flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Flight
                </TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* From City */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">From</label>
                  <Select value={from} onValueChange={setFrom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURIST_DESTINATIONS.map((dest) => (
                        <SelectItem key={dest.id} value={dest.id}>
                          {dest.name}, {dest.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* To Destination */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">To (Destination)</label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURIST_DESTINATIONS.map((dest) => (
                        <SelectItem key={dest.id} value={dest.id} disabled={dest.id === from}>
                          {dest.name}, {dest.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Travel Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Travel Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !travelDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {travelDate ? format(travelDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={travelDate}
                        onSelect={setTravelDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Search Button */}
                <div className="space-y-2">
                  <label className="text-sm font-medium opacity-0">Search</label>
                  <Button onClick={handleSearch} className="w-full" size="lg">
                    Search {transportType === "train" ? "Trains" : transportType === "bus" ? "Buses" : "Flights"}
                  </Button>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Destination Info */}
        {destination && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              {TOURIST_DESTINATIONS.filter(d => d.id === destination).map((dest) => (
                <div key={dest.id} className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{dest.name}</h3>
                    <p className="text-muted-foreground mb-2">{dest.state}</p>
                    <p className="text-sm">{dest.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {dest.state}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              Available {transportType === "train" ? "Trains" : transportType === "bus" ? "Buses" : "Flights"}
            </h2>
            {searchResults.map((transport) => (
              <Card key={transport.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Transport Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        {getTransportIcon(transport.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{transport.name}</h3>
                          <Badge variant="outline">{transport.operator}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{transport.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{transport.availableSeats} seats</span>
                          </div>
                        </div>

                        {/* Time Info */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{transport.departureTime}</div>
                            <div className="text-xs text-muted-foreground">Departure</div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                          <div className="text-center">
                            <div className="text-2xl font-bold">{transport.arrivalTime}</div>
                            <div className="text-xs text-muted-foreground">Arrival</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price & Booking */}
                    <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-3xl font-bold">
                          <IndianRupee className="w-6 h-6" />
                          {transport.price}
                        </div>
                        <div className="text-xs text-muted-foreground">per person</div>
                      </div>
                      <Button 
                        onClick={() => handleBooking(transport)}
                        size="lg"
                        className="w-full md:w-auto"
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && from && destination && travelDate && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                Click "Search" to find available {transportType}s
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
