export interface Hotel {
  id: string
  name: string
  location: string
  distanceFromCenter: string
  rating: number
  reviews: number
  price: number
  amenities: string[]
  image: string
  type: "budget" | "mid-range" | "luxury"
}

export interface Destination {
  id: string
  name: string
  state: string
  description: string
  airportCode?: string
  trainStations: string[]
  busStands: string[]
  image: string
  hotels?: Hotel[]
}

export const TOURIST_DESTINATIONS: Destination[] = [
  {
    id: "kochi",
    name: "Kochi",
    state: "Kerala",
    description: "Queen of the Arabian Sea - A vibrant port city with colonial history",
    airportCode: "COK",
    trainStations: ["Ernakulam Junction", "Ernakulam Town"],
    busStands: ["Ernakulam KSRTC Bus Stand", "Kaloor Bus Stand"],
    image: "/destinations/kochi.jpg"
  },
  {
    id: "jaipur",
    name: "Jaipur",
    state: "Rajasthan",
    description: "The Pink City - Famous for magnificent forts and palaces",
    airportCode: "JAI",
    trainStations: ["Jaipur Junction"],
    busStands: ["Sindhi Camp Bus Stand"],
    image: "/destinations/jaipur.jpg"
  },
  {
    id: "goa",
    name: "Goa",
    state: "Goa",
    description: "Beach Paradise - Sun, sand, and Portuguese heritage",
    airportCode: "GOI",
    trainStations: ["Madgaon Junction", "Vasco da Gama"],
    busStands: ["Panaji Bus Stand", "Mapusa Bus Stand"],
    image: "/destinations/goa.jpg"
  },
  {
    id: "varanasi",
    name: "Varanasi",
    state: "Uttar Pradesh",
    description: "Spiritual Capital - Ancient city on the banks of Ganges",
    airportCode: "VNS",
    trainStations: ["Varanasi Junction", "Varanasi City"],
    busStands: ["Varanasi Bus Station"],
    image: "/destinations/varanasi.jpg"
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    description: "City of Dreams - India's financial and entertainment capital",
    airportCode: "BOM",
    trainStations: ["Chhatrapati Shivaji Terminus", "Mumbai Central", "Bandra Terminus"],
    busStands: ["Mumbai Central Bus Depot", "Dadar Bus Depot"],
    image: "/destinations/mumbai.jpg"
  },
  {
    id: "udaipur",
    name: "Udaipur",
    state: "Rajasthan",
    description: "City of Lakes - Romantic palaces and serene lakes",
    airportCode: "UDR",
    trainStations: ["Udaipur City"],
    busStands: ["Udaipur Bus Stand"],
    image: "/destinations/udaipur.jpg"
  },
  {
    id: "manali",
    name: "Manali",
    state: "Himachal Pradesh",
    description: "Himalayan Paradise - Adventure sports and mountain beauty",
    trainStations: ["Joginder Nagar (nearest)", "Chandigarh (major hub)"],
    busStands: ["Manali Bus Stand"],
    image: "/destinations/manali.jpg"
  },
  {
    id: "rishikesh",
    name: "Rishikesh",
    state: "Uttarakhand",
    description: "Yoga Capital - Spiritual retreat and adventure hub",
    trainStations: ["Rishikesh Railway Station", "Haridwar Junction (nearby)"],
    busStands: ["Rishikesh Bus Stand"],
    image: "/destinations/rishikesh.jpg"
  },
  {
    id: "agra",
    name: "Agra",
    state: "Uttar Pradesh",
    description: "Home of Taj Mahal - Mughal architecture marvel",
    trainStations: ["Agra Cantt", "Agra Fort"],
    busStands: ["Agra ISBT"],
    image: "/destinations/agra.jpg"
  },
  {
    id: "mysore",
    name: "Mysore",
    state: "Karnataka",
    description: "City of Palaces - Royal heritage and sandalwood",
    airportCode: "MYQ",
    trainStations: ["Mysore Junction"],
    busStands: ["Mysore City Bus Stand"],
    image: "/destinations/mysore.jpg"
  }
]

export interface TransportOption {
  id: string
  type: "train" | "bus" | "flight"
  name: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  operator: string
  availableSeats: number
}

export function getTransportOptions(
  from: string,
  to: string,
  type: "train" | "bus" | "flight",
  date: Date
): TransportOption[] {
  // Mock transport options - in production, this would call real APIs
  const baseOptions = {
    train: [
      {
        id: `train-1-${to}`,
        type: "train" as const,
        name: "Rajdhani Express",
        departureTime: "06:00",
        arrivalTime: "18:30",
        duration: "12h 30m",
        price: 1250,
        operator: "Indian Railways",
        availableSeats: 45
      },
      {
        id: `train-2-${to}`,
        type: "train" as const,
        name: "Shatabdi Express",
        departureTime: "08:15",
        arrivalTime: "20:45",
        duration: "12h 30m",
        price: 1450,
        operator: "Indian Railways",
        availableSeats: 32
      },
      {
        id: `train-3-${to}`,
        type: "train" as const,
        name: "Duronto Express",
        departureTime: "14:30",
        arrivalTime: "02:00",
        duration: "11h 30m",
        price: 1350,
        operator: "Indian Railways",
        availableSeats: 28
      }
    ],
    bus: [
      {
        id: `bus-1-${to}`,
        type: "bus" as const,
        name: "Volvo Multi-Axle Sleeper",
        departureTime: "22:00",
        arrivalTime: "08:00",
        duration: "10h",
        price: 800,
        operator: "RedBus Premium",
        availableSeats: 18
      },
      {
        id: `bus-2-${to}`,
        type: "bus" as const,
        name: "AC Seater",
        departureTime: "06:30",
        arrivalTime: "18:30",
        duration: "12h",
        price: 650,
        operator: "State Transport",
        availableSeats: 25
      },
      {
        id: `bus-3-${to}`,
        type: "bus" as const,
        name: "Luxury Coach",
        departureTime: "23:30",
        arrivalTime: "09:30",
        duration: "10h",
        price: 900,
        operator: "IntrCity SmartBus",
        availableSeats: 15
      }
    ],
    flight: [
      {
        id: `flight-1-${to}`,
        type: "flight" as const,
        name: "AI 601",
        departureTime: "09:00",
        arrivalTime: "11:30",
        duration: "2h 30m",
        price: 4500,
        operator: "Air India",
        availableSeats: 52
      },
      {
        id: `flight-2-${to}`,
        type: "flight" as const,
        name: "6E 2345",
        departureTime: "14:15",
        arrivalTime: "16:45",
        duration: "2h 30m",
        price: 3800,
        operator: "IndiGo",
        availableSeats: 68
      },
      {
        id: `flight-3-${to}`,
        type: "flight" as const,
        name: "SG 8765",
        departureTime: "18:30",
        arrivalTime: "21:00",
        duration: "2h 30m",
        price: 4200,
        operator: "SpiceJet",
        availableSeats: 42
      }
    ]
  }

  return baseOptions[type]
}
