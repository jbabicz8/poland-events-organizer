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
  large?: boolean
}

function PolandMap({ voivodeships, selectedId, onSelect, large = false }: Props) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)

  const byCode = new Map(voivodeships.map((v) => [v.mapCode.replace('-', ''), v]))
  const selected = voivodeships.find((v) => String(v.id) === selectedId)
  const hovered = hoveredCode ? byCode.get(hoveredCode) : undefined
  const label = hovered?.name ?? selected?.name

  return (
    <div className="relative rounded-[2rem] border border-line bg-gradient-to-br from-map-a to-map-b p-6 shadow-2xl shadow-black/10">
        <svg viewBox={MAP_VIEWBOX} className={'mx-auto block h-auto w-full ' + (large ? 'max-w-[640px] xl:max-w-[760px]' : 'max-w-[460px]')} role="img" aria-label="Mapa Polski z województwami">
        {Object.entries(MAP_PATHS).map(([code, d]) => {
          const v = byCode.get(code)
          const isSelected = v !== undefined && String(v.id) === selectedId
          const isHovered = hoveredCode === code

          return (
            <path
              key={code}
              d={d}
              strokeWidth={1.5}
              className={
                'cursor-pointer stroke-surface transition-colors duration-200 ' +
                (isSelected ? 'fill-accent-2' : isHovered ? 'fill-accent' : 'fill-region')
              }
              onMouseEnter={() => setHoveredCode(code)}
              onMouseLeave={() => setHoveredCode(null)}
              onClick={() => v && onSelect(isSelected ? '' : String(v.id))}
            />
          )
        })}
      </svg>

      <div className="mt-4 flex min-h-[3.25rem] items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm shadow-lg shadow-black/5">
        <div>
          <b className="block font-serif text-base">{label ?? 'Cała Polska'}</b>
          <span className="text-muted">
            {selected ? 'Kliknij ponownie, aby odznaczyć' : 'Kliknij województwo, aby filtrować'}
          </span>
        </div>
        {selected && (
          <button onClick={() => onSelect('')} className="shrink-0">
            Wyczyść
          </button>
        )}
      </div>

      <small className="mt-2 block text-center text-xs text-muted">
        Mapa:{' '}
        <a className="underline" href="https://simplemaps.com" target="_blank" rel="noreferrer">
          SimpleMaps.com
        </a>
      </small>
    </div>
  )
}

export default PolandMap
