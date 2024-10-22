import React from 'react';
import { Search, Stars, ChevronDown } from "lucide-react";
import Switch from 'react-switch';

const QueryControls = ({
    handleQuery,
    queryButtonText,
    selectedModel,
    handleModelSelect,
    modelOptions,
    setDeepSearch,
    deepSearch,
    setVisibleTooltip,
    visibleTooltip,
    tooltips,
    expectedResults,
    setExpectedResults
}) => {
    return (
        <div className="flex flex-wrap w-full gap-4 items-center">
            <div className="flex gap-4 items-center w-full">
                <div className="flex items-center w-1/2 gap-4">
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button onClick={handleQuery}
                            onMouseEnter={() => setVisibleTooltip(0)}
                            onMouseLeave={() => setVisibleTooltip(null)}
                            className="flex items-center"
                        >
                            <Search className="mr-2 h-4 w-4" />
                            {queryButtonText}
                        </button>
                        {visibleTooltip === 0 && (
                            <div className="tooltip">
                                {tooltips[0]}
                            </div>
                        )}
                    </div>

                    <div className="relative" style={{ width: '200px' }}>
                        <select
                            value={selectedModel}
                            onChange={handleModelSelect}
                            className="w-full p-2 border rounded appearance-none bg-white"
                        >
                            {modelOptions.map((option, index) => (
                                option.selectable ? (
                                    <option key={index} value={option.value}>
                                        {option.display}
                                    </option>
                                ) : (
                                    <option key={index} disabled className="font-bold bg-gray-100">
                                        {option.header}
                                    </option>
                                )
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown size={20} />
                        </div>
                    </div>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <div className="flex items-center gap-2"
                            onMouseEnter={() => setVisibleTooltip(1)}
                            onMouseLeave={() => setVisibleTooltip(null)}
                        >
                            <Switch
                                onChange={setDeepSearch}
                                checked={deepSearch}
                                onColor="#86d3ff"
                                onHandleColor="#2693e6"
                                handleDiameter={24}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                                height={20}
                                width={48}
                                className="react-switch"
                            />
                            <Stars className="h-4 w-4" />
                            <span>PRO</span>
                        </div>
                        {visibleTooltip === 1 && (
                            <div className="tooltip">
                                {tooltips[1]}
                            </div>
                        )}
                    </div>
                </div>
                {deepSearch && (
                    <div className="w-1/2">
                        <input
                            type="text"
                            value={expectedResults}
                            onChange={(e) => setExpectedResults(e.target.value)}
                            placeholder="Enter expected results"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default QueryControls;
