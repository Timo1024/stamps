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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [gridColumns, setGridColumns] = useState(4); // Default value
  const basePageSize = 40; // Base number of items per page
  const [currentSearchPayload, setCurrentSearchPayload] = useState<SearchPayload | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Calculate the actual page size based on grid columns
  const getAdjustedPageSize = useCallback(() => {
    return Math.ceil(basePageSize / gridColumns) * gridColumns;
  }, [gridColumns]);

  // Update grid columns based on container width
  const updateGridColumns = useCallback(() => {
    const container = document.querySelector('.stamps-container');
    if (container) {
      const computedStyle = window.getComputedStyle(container);
      const gridTemplateColumns = computedStyle.getPropertyValue('grid-template-columns');
      const columnCount = gridTemplateColumns.split(' ').length;
      if (columnCount !== gridColumns) {
        setGridColumns(columnCount);
      }
    }
  }, [gridColumns]);

  // Add resize observer to update grid columns
  useEffect(() => {
    const container = document.querySelector('.stamps-container');
    if (container) {
      const resizeObserver = new ResizeObserver(() => {
        updateGridColumns();
      });
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }
  }, [updateGridColumns]);

  // Initial grid columns calculation
  useEffect(() => {
    updateGridColumns();
  }, [updateGridColumns]);

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

  const fetchStamps = useCallback(async (searchPayload: SearchPayload, isNewSearch: boolean = false) => {
    try {
      setLoading(true);
      setHasSearched(true);
      
      if (isNewSearch) {
        setStamps([]); // Clear stamps immediately
        setPage(1);
        setCurrentSearchPayload(searchPayload);
      }

      const response = await axios.post<SearchResponse>(`http://localhost:5000/api/stamps/search`, {
        ...searchPayload,
        page: isNewSearch ? 1 : page,
        page_size: getAdjustedPageSize()
      });
      
      setStamps(prev => isNewSearch ? response.data.stamps : [...prev, ...response.data.stamps]);
      setTotalCount(response.data.total_count);
      setHasMore(response.data.has_more);
      setError(null);
    } catch (err) {
      setError('Error fetching stamps data.');
      setStamps([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, getAdjustedPageSize]);

  // Effect to load more stamps when page changes
  useEffect(() => {
    if (page > 1 && currentSearchPayload) {
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
            <div className="search-results-title">Search Results {totalCount > 0 ? `(${totalCount} stamps found)` : ''}</div>
            <div className="stamps-container">
              {loading && !stamps.length ? (
                <div style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ fontWeight: 300, fontSize: '1rem' }}>Searching for stamps...</div>
                </div>
              ) : !loading && !stamps.length ? (
                  <div style={{
                    width: '100%',
                    // textAlign: 'center',
                    // make text align left
                    textAlign: 'left',
                  }}>
                    <div style={{ 
                    // small font weight
                    fontWeight: 300,
                    // small font size
                    fontSize: '1rem',
                   }}>
                    {hasSearched 
                      ? "No stamps found matching your search criteria."
                      : "Use the search filters on the left to find stamps."}
                  </div>
                </div>
              ) : (
                stamps.map((stamp, index) => {
                  return (
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
                  );
                })
              )}
            </div>
            {loading && stamps.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '1rem' }}>
                <h3>Loading more stamps...</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
