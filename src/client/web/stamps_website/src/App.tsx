import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './App.css';

import StampCard from './components/StampCard';
import SearchBar from './components/SearchBar';
import HuePicker from './components/HuePicker';

interface Stamp {
  // added_at: string;
  amount_letter_fdc: number | null;
  amount_unused: number | null;
  amount_used: number;
  // amount_minted: number | null;
  category: string;
  // color: string;
  color_palette: string;
  country: string;
  date_of_issue: string;
  denomination: string;
  description: string;
  // designed: string;
  // engraved: string;
  height: number | null;
  height_width: string | null;
  // image_accuracy: number;
  image_path: string;
  letter_fdc: number | null;
  letter_fdc_float: number | null;
  mint_condition: string;
  mint_condition_float: number;
  // name: string;
  // note: string | null;
  number: string;
  number_issued: number;
  perforation_horizontal: number;
  perforation_keyword: string;
  perforation_vertical: number;
  perforations: string;
  // set_description: string;
  set_name: string;
  // set_id: number;
  sheet_size: string;
  sheet_size_amount: number | null;
  // sheet_size_note: string | null;
  sheet_size_x: number | null;
  sheet_size_y: number | null;
  stamp_id: number;
  // stamps_issued: string;
  // themes: string;
  type: string;
  unused: number | null;
  unused_float: number | null;
  // url: string;
  used: string;
  used_float: number;
  // user_id: number;
  value_from: number;
  value_to: number;
  width: number | null;
  year: number;
}

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
  page?: number;
  page_size?: number;
}

interface SearchResponse {
  stamps: Stamp[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

function App() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [currentSearchPayload, setCurrentSearchPayload] = useState<SearchPayload | null>(null);

  // Intersection Observer setup
  const observer = useRef<IntersectionObserver>();
  const lastStampElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchStamps = async (payload: SearchPayload, isNewSearch: boolean = true) => {
    try {
      setLoading(true);
      setError('');
      
      const searchPayload = {
        ...payload,
        page: isNewSearch ? 0 : page,
        page_size: 20
      };

      if (isNewSearch) {
        setStamps([]);
        setPage(0);
        setHasMore(true);
        setCurrentSearchPayload(searchPayload);
      }

      const response = await axios.post<SearchResponse>(`http://localhost:5000/api/stamps/search`, searchPayload);
      
      setStamps(prev => isNewSearch ? response.data.stamps : [...prev, ...response.data.stamps]);
      setHasMore(response.data.has_more);
      setError('');
    } catch (err) {
      setError('Error fetching stamps data.');
      console.error("Error fetching stamps data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to load more stamps when page changes
  useEffect(() => {
    if (page > 0 && currentSearchPayload) {
      fetchStamps(currentSearchPayload, false);
    }
  }, [page]);

  return (
    <div className="App">
      <div className="title">Stamp Collection Search</div>
      
      <div className="main-container">
        <div className="search-sidebar">
          <SearchBar onSearch={(payload) => fetchStamps(payload, true)} />
        </div>

        <div className="results-container">
          {error && <p className="error-message">{error}</p>}

          <div>
            <h2 className="search-results-title">Search Results:</h2>
            <div className="stamps-container">
              {stamps.length > 0 ? (
                stamps.map((stamp, index) => (
                  <div
                    ref={index === stamps.length - 1 ? lastStampElementRef : null}
                    key={`${stamp.stamp_id}-${index}`}
                    className="stamp-card-wrapper"
                  >
                    <StampCard 
                      country={stamp.country}
                      name={stamp.set_name}
                      imageLink={stamp.image_path ? stamp.image_path.replace('./images_all_2/', '') : null}
                      colorPalette={stamp.color_palette}
                    />
                  </div>
                ))
              ) : (
                <p>No stamps found matching your search criteria.</p>
              )}
              {loading && <div className="loading">Loading more stamps...</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
