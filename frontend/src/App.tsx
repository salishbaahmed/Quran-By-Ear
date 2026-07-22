import { useState, useEffect, useRef } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

const SURAHS = [
  { num: 1,   arabic: 'الفاتحة',    english: 'Al-Fatiha',      ayahs: 7   },
  { num: 2,   arabic: 'البقرة',     english: 'Al-Baqara',      ayahs: 286 },
  { num: 3,   arabic: 'آل عمران',   english: "Ali 'Imran",     ayahs: 200 },
  { num: 4,   arabic: 'النساء',     english: "An-Nisa",        ayahs: 176 },
  { num: 5,   arabic: 'المائدة',    english: "Al-Ma'ida",      ayahs: 120 },
  { num: 6,   arabic: 'الأنعام',    english: "Al-An'am",       ayahs: 165 },
  { num: 7,   arabic: 'الأعراف',    english: "Al-A'raf",       ayahs: 206 },
  { num: 8,   arabic: 'الأنفال',    english: 'Al-Anfal',       ayahs: 75  },
  { num: 9,   arabic: 'التوبة',     english: 'At-Tawba',       ayahs: 129 },
  { num: 10,  arabic: 'يونس',       english: 'Yunus',          ayahs: 109 },
  { num: 11,  arabic: 'هود',        english: 'Hud',            ayahs: 123 },
  { num: 12,  arabic: 'يوسف',       english: 'Yusuf',          ayahs: 111 },
  { num: 13,  arabic: 'الرعد',      english: "Ar-Ra'd",        ayahs: 43  },
  { num: 14,  arabic: 'إبراهيم',    english: 'Ibrahim',        ayahs: 52  },
  { num: 15,  arabic: 'الحجر',      english: 'Al-Hijr',        ayahs: 99  },
  { num: 16,  arabic: 'النحل',      english: 'An-Nahl',        ayahs: 128 },
  { num: 17,  arabic: 'الإسراء',    english: 'Al-Isra',        ayahs: 111 },
  { num: 18,  arabic: 'الكهف',      english: 'Al-Kahf',        ayahs: 110 },
  { num: 19,  arabic: 'مريم',       english: 'Maryam',         ayahs: 98  },
  { num: 20,  arabic: 'طه',         english: 'Ta-Ha',          ayahs: 135 },
  { num: 21,  arabic: 'الأنبياء',   english: "Al-Anbiya",      ayahs: 112 },
  { num: 22,  arabic: 'الحج',       english: 'Al-Hajj',        ayahs: 78  },
  { num: 23,  arabic: 'المؤمنون',   english: "Al-Mu'minun",    ayahs: 118 },
  { num: 24,  arabic: 'النور',      english: 'An-Nur',         ayahs: 64  },
  { num: 25,  arabic: 'الفرقان',    english: 'Al-Furqan',      ayahs: 77  },
  { num: 26,  arabic: 'الشعراء',    english: "Ash-Shu'ara",    ayahs: 227 },
  { num: 27,  arabic: 'النمل',      english: 'An-Naml',        ayahs: 93  },
  { num: 28,  arabic: 'القصص',      english: 'Al-Qasas',       ayahs: 88  },
  { num: 29,  arabic: 'العنكبوت',   english: "Al-'Ankabut",    ayahs: 69  },
  { num: 30,  arabic: 'الروم',      english: 'Ar-Rum',         ayahs: 60  },
  { num: 31,  arabic: 'لقمان',      english: 'Luqman',         ayahs: 34  },
  { num: 32,  arabic: 'السجدة',     english: 'As-Sajda',       ayahs: 30  },
  { num: 33,  arabic: 'الأحزاب',    english: 'Al-Ahzab',       ayahs: 73  },
  { num: 34,  arabic: 'سبأ',        english: 'Saba',           ayahs: 54  },
  { num: 35,  arabic: 'فاطر',       english: 'Fatir',          ayahs: 45  },
  { num: 36,  arabic: 'يس',         english: 'Ya-Sin',         ayahs: 83  },
  { num: 37,  arabic: 'الصافات',    english: 'As-Saffat',      ayahs: 182 },
  { num: 38,  arabic: 'ص',          english: 'Sad',            ayahs: 88  },
  { num: 39,  arabic: 'الزمر',      english: 'Az-Zumar',       ayahs: 75  },
  { num: 40,  arabic: 'غافر',       english: 'Ghafir',         ayahs: 85  },
  { num: 41,  arabic: 'فصلت',       english: 'Fussilat',       ayahs: 54  },
  { num: 42,  arabic: 'الشورى',     english: 'Ash-Shura',      ayahs: 53  },
  { num: 43,  arabic: 'الزخرف',     english: 'Az-Zukhruf',     ayahs: 89  },
  { num: 44,  arabic: 'الدخان',     english: 'Ad-Dukhan',      ayahs: 59  },
  { num: 45,  arabic: 'الجاثية',    english: 'Al-Jathiya',     ayahs: 37  },
  { num: 46,  arabic: 'الأحقاف',    english: 'Al-Ahqaf',       ayahs: 35  },
  { num: 47,  arabic: 'محمد',       english: 'Muhammad',       ayahs: 38  },
  { num: 48,  arabic: 'الفتح',      english: 'Al-Fath',        ayahs: 29  },
  { num: 49,  arabic: 'الحجرات',    english: 'Al-Hujurat',     ayahs: 18  },
  { num: 50,  arabic: 'ق',          english: 'Qaf',            ayahs: 45  },
  { num: 51,  arabic: 'الذاريات',   english: 'Adh-Dhariyat',   ayahs: 60  },
  { num: 52,  arabic: 'الطور',      english: 'At-Tur',         ayahs: 49  },
  { num: 53,  arabic: 'النجم',      english: 'An-Najm',        ayahs: 62  },
  { num: 54,  arabic: 'القمر',      english: 'Al-Qamar',       ayahs: 55  },
  { num: 55,  arabic: 'الرحمن',     english: 'Ar-Rahman',      ayahs: 78  },
  { num: 56,  arabic: 'الواقعة',    english: "Al-Waqi'a",      ayahs: 96  },
  { num: 57,  arabic: 'الحديد',     english: 'Al-Hadid',       ayahs: 29  },
  { num: 58,  arabic: 'المجادلة',   english: 'Al-Mujadila',    ayahs: 22  },
  { num: 59,  arabic: 'الحشر',      english: 'Al-Hashr',       ayahs: 24  },
  { num: 60,  arabic: 'الممتحنة',   english: 'Al-Mumtahana',   ayahs: 13  },
  { num: 61,  arabic: 'الصف',       english: 'As-Saf',         ayahs: 14  },
  { num: 62,  arabic: 'الجمعة',     english: "Al-Jumu'a",      ayahs: 11  },
  { num: 63,  arabic: 'المنافقون',  english: 'Al-Munafiqun',   ayahs: 11  },
  { num: 64,  arabic: 'التغابن',    english: 'At-Taghabun',    ayahs: 18  },
  { num: 65,  arabic: 'الطلاق',     english: 'At-Talaq',       ayahs: 12  },
  { num: 66,  arabic: 'التحريم',    english: 'At-Tahrim',      ayahs: 12  },
  { num: 67,  arabic: 'الملك',      english: 'Al-Mulk',        ayahs: 30  },
  { num: 68,  arabic: 'القلم',      english: 'Al-Qalam',       ayahs: 52  },
  { num: 69,  arabic: 'الحاقة',     english: 'Al-Haqqa',       ayahs: 52  },
  { num: 70,  arabic: 'المعارج',    english: "Al-Ma'arij",     ayahs: 44  },
  { num: 71,  arabic: 'نوح',        english: 'Nuh',            ayahs: 28  },
  { num: 72,  arabic: 'الجن',       english: 'Al-Jinn',        ayahs: 28  },
  { num: 73,  arabic: 'المزمل',     english: 'Al-Muzzammil',   ayahs: 20  },
  { num: 74,  arabic: 'المدثر',     english: 'Al-Muddaththir', ayahs: 56  },
  { num: 75,  arabic: 'القيامة',    english: 'Al-Qiyama',      ayahs: 40  },
  { num: 76,  arabic: 'الإنسان',    english: 'Al-Insan',       ayahs: 31  },
  { num: 77,  arabic: 'المرسلات',   english: 'Al-Mursalat',    ayahs: 50  },
  { num: 78,  arabic: 'النبأ',      english: "An-Naba",        ayahs: 40  },
  { num: 79,  arabic: 'النازعات',   english: "An-Nazi'at",     ayahs: 46  },
  { num: 80,  arabic: 'عبس',        english: "'Abasa",         ayahs: 42  },
  { num: 81,  arabic: 'التكوير',    english: 'At-Takwir',      ayahs: 29  },
  { num: 82,  arabic: 'الانفطار',   english: 'Al-Infitar',     ayahs: 19  },
  { num: 83,  arabic: 'المطففين',   english: 'Al-Mutaffifin',  ayahs: 36  },
  { num: 84,  arabic: 'الانشقاق',   english: 'Al-Inshiqaq',    ayahs: 25  },
  { num: 85,  arabic: 'البروج',     english: 'Al-Buruj',       ayahs: 22  },
  { num: 86,  arabic: 'الطارق',     english: 'At-Tariq',       ayahs: 17  },
  { num: 87,  arabic: 'الأعلى',     english: "Al-A'la",        ayahs: 19  },
  { num: 88,  arabic: 'الغاشية',    english: 'Al-Ghashiya',    ayahs: 26  },
  { num: 89,  arabic: 'الفجر',      english: 'Al-Fajr',        ayahs: 30  },
  { num: 90,  arabic: 'البلد',      english: 'Al-Balad',       ayahs: 20  },
  { num: 91,  arabic: 'الشمس',      english: 'Ash-Shams',      ayahs: 15  },
  { num: 92,  arabic: 'الليل',      english: 'Al-Layl',        ayahs: 21  },
  { num: 93,  arabic: 'الضحى',      english: 'Ad-Duha',        ayahs: 11  },
  { num: 94,  arabic: 'الشرح',      english: 'Ash-Sharh',      ayahs: 8   },
  { num: 95,  arabic: 'التين',      english: 'At-Tin',         ayahs: 8   },
  { num: 96,  arabic: 'العلق',      english: "Al-'Alaq",       ayahs: 19  },
  { num: 97,  arabic: 'القدر',      english: 'Al-Qadr',        ayahs: 5   },
  { num: 98,  arabic: 'البينة',     english: 'Al-Bayyina',     ayahs: 8   },
  { num: 99,  arabic: 'الزلزلة',    english: 'Az-Zalzala',     ayahs: 8   },
  { num: 100, arabic: 'العاديات',   english: "Al-'Adiyat",     ayahs: 11  },
  { num: 101, arabic: 'القارعة',    english: "Al-Qari'a",      ayahs: 11  },
  { num: 102, arabic: 'التكاثر',    english: 'At-Takathur',    ayahs: 8   },
  { num: 103, arabic: 'العصر',      english: "Al-'Asr",        ayahs: 3   },
  { num: 104, arabic: 'الهمزة',     english: 'Al-Humaza',      ayahs: 9   },
  { num: 105, arabic: 'الفيل',      english: 'Al-Fil',         ayahs: 5   },
  { num: 106, arabic: 'قريش',       english: 'Quraysh',        ayahs: 4   },
  { num: 107, arabic: 'الماعون',    english: "Al-Ma'un",       ayahs: 7   },
  { num: 108, arabic: 'الكوثر',     english: 'Al-Kawthar',     ayahs: 3   },
  { num: 109, arabic: 'الكافرون',   english: 'Al-Kafirun',     ayahs: 6   },
  { num: 110, arabic: 'النصر',      english: 'An-Nasr',        ayahs: 3   },
  { num: 111, arabic: 'المسد',      english: 'Al-Masad',       ayahs: 5   },
  { num: 112, arabic: 'الإخلاص',    english: 'Al-Ikhlas',      ayahs: 4   },
  { num: 113, arabic: 'الفلق',      english: 'Al-Falaq',       ayahs: 5   },
  { num: 114, arabic: 'الناس',      english: 'An-Nas',         ayahs: 6   },
]

