import React, { useState, useEffect } from 'react';
import { MagneticFieldSimulation } from './physics/simulation';
import { Coil, Magnet } from './physics/objects';
import ArrowVisualization from './components/ArrowVisualization';
import LineVisualization from './components/LineVisualization';
import PotentialVisualization from './components/PotentialVisualization';
import ControlPanel from './components/ControlPanel';
import ColorLegend from './components/ColorLegend';

function App() {
  const [simulation] = useState(() => {
    const sim = new MagneticFieldSimulation();
    
    // Add initial objects (matching Python example)
    sim.addObject(new Coil(-0.05, 0.0, 0.05, 0.1, 100, 2.0));
    sim.addObject(new Magnet(0.069, 0.2, 0.1));
    
    return sim;
  });

  const [viewMode, setViewMode] = useState('arrows');
  const [updateCounter, setUpdateCounter] = useState(0);
  const [resolution, setResolution] = useState(30);
  const [lineDensity, setLineDensity] = useState(1.6);
  const [simMode, setSimMode] = useState('static');
  const [frequency, setFrequency] = useState(1.0);
  const [timeSpeed, setTimeSpeed] = useState(0.1);
  
  const animationRef = React.useRef();
  const phaseRef = React.useRef(0);
  const lastTimeRef = React.useRef(Date.now());

  const xRange = [-0.20, 0.20];
  const yRange = [-0.15, 0.35];

  useEffect(() => {
    if (simMode === 'dynamic') {
      lastTimeRef.current = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const dt = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;
        
        // Update phase: d(phase) = 2*PI * f * dt * speed
        phaseRef.current += 2 * Math.PI * frequency * dt * timeSpeed;
        
        let hasCoils = false;
        simulation.objects.forEach(obj => {
          if (obj.type === 'coil') {
            hasCoils = true;
            if (obj.baseCurrent === undefined) obj.baseCurrent = obj.current;
            obj.current = obj.baseCurrent * Math.cos(phaseRef.current);
          }
        });

        if (hasCoils) {
          handleUpdate();
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Reset to static state
      simulation.objects.forEach(obj => {
        if (obj.type === 'coil' && obj.baseCurrent !== undefined) {
          obj.current = obj.baseCurrent;
        }
      });
      handleUpdate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simMode, frequency, timeSpeed, simulation]);

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
        <h1 style={styles.title}>⚡️ Electromagnetic Field Visualizer</h1>
      </header>

      <div style={styles.main}>
        <div style={styles.canvas}>
          {viewMode === 'arrows' ? (
            <>
              <ArrowVisualization
                simulation={simulation}
                version={updateCounter}
                xRange={xRange}
                yRange={yRange}
                resolution={resolution}
                onObjectDrag={handleObjectDrag}
              />
              <ColorLegend />
            </>
          ) : viewMode === 'potential' ? (
            <>
              <PotentialVisualization
                simulation={simulation}
                version={updateCounter}
                xRange={xRange}
                yRange={yRange}
                resolution={resolution}
                onObjectDrag={handleObjectDrag}
              />
              <ColorLegend mode="potential" min={-9} max={-4} />
            </>
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
          resolution={resolution}
          setResolution={setResolution}
          lineDensity={lineDensity}
          setLineDensity={setLineDensity}
          simMode={simMode}
          setSimMode={setSimMode}
          frequency={frequency}
          setFrequency={setFrequency}
          timeSpeed={timeSpeed}
          setTimeSpeed={setTimeSpeed}
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
    backgroundColor: '#f9f9f9',
    position: 'relative'
  }
};

export default App;

