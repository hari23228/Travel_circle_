"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CalendarIcon, Hotel as HotelIcon, MapPin, Star, IndianRupee, Users, Wifi, Coffee, Dumbbell, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { TOURIST_DESTINATIONS } from "@/lib/tourist-destinations"
import { HOTELS_BY_DESTINATION } from "@/lib/hotels-data"
import type { Hotel } from "@/lib/tourist-destinations"
import { cn } from "@/lib/utils"

export default function BookHotelPage() {
  const [destination, setDestination] = useState<string>("")
  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [guests, setGuests] = useState<string>("2")
  const [searchResults, setSearchResults] = useState<Hotel[]>([])
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null)

  const handleSearch = () => {
    if (!destination || !checkIn || !checkOut) {
      alert("Please fill in all fields")
      return
    }
    
    const hotels = HOTELS_BY_DESTINATION[destination] || []
    setSearchResults(hotels)
  }

  const handleBooking = (hotel: Hotel) => {
    const destinationData = TOURIST_DESTINATIONS.find(d => d.id === destination)
    
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates")
      return
    }

    // Calculate number of nights
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    const bookingData = {
      hotel,
      destination: destinationData,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      guests: parseInt(guests),
      nights,
      bookedAt: new Date().toISOString(),
    }
    
    sessionStorage.setItem("hotelBookingData", JSON.stringify(bookingData))
    window.location.href = "/booking-confirmation"
  }

  const getAmenityIcon = (amenity: string) => {
    if (amenity.toLowerCase().includes("wifi")) return <Wifi className="w-4 h-4" />
    if (amenity.toLowerCase().includes("gym")) return <Dumbbell className="w-4 h-4" />
    if (amenity.toLowerCase().includes("restaurant") || amenity.toLowerCase().includes("cafe")) return <Coffee className="w-4 h-4" />
    if (amenity.toLowerCase().includes("spa")) return <Sparkles className="w-4 h-4" />
    return <Star className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Book Your Hotel</h1>
          <p className="text-muted-foreground">
            Find and book the perfect accommodation at India's top tourist destinations
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Hotels</CardTitle>
            <CardDescription>Enter your stay details to find available hotels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Destination */}
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium">Destination</label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
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

              {/* Check-in Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-in</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !checkIn && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkIn ? format(checkIn, "PP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={setCheckIn}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Check-out Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-out</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !checkOut && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkOut ? format(checkOut, "PP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      disabled={(date) => date < (checkIn || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Guests */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Guests</label>
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "Guest" : "Guests"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSearch} className="w-full mt-6" size="lg">
              Search Hotels
            </Button>
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
                    {searchResults.length} Hotels
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Available Hotels ({searchResults.length})</h2>
            {searchResults.map((hotel) => (
              <Card key={hotel.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Hotel Image */}
                    <div className="md:w-64 h-48 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <HotelIcon className="w-16 h-16 text-primary/40" />
                      </div>
                    </div>

                    {/* Hotel Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{hotel.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>{hotel.location} • {hotel.distanceFromCenter} from center</span>
                          </div>
                        </div>
                        <Badge variant={hotel.type === "luxury" ? "default" : hotel.type === "mid-range" ? "secondary" : "outline"}>
                          {hotel.type}
                        </Badge>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 bg-primary text-white px-2 py-1 rounded">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-bold">{hotel.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({hotel.reviews.toLocaleString()} reviews)
                        </span>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hotel.amenities.slice(0, 5).map((amenity, idx) => (
                          <Badge key={idx} variant="outline" className="flex items-center gap-1">
                            {getAmenityIcon(amenity)}
                            {amenity}
                          </Badge>
                        ))}
                      </div>

                      {/* Price & Booking */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <div className="text-sm text-muted-foreground">Price per night</div>
                          <div className="flex items-center gap-1 text-2xl font-bold">
                            <IndianRupee className="w-5 h-5" />
                            {Math.round(hotel.price).toLocaleString()}
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleBooking(hotel)}
                          size="lg"
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && destination && checkIn && checkOut && (
          <Card>
            <CardContent className="p-12 text-center">
              <HotelIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground">
                Click "Search Hotels" to find available accommodations
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
