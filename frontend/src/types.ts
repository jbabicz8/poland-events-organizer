export type EventSummary = {
    id: number
    title: string
    description: string | null
    startDate: string
    endDate: string | null
    city: string
    address: string | null
    voivodeship: string
    categories: string[]
    organizerName: string | null
    participantCount: number | null
    capacity: number | null
    images: ImageItem[]
}

export type ImageItem = {
    id: number
    url: string
}