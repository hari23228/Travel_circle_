"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, MapPin, Star, Clock, Users, Plane, Camera, Mountain, Sunset, Waves } from "lucide-react"

interface Destination {
  id: string
  name: string
  location: string
  description: string
  estimatedCost: {
    budget: number
    mid: number
    luxury: number
  }
  duration: string
  bestTime: string
  highlights: string[]
  image: string
  category: 'beach' | 'mountain' | 'city' | 'adventure'
  rating: number
  popularCircles: number
}

export default function TravelGoalsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)

  const destinations: Destination[] = [
    {
      id: 'goa',
      name: 'Goa Beach Paradise',
      location: 'Goa, India',
      description: 'Experience the perfect blend of beaches, culture, and nightlife in India\'s beach capital.',
      estimatedCost: {
        budget: 35000,
        mid: 65000,
        luxury: 120000
      },
      duration: '5-7 days',
      bestTime: 'November - March',
      highlights: ['Beautiful beaches', 'Water sports', 'Portuguese heritage', 'Vibrant nightlife', 'Delicious seafood'],
      image: '/goa-beach.jpg',
      category: 'beach',
      rating: 4.8,
      popularCircles: 45
    },
    {
      id: 'manali',
      name: 'Manali Adventure',
      location: 'Himachal Pradesh, India',
      description: 'Discover the snow-capped mountains, adventure sports, and serene landscapes of the Himalayas.',
      estimatedCost: {
        budget: 25000,
        mid: 45000,
        luxury: 85000
      },
      duration: '4-6 days',
      bestTime: 'October - June',
      highlights: ['Snow-capped mountains', 'Adventure sports', 'Rohtang Pass', 'Apple orchards', 'Peaceful valleys'],
      image: '/manali-mountains.jpg',
      category: 'mountain',
      rating: 4.7,
      popularCircles: 32
    },
    {
      id: 'kerala',
      name: 'Kerala Backwaters',
      location: 'Kerala, India',
      description: 'Cruise through serene backwaters, enjoy Ayurvedic treatments, and experience God\'s Own Country.',
      estimatedCost: {
        budget: 30000,
        mid: 55000,
        luxury: 100000
      },
      duration: '6-8 days',
      bestTime: 'October - March',
      highlights: ['Backwater cruises', 'Tea plantations', 'Ayurvedic spas', 'Wildlife sanctuaries', 'Cultural performances'],
      image: '/kerala-backwaters.jpg',
      category: 'beach',
      rating: 4.9,
      popularCircles: 28
    },
    {
      id: 'thailand',
      name: 'Thailand Explorer',
      location: 'Bangkok & Phuket, Thailand',
      description: 'Explore bustling Bangkok and relax on pristine beaches in this perfect Thailand combination.',
      estimatedCost: {
        budget: 80000,
        mid: 140000,
        luxury: 250000
      },
      duration: '7-10 days',
      bestTime: 'November - April',
      highlights: ['Temples and culture', 'Street food', 'Beautiful islands', 'Thai massage', 'Shopping markets'],
      image: '/thailand-temple.jpg',
      category: 'city',
      rating: 4.8,
      popularCircles: 38
    },
    {
      id: 'bali',
      name: 'Bali Serenity',
      location: 'Bali, Indonesia',
      description: 'Experience the perfect balance of culture, adventure, and relaxation in the Island of Gods.',
      estimatedCost: {
        budget: 75000,
        mid: 130000,
        luxury: 220000
      },
      duration: '7-9 days',
      bestTime: 'April - October',
      highlights: ['Ancient temples', 'Rice terraces', 'Volcano hiking', 'Beach clubs', 'Yoga retreats'],
      image: '/bali-temple.jpg',
      category: 'adventure',
      rating: 4.9,
      popularCircles: 41
    },
    {
      id: 'dubai',
      name: 'Dubai Luxury',
      location: 'Dubai, UAE',
      description: 'Experience luxury shopping, world-class dining, and architectural marvels in this desert oasis.',
      estimatedCost: {
        budget: 90000,
        mid: 160000,
        luxury: 300000
      },
      duration: '5-7 days',
      bestTime: 'November - March',
      highlights: ['Burj Khalifa', 'Desert safari', 'Luxury malls', 'Gold souks', 'Beach resorts'],
      image: '/dubai-skyline.jpg',
      category: 'city',
      rating: 4.7,
      popularCircles: 35
    }
  ]

  const categories = [
    { id: 'all', name: 'All Destinations', icon: MapPin },
    { id: 'beach', name: 'Beach', icon: Waves },
    { id: 'mountain', name: 'Mountain', icon: Mountain },
    { id: 'city', name: 'City', icon: Camera },
    { id: 'adventure', name: 'Adventure', icon: Sunset }
  ]

  const filteredDestinations = selectedCategory === 'all' 
    ? destinations 
    : destinations.filter(dest => dest.category === selectedCategory)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Travel Goals</h1>
            <p className="text-sm text-muted-foreground">Discover amazing destinations for your next circle</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            )
          })}
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((destination) => (
            <Card 
              key={destination.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow border-0 cursor-pointer group"
              onClick={() => setSelectedDestination(destination)}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={destination.image || "/placeholder.svg"}
                  alt={destination.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{destination.rating}</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                  {destination.popularCircles} circles
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-1">{destination.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {destination.location}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {destination.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{destination.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>2-6 people</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Starting from</p>
                      <p className="text-xl font-bold text-primary">₹{destination.estimatedCost.budget.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">per person</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-white">
                      <Plane className="w-4 h-4 mr-2" />
                      Create Circle
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Destination Detail Modal */}
        {selectedDestination && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="relative h-80">
                <img
                  src={selectedDestination.image || "/placeholder.svg"}
                  alt={selectedDestination.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedDestination(null)}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition"
                >
                  ✕
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedDestination.name}</h2>
                  <p className="text-white opacity-90 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {selectedDestination.location}
                  </p>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                      {selectedDestination.description}
                    </p>

                    <h3 className="text-xl font-bold text-foreground mb-4">Highlights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {selectedDestination.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm text-foreground">{highlight}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary mb-1">₹{selectedDestination.estimatedCost.budget.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Budget Trip</div>
                      </div>
                      <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="text-2xl font-bold text-primary mb-1">₹{selectedDestination.estimatedCost.mid.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Mid-range</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary mb-1">₹{selectedDestination.estimatedCost.luxury.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Luxury Trip</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Card className="p-6 border-0 bg-primary/5">
                      <h4 className="font-bold text-foreground mb-4">Trip Details</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{selectedDestination.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Best Time</span>
                          <span className="font-medium">{selectedDestination.bestTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rating</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{selectedDestination.rating}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Popular Circles</span>
                          <span className="font-medium">{selectedDestination.popularCircles}</span>
                        </div>
                      </div>
                    </Card>

                    <div className="space-y-3">
                      <Link href={`/create-circle?destination=${selectedDestination.id}`}>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white py-3">
                          <Plane className="w-5 h-5 mr-2" />
                          Create Circle for This Trip
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full">
                        <Users className="w-5 h-5 mr-2" />
                        Join Existing Circle
                      </Button>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">🎉 Popular Choice!</p>
                      <p className="text-xs text-green-600 mt-1">
                        {selectedDestination.popularCircles} circles are already saving for this destination
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}