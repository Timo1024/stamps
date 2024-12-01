import React, { useState } from 'react';
import './App.css';
import axios from 'axios';

import StampCard from './components/StampCard';

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

function App() {
  const [username, setUsername] = useState<string>('');
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [error, setError] = useState<string>('');
  const [imageLinks, setImageLinks] = useState<string[]>([]);

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const fetchStamps = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/stamps/by_username/${username}`);
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
    }
  };

  const handleButtonClick = () => {
    if (username) {
      fetchStamps();
    } else {
      setError('Please enter a username.');
    }
  };

  return (
    <div className="App">
      <h1 className='title'>Stamp Ownership</h1>
      <div className='input-container'>
        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={handleUsernameChange}
          className='username-input'
        />
        <div onClick={handleButtonClick} className='get-stamps-button'>
          Get Stamps
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <h2>Stamps Owned:</h2>
        <div className="stamps-container">
          {stamps.length > 0 ? (
            stamps.map((stamp, index) => (
              <StampCard 
                key={stamp.stamp_id}
                country={stamp.country}
                name={stamp.name}
                imageLink={imageLinks[index] || null}
              />
            ))
          ) : (
            <p>No stamps found for this user.</p>
          )}
        </div>
      </div>

      {/* <div>
        <h2>Stamps Owned:</h2>
        <ul>
          {stamps.length > 0 ? (
            stamps.map((stamp) => (
              <li key={stamp.stamp_id}>
                {stamp.country} - {stamp.name}
              </li>
            ))
          ) : (
            <p>No stamps found for this user.</p>
          )}
        </ul>
      </div>

      <div>
        <h2>Stamp Images:</h2>
        <div>
        {imageLinks
          .map((link, index) => (
            <img 
              key={index} 
              src={link ? `http://localhost:5000/images/${link}` : '/assets/images/stamp_placeholder_2.jpg'} 
              alt={`Stamp ${index}`} 
              className='stamp-image'
            />
          ))}
        </div>
      </div> */}
    </div>
  );
}

export default App;
