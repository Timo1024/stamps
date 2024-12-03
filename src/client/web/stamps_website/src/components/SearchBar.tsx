import React, { useState } from 'react';

interface SearchPayload {
  username: string;
  country: string | null;
  year_from: number | null;
  year_to: number | null;
  denomination: number | null;
  theme: string | null;
  keywords: string[] | null;
  colors: string[] | null;
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
}

interface SearchBarProps {
  onSearch: (payload: SearchPayload) => void;
}

const categories = ['Commemorative', 'Definitive', 'Airmail', 'Special Delivery', 'Postage Due'];
const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Brown', 'Purple', 'Orange'];

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchParams, setSearchParams] = useState<SearchPayload>({
    username: '',
    country: null,
    year_from: null,
    year_to: null,
    denomination: null,
    theme: null,
    keywords: null,
    colors: null,
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
  });

  const handleChange = (field: keyof SearchPayload, value: any) => {
    setSearchParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  return (
    <div style={{ padding: '0px', maxWidth: '600px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start'}}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Search</div>
          <input
            type="text"
            placeholder="Username"
            value={searchParams.username}
            onChange={(e) => handleChange('username', e.target.value)}
          />

          <input
            type="text"
            placeholder="Country"
            value={searchParams.country || ''}
            onChange={(e) => handleChange('country', e.target.value)}
          />

          <div style={{ display: 'flex', gap: '10px', width: '100%'}}>
            <input
              type="number"
              placeholder="Year From"
              value={searchParams.year_from || ''}
              onChange={(e) => handleChange('year_from', e.target.value ? Number(e.target.value) : null)}
            />
            <input
              type="number"
              placeholder="Year To"
              value={searchParams.year_to || ''}
              onChange={(e) => handleChange('year_to', e.target.value ? Number(e.target.value) : null)}
            />
          </div>

          <input
            type="number"
            placeholder="Denomination"
            value={searchParams.denomination || ''}
            onChange={(e) => handleChange('denomination', e.target.value ? Number(e.target.value) : null)}
          />

          <input
            type="text"
            placeholder="Theme"
            value={searchParams.theme || ''}
            onChange={(e) => handleChange('theme', e.target.value)}
          />

          <input
            type="text"
            placeholder="Keywords (comma-separated)"
            value={searchParams.keywords?.join(', ') || ''}
            onChange={(e) => handleChange('keywords', e.target.value ? e.target.value.split(',').map(k => k.trim()) : null)}
          />

          <select
            multiple
            value={searchParams.colors || []}
            onChange={(e) => handleChange('colors', Array.from(e.target.selectedOptions, option => option.value))}
          >
            {colors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>

          <input
            type="date"
            value={searchParams.date_of_issue || ''}
            onChange={(e) => handleChange('date_of_issue', e.target.value)}
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
          />

          <div style={{ display: 'flex', gap: '10px', width: '100%'}}>
            <input
              type="number"
              placeholder="Perforation Horizontal"
              value={searchParams.perforation_horizontal || ''}
              onChange={(e) => handleChange('perforation_horizontal', e.target.value ? Number(e.target.value) : null)}
            />
            <input
              type="number"
              placeholder="Perforation Vertical"
              value={searchParams.perforation_vertical || ''}
              onChange={(e) => handleChange('perforation_vertical', e.target.value ? Number(e.target.value) : null)}
            />
          </div>

          <input
            type="text"
            placeholder="Perforation Keyword"
            value={searchParams.perforation_keyword || ''}
            onChange={(e) => handleChange('perforation_keyword', e.target.value)}
          />

          <input
            type="number"
            placeholder="Sheet Size Amount"
            value={searchParams.sheet_size_amount || ''}
            onChange={(e) => handleChange('sheet_size_amount', e.target.value ? Number(e.target.value) : null)}
          />

          <div style={{ display: 'flex', gap: '10px', width: '100%'}}>
            <input
              type="number"
              placeholder="Sheet Size Horizontal"
              value={searchParams.sheet_size_horizontal || ''}
              onChange={(e) => handleChange('sheet_size_horizontal', e.target.value ? Number(e.target.value) : null)}
            />
            <input
              type="number"
              placeholder="Sheet Size Vertical"
              value={searchParams.sheet_size_vertical || ''}
              onChange={(e) => handleChange('sheet_size_vertical', e.target.value ? Number(e.target.value) : null)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', width: '100%'}}>
            <input
              type="number"
              placeholder="Stamp Size Horizontal"
              value={searchParams.stamp_size_horizontal || ''}
              onChange={(e) => handleChange('stamp_size_horizontal', e.target.value ? Number(e.target.value) : null)}
            />
            <input
              type="number"
              placeholder="Stamp Size Vertical"
              value={searchParams.stamp_size_vertical || ''}
              onChange={(e) => handleChange('stamp_size_vertical', e.target.value ? Number(e.target.value) : null)}
            />
          </div>

          <button type="submit">Search</button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;