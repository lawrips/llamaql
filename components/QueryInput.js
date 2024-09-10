import React, { useState } from 'react';
import { Search } from 'lucide-react';

const QueryInput = ({ userQuery, setUserQuery, queryOptions, handleOptionSelect, showDropdown, setShowDropdown, setFocusedInput, getInputStyle, handleKeyDown }) => {

    return (

        <div style={getInputStyle('query')} className="relative">
            <input
                className="w-full p-2 border rounded"
                style={{ width: '100%', boxSizing: 'border-box', paddingRight: '2.5rem' }}
                value={userQuery}
                type="text"
                placeholder="Natural Language Query"
                onChange={(e) => {
                    setUserQuery(e.target.value);
                    setShowDropdown(true);
                }}
                onFocus={() => {
                    setShowDropdown(true);
                    setFocusedInput('query');
                }}
                onBlur={() => {
                    setTimeout(() => setShowDropdown(false), 200);
                    setFocusedInput(null);
                }}
                onKeyDown={handleKeyDown}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            {showDropdown && (
                <div className="absolute bg-white border rounded mt-1 w-full z-10 max-h-40 overflow-y-auto">
                    {queryOptions
                        .filter(option => option.toLowerCase().includes(userQuery.toLowerCase()))
                        .map((option, index) => (
                            <div
                                className="p-2 hover:bg-gray-100 cursor-pointer"
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