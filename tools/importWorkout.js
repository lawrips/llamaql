const parseWorkoutCSV = (csvString) => {
    const parsedResult = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
    });
  
    const data = parsedResult.data;
  
    const parsedData = data.map(item => ({
      workout_id: item['Workout #'],
      date: new Date(item['Date']),
      workout_name: item['Workout Name'],
      duration_sec: Number.parseInt(item['Duration (sec)']),
      exercise_name: item['Exercise Name'],
      set_order: Number.parseInt(item['Set Order']),
      weight_kg: item['Weight (kg)'] ? Number.parseFloat(item['Weight (kg)']) : null,
      weight_lbs: item['Weight (kg)'] ? Number.parseFloat(item['Weight (kg)']) * 2.204 : null,
      reps: item['Reps'] ? Number.parseInt(item['Reps']) : null,
      rpe: item['RPE'] ? Number.parseFloat(item['RPE']) : null,
      distance_meters: item['Distance (meters)'] ? Number.parseFloat(item['Distance (meters)']) : null,
      seconds: item['Seconds'] ? Number.parseFloat(item['Seconds']) : null,
      notes: item['Notes'],
      workout_notes: item['Workout Notes']
    }));
  
    return parsedData;
  };
  