const RECITERS = [
  { id: 'basfar',    english: 'Abdullah Basfar',              arabic: 'عبدالله بصفر'              },
  { id: 'sudais',    english: 'Abdul Rahman Al-Sudais',        arabic: 'عبدالرحمن السديس'          },
  { id: 'basit',    english: 'Abdul Basit Abdul Samad',       arabic: 'عبدالباسط عبدالصمد'        },
  { id: 'ajmi',     english: 'Ahmad Al-Ajmi',                 arabic: 'أحمد العجمي'               },
  { id: 'huthaify', english: 'Ali Al-Huthaify',               arabic: 'علي الحذيفي'               },
  { id: 'rifai',    english: 'Hani Ar-Rifai',                 arabic: 'هاني الرفاعي'              },
  { id: 'hussary',  english: 'Mahmoud Khalil Al-Hussary',     arabic: 'محمود خليل الحصري'         },
  { id: 'muaiqly',  english: 'Maher Al-Muaiqly',             arabic: 'ماهر المعيقلي'             },
  { id: 'afasy',    english: 'Mishary Rashid Al-Afasy',       arabic: 'مشاري راشد العفاسي'        },
  { id: 'ayyub',    english: 'Muhammad Ayyub',                arabic: 'محمد أيوب'                 },
  { id: 'minshawi', english: 'Muhammad Siddiq Al-Minshawi',   arabic: 'محمد صديق المنشاوي'        },
  { id: 'ghamdi',   english: "Sa'd Al-Ghamdi",                arabic: 'سعد الغامدي'               },
  { id: 'shuraim',  english: 'Saud Al-Shuraim',               arabic: 'سعود الشريم'               },
  { id: 'dosari',   english: 'Yasser Al-Dosari',              arabic: 'ياسر الدوسري'              },
  { id: 'qahtani',  english: 'Khalid Al-Qahtani',             arabic: 'خالد القحطاني'             },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'splash' | 'surah-list' | 'reciter' | 'ayah-range' | 'download-type' | 'downloading' | 'settings'
type DownloadType = 'mp3' | 'mp4'
type FontSize = 'sm' | 'md' | 'lg' | 'xl'

interface Surah { num: number; arabic: string; english: string; ayahs: number }
interface Reciter { id: string; english: string; arabic: string }

const FONT_SIZE_MAP: Record<FontSize, { arabic: string; label: string; size: number }> = {
  sm: { arabic: '18px', label: 'Small',   size: 18 },
  md: { arabic: '22px', label: 'Medium',  size: 22 },
  lg: { arabic: '28px', label: 'Large',   size: 28 },
  xl: { arabic: '34px', label: 'X-Large', size: 34 },
}

// ─── Shared components ────────────────────────────────────────────────────────

function SearchInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--fg-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-150"
        style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          color: 'var(--fg)',
          fontFamily: 'var(--font-sans)',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
      />
    </div>
  )
}

