import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import HuePicker from './HuePicker';
import './SearchBar.css';

interface SearchParams {
  // username: string;
  show_owned: boolean;
  country: string | null;
  year_from: string | null;
  year_to: string | null;
  denomination: string | null;
  theme: string | null;
  keywords: string[] | null;
  date_of_issue: string | null;
  category: string | null;
  number_issued: string | null;
  perforation_horizontal: string | null;
  perforation_vertical: string | null;
  perforation_keyword: string | null;
  sheet_size_amount: string | null;
  sheet_size_horizontal: string | null;
  sheet_size_vertical: string | null;
  stamp_size_horizontal: string | null;
  stamp_size_vertical: string | null;
  hue: number | null;
  saturation: number | null;
  tolerance: number | null;
  max_results: string;
}

interface SearchPayload {
  username?: string;
  country?: string;
  year_from?: number;
  year_to?: number;
  denomination?: number;
  theme?: string;
  keywords?: string[];
  date_of_issue?: string;
  category?: string;
  number_issued?: number;
  perforation_horizontal?: number;
  perforation_vertical?: number;
  perforation_keyword?: string;
  sheet_size_amount?: number;
  sheet_size_horizontal?: number;
  sheet_size_vertical?: number;
  stamp_size_horizontal?: number;
  stamp_size_vertical?: number;
  hue?: number;
  saturation?: number;
  tolerance?: number;
  max_results: number;
  show_owned?: boolean;
}

interface SearchBarProps {
  onSearch: (params: SearchPayload) => void;
  currentUser: string;
}

const categories = ['Commemorative', 'Definitive', 'Airmail', 'Special Delivery', 'Postage Due'];

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, currentUser }) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    // username: '',
    show_owned: false,
    country: null,
    year_from: null,
    year_to: null,
    denomination: null,
    theme: null,
    keywords: null,
    date_of_issue: null,
    category: null,
    number_issued: null,
    perforation_horizontal: null,
    perforation_vertical: null,
    perforation_keyword: null,
    sheet_size_amount: null,
    sheet_size_horizontal: null,
    sheet_size_vertical: null,
    stamp_size_horizontal: null,
    stamp_size_vertical: null,
    hue: null,
    saturation: null,
    tolerance: 15,
    max_results: '1000'
  });

  const [countries, setCountries] = useState<string[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryContainerRef = useRef<HTMLDivElement>(null);

  const [themes, setThemes] = useState<string[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<string[]>([]);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);

  const [keywordsText, setKeywordsText] = useState('');

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    if (searchParams.keywords?.length) {
      setKeywordsText(searchParams.keywords.join(', '));
    }
  }, []);

  useEffect(() => {
    // Fetch countries and themes when component mounts
    const fetchData = async () => {
      try {
        const [countriesResponse, themesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/countries'),
          axios.get('http://localhost:5000/api/themes')
        ]);
        setCountries(countriesResponse.data);
        setThemes(themesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Add click outside handler for both dropdowns
    const handleClickOutside = (event: MouseEvent) => {
      if (countryContainerRef.current && !countryContainerRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
      if (themeContainerRef.current && !themeContainerRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (field: keyof SearchParams, value: any) => {
    setSearchParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleChange('country', value);
    
    // Filter countries based on input
    if (value) {
      const filtered = countries.filter(country => 
        country.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCountries(filtered);
      setShowCountryDropdown(true);
    } else {
      setFilteredCountries([]);
      setShowCountryDropdown(false);
    }
  };

  const selectCountry = (country: string) => {
    handleChange('country', country);
    setShowCountryDropdown(false);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleChange('theme', value);
    
    // Filter themes based on input
    if (value) {
      const filtered = themes.filter(theme => 
        theme.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredThemes(filtered);
      setShowThemeDropdown(true);
    } else {
      setFilteredThemes([]);
      setShowThemeDropdown(false);
    }
  };

  const selectTheme = (theme: string) => {
    handleChange('theme', theme);
    setShowThemeDropdown(false);
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);

    // Prepare the payload
    const payload: SearchPayload = {
      max_results: parseInt(searchParams.max_results || '1000')
    };

    // Add non-null parameters
    if (searchParams.country) payload.country = searchParams.country;
    if (searchParams.year_from) payload.year_from = parseInt(searchParams.year_from);
    if (searchParams.year_to) payload.year_to = parseInt(searchParams.year_to);
    if (searchParams.theme) payload.theme = searchParams.theme;
    
    // Handle denomination
    if (searchParams.denomination) {
      payload.denomination = parseFloat(searchParams.denomination);
    }

    // Handle keywords
    if (keywordsText) {
      payload.keywords = keywordsText.split(',').map(kw => kw.trim()).filter(kw => kw);
    }

    // Handle username for owned stamps
    if (searchParams.show_owned) {
      payload.show_owned = true;
      payload.username = currentUser;
    }

    // Add color filtering if available
    if (searchParams.hue !== null && searchParams.saturation !== null) {
      payload.hue = searchParams.hue;
      payload.saturation = searchParams.saturation;
      payload.tolerance = searchParams.tolerance || 15;
    }

    // Perform search
    onSearch(payload);
    setLoading(false);
  };

  const handleToleranceChange = (tolerance: number) => {
    setSearchParams({
      ...searchParams,
      tolerance
    });
  };

  const handleKeywordsChange = (value: string) => {
    setKeywordsText(value);
    // Only split into keywords when submitting or when there's actual content
    const keywords = value.trim() ? value.split(',').map(k => k.trim()).filter(k => k) : [];
    handleChange('keywords', keywords);
  };

  const handleMaxResultsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only update if value is empty or a valid number
    if (value === '' || /^\d+$/.test(value)) {
      handleChange('max_results', value || '1000');
    }
  };

  return (
    <div className="search-bar">
      <div className="search-header">
        <div className="search-results-title">Search Filters</div>
        <button 
          className="search-submit-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search Stamps'}
        </button>
      </div>

      <div className="search-section">
        <div className="search-box">
          {/* <div className="single-input">
            <div className={`single-input-title ${searchParams.username ? 'visible' : ''}`}>Username</div>
            <input
              type="text"
              placeholder="Username"
              value={searchParams.username}
              onChange={(e) => handleChange('username', e.target.value)}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
            />
          </div> */}
          <div className="toggle-container">
            <label className="toggle-switch">
              <span className="toggle-label">Show Only My Stamps</span>
              <input
                type="checkbox"
                checked={searchParams.show_owned}
                onChange={(e) => handleChange('show_owned', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="autocomplete-container" ref={countryContainerRef}>
            <div className="single-input">
              <div className={`single-input-title ${searchParams.country ? 'visible' : ''}`}>Country</div>
              <input
                type="text"
                placeholder="Country"
                value={searchParams.country || ''}
                onChange={handleCountryChange}
                onFocus={() => setShowCountryDropdown(true)}
                autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
              />
            </div>
            {showCountryDropdown && filteredCountries.length > 0 && (
              <div className="autocomplete-dropdown">
                {filteredCountries.map((country, index) => (
                  <div
                    key={index}
                    className="autocomplete-item"
                    onClick={() => selectCountry(country)}
                  >
                    {country}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="autocomplete-container" ref={themeContainerRef}>
            <div className="single-input">
              <div className={`single-input-title ${searchParams.theme ? 'visible' : ''}`}>Theme</div>
              <input
                type="text"
                placeholder="Theme"
                value={searchParams.theme || ''}
                onChange={handleThemeChange}
                onFocus={() => setShowThemeDropdown(true)}
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck="false"
                />
            </div>
            {showThemeDropdown && filteredThemes.length > 0 && (
              <div className="autocomplete-dropdown">
                {filteredThemes.map((theme, index) => (
                  <div
                    key={index}
                    className="autocomplete-item"
                    onClick={() => selectTheme(theme)}
                  >
                    {theme}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <div className="single-input">
              <div className={`single-input-title ${searchParams.year_from ? 'visible' : ''}`}>Year From</div>
              <input
                type="number"
                placeholder="Year From"
                value={searchParams.year_from || ''}
                onChange={(e) => handleChange('year_from', e.target.value)}
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck="false"
                onKeyDown={(e) => {
                  if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
            <div className="single-input">
              <div className={`single-input-title ${searchParams.year_to ? 'visible' : ''}`}>Year To</div>
              <input
                type="number"
                placeholder="Year To"
                value={searchParams.year_to || ''}
                onChange={(e) => handleChange('year_to', e.target.value)}
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck="false"
                onKeyDown={(e) => {
                  if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>

          <div className="single-input">
            <div className={`single-input-title ${searchParams.denomination ? 'visible' : ''}`}>Denomination</div>
            <input
              type="number"
              placeholder="Denomination"
              value={searchParams.denomination || ''}
              onChange={(e) => handleChange('denomination', e.target.value)}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
              onKeyDown={(e) => {
                if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', ".", ","].includes(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </div>

          <div className="single-input">
            <div className={`single-input-title ${searchParams.keywords ? 'visible' : ''}`}>Keywords (comma-separated)</div>
            <textarea
              placeholder="Keywords (comma-separated)"
              value={keywordsText}
              onChange={(e) => {
                const value = e.target.value;
                handleKeywordsChange(value);
                // Auto-adjust height only if content exceeds initial height
                if (e.target.scrollHeight > 57) {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight + 2}px`;
                } else {
                  e.target.style.height = '57px';
                }
              }}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
              rows={1}
              className="keywords-textarea"
            />
          </div>

          <div className="hue-picker-wrapper">
            <div className="single-input">
              <div className={`single-input-title ${searchParams.hue ? 'visible' : ''}`}>Color</div>
              <HuePicker
                value={searchParams.hue}
                saturation={searchParams.saturation}
                onChange={(hue, saturation) => {
                  setSearchParams({
                    ...searchParams,
                    hue,
                    saturation
                  });
                }}
                baseTolerance={searchParams.tolerance || 10}
                onToleranceChange={handleToleranceChange}
              />
            </div>
          </div>

          <div 
            className="advanced-options-title" 
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            Advanced Search Options
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none"
              style={{
                marginLeft: '1rem',
                transform: showAdvancedOptions ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            >
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div style={{
            maxHeight: showAdvancedOptions ? '1000px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-in-out',
            width: '100%',
          }}>
            <div className="advanced-options-content">
              <div className="single-input">
                <div className={'single-input-title visible'}>Date of Issue</div>
                <input
                  type="date"
                  value={searchParams.date_of_issue || ''}
                  onChange={(e) => handleChange('date_of_issue', e.target.value)}
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>

              <div className="single-input">
                <div className={'single-input-title visible'}>Category</div>
                <select
                  value={searchParams.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="single-input">
                <div className={`single-input-title ${searchParams.number_issued ? 'visible' : ''}`}>Number Issued</div>
                <input
                  type="number"
                  placeholder="Number Issued"
                  value={searchParams.number_issued || ''}
                  onChange={(e) => handleChange('number_issued', e.target.value)}
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck="false"
                  onKeyDown={(e) => {
                    if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>

              <div className="input-group">
                <div className="single-input">
                  <div className={`single-input-title ${searchParams.perforation_horizontal ? 'visible' : ''}`}>Perforation Horizontal</div>
                  <input
                    type="number"
                    placeholder="Perforation Horizontal"
                    value={searchParams.perforation_horizontal || ''}
                    onChange={(e) => handleChange('perforation_horizontal', e.target.value)}
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck="false"
                    onKeyDown={(e) => {
                      if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
                <div className="single-input">
                  <div className={`single-input-title ${searchParams.perforation_vertical ? 'visible' : ''}`}>Perforation Vertical</div>
                  <input
                    type="number"
                    placeholder="Perforation Vertical"
                    value={searchParams.perforation_vertical || ''}
                    onChange={(e) => handleChange('perforation_vertical', e.target.value)}
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck="false"
                    onKeyDown={(e) => {
                      if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="single-input">
                <div className={`single-input-title ${searchParams.perforation_keyword ? 'visible' : ''}`}>Perforation Keyword</div>
                <input
                  type="text"
                  placeholder="Perforation Keyword"
                  value={searchParams.perforation_keyword || ''}
                  onChange={(e) => handleChange('perforation_keyword', e.target.value)}
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>

              <div className="single-input">
                <div className={`single-input-title ${searchParams.sheet_size_amount ? 'visible' : ''}`}>Sheet Size Amount</div>
                <input
                  type="number"
                  placeholder="Sheet Size Amount"
                  value={searchParams.sheet_size_amount || ''}
                  onChange={(e) => handleChange('sheet_size_amount', e.target.value)}
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck="false"
                  onKeyDown={(e) => {
                    if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>

              <div className="input-group">
                <div className="single-input">
                  <div className={`single-input-title ${searchParams.sheet_size_horizontal ? 'visible' : ''}`}>Sheet Size Horizontal</div>
                  <input
                    type="number"
                    placeholder="Sheet Size Horizontal"
                    value={searchParams.sheet_size_horizontal || ''}
                    onChange={(e) => handleChange('sheet_size_horizontal', e.target.value)}
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck="false"
                    onKeyDown={(e) => {
                      if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    />
                </div>
                <div className="single-input">
                  <div className={`single-input-title ${searchParams.sheet_size_vertical ? 'visible' : ''}`}>Sheet Size Vertical</div>
                  <input
                    type="number"
                    placeholder="Sheet Size Vertical"
                    value={searchParams.sheet_size_vertical || ''}
                    onChange={(e) => handleChange('sheet_size_vertical', e.target.value)}
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck="false"
                    onKeyDown={(e) => {
                      if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="single-input">
                  <div className={`single-input-title ${searchParams.stamp_size_horizontal ? 'visible' : ''}`}>Stamp Size Horizontal</div>
                  <input
                    type="number"
                    placeholder="Stamp Size Horizontal"
                    value={searchParams.stamp_size_horizontal || ''}
                    onChange={(e) => handleChange('stamp_size_horizontal', e.target.value)}
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck="false"
                    onKeyDown={(e) => {
                      if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
                <div className="single-input">
                  <div className={`single-input-title ${searchParams.stamp_size_vertical ? 'visible' : ''}`}>Stamp Size Vertical</div>
                  <input
                    type="number"
                    placeholder="Stamp Size Vertical"
                    value={searchParams.stamp_size_vertical || ''}
                    onChange={(e) => handleChange('stamp_size_vertical', e.target.value)}
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck="false"
                    onKeyDown={(e) => {
                      if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  /> 
                </div>
              </div>

              <div className="single-input">
                <div className={`single-input-title ${searchParams.max_results ? 'visible' : ''}`}>Max Results</div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="Max Results"
                  value={searchParams.max_results}
                  onChange={handleMaxResultsChange}
                  className="max-results-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;