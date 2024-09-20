import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

const QueryInput = ({ userQuery, setUserQuery, queryOptions, handleOptionSelect, handleDeleteOption, showDropdown, setShowDropdown, setFocusedInput, getInputStyle, handleKeyDown }) => {

    return (

        <div style={getInputStyle('query')} className="relative">
            <input
                className="w-full p-2 border rounded"
                style={{ width: '100%', boxSizing: 'border-box', paddingRight: '2.5rem' }}
                value={userQuery}
                type="text"
                placeholder="Enter query here"
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
                                className="relative flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                                key={index}
                                onMouseDown={(e) => handleOptionSelect(e, option)}
                            >
                                <span className="flex-grow">{option}</span>
                                <X
                                    color="gray"
                                    size={24}
                                    className="text-gray-400 cursor-pointer"
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevents the default mousedown behavior
                                        e.stopPropagation(); // Prevents the event from bubbling up to the parent div
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault(); // Prevents any default click behavior
                                        e.stopPropagation(); // Prevents the event from bubbling up
                                        handleDeleteOption(e, option); // Your custom delete handler
                                    }}
                                />
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default QueryInput;