function Header({ title, onBack, onSettings }: { title: string; onBack?: () => void; onSettings?: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 pt-12 pb-4">
      <div className="w-10">
        {onBack && (
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 hover:scale-105 active:scale-95" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--fg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>
      <h1 className="text-base font-semibold tracking-tight" style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>{title}</h1>
      <div className="w-10">
        {onSettings && (
          <button onClick={onSettings} className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 hover:scale-105 active:scale-95" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--fg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
        <svg className="w-6 h-6" style={{ color: 'var(--fg-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="text-sm" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
        No results for <span className="font-medium" style={{ color: 'var(--fg)' }}>"{query}"</span>
      </p>
    </div>
  )
}

// ─── Screen 1: Splash ─────────────────────────────────────────────────────────

function SplashScreen({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 3000)
    return () => clearTimeout(t)
  }, [onContinue])

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-full overflow-hidden cursor-pointer select-none"
      style={{ background: 'transparent' }}
      onClick={onContinue}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Frosted-glass card */}
        <div style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '32px 28px 28px',
          maxWidth: '300px',
          width: '100%',
          boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
        }}>
          {/* Bismillah */}
          <div style={{
            fontFamily: 'Amiri, serif',
            fontSize: '24px',
            color: 'var(--accent)',
            letterSpacing: '0.02em',
            lineHeight: 1.5,
            textShadow: '0 0 20px var(--accent-soft)',
          }}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
          </div>

          {/* Divider */}
          <div style={{
            margin: '16px auto',
            width: '48px',
            height: '1.5px',
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            borderRadius: '2px',
          }} />

          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '30px',
            fontWeight: 700,
            color: 'var(--fg)',
            lineHeight: 1.15,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Quran by Ear
          </h1>
          <p style={{
            marginTop: '8px',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            color: 'var(--fg-muted)',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
          }}>
            Beautiful recitation, wherever you go
          </p>
        </div>

        {/* Pulse indicator */}
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div className="relative">
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 10px var(--accent-soft)',
            }} />
            <div className="absolute inset-0 rounded-full animate-ping" style={{
              background: 'var(--accent)',
              opacity: 0.35,
            }} />
          </div>
          <p style={{
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: 'var(--fg-muted)',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>Tap anywhere to begin</p>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 2: Surah List ─────────────────────────────────────────────────────

function SurahListScreen({ onSelect, onSettings }: { onSelect: (s: Surah) => void; onSettings: () => void }) {
  const [query, setQuery] = useState('')

  const filtered = SURAHS.filter(s => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return s.english.toLowerCase().includes(q) || s.arabic.includes(q) || String(s.num).includes(q)
  })

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg)' }}>
      <Header title="Choose a Surah" onSettings={onSettings} />
      <div className="px-5 pb-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search in Arabic or English…" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-8 scrollbar-thin">
        {filtered.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map(s => (
              <SurahRow key={s.num} surah={s} onClick={() => onSelect(s)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SurahRow({ surah, onClick }: { surah: Surah; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl transition-all duration-150"
      style={{
        background: hover ? 'var(--surface)' : 'transparent',
        border: '1.5px solid',
        borderColor: hover ? 'var(--border)' : 'transparent',
      }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold" style={{
        background: hover ? 'var(--accent)' : 'var(--surface-2)',
        color: hover ? 'var(--accent-fg)' : 'var(--fg-muted)',
        fontFamily: 'var(--font-sans)',
        transition: 'all 0.15s',
      }}>
        {surah.num}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium truncate" style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>
            {surah.english}
          </span>
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
            {surah.ayahs} ayahs
          </span>
        </div>
        <div className="text-base mt-0.5" style={{ color: 'var(--fg-muted)', fontFamily: 'Amiri, serif', direction: 'rtl' }}>
          {surah.arabic}
        </div>
      </div>
      <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--fg-muted)', opacity: hover ? 1 : 0.4, transition: 'opacity 0.15s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

// ─── Screen 3: Reciter Selection ──────────────────────────────────────────────

function ReciterScreen({ surah, onSelect, onBack, onSettings }: {
  surah: Surah
  onSelect: (r: Reciter) => void
  onBack: () => void
  onSettings: () => void
}) {
  const [query, setQuery] = useState('')

  const filtered = RECITERS.filter(r => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return r.english.toLowerCase().includes(q) || r.arabic.includes(q)
  }).sort((a, b) => a.english.localeCompare(b.english))

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg)' }}>
      <Header title="Choose a Reciter" onBack={onBack} onSettings={onSettings} />
      <div className="px-5 pb-1">
        <div className="px-4 py-3 rounded-xl mb-3" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>Surah selected</span>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-sm font-semibold" style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>{surah.english}</span>
            <span className="text-base" style={{ color: 'var(--fg)', fontFamily: 'Amiri, serif' }}>{surah.arabic}</span>
          </div>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Search reciters…" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2 scrollbar-thin">
        {filtered.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map(r => (
              <ReciterRow key={r.id} reciter={r} onClick={() => onSelect(r)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReciterRow({ reciter, onClick }: { reciter: Reciter; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  const initials = reciter.english.split(' ').slice(0, 2).map(w => w[0]).join('')
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl transition-all duration-150"
      style={{
        background: hover ? 'var(--surface)' : 'transparent',
        border: '1.5px solid',
        borderColor: hover ? 'var(--border)' : 'transparent',
      }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold" style={{
        background: hover ? 'var(--accent)' : 'var(--surface-2)',
        color: hover ? 'var(--accent-fg)' : 'var(--fg-muted)',
        fontFamily: 'var(--font-sans)',
        transition: 'all 0.15s',
      }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>{reciter.english}</div>
        <div className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)', fontFamily: 'Amiri, serif', direction: 'rtl', textAlign: 'right' }}>{reciter.arabic}</div>
      </div>
      <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--fg-muted)', opacity: hover ? 1 : 0.4, transition: 'opacity 0.15s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

// ─── Screen 4: Ayah Range ─────────────────────────────────────────────────────

function AyahRangeScreen({ surah, reciter, onContinue, onBack, onSettings }: {
  surah: Surah
  reciter: Reciter
  onContinue: (start: number, end: number) => void
  onBack: () => void
  onSettings: () => void
}) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [touched, setTouched] = useState({ start: false, end: false })

  const startNum = parseInt(start, 10)
  const endNum = parseInt(end, 10)

  const startError = touched.start ? (() => {
    if (!start || isNaN(startNum) || startNum < 1) return 'Enter a valid ayah number.'
    if (startNum > surah.ayahs) return `Surah only has ${surah.ayahs} ayahs.`
    return null
  })() : null

  const endError = touched.end ? (() => {
    if (!end || isNaN(endNum) || endNum < 1) return 'Enter a valid ayah number.'
    if (endNum > surah.ayahs) return `Surah only has ${surah.ayahs} ayahs.`
    if (!isNaN(startNum) && endNum < startNum) return 'End ayah must be after start ayah.'
    return null
  })() : null

  const isValid = start && end && !isNaN(startNum) && !isNaN(endNum)
    && startNum >= 1 && endNum >= 1
    && startNum <= surah.ayahs && endNum <= surah.ayahs
    && endNum >= startNum

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg)' }}>
      <Header title="Select Ayah Range" onBack={onBack} onSettings={onSettings} />
      <div className="flex-1 px-5 pb-8">
        {/* Context chip */}
        <div className="flex gap-2 mb-6">
          <div className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>
            {surah.english}
          </div>
          <div className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>
            {reciter.english}
          </div>
        </div>

        {/* Hint */}
        <div className="px-4 py-3 rounded-xl mb-6 flex items-center gap-3" style={{ background: 'var(--accent-soft)', border: '1.5px solid var(--border)' }}>
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>
            <span style={{ fontFamily: 'Amiri, serif', fontSize: '17px', marginRight: '4px' }}>{surah.arabic}</span>
            has <strong>{surah.ayahs}</strong> ayahs in total.
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <AyahInput
            label="Start Ayah"
            value={start}
            onChange={v => { setStart(v); setTouched(t => ({ ...t, start: true })) }}
            onBlur={() => setTouched(t => ({ ...t, start: true }))}
            error={startError}
            max={surah.ayahs}
          />
          <AyahInput
            label="End Ayah"
            value={end}
            onChange={v => { setEnd(v); setTouched(t => ({ ...t, end: true })) }}
            onBlur={() => setTouched(t => ({ ...t, end: true }))}
            error={endError}
            max={surah.ayahs}
          />
        </div>

        {/* Range preview */}
        {isValid && (
          <div className="px-4 py-3 rounded-xl mb-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
              You selected <strong style={{ color: 'var(--fg)' }}>{endNum - startNum + 1} ayah{endNum - startNum + 1 !== 1 ? 's' : ''}</strong> — from ayah {startNum} to {endNum}.
            </p>
          </div>
        )}

        <button
          disabled={!isValid}
          onClick={() => isValid && onContinue(startNum, endNum)}
          className="w-full py-4 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: isValid ? 'var(--accent)' : 'var(--surface-2)',
            color: isValid ? 'var(--accent-fg)' : 'var(--fg-muted)',
            fontFamily: 'var(--font-sans)',
            cursor: isValid ? 'pointer' : 'not-allowed',
            border: 'none',
            outline: 'none',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

function AyahInput({ label, value, onChange, onBlur, error, max }: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  error: string | null
  max: number
}) {
  const [focused, setFocused] = useState(false)
  const borderColor = error ? 'var(--error)' : focused ? 'var(--accent)' : 'var(--border)'
  return (
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>{label}</label>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlur() }}
        className="w-full px-4 py-3 rounded-xl text-center text-lg font-semibold outline-none transition-all duration-150"
        style={{
          background: 'var(--surface)',
          border: `2px solid ${borderColor}`,
          color: 'var(--fg)',
          fontFamily: 'var(--font-sans)',
        }}
        placeholder="—"
      />
      {error && (
        <p className="mt-1.5 text-xs leading-tight" style={{ color: 'var(--error)', fontFamily: 'var(--font-sans)' }}>{error}</p>
      )}
    </div>
  )
}

// ─── Screen 5: Download Type ──────────────────────────────────────────────────

function DownloadTypeScreen({ surah, reciter, startAyah, endAyah, onSelect, onBack, onSettings }: {
  surah: Surah
  reciter: Reciter
  startAyah: number
  endAyah: number
  onSelect: (t: DownloadType) => void
  onBack: () => void
  onSettings: () => void
}) {
  const [selected, setSelected] = useState<DownloadType | null>(null)

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg)' }}>
      <Header title="Download Format" onBack={onBack} onSettings={onSettings} />
      <div className="flex-1 px-5 pb-8">
        {/* Summary */}
        <div className="px-4 py-3 rounded-xl mb-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
            <div style={{ color: 'var(--fg-muted)' }}>Surah</div>
            <div style={{ color: 'var(--fg-muted)' }}>Reciter</div>
            <div className="font-medium" style={{ color: 'var(--fg)' }}>{surah.english}</div>
            <div className="font-medium truncate" style={{ color: 'var(--fg)' }}>{reciter.english}</div>
            <div className="mt-1" style={{ color: 'var(--fg-muted)' }}>Ayahs</div>
            <div />
            <div className="font-medium" style={{ color: 'var(--fg)' }}>{startAyah} – {endAyah}</div>
          </div>
        </div>

        <p className="text-sm font-medium mb-4" style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>Choose format</p>

        <div className="flex flex-col gap-3 mb-8">
          <FormatCard
            type="mp3"
            selected={selected === 'mp3'}
            onSelect={() => setSelected('mp3')}
            icon={<AudioIcon />}
            title="MP3 — Audio Only"
            desc="Audio recitation, including Bismillah before the Surah."
          />
          <FormatCard
            type="mp4"
            selected={selected === 'mp4'}
            onSelect={() => setSelected('mp4')}
            icon={<VideoIcon />}
            title="MP4 — Audio + Video"
            desc="Recitation video with on-screen Arabic text, ayah-by-ayah highlighting, and Bismillah."
          />
        </div>

        <button
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="w-full py-4 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: selected ? 'var(--accent)' : 'var(--surface-2)',
            color: selected ? 'var(--accent-fg)' : 'var(--fg-muted)',
            fontFamily: 'var(--font-sans)',
            cursor: selected ? 'pointer' : 'not-allowed',
            border: 'none',
            outline: 'none',
          }}
        >
          {selected ? `Download ${selected.toUpperCase()}` : 'Select a format'}
        </button>
      </div>
    </div>
  )
}

