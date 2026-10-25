import { useState } from 'react'
import { MAP_PATHS, MAP_VIEWBOX } from './polandMapPaths'

type Voivodeship = {
    id: number
    name: string
    mapCode: string
}

type Props = {
    voivodeships: Voivodeship[]
    selectedId: string
    onSelect: (id: string) => void
}

function PolandMap({ voivodeships, selectedId, onSelect }: Props) {
    const [hoveredCode, setHoveredCode] = useState<string | null>(null)

    // W bazie kod to "PL-02", a na mapie "PL02", więc usuwamy myślnik
    const byCode = new Map(voivodeships.map((v) => [v.mapCode.replace('-', ''), v]))

    const selected = voivodeships.find((v) => String(v.id) === selectedId)
    const hovered = hoveredCode ? byCode.get(hoveredCode) : undefined
    const label = hovered?.name ?? selected?.name ?? 'Kliknij województwo'

    return (
        <div style={{ textAlign: 'center' }}>
            <svg viewBox={MAP_VIEWBOX} style={{ width: '100%', maxWidth: 400 }}>
                {Object.entries(MAP_PATHS).map(([code, d]) => {
                    const v = byCode.get(code)
                    const isSelected = v !== undefined && String(v.id) === selectedId
                    const isHovered = hoveredCode === code

                    return (
                        <path
                            key={code}
                            d={d}
                            fill={isSelected ? '#481d14' : isHovered ? '#672d1d' : '#893925'}
                            stroke="#ffffff"
                            strokeWidth={1.5}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredCode(code)}
                            onMouseLeave={() => setHoveredCode(null)}
                            onClick={() => v && onSelect(isSelected ? '' : String(v.id))}
                        />
                    )
                })}
            </svg>
            <p style={{ margin: 4, fontWeight: 600 }}>{label}</p>
            <small>
                Mapa: <a href="https://simplemaps.com" target="_blank" rel="noreferrer">SimpleMaps.com</a>
            </small>
        </div>
    )
}

export default PolandMap