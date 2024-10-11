import React from 'react';
import { X } from 'lucide-react';

const AnnotationInput = ({ annotation, setAnnotation, focusedInput, setFocusedInput, getInputStyle, handleKeyDown }) => {

  return (
    <div style={getInputStyle('annotation')} className="relative">
      <div className="relative">
        <input
          className="w-full p-2 border rounded"
          autoComplete="off"
          id="customField22"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            paddingRight: '2.5rem' // Space for the X icon
          }}
          value={annotation}
          onChange={(e) => setAnnotation(e.target.value)}
          onFocus={() => setFocusedInput('annotation')}
          onBlur={() => setFocusedInput(null)}
          type="text"
          placeholder="Hints to help AI"
          onKeyDown={handleKeyDown}
        />

        {focusedInput === 'annotation' ? (
          <div className="absolute right-0 top-0 h-full flex items-center pr-2">

            <X
              aria-label="Clear annotation"
              className="text-gray-400 cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents default mousedown behavior
                e.stopPropagation(); // Prevents event bubbling
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setAnnotation('');
              }}
            />
          </div>
        ) : null}


      </div>
    </div>
  );
};

export default AnnotationInput;