export const generateNiceTicks = (minVal, maxVal, maxTicks = 10) => {
    // Handle the case where min and max are equal
    if (minVal === maxVal) {
      const ticks = Array.from({ length: 5 }, () => minVal);
      return { ticks, niceMin: minVal, niceMax: maxVal };
    }

    // Calculate the range of the data
    const range = niceNumber(maxVal - minVal, false);

    // Calculate the tick interval
    const tickSpacing = niceNumber(range / (maxTicks - 1), true);

    // Calculate nice minimum and maximum values
    const niceMin = Math.floor(minVal / tickSpacing) * tickSpacing;
    const niceMax = Math.ceil(maxVal / tickSpacing) * tickSpacing;

    // Generate tick values
    const ticks = [];
    for (let tick = niceMin; tick <= niceMax; tick += tickSpacing) {
      // Adjust decimal places based on tickSpacing
      const decimalPlaces = getDecimalPlaces(tickSpacing);
      ticks.push(parseFloat(tick.toFixed(decimalPlaces)));
    }

    return { ticks, niceMin, niceMax };
  }


  // Helper function to calculate a "nice" number for the range and tick spacing
  export const niceNumber = (range, round) => {
    const exponent = Math.floor(Math.log10(range)); // Exponent of range
    const fraction = range / Math.pow(10, exponent); // Fractional part of range
    let niceFraction;

    if (round) {
      if (fraction < 1.5) {
        niceFraction = 1;
      } else if (fraction < 3) {
        niceFraction = 2;
      } else if (fraction < 7) {
        niceFraction = 5;
      } else {
        niceFraction = 10;
      }
    } else {
      if (fraction <= 1) {
        niceFraction = 1;
      } else if (fraction <= 2) {
        niceFraction = 2;
      } else if (fraction <= 5) {
        niceFraction = 5;
      } else {
        niceFraction = 10;
      }
    }

    return niceFraction * Math.pow(10, exponent);
  }

  // Helper function to determine the appropriate number of decimal places
  function getDecimalPlaces(value) {
    if (value >= 10) {
      return 0;
    } else if (value >= 1) {
      return 1;
    } else {
      const decimalPlaces = -Math.floor(Math.log10(value)) + 1;
      return decimalPlaces;
    }
  }