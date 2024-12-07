import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './App.css';

import StampCard from './components/StampCard';
import SearchBar from './components/SearchBar';
import HuePicker from './components/HuePicker';
import Auth from './components/Auth';

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

interface EstimateResponse {
  estimated_count: number;
  error?: string;
  detail?: string;
}

interface SearchResponse {
  stamps: Stamp[];
  total_count: number;
  error?: string;
  detail?: string;
}

const PAGE_SIZE = 20;

function App() {
  const [searchParams, setSearchParams] = useState({});
  const [allStamps, setAllStamps] = useState<Stamp[]>([]);  // All stamps from server
  const [visibleStamps, setVisibleStamps] = useState<Stamp[]>([]); // Currently visible stamps
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const handleAuthSuccess = (username: string) => {
    setIsAuthenticated(true);
    setCurrentUser(username);
  };

  // Intersection Observer for infinite scroll
  const observer = useRef<IntersectionObserver>();
  const lastStampElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleStamps.length < allStamps.length) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, visibleStamps.length, allStamps.length]);

  // Load more stamps when page changes
  useEffect(() => {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    setVisibleStamps(allStamps.slice(0, end));
  }, [page, allStamps]);

  const handleSearch = useCallback(async (searchParams: any) => {
    setLoading(true);
    setError(null);
    setPage(0);
    setVisibleStamps([]);
    
    try {
      // Get all results at once
      const response = await axios.post<SearchResponse>('http://localhost:5000/api/stamps/search', searchParams);
      
      if (response.data.error) {
        throw new Error(response.data.detail || response.data.error);
      }

      const stamps = Array.isArray(response.data.stamps) ? response.data.stamps : [];
      console.log('Total stamps loaded:', stamps.length);

      const maxResults = searchParams.max_results || 1000;
      if (stamps.length > maxResults) {
        setError(`Too many results (${stamps.length}). Please use more specific search filters or increase the maximum results limit (currently set to ${maxResults}).`);
        setAllStamps([]);
        setVisibleStamps([]);
        return;
      }
      
      setAllStamps(stamps);
      setTotalCount(stamps.length);
      setVisibleStamps(stamps.slice(0, PAGE_SIZE));
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setAllStamps([]);
      setVisibleStamps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="App">
      {!isAuthenticated ? (
        <Auth onAuthSuccess={handleAuthSuccess} />
      ) : (
        <div>
          <div className="title">
            <span>Stamp Collection Search</span>
            <span className="user-info">Welcome, {currentUser}!</span>
          </div>
          
          <div className="main-container">
            <div className="search-sidebar">
              <SearchBar onSearch={handleSearch} currentUser={currentUser || ''} />
            </div>

            <div className="results-container">
              {error ? (
                <div className="error-message">{error}</div>
              ) : visibleStamps.length === 0 ? (
                loading ? (
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <h3>Loading stamps...</h3>
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    textAlign: 'left',
                  }}>
                    <div style={{ 
                      fontWeight: 300,
                      fontSize: '1rem',
                    }}>
                      Use the search filters on the left to find stamps.
                    </div>
                  </div>
                )
              ) : (
                <div>
                  <div className="search-results-title">
                    Search Results {totalCount > 0 ? `(${totalCount} stamps found)` : ''}
                  </div>
                  <div className="stamps-container">
                    {visibleStamps.map((stamp, index) => (
                      <div
                        key={`${stamp.stamp_id}-${index}`}
                        ref={index === visibleStamps.length - 1 ? lastStampElementRef : undefined}
                        className="stamp-card-wrapper"
                      >
                        <StampCard
                          country={stamp.country}
                          name={stamp.set_name}
                          imageLink={stamp.image_path ? stamp.image_path.replace('./images_all_2/', '') : null}
                          colorPalette={stamp.color_palette}
                        />
                      </div>
                    ))}

                    {loading && (
                      <div style={{ 
                        width: '100%',
                        textAlign: 'center', 
                        padding: '1rem',
                        gridColumn: '1 / -1'
                      }}>
                        <h3>Loading more stamps...</h3>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
