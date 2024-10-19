import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Search, Trash2, Stars } from 'lucide-react';

const QueryInput = ({ userQuery, setUserQuery, setAnnotation, queryOptions, handleOptionSelect, handleDeleteOption, showDropdown, setShowDropdown, focusedInput, setFocusedInput, getInputStyle, handleKeyDown, shared, handleCheckboxChange, checkedOptions, addedQueries, handleAddQuery, handleRemoveQuery, handleGenerateQuery }) => {
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const prevUserQueryRef = useRef('');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
                setFocusedInput(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setShowDropdown, setFocusedInput]);

    // Modified useEffect to focus only when userQuery changes and is not empty
    useEffect(() => {
        if (inputRef.current && userQuery && userQuery !== prevUserQueryRef.current) {
            inputRef.current.focus();
        }
        prevUserQueryRef.current = userQuery;
    }, [userQuery]);

    const handleIconClick = (e, action) => {
        e.preventDefault();
        e.stopPropagation();
        action();
    };

    return (
        <div style={getInputStyle('query')} className="relative">
            <div className="relative">
                <input
                    ref={inputRef}
                    className="w-full p-2 pr-16 border rounded"
                    style={{ width: '100%', boxSizing: 'border-box' }}
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
                    onKeyDown={handleKeyDown}
                />
                <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                    {userQuery ? (
                        <>
                            <Plus
                                className="text-gray-400 cursor-pointer mr-2"
                                size={20}
                                onMouseDown={(e) => handleIconClick(e, handleAddQuery)}
                            />
                            <X
                                className="text-gray-400 cursor-pointer"
                                size={20}
                                onMouseDown={(e) => handleIconClick(e, () => {
                                    setUserQuery('');
                                    setAnnotation('');
                                })}
                            />
                        </>
                    ) : (
                        <Stars
                            className="text-gray-400 cursor-pointer"
                            size={20}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onClick={handleGenerateQuery}
                        />
                    )}
                </div>
            </div>

            {showDropdown && (
                <div ref={dropdownRef} className="absolute bg-white border rounded mt-1 w-full z-10 max-h-60 overflow-y-auto">
                    {queryOptions
                        .filter(option =>
                            option.toLowerCase().includes(userQuery.toLowerCase())
                        )
                        .map((option, index) => (
                            <div
                                className="relative flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                                key={index}
                                onClick={(e) => {
                                    if (e.target.type !== 'checkbox') {
                                        handleOptionSelect(e, option);
                                    }
                                }}
                            >
                                <div className="flex items-center mr-2">
                                    <input
                                        type="checkbox"
                                        checked={!!checkedOptions[option]}
                                        className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out"
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleCheckboxChange(option);
                                        }}
                                    />
                                </div>
                                <span className="flex-grow">{option}</span>
                                {!shared && (
                                    <Trash2
                                        color="gray"
                                        size={24}
                                        className="text-gray-400 cursor-pointer"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteOption(e, option);
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                </div>
            )}

            {/* Added Queries Section */}
            {addedQueries && addedQueries.length > 0 ?
                <div className="added-queries-section mt-4">
                    <h3 className="text-sm font-semibold mb-2">Added Queries:</h3>
                    <div className="max-h-40 overflow-y-auto">
                        {addedQueries.map((query, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded mb-1 text-sm">
                                <span className="flex-grow mr-2 truncate">{query.query}</span>
                                <Trash2
                                    color="gray"
                                    size={18}
                                    className="text-gray-400 cursor-pointer hover:text-gray-600 flex-shrink-0"
                                    onClick={() => handleRemoveQuery(index)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                : null}
        </div>
    );
};

export default QueryInput;
