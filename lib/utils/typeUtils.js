module.exports = {

    
  sanitizeHeader: function(header, sanitizedHeaders) {

    // 1. Replace '+' with 'plus'
    let sanitized = header.trim().replace(/\+/g, 'plus');
  
    // 2. Replace spaces and special characters with underscores
    sanitized = sanitized.replace(/[\s\W]+/g, '_'); // Replace multiple spaces/special chars with one _
  
    // 3. Remove leading/trailing underscores 
    sanitized = sanitized.replace(/^_+|_+$/g, '');
  
    // 4. Handle cases where sanitization results in an empty string or a number
    if (!sanitized || !isNaN(sanitized)) {
      sanitized = `column_${sanitized || header.substring(0, 10).replace(/\W/g, '')}`; // Ensure valid name
    }
  
    // 5. Prefix with 'col_' if sanitized name starts with a digit
    if (/^\d/.test(sanitized)) {
      sanitized = `col_${sanitized}`;
    }
  
    // 6. Ensure uniqueness (optional, but recommended)
    // Keep track of used sanitized headers to prevent duplicates
    if (sanitizedHeaders.includes(sanitized)) {
      let counter = 1;
      while (sanitizedHeaders.includes(`${sanitized}_${counter}`)) {
        counter++;
      }
      sanitized = `${sanitized}_${counter}`;
    }
    sanitizedHeaders.push(sanitized);
  
    // 7. Remove trailing underscores (if any)
    sanitized = sanitized.replace(/_+$/g, '');
  
    if (sanitized == 'index') sanitized = 'idx';
  
    return sanitized;
},


  
 determineColumnTypes : function(parsedData, sampleSize = 100) {
    const isDate = (value) => {
      // Strict date format check: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
      const dateRegex = /^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?$/;
      if (!dateRegex.test(value)) return false;
      
      // Additional check to ensure it's a valid date
      const date = new Date(value);
      return !isNaN(date.getTime());
    };
  
    const isBooleanLike = (value) => ['true', 'false', 'yes', 'no', 'on', 'off'].includes(String(value).toLowerCase());
    
    const isNumber = (value) => !isNaN(parseFloat(value)) && isFinite(value);
  
    return parsedData.meta.fields.map(columnName => {
      const sample = parsedData.data.slice(0, sampleSize);
      const values = sample.map(row => row[columnName]).filter(v => v != null && v !== '');
  
      if (values.length === 0) return 'TEXT';
  
      // Check if all values are valid dates and the column name suggests it's a date
      const allDates = values.every(isDate);
      if (allDates && ['date', 'datetime'].some(term => columnName.toLowerCase().includes(term))) {
        return 'DATE';
      }
  
      const allBooleans = values.every(isBooleanLike);
      if (allBooleans) return 'BOOLEAN';
  
      const allNumbers = values.every(isNumber);
      if (allNumbers) {
        const allIntegers = values.every(v => Number.isInteger(parseFloat(v)));
        return allIntegers ? 'INTEGER' : 'REAL';
      }
  
      return 'TEXT';
    });
  }
}