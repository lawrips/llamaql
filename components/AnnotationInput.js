import React from 'react';

const AnnotationInput = ({ annotation, setAnnotation }) => {
  return (
    <div>
      <input
        value={annotation}
        onChange={(e) => setAnnotation(e.target.value)}
        type="text"
        placeholder="Annotation (Optional)"
      />
    </div>
  );
};

export default AnnotationInput;