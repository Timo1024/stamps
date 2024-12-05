import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import HuePicker from './HuePicker';

interface SearchPayload {
  username: string;
  country: string | null;
  year_from: number | null;
  year_to: number | null;
  denomination: number | null;
  theme: string | null;
  keywords: string[] | null;
  date_of_issue: string | null;
  category: string | null;
  number_issued: number | null;
  perforation_horizontal: number | null;
  perforation_vertical: number | null;
  perforation_keyword: string | null;
  sheet_size_amount: number | null;
  sheet_size_horizontal: number | null;
  sheet_size_vertical: number | null;
  stamp_size_horizontal: number | null;
  stamp_size_vertical: number | null;
  hue: number | null;
  saturation: number | null;
  tolerance: number | null;
}

interface SearchBarProps {
  onSearch: (payload: SearchPayload) => void;
}

const categories = ['Commemorative', 'Definitive', 'Airmail', 'Special Delivery', 'Postage Due'];

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchParams, setSearchParams] = useState<SearchPayload>({
    username: '',
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
    hue: 180,
    saturation: 60,
    tolerance: 15
  });

  const [countries, setCountries] = useState<string[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryContainerRef = useRef<HTMLDivElement>(null);

  const [themes, setThemes] = useState<string[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<string[]>([]);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeContainerRef = useRef<HTMLDivElement>(null);

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

  const handleChange = (field: keyof SearchPayload, value: any) => {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  const handleToleranceChange = (tolerance: number) => {
    handleChange('tolerance', tolerance);
  };

  return (
    <div style={{ padding: '0px', maxWidth: '600px', margin: '0 auto' }}>
      <form 
        onSubmit={handleSubmit} 
        autoComplete="off" 
        autoCorrect="off"
        spellCheck="false"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start'}}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Search</div>
          <input
            type="text"
            placeholder="Username"
            value={searchParams.username}
            onChange={(e) => handleChange('username', e.target.value)}
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck="false"
          />

          <div className="autocomplete-container" ref={countryContainerRef}>
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

          <div style={{ display: 'flex', gap: '10px', width: '100%'}}>
            <input
              type="number"
              placeholder="Year From"
              value={searchParams.year_from || ''}
              onChange={(e) => handleChange('year_from', e.target.value ? Number(e.target.value) : null)}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
            />
            <input
              type="number"
              placeholder="Year To"
              value={searchParams.year_to || ''}
              onChange={(e) => handleChange('year_to', e.target.value ? Number(e.target.value) : null)}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <input
            type="number"
            placeholder="Denomination"
            value={searchParams.denomination || ''}
            onChange={(e) => handleChange('denomination', e.target.value ? Number(e.target.value) : null)}
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck="false"
          />

          <input
            type="text"
            placeholder="Keywords (comma-separated)"
            value={searchParams.keywords?.join(', ') || ''}
            onChange={(e) => handleChange('keywords', e.target.value ? e.target.value.split(',').map(k => k.trim()) : null)}
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck="false"
          />

          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Advanced Search Options</div>

          <div style={{ marginBottom: '0.5rem', width: '100%' }}>
            {/* <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Color:</div> */}
            <HuePicker
              value={searchParams.hue || 0}
              saturation={searchParams.saturation || 100}
              onChange={(hue, saturation) => {
                setSearchParams(prev => ({
                  ...prev,
                  hue,
                  saturation,
                }));
              }}
              baseTolerance={searchParams.tolerance || 10}
              onToleranceChange={handleToleranceChange}
            />
          </div>

          <input
            type="date"
            value={searchParams.date_of_issue || ''}
            onChange={(e) => handleChange('date_of_issue', e.target.value)}
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck="false"
          />

          <select
            value={searchParams.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Number Issued"
            value={searchParams.number_issued || ''}
            onChange={(e) => handleChange('number_issued', e.target.value ? Number(e.target.value) : null)}
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck="false"
          />

          <div style={{ display: 'flex', gap: '10px', width: '100%'}}>
            <input
              type="number"
              placeholder="Perforation Horizontal"
              value={searchParams.perforation_horizontal || ''}
              onChange={(e) => handleChange('perforation_horizontal', e.target.value ? Number(e.target.value) : null)}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
            />
            <input
              type="number"
              placeholder="Perforation Vertical"
              value={searchParams.perforation_vertical || ''}
              onChange={(e) => handleChange('perforation_vertical', e.target.value ? Number(e.target.value) : null)}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <input
            type="text"
            placeholder="Perforation Keyword"
            value={searchParams.perforation_keyword || ''}
            onChange={(e) => handleChange('perforation_keyword', e.target.value)}
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck="false"
          />

          <input
            type="number"
            placeholder="Sheet Size Amount"
            value={searchParams.sheet_size_amount || ''}
            onChange={(e) => handleChange('sheet_size_amount', e.target.value ? Number(e.target.value) : null)}
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck="false"
          />

          <div style={{ display: 'flex', gap: '10px', width: '100%'}}>
            <input
              type="number"
              placeholder="Sheet Size Horizontal"
              value={searchParams.sheet_size_horizontal || ''}
              onChange={(e) => handleChange('sheet_size_horizontal', e.target.value ? Number(e.target.value) : null)}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
            />
            <input
              type="number"
              placeholder="Sheet Size Vertical"
              value={searchParams.sheet_size_vertical || ''}
              onChange={(e) => handleChange('sheet_size_vertical', e.target.value ? Number(e.target.value) : null)}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', width: '100%'}}>
            <input
              type="number"
              placeholder="Stamp Size Horizontal"
              value={searchParams.stamp_size_horizontal || ''}
              onChange={(e) => handleChange('stamp_size_horizontal', e.target.value ? Number(e.target.value) : null)}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
            />
            <input
              type="number"
              placeholder="Stamp Size Vertical"
              value={searchParams.stamp_size_vertical || ''}
              onChange={(e) => handleChange('stamp_size_vertical', e.target.value ? Number(e.target.value) : null)}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <button type="submit">Search</button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;