import React, { useState, useEffect } from 'react';
import { MagneticFieldSimulation } from './physics/simulation';
import { Coil, Magnet } from './physics/objects';
import ArrowVisualization from './components/ArrowVisualization';
import LineVisualization from './components/LineVisualization';
import ControlPanel from './components/ControlPanel';

function App() {
  const [simulation] = useState(() => {
    const sim = new MagneticFieldSimulation();
    
    // Add initial objects (matching Python example)
    sim.addObject(new Coil(-0.05, 0.0, 0.05, 0.20, 100, 2.0));
    sim.addObject(new Magnet(0.1, 0.2, 0.1));
    
    return sim;
  });

  const [viewMode, setViewMode] = useState('arrows');
  const [updateCounter, setUpdateCounter] = useState(0);
  const [resolution, setResolution] = useState(30);
  const [lineDensity, setLineDensity] = useState(1.6);

  const xRange = [-0.20, 0.20];
  const yRange = [-0.15, 0.35];

  const handleUpdate = () => {
    setUpdateCounter(prev => prev + 1);
  };

  const handleObjectDrag = (objectId, newX, newY) => {
    simulation.updateObject(objectId, { x: newX, y: newY });
    handleUpdate();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Electromagnetic Field Visualizer</h1>
        <div style={styles.controls}>
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>Resolution:</label>
            <input
              type="range"
              min="10"
              max="50"
              value={resolution}
              onChange={(e) => setResolution(parseInt(e.target.value))}
              style={styles.slider}
            />
            <span style={styles.controlValue}>{resolution}</span>
          </div>
          {viewMode === 'lines' && (
            <div style={styles.controlGroup}>
              <label style={styles.controlLabel}>Line Density:</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={lineDensity}
                onChange={(e) => setLineDensity(parseFloat(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.controlValue}>{lineDensity.toFixed(1)}</span>
            </div>
          )}
        </div>
      </header>

      <div style={styles.main}>
        <div style={styles.canvas}>
          {viewMode === 'arrows' ? (
            <ArrowVisualization
              simulation={simulation}
              version={updateCounter}
              xRange={xRange}
              yRange={yRange}
              resolution={resolution}
              onObjectDrag={handleObjectDrag}
            />
          ) : (
            <LineVisualization
              simulation={simulation}
              version={updateCounter}
              xRange={xRange}
              yRange={yRange}
              resolution={resolution}
              density={lineDensity}
              onObjectDrag={handleObjectDrag}
            />
          )}
        </div>

        <ControlPanel
          simulation={simulation}
          onUpdate={handleUpdate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#fff',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    padding: '20px 30px',
    backgroundColor: '#2c3e50',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 15px 0',
    fontSize: '24px',
    fontWeight: 'bold'
  },
  controls: {
    display: 'flex',
    gap: '30px',
    alignItems: 'center'
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  controlLabel: {
    fontSize: '14px',
    fontWeight: 'bold'
  },
  slider: {
    width: '150px'
  },
  controlValue: {
    fontSize: '14px',
    minWidth: '30px'
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },
  canvas: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f9f9f9'
  }
};

export default App;

