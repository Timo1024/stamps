import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

import StampCard from './components/StampCard';
import SearchBar from './components/SearchBar';
import HuePicker from './components/HuePicker';

interface Stamp {
  added_at: string;
  amount_letter_fdc: number | null;
  amount_minted: number | null;
  amount_unused: number | null;
  amount_used: number;
  category: string;
  color: string;
  color_palette: string;
  country: string;
  date_of_issue: string;
  denomination: string;
  description: string;
  designed: string;
  engraved: string;
  height: number | null;
  height_width: string | null;
  image_accuracy: number;
  image_path: string;
  letter_fdc: number | null;
  letter_fdc_float: number | null;
  mint_condition: string;
  mint_condition_float: number;
  name: string;
  note: string | null;
  number: string;
  number_issued: number;
  perforation_horizontal: number;
  perforation_keyword: string;
  perforation_vertical: number;
  perforations: string;
  set_description: string;
  set_id: number;
  sheet_size: string;
  sheet_size_amount: number | null;
  sheet_size_note: string | null;
  sheet_size_x: number | null;
  sheet_size_y: number | null;
  stamp_id: number;
  stamps_issued: string;
  themes: string;
  type: string;
  unused: number | null;
  unused_float: number | null;
  url: string;
  used: string;
  used_float: number;
  user_id: number;
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
}

function App() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [error, setError] = useState<string>('');
  const [imageLinks, setImageLinks] = useState<string[]>([]);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);

  const fetchStamps = async (payload: SearchPayload) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/stamps/search`, payload);
      setStamps(response.data);
      setError('');

      // Extract and modify image paths
      const links = response.data.map((stamp: Stamp) => {
        if (!stamp.image_path) {
          return "";
        }
        return stamp.image_path.replace('./images_all_2/', '');
      });
      setImageLinks(links);
    } catch (err) {
      setError('Error fetching stamps data.');
      console.error("Error fetching stamps data:", err);
    }
  };


  return (
    <div className="App">
      <div className="title">Stamp Collection Search</div>
      
      <div className="main-container">
        <div className="search-sidebar">
          <SearchBar onSearch={fetchStamps} />
        </div>

        <div className="results-container">
          {error && <p className="error-message">{error}</p>}

          <div>
            <h2 className="search-results-title">Search Results:</h2>
            <div className="stamps-container">
              {stamps.length > 0 ? (
                stamps.map((stamp, index) => (
                  <StampCard 
                    key={stamp.stamp_id}
                    country={stamp.country}
                    name={stamp.name}
                    imageLink={stamp.image_path ? stamp.image_path.replace('./images_all_2/', '') : null}
                    colorPalette={stamp.color_palette}
                  />
                ))
              ) : (
                <p>No stamps found matching your search criteria.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
