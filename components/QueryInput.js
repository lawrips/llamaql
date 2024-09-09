import React, { useState } from 'react';
import { Search } from 'lucide-react';

const QueryInput = ({ userQuery, setUserQuery, queryOptions, handleOptionSelect, showDropdown, setShowDropdown }) => {
  //const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="autocomplete-container">
      <div className="relative">
        <input
          className="autocomplete-input"
          value={userQuery}
          onChange={(e) => {
            setUserQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          type="text"
          placeholder="Natural Language Query"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      {showDropdown && (
        <div className="autocomplete-dropdown">
          {queryOptions
            .filter(option => option.toLowerCase().includes(userQuery.toLowerCase()))
            .map((option, index) => (
              <div
                className="autocomplete-option"
                key={index}
                onMouseDown={(e) => handleOptionSelect(e, option)}>
                {option}
              </div>
            ))}
        </div>            
      )}
    </div>
  );
};

export default QueryInput;