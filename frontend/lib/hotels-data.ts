import type { Hotel } from "./tourist-destinations"

export const HOTELS_BY_DESTINATION: Record<string, Hotel[]> = {
  kochi: [
    {
      id: "kochi-1",
      name: "Grand Hyatt Kochi Bolgatty",
      location: "Bolgatty Island",
      distanceFromCenter: "5 km",
      rating: 4.7,
      reviews: 1250,
      price: 8500,
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym"],
      image: "/hotels/kochi-1.jpg",
      type: "luxury"
    },
    {
      id: "kochi-2",
      name: "Taj Malabar Resort & Spa",
      location: "Willingdon Island",
      distanceFromCenter: "3 km",
      rating: 4.8,
      reviews: 2100,
      price: 12000,
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Beach Access"],
      image: "/hotels/kochi-2.jpg",
      type: "luxury"
    },
    {
      id: "kochi-3",
      name: "The Gateway Hotel Marine Drive",
      location: "Marine Drive",
      distanceFromCenter: "2 km",
      rating: 4.5,
      reviews: 890,
      price: 6500,
      amenities: ["Free WiFi", "Pool", "Restaurant", "Bar"],
      image: "/hotels/kochi-3.jpg",
      type: "mid-range"
    },
    {
      id: "kochi-4",
      name: "Crowne Plaza Kochi",
      location: "Kundannoor",
      distanceFromCenter: "8 km",
      rating: 4.6,
      reviews: 1450,
      price: 7800,
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym"],
      image: "/hotels/kochi-4.jpg",
      type: "luxury"
    },
    {
      id: "kochi-5",
      name: "Hotel Excellency",
      location: "MG Road",
      distanceFromCenter: "1 km",
      rating: 4.2,
      reviews: 650,
      price: 3500,
      amenities: ["Free WiFi", "Restaurant", "Room Service"],
      image: "/hotels/kochi-5.jpg",
      type: "mid-range"
    },
    {
      id: "kochi-6",
      name: "Le Meridien Kochi",
      location: "Maradu",
      distanceFromCenter: "12 km",
      rating: 4.7,
      reviews: 1820,
      price: 9500,
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym", "Lake View"],
      image: "/hotels/kochi-6.jpg",
      type: "luxury"
    },
    {
      id: "kochi-7",
      name: "Keys Select Hotel Kochi",
      location: "Kadavanthra",
      distanceFromCenter: "4 km",
      rating: 4.3,
      reviews: 720,
      price: 4200,
      amenities: ["Free WiFi", "Restaurant", "Gym"],
      image: "/hotels/kochi-7.jpg",
      type: "mid-range"
    },
    {
      id: "kochi-8",
      name: "Fort House Hotel",
      location: "Fort Kochi",
      distanceFromCenter: "10 km",
      rating: 4.4,
      reviews: 580,
      price: 5500,
      amenities: ["Free WiFi", "Restaurant", "Heritage Property"],
      image: "/hotels/kochi-8.jpg",
      type: "mid-range"
    },
    {
      id: "kochi-9",
      name: "Hotel Abad Plaza",
      location: "MG Road",
      distanceFromCenter: "1.5 km",
      rating: 4.1,
      reviews: 890,
      price: 3200,
      amenities: ["Free WiFi", "Restaurant", "Bar"],
      image: "/hotels/kochi-9.jpg",
      type: "budget"
    },
    {
      id: "kochi-10",
      name: "Trident Cochin",
      location: "Bristow Road",
      distanceFromCenter: "6 km",
      rating: 4.6,
      reviews: 1340,
      price: 8200,
      amenities: ["Free WiFi", "Pool", "Restaurant", "Spa", "Gym"],
      image: "/hotels/kochi-10.jpg",
      type: "luxury"
    },
    {
      id: "kochi-11",
      name: "Ginger Hotel Kochi",
      location: "Kaloor",
      distanceFromCenter: "3 km",
      rating: 4.0,
      reviews: 450,
      price: 2800,
      amenities: ["Free WiFi", "Restaurant", "Parking"],
      image: "/hotels/kochi-11.jpg",
      type: "budget"
    },
    {
      id: "kochi-12",
      name: "Fragrant Nature Backwater Resort",
      location: "Vypeen",
      distanceFromCenter: "15 km",
      rating: 4.5,
      reviews: 920,
      price: 7500,
      amenities: ["Free WiFi", "Pool", "Restaurant", "Backwater View", "Spa"],
      image: "/hotels/kochi-12.jpg",
      type: "luxury"
    }
  ],
  jaipur: [
    {
      id: "jaipur-1",
      name: "Rambagh Palace",
      location: "Bhawani Singh Road",
      distanceFromCenter: "5 km",
      rating: 4.9,
      reviews: 2500,
      price: 25000,
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Heritage Palace"],
      image: "/hotels/jaipur-1.jpg",
      type: "luxury"
    },
    {
      id: "jaipur-2",
      name: "Taj Jai Mahal Palace",
      location: "Jacob Road",
      distanceFromCenter: "4 km",
      rating: 4.7,
      reviews: 1850,
      price: 15000,
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Garden"],
      image: "/hotels/jaipur-2.jpg",
      type: "luxury"
    },
    {
      id: "jaipur-3",
      name: "ITC Rajputana",
      location: "Palace Road",
      distanceFromCenter: "2 km",
      rating: 4.6,
      reviews: 1650,
      price: 12000,
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym"],
      image: "/hotels/jaipur-3.jpg",
      type: "luxury"
    },
    {
      id: "jaipur-4",
      name: "Hilton Jaipur",
      location: "Malviya Nagar",
      distanceFromCenter: "8 km",
      rating: 4.5,
      reviews: 1420,
      price: 9500,
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym"],
      image: "/hotels/jaipur-4.jpg",
      type: "luxury"
    },
    {
      id: "jaipur-5",
      name: "Clarks Amer",
      location: "Jawahar Lal Nehru Marg",
      distanceFromCenter: "3 km",
      rating: 4.3,
      reviews: 980,
      price: 6500,
      amenities: ["Free WiFi", "Pool", "Restaurant", "Bar"],
      image: "/hotels/jaipur-5.jpg",
      type: "mid-range"
    },
    {
      id: "jaipur-6",
      name: "Park Prime",
      location: "MI Road",
      distanceFromCenter: "1 km",
      rating: 4.2,
      reviews: 750,
      price: 4500,
      amenities: ["Free WiFi", "Restaurant", "Rooftop"],
      image: "/hotels/jaipur-6.jpg",
      type: "mid-range"
    },
    {
      id: "jaipur-7",
      name: "Hotel Royal Orchid",
      location: "Tonk Road",
      distanceFromCenter: "6 km",
      rating: 4.4,
      reviews: 1120,
      price: 5800,
      amenities: ["Free WiFi", "Pool", "Restaurant", "Gym"],
      image: "/hotels/jaipur-7.jpg",
      type: "mid-range"
    },
    {
      id: "jaipur-8",
      name: "Umaid Mahal",
      location: "Bani Park",
      distanceFromCenter: "2 km",
      rating: 4.1,
      reviews: 620,
      price: 3800,
      amenities: ["Free WiFi", "Restaurant", "Heritage Property"],
      image: "/hotels/jaipur-8.jpg",
      type: "budget"
    },
    {
      id: "jaipur-9",
      name: "The Oberoi Rajvilas",
      location: "Goner Road",
      distanceFromCenter: "12 km",
      rating: 4.9,
      reviews: 2200,
      price: 30000,
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Luxury Villas"],
      image: "/hotels/jaipur-9.jpg",
      type: "luxury"
    },
    {
      id: "jaipur-10",
      name: "Lemon Tree Premier",
      location: "MI Road",
      distanceFromCenter: "1.5 km",
      rating: 4.3,
      reviews: 890,
      price: 5200,
      amenities: ["Free WiFi", "Pool", "Restaurant", "Gym"],
      image: "/hotels/jaipur-10.jpg",
      type: "mid-range"
    },
    {
      id: "jaipur-11",
      name: "Zostel Jaipur",
      location: "MI Road",
      distanceFromCenter: "1 km",
      rating: 4.0,
      reviews: 450,
      price: 2500,
      amenities: ["Free WiFi", "Cafe", "Common Area"],
      image: "/hotels/jaipur-11.jpg",
      type: "budget"
    },
    {
      id: "jaipur-12",
      name: "Samode Haveli",
      location: "Gangapole",
      distanceFromCenter: "3 km",
      rating: 4.6,
      reviews: 1150,
      price: 11000,
      amenities: ["Free WiFi", "Pool", "Restaurant", "Heritage Haveli", "Spa"],
      image: "/hotels/jaipur-12.jpg",
      type: "luxury"
    }
  ],
  goa: [
    {
      id: "goa-1",
      name: "Taj Exotica Resort & Spa",
      location: "Benaulim Beach",
      distanceFromCenter: "10 km",
      rating: 4.8,
      reviews: 2300,
      price: 18000,
      amenities: ["Free WiFi", "Pool", "Spa", "Beach Access", "Restaurant"],
      image: "/hotels/goa-1.jpg",
      type: "luxury"
    },
    {
      id: "goa-2",
      name: "The Leela Goa",
      location: "Cavelossim Beach",
      distanceFromCenter: "12 km",
      rating: 4.7,
      reviews: 1950,
      price: 16000,
      amenities: ["Free WiFi", "Pool", "Spa", "Beach Access", "Golf Course"],
      image: "/hotels/goa-2.jpg",
      type: "luxury"
    },
    {
      id: "goa-3",
      name: "Park Hyatt Goa Resort",
      location: "Arossim Beach",
      distanceFromCenter: "8 km",
      rating: 4.6,
      reviews: 1720,
      price: 14000,
      amenities: ["Free WiFi", "Pool", "Spa", "Beach Access", "Restaurant"],
      image: "/hotels/goa-3.jpg",
      type: "luxury"
    },
    {
      id: "goa-4",
      name: "Alila Diwa Goa",
      location: "Majorda Beach",
      distanceFromCenter: "9 km",
      rating: 4.7,
      reviews: 1580,
      price: 13500,
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym"],
      image: "/hotels/goa-4.jpg",
      type: "luxury"
    },
    {
      id: "goa-5",
      name: "Novotel Goa Candolim",
      location: "Candolim Beach",
      distanceFromCenter: "15 km",
      rating: 4.4,
      reviews: 1240,
      price: 8500,
      amenities: ["Free WiFi", "Pool", "Beach Access", "Restaurant", "Gym"],
      image: "/hotels/goa-5.jpg",
      type: "mid-range"
    },
    {
      id: "goa-6",
      name: "Cidade de Goa",
      location: "Vainguinim Beach",
      distanceFromCenter: "5 km",
      rating: 4.3,
      reviews: 980,
      price: 7200,
      amenities: ["Free WiFi", "Pool", "Beach Access", "Restaurant"],
      image: "/hotels/goa-6.jpg",
      type: "mid-range"
    },
    {
      id: "goa-7",
      name: "Fortune Resort Benaulim",
      location: "Benaulim",
      distanceFromCenter: "10 km",
      rating: 4.2,
      reviews: 850,
      price: 6500,
      amenities: ["Free WiFi", "Pool", "Restaurant", "Beach Access"],
      image: "/hotels/goa-7.jpg",
      type: "mid-range"
    },
    {
      id: "goa-8",
      name: "Lemon Tree Amarante Beach Resort",
      location: "Candolim",
      distanceFromCenter: "14 km",
      rating: 4.3,
      reviews: 1120,
      price: 7800,
      amenities: ["Free WiFi", "Pool", "Beach Access", "Restaurant", "Spa"],
      image: "/hotels/goa-8.jpg",
      type: "mid-range"
    },
    {
      id: "goa-9",
      name: "Treehouse Blue",
      location: "Anjuna",
      distanceFromCenter: "18 km",
      rating: 4.5,
      reviews: 680,
      price: 9500,
      amenities: ["Free WiFi", "Pool", "Treehouse Rooms", "Restaurant"],
      image: "/hotels/goa-9.jpg",
      type: "mid-range"
    },
    {
      id: "goa-10",
      name: "Zostel Goa",
      location: "Anjuna",
      distanceFromCenter: "18 km",
      rating: 4.1,
      reviews: 520,
      price: 2800,
      amenities: ["Free WiFi", "Cafe", "Beach Access", "Common Area"],
      image: "/hotels/goa-10.jpg",
      type: "budget"
    },
    {
      id: "goa-11",
      name: "Sea Shell Beach Suites",
      location: "Colva Beach",
      distanceFromCenter: "8 km",
      rating: 4.0,
      reviews: 450,
      price: 4500,
      amenities: ["Free WiFi", "Beach Access", "Restaurant"],
      image: "/hotels/goa-11.jpg",
      type: "budget"
    },
    {
      id: "goa-12",
      name: "ITC Grand Goa Resort",
      location: "Arossim Beach",
      distanceFromCenter: "8 km",
      rating: 4.8,
      reviews: 2100,
      price: 17500,
      amenities: ["Free WiFi", "Pool", "Spa", "Beach Access", "Multiple Restaurants"],
      image: "/hotels/goa-12.jpg",
      type: "luxury"
    }
  ]
}

