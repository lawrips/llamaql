import React from 'react';
import { X } from 'lucide-react';

const AnnotationInput = ({ annotation, setAnnotation, focusedInput, setFocusedInput, getInputStyle, handleKeyDown }) => {

  return (
    <div style={getInputStyle('annotation')} className="relative">
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

        <X
          aria-label="Clear annotation"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
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
      ) : null}

    </div>
  );
};

export default AnnotationInput;