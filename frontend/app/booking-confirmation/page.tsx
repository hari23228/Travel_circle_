"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Train, Bus, Plane, Calendar, MapPin, Clock, IndianRupee, Download, ArrowLeft, Hotel as HotelIcon, Users, Star, Wifi, Coffee, Dumbbell, Sparkles } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { TransportOption, Destination, Hotel } from "@/lib/tourist-destinations"

interface TransportBookingData {
  transport: TransportOption
  destination: Destination
  from: string
  travelDate: string
  bookedAt: string
}

interface HotelBookingData {
  hotel: Hotel
  destination: Destination
  checkIn: string
  checkOut: string
  guests: number
  nights: number
  bookedAt: string
}

type BookingType = 'transport' | 'hotel'

export default function BookingConfirmationPage() {
  const router = useRouter()
  const [bookingType, setBookingType] = useState<BookingType | null>(null)
  const [transportBooking, setTransportBooking] = useState<TransportBookingData | null>(null)
  const [hotelBooking, setHotelBooking] = useState<HotelBookingData | null>(null)
  const [bookingId] = useState(() => `TRP${Date.now().toString().slice(-8)}`)

  useEffect(() => {
    const transportData = sessionStorage.getItem("bookingData")
    const hotelData = sessionStorage.getItem("hotelBookingData")
    
    if (hotelData) {
      setHotelBooking(JSON.parse(hotelData))
      setBookingType('hotel')
    } else if (transportData) {
      setTransportBooking(JSON.parse(transportData))
      setBookingType('transport')
    } else {
      router.push("/book-transport")
    }
  }, [router])

  if (!bookingType) {
    return null
  }

  const getAmenityIcon = (amenity: string) => {
    if (amenity.toLowerCase().includes("wifi")) return <Wifi className="w-4 h-4" />
    if (amenity.toLowerCase().includes("gym")) return <Dumbbell className="w-4 h-4" />
    if (amenity.toLowerCase().includes("restaurant") || amenity.toLowerCase().includes("cafe")) return <Coffee className="w-4 h-4" />
    if (amenity.toLowerCase().includes("spa")) return <Sparkles className="w-4 h-4" />
    return <Star className="w-4 h-4" />
  }

  const getTransportIcon = (type: string) => {
    switch (type) {
      case "train":
        return <Train className="w-6 h-6" />
      case "bus":
        return <Bus className="w-6 h-6" />
      case "flight":
        return <Plane className="w-6 h-6" />
    }
  }

  const handleDownloadTicket = () => {
    // In production, this would generate a PDF ticket
    alert(`${bookingType === 'hotel' ? 'Hotel voucher' : 'Ticket'} download functionality will be implemented with PDF generation`)
  }

  // Render Hotel Booking Confirmation
  if (bookingType === 'hotel' && hotelBooking) {
    const totalAmount = hotelBooking.hotel.price * hotelBooking.nights
    const taxesAndFees = Math.round(totalAmount * 0.18) // 18% GST

    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Hotel Booking Confirmed!</h1>
            <p className="text-lg text-muted-foreground">
              Your reservation at {hotelBooking.hotel.name} has been successfully confirmed
            </p>
            <div className="mt-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Booking ID: {bookingId}
              </Badge>
            </div>
          </div>

          {/* Booking Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HotelIcon className="w-6 h-6" />
                Hotel Booking Details
              </CardTitle>
              <CardDescription>
                Please save this information for your stay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hotel Information */}
              <div>
                <h3 className="font-semibold mb-3">Hotel Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Hotel Name</div>
                    <div className="font-medium text-lg">{hotelBooking.hotel.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {hotelBooking.hotel.location}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Hotel Type</div>
                    <Badge variant={hotelBooking.hotel.type === "luxury" ? "default" : "secondary"} className="capitalize">
                      {hotelBooking.hotel.type}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Rating</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-primary text-white px-2 py-1 rounded">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold">{hotelBooking.hotel.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({hotelBooking.hotel.reviews.toLocaleString()} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {hotelBooking.hotel.amenities.map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="flex items-center gap-1">
                        {getAmenityIcon(amenity)}
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Stay Details */}
              <div>
                <h3 className="font-semibold mb-3">Stay Details</h3>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Check-in</div>
                    <div className="text-2xl font-bold">
                      {format(new Date(hotelBooking.checkIn), "dd MMM")}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(hotelBooking.checkIn), "yyyy")}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <HotelIcon className="w-8 h-8 text-primary mb-1" />
                    <div className="text-sm font-medium">{hotelBooking.nights} {hotelBooking.nights === 1 ? 'Night' : 'Nights'}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Check-out</div>
                    <div className="text-2xl font-bold">
                      {format(new Date(hotelBooking.checkOut), "dd MMM")}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(hotelBooking.checkOut), "yyyy")}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Number of Guests
                    </div>
                    <div className="font-medium">
                      {hotelBooking.guests} {hotelBooking.guests === 1 ? 'Guest' : 'Guests'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Destination
                    </div>
                    <div className="font-medium">
                      {hotelBooking.destination.name}, {hotelBooking.destination.state}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Details */}
              <div>
                <h3 className="font-semibold mb-3">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Room Rate (₹{hotelBooking.hotel.price.toLocaleString()} × {hotelBooking.nights} {hotelBooking.nights === 1 ? 'night' : 'nights'})
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes & Service Charges (18% GST)</span>
                    <span className="font-medium flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {taxesAndFees.toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount Paid</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <IndianRupee className="w-5 h-5" />
                      {(totalAmount + taxesAndFees).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Booking Timestamp */}
              <div className="text-sm text-muted-foreground">
                Booked on: {format(new Date(hotelBooking.bookedAt), "PPpp")}
              </div>
            </CardContent>
          </Card>

          {/* Destination Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About {hotelBooking.destination.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{hotelBooking.destination.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotelBooking.destination.trainStations.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Train className="w-4 h-4" />
                      Railway Stations
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {hotelBooking.destination.trainStations.map((station, idx) => (
                        <li key={idx}>• {station}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {hotelBooking.destination.busStands.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Bus className="w-4 h-4" />
                      Bus Stands
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {hotelBooking.destination.busStands.map((stand, idx) => (
                        <li key={idx}>• {stand}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleDownloadTicket} size="lg" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download Hotel Voucher
            </Button>
            <Link href="/book-hotel" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Book Another Hotel
              </Button>
            </Link>
          </div>

          {/* Important Notes */}
          <Card className="mt-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Important Notes:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Check-in time: After 2:00 PM</li>
                <li>• Check-out time: Before 11:00 AM</li>
                <li>• Carry a valid government-issued ID proof and this confirmation</li>
                <li>• Contact hotel directly for any special requests or early check-in</li>
                <li>• Cancellation policy: Free cancellation up to 24 hours before check-in</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render Transport Booking Confirmation
  if (bookingType === 'transport' && transportBooking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-lg text-muted-foreground">
              Your {transportBooking.transport.type} booking has been successfully confirmed
            </p>
            <div className="mt-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Booking ID: {bookingId}
              </Badge>
            </div>
          </div>

          {/* Booking Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getTransportIcon(transportBooking.transport.type)}
                Booking Details
              </CardTitle>
              <CardDescription>
                Please save this information for your travel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transport Information */}
              <div>
                <h3 className="font-semibold mb-3">Transport Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Transport Type</div>
                    <div className="font-medium capitalize">{transportBooking.transport.type}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Service Name</div>
                    <div className="font-medium">{transportBooking.transport.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Operator</div>
                    <div className="font-medium">{transportBooking.transport.operator}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {transportBooking.transport.duration}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Journey Details */}
              <div>
                <h3 className="font-semibold mb-3">Journey Details</h3>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Departure</div>
                    <div className="text-2xl font-bold">{transportBooking.transport.departureTime}</div>
                    <div className="text-sm text-muted-foreground mt-1 capitalize">{transportBooking.from}</div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="w-full border-t-2 border-dashed border-primary relative">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                        {getTransportIcon(transportBooking.transport.type)}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Arrival</div>
                    <div className="text-2xl font-bold">{transportBooking.transport.arrivalTime}</div>
                    <div className="text-sm text-muted-foreground mt-1">{transportBooking.destination.name}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Travel Date
                    </div>
                    <div className="font-medium">
                      {format(new Date(transportBooking.travelDate), "PPPP")}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Destination
                    </div>
                    <div className="font-medium">
                      {transportBooking.destination.name}, {transportBooking.destination.state}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Details */}
              <div>
                <h3 className="font-semibold mb-3">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Fare</span>
                    <span className="font-medium flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {transportBooking.transport.price}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes & Fees</span>
                    <span className="font-medium flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {Math.round(transportBooking.transport.price * 0.05)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount Paid</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <IndianRupee className="w-5 h-5" />
                      {Math.round(transportBooking.transport.price * 1.05)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Booking Timestamp */}
              <div className="text-sm text-muted-foreground">
                Booked on: {format(new Date(transportBooking.bookedAt), "PPpp")}
              </div>
            </CardContent>
          </Card>

          {/* Destination Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About {transportBooking.destination.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{transportBooking.destination.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transportBooking.destination.trainStations.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Train className="w-4 h-4" />
                      Railway Stations
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {transportBooking.destination.trainStations.map((station, idx) => (
                        <li key={idx}>• {station}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {transportBooking.destination.busStands.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Bus className="w-4 h-4" />
                      Bus Stands
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {transportBooking.destination.busStands.map((stand, idx) => (
                        <li key={idx}>• {stand}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleDownloadTicket} size="lg" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download Ticket
            </Button>
            <Link href="/book-transport" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Book Another Trip
              </Button>
            </Link>
          </div>

          {/* Important Notes */}
          <Card className="mt-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Important Notes:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Please arrive at the {transportBooking.transport.type === "flight" ? "airport" : "station"} at least {transportBooking.transport.type === "flight" ? "2 hours" : "30 minutes"} before departure</li>
                <li>• Carry a valid government-issued ID proof</li>
                <li>• Download or take a screenshot of this confirmation</li>
                <li>• Check {transportBooking.transport.operator} website for any schedule changes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