function FormatCard({ type, selected, onSelect, icon, title, desc }: {
  type: DownloadType; selected: boolean; onSelect: () => void
  icon: React.ReactNode; title: string; desc: string
}) {
  return (
    <button
      onClick={onSelect}
      className="flex gap-4 items-start w-full text-left px-5 py-4 rounded-2xl transition-all duration-150"
      style={{
        background: selected ? 'var(--accent-soft)' : 'var(--surface)',
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        outline: 'none',
      }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{
        background: selected ? 'var(--accent)' : 'var(--surface-2)',
        transition: 'all 0.15s',
      }}>
        <span style={{ color: selected ? 'var(--accent-fg)' : 'var(--fg-muted)' }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm mb-1" style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>{title}</div>
        <div className="text-xs leading-relaxed" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>{desc}</div>
      </div>
      <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center transition-all duration-150" style={{
        borderColor: selected ? 'var(--accent)' : 'var(--border)',
        background: selected ? 'var(--accent)' : 'transparent',
      }}>
        {selected && (
          <svg className="w-3 h-3" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  )
}

function AudioIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

// ─── Screen 6: Download ───────────────────────────────────────────────────────

function DownloadScreen({ surah, reciter, startAyah, endAyah, downloadType, fontSize, onBack, onRestart }: {
  surah: Surah
  reciter: Reciter
  startAyah: number
  endAyah: number
  downloadType: DownloadType
  fontSize: FontSize
  onBack: () => void
  onRestart: () => void
}) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [mp4Preview, setMp4Preview] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    const duration = 2800
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const p = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setProgress(Math.round(eased * 100))
      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDone(true)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const ayahCount = endAyah - startAyah + 1
  const estimatedSize = downloadType === 'mp3' ? `${(ayahCount * 0.4).toFixed(1)} MB` : `${(ayahCount * 2.8).toFixed(1)} MB`
  const filename = `${surah.english.replace(/[^a-z0-9]/gi, '_')}_${startAyah}-${endAyah}_${reciter.english.split(' ')[0]}.${downloadType}`

  if (mp4Preview && downloadType === 'mp4') {
    return <MP4PreviewScreen surah={surah} startAyah={startAyah} endAyah={endAyah} fontSize={fontSize} onBack={() => setMp4Preview(false)} />
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg)' }}>
      <Header title={done ? 'Download Complete' : 'Preparing Download'} onBack={done ? undefined : onBack} />
      <div className="flex-1 flex flex-col px-5 pb-8">
        {/* Summary card */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-lg font-semibold" style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>{surah.english}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>{reciter.english}</div>
            </div>
            <div className="text-2xl" style={{ fontFamily: 'Amiri, serif', color: 'var(--fg)' }}>{surah.arabic}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Chip label={`Ayahs ${startAyah}–${endAyah}`} />
            <Chip label={`${ayahCount} ayah${ayahCount !== 1 ? 's' : ''}`} />
            <Chip label={downloadType.toUpperCase()} accent />
          </div>
        </div>

        {/* Progress */}
        {!done ? (
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
              <span>Processing…</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              <div
                className="h-full rounded-full transition-none"
                style={{ width: `${progress}%`, background: 'var(--accent)' }}
              />
            </div>
            <div className="mt-3 text-xs text-center" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
              Compiling {ayahCount} ayah{ayahCount !== 1 ? 's' : ''} from {surah.english}…
            </div>
          </div>
        ) : (
          <div className="mb-6">
            {/* Success state */}
            <div className="flex flex-col items-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--accent-soft)', border: '2px solid var(--accent)' }}>
                <svg className="w-7 h-7" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>Ready to save</p>
              <p className="text-xs" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>{filename}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>~{estimatedSize}</p>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 hover:opacity-90 active:scale-95"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)', fontFamily: 'var(--font-sans)', border: 'none', outline: 'none' }}
              >
                Save / Share
              </button>
              {downloadType === 'mp4' && (
                <button
                  onClick={() => setMp4Preview(true)}
                  className="px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 hover:opacity-90 active:scale-95"
                  style={{ background: 'var(--surface)', color: 'var(--fg)', fontFamily: 'var(--font-sans)', border: '1.5px solid var(--border)', outline: 'none' }}
                >
                  Preview
                </button>
              )}
            </div>
          </div>
        )}

        {done && (
          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl text-sm transition-all duration-150 hover:opacity-80"
            style={{ background: 'transparent', color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', border: '1.5px solid var(--border)', outline: 'none' }}
          >
            Download another
          </button>
        )}
      </div>
    </div>
  )
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{
      background: accent ? 'var(--accent-soft)' : 'var(--surface-2)',
      color: accent ? 'var(--accent-dark)' : 'var(--fg-muted)',
      fontFamily: 'var(--font-sans)',
      border: accent ? '1px solid var(--accent)' : '1px solid var(--border)',
    }}>
      {label}
    </span>
  )
}