// Generate hotels for remaining destinations with similar patterns
const generateHotelsForDestination = (destinationId: string, cityName: string): Hotel[] => {
  const hotelTypes = ["Heritage", "Grand", "Royal", "Crown Plaza", "Taj", "Oberoi", "Lemon Tree", "Keys Select", "Ginger", "Zostel", "Treebo", "The Gateway"]
  const amenitiesPool = [
    ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym"],
    ["Free WiFi", "Restaurant", "Bar", "Room Service"],
    ["Free WiFi", "Pool", "Restaurant", "Parking"],
    ["Free WiFi", "Spa", "Restaurant", "Gym", "Bar"],
    ["Free WiFi", "Restaurant", "Rooftop", "Parking"]
  ]
  
  return Array.from({ length: 12 }, (_, i) => ({
    id: `${destinationId}-${i + 1}`,
    name: `${hotelTypes[i % hotelTypes.length]} ${cityName}`,
    location: `${cityName} City Center`,
    distanceFromCenter: `${Math.floor(Math.random() * 15) + 1} km`,
    rating: 4.0 + Math.random() * 0.9,
    reviews: Math.floor(Math.random() * 2000) + 300,
    price: i < 4 ? 10000 + Math.random() * 10000 : i < 8 ? 4000 + Math.random() * 4000 : 2000 + Math.random() * 2000,
    amenities: amenitiesPool[i % amenitiesPool.length],
    image: `/hotels/${destinationId}-${i + 1}.jpg`,
    type: i < 4 ? "luxury" : i < 8 ? "mid-range" : "budget"
  }))
}

HOTELS_BY_DESTINATION.varanasi = generateHotelsForDestination("varanasi", "Varanasi")
HOTELS_BY_DESTINATION.mumbai = generateHotelsForDestination("mumbai", "Mumbai")
HOTELS_BY_DESTINATION.udaipur = generateHotelsForDestination("udaipur", "Udaipur")
HOTELS_BY_DESTINATION.manali = generateHotelsForDestination("manali", "Manali")
HOTELS_BY_DESTINATION.rishikesh = generateHotelsForDestination("rishikesh", "Rishikesh")
HOTELS_BY_DESTINATION.agra = generateHotelsForDestination("agra", "Agra")
HOTELS_BY_DESTINATION.mysore = generateHotelsForDestination("mysore", "Mysore")
