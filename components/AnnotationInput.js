import React from 'react';

const AnnotationInput = ({ annotation, setAnnotation, focusedInput, setFocusedInput, getInputStyle}) => {
      
  return (
    <div style={getInputStyle('annotation')} className="relative">
    <input
      className="w-full p-2 border rounded"
      autocomplete="off"
      style={{ width: '100%', boxSizing: 'border-box' }}
      value={annotation}
      onChange={(e) => setAnnotation(e.target.value)}
      onFocus={() => setFocusedInput('annotation')}
      onBlur={() => setFocusedInput(null)}
      type="text"
      placeholder="Instructions (add hints or additional details if helpful)"
    />
  </div>
  );
};

export default AnnotationInput;