'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { countryFlagUrl } from '@/lib/osu-api';

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'US', name: 'United States'  },
  { code: 'JP', name: 'Japan'          },
  { code: 'KR', name: 'South Korea'    },
  { code: 'CN', name: 'China'          },
  { code: 'TW', name: 'Taiwan'         },
  { code: 'HK', name: 'Hong Kong'      },
  { code: 'BR', name: 'Brazil'         },
  { code: 'RU', name: 'Russia'         },
  { code: 'DE', name: 'Germany'        },
  { code: 'FR', name: 'France'         },
  { code: 'PL', name: 'Poland'         },
  { code: 'ID', name: 'Indonesia'      },
  { code: 'TH', name: 'Thailand'       },
  { code: 'VN', name: 'Vietnam'        },
  { code: 'TR', name: 'Turkey'         },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia'      },
  { code: 'CA', name: 'Canada'         },
  { code: 'MX', name: 'Mexico'         },
  { code: 'AR', name: 'Argentina'      },
  { code: 'PH', name: 'Philippines'    },
  { code: 'MY', name: 'Malaysia'       },
  { code: 'SG', name: 'Singapore'      },
  { code: 'CL', name: 'Chile'          },
  { code: 'IT', name: 'Italy'          },
  { code: 'ES', name: 'Spain'          },
  { code: 'NL', name: 'Netherlands'    },
  { code: 'SE', name: 'Sweden'         },
  { code: 'NO', name: 'Norway'         },
  { code: 'FI', name: 'Finland'        },
  { code: 'UA', name: 'Ukraine'        },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'RO', name: 'Romania'        },
  { code: 'HU', name: 'Hungary'        },
  { code: 'PT', name: 'Portugal'       },
  { code: 'NZ', name: 'New Zealand'    },
  { code: 'SA', name: 'Saudi Arabia'   },
  { code: 'EG', name: 'Egypt'          },
  { code: 'IN', name: 'India'          },
];

interface Props {
  value: string;
  onChange: (code: string) => void;
}

export default function CountrySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = COUNTRIES.find(c => c.code === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 bg-gray-800 border rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors ${
          value ? 'border-pink-500/50 text-pink-400' : 'border-transparent text-gray-400 hover:text-white'
        }`}
      >
        {selected ? (
          <Image src={countryFlagUrl(selected.code)} alt={selected.code} width={16} height={12} className="rounded-sm" unoptimized />
        ) : (
          <span>🌍</span>
        )}
        <span>{selected ? selected.name : 'Any country'}</span>
        <svg className="w-3 h-3 opacity-50 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-52 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
          <div className="overflow-y-scroll p-1.5" style={{ maxHeight: '280px' }}>
            {/* Any country option */}
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-left transition-colors ${
                !value ? 'bg-pink-500/20 text-pink-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-base">🌍</span>
              <span>Any country</span>
              {!value && <span className="ml-auto text-pink-400 text-xs">✓</span>}
            </button>

            {COUNTRIES.map(c => (
              <button
                key={c.code}
                onClick={() => { onChange(c.code); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-left transition-colors ${
                  value === c.code ? 'bg-pink-500/20 text-pink-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Image src={countryFlagUrl(c.code)} alt={c.code} width={18} height={13} className="rounded-sm shrink-0" unoptimized />
                <span>{c.name}</span>
                {value === c.code && <span className="ml-auto text-pink-400 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