// ─── Screen 6b: MP4 Preview ───────────────────────────────────────────────────

const SAMPLE_AYAHS = [
  { num: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ' },
  { num: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
  { num: 3, text: 'الرَّحْمَنِ الرَّحِيمِ' },
  { num: 4, text: 'مَالِكِ يَوْمِ الدِّينِ' },
  { num: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
  { num: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ' },
  { num: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ' },
]

function MP4PreviewScreen({ surah, startAyah, endAyah, fontSize, onBack }: {
  surah: Surah
  startAyah: number
  endAyah: number
  fontSize: FontSize
  onBack: () => void
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const ayahs = SAMPLE_AYAHS.slice(0, Math.min(endAyah - startAyah + 1, 7))
  const arabicFontSize = FONT_SIZE_MAP[fontSize].arabic

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx(i => (i + 1) % ayahs.length)
    }, 2200)
    return () => clearInterval(t)
  }, [ayahs.length])

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg)' }}>
      <Header title="MP4 Preview" onBack={onBack} />
      <div className="flex-1 flex flex-col px-5 pb-8">
        <p className="text-xs mb-4" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
          Simulated preview — ayah highlight advances automatically. Font size reflects your Settings choice ({FONT_SIZE_MAP[fontSize].label}).
        </p>
        {/* Video frame */}
        <div className="rounded-2xl overflow-hidden flex flex-col" style={{
          background: '#0a1910',
          border: '2px solid var(--border)',
          aspectRatio: '16 / 9',
          minHeight: '200px',
        }}>
          {/* Bismillah header */}
          <div className="px-6 pt-5 pb-3 text-center border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: '18px', color: 'rgba(255,255,255,0.5)', direction: 'rtl' }}>
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </div>
          </div>
          {/* Ayahs */}
          <div className="flex-1 flex flex-col justify-center px-6 py-4 gap-3 overflow-y-auto">
            {ayahs.map((a, i) => (
              <div
                key={a.num}
                className="rounded-lg px-4 py-3 text-center transition-all duration-500"
                style={{
                  background: i === activeIdx ? 'rgba(74,222,128,0.15)' : 'transparent',
                  border: i === activeIdx ? '1px solid rgba(74,222,128,0.35)' : '1px solid transparent',
                }}
              >
                <div style={{
                  fontFamily: 'Amiri, serif',
                  fontSize: arabicFontSize,
                  color: i === activeIdx ? '#4ade80' : 'rgba(255,255,255,0.3)',
                  direction: 'rtl',
                  lineHeight: 1.7,
                  transition: 'color 0.4s',
                }}>
                  {a.text}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: i === activeIdx ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.15)',
                  fontFamily: 'var(--font-sans)',
                  marginTop: '4px',
                  transition: 'color 0.4s',
                }}>
                  {startAyah + i}
                </div>
              </div>
            ))}
          </div>
          {/* Bottom bar */}
          <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-sans)' }}>{surah.english}</span>
            <div className="flex gap-1">
              {ayahs.map((_, i) => (
                <div key={i} className="rounded-full transition-all duration-300" style={{
                  width: i === activeIdx ? '16px' : '4px',
                  height: '4px',
                  background: i === activeIdx ? '#4ade80' : 'rgba(255,255,255,0.2)',
                }} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 px-4 py-3 rounded-xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
            Arabic font size in the exported video: <strong style={{ color: 'var(--fg)' }}>{arabicFontSize} ({FONT_SIZE_MAP[fontSize].label})</strong>. Change this in Settings.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 7: Settings ───────────────────────────────────────────────────────

function SettingsScreen({ darkMode, fontSize, onDarkMode, onFontSize, onBack }: {
  darkMode: boolean
  fontSize: FontSize
  onDarkMode: (v: boolean) => void
  onFontSize: (v: FontSize) => void
  onBack: () => void
}) {
  const sizes: FontSize[] = ['sm', 'md', 'lg', 'xl']

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg)' }}>
      <Header title="Settings" onBack={onBack} />
      <div className="flex-1 px-5 pb-8">
        {/* Theme */}
        <div className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>Appearance</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--border)' }}>
            <SettingsRow label="Dark Mode" description="Use a deep green dark theme">
              <Toggle checked={darkMode} onChange={onDarkMode} />
            </SettingsRow>
          </div>
        </div>

        {/* Font size */}
        <div className="mt-6 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>Arabic Font Size</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--border)' }}>
            <SettingsRow label="Size" description="Affects the MP4 video and this preview">
              <div className="flex gap-1">
                {sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => onFontSize(s)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      background: fontSize === s ? 'var(--accent)' : 'var(--surface-2)',
                      color: fontSize === s ? 'var(--accent-fg)' : 'var(--fg-muted)',
                      fontFamily: 'var(--font-sans)',
                      border: 'none',
                      outline: 'none',
                    }}
                  >
                    {FONT_SIZE_MAP[s].label[0]}
                  </button>
                ))}
              </div>
            </SettingsRow>
          </div>
        </div>

        {/* Live preview */}
        <div className="mt-4 rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>Live preview — {FONT_SIZE_MAP[fontSize].label} ({FONT_SIZE_MAP[fontSize].arabic})</p>
          <div className="text-center" style={{ direction: 'rtl' }}>
            <div style={{
              fontFamily: 'Amiri, serif',
              fontSize: FONT_SIZE_MAP[fontSize].arabic,
              color: 'var(--fg)',
              lineHeight: 1.8,
            }}>
              وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ
            </div>
            <div className="mt-1 text-xs" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', direction: 'ltr' }}>
              Surah Adh-Dhariyat 51:56
            </div>
          </div>
        </div>

        {/* Default reciter (optional) */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>Preferences</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--border)' }}>
            <SettingsRow label="Default Reciter" description="Pre-select in new downloads">
              <span className="text-xs" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>None</span>
            </SettingsRow>
            <div style={{ height: '1px', background: 'var(--border)' }} />
            <SettingsRow label="Download Quality" description="Audio bitrate for MP3">
              <span className="text-xs font-medium" style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>128 kbps</span>
            </SettingsRow>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5" style={{ background: 'var(--surface)' }}>
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>{description}</div>
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 rounded-full transition-all duration-200"
      style={{
        width: '44px',
        height: '26px',
        background: checked ? 'var(--accent)' : 'var(--surface-2)',
        border: '2px solid',
        borderColor: checked ? 'var(--accent)' : 'var(--border)',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        className="absolute top-0.5 rounded-full shadow-sm transition-all duration-200"
        style={{
          width: '18px',
          height: '18px',
          background: 'white',
          left: checked ? 'calc(100% - 20px)' : '2px',
        }}
      />
    </button>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState<FontSize>('md')

  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null)
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null)
  const [startAyah, setStartAyah] = useState(1)
  const [endAyah, setEndAyah] = useState(1)
  const [downloadType, setDownloadType] = useState<DownloadType>('mp3')

  const go = (s: Screen) => {
    setPrevScreen(screen)
    setScreen(s)
  }

  const goSettings = () => {
    setPrevScreen(screen)
    setScreen('settings')
  }

  const goBack = () => {
    if (prevScreen) {
      setScreen(prevScreen)
      setPrevScreen(null)
    }
  }

  const renderScreen = () => {
    switch (screen) {
      case 'splash':
        return <SplashScreen onContinue={() => go('surah-list')} />

      case 'surah-list':
        return (
          <SurahListScreen
            onSelect={s => { setSelectedSurah(s); go('reciter') }}
            onSettings={goSettings}
          />
        )

      case 'reciter':
        return selectedSurah ? (
          <ReciterScreen
            surah={selectedSurah}
            onSelect={r => { setSelectedReciter(r); go('ayah-range') }}
            onBack={() => go('surah-list')}
            onSettings={goSettings}
          />
        ) : null

      case 'ayah-range':
        return (selectedSurah && selectedReciter) ? (
          <AyahRangeScreen
            surah={selectedSurah}
            reciter={selectedReciter}
            onContinue={(s, e) => { setStartAyah(s); setEndAyah(e); go('download-type') }}
            onBack={() => go('reciter')}
            onSettings={goSettings}
          />
        ) : null

      case 'download-type':
        return (selectedSurah && selectedReciter) ? (
          <DownloadTypeScreen
            surah={selectedSurah}
            reciter={selectedReciter}
            startAyah={startAyah}
            endAyah={endAyah}
            onSelect={t => { setDownloadType(t); go('downloading') }}
            onBack={() => go('ayah-range')}
            onSettings={goSettings}
          />
        ) : null

      case 'downloading':
        return (selectedSurah && selectedReciter) ? (
          <DownloadScreen
            surah={selectedSurah}
            reciter={selectedReciter}
            startAyah={startAyah}
            endAyah={endAyah}
            downloadType={downloadType}
            fontSize={fontSize}
            onBack={() => go('download-type')}
            onRestart={() => {
              setSelectedSurah(null)
              setSelectedReciter(null)
              go('surah-list')
            }}
          />
        ) : null

      case 'settings':
        return (
          <SettingsScreen
            darkMode={darkMode}
            fontSize={fontSize}
            onDarkMode={v => { setDarkMode(v) }}
            onFontSize={setFontSize}
            onBack={goBack}
          />
        )
    }
  }

  return (
    <div
      className={darkMode ? 'dark' : ''}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div
        className="flex-1 flex flex-col mx-auto w-full overflow-hidden"
        style={{
          maxWidth: '430px',
          background: 'var(--bg-color)',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {/* Global Background Image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'var(--bg-image)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
          }}
        />
        {/* Global Gradient Overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'var(--overlay-gradient)',
          zIndex: 0,
        }} />

        {/* Content Wrapper */}
        <div className="relative z-10 flex-1 flex flex-col" style={{ height: '100%' }}>
          {renderScreen()}
        </div>
      </div>
    </div>
  )
}
