import React, { useState } from 'react';
import { Coil, Magnet, MeasurementCoil, Rope } from '../physics/objects';

const ControlPanel = ({ 
  simulation, 
  onUpdate, 
  viewMode, 
  onViewModeChange,
  resolution,
  setResolution,
  lineDensity,
  setLineDensity,
  simMode,
  setSimMode,
  frequency,
  setFrequency,
  timeSpeed,
  setTimeSpeed
}) => {
  const [selectedObject, setSelectedObject] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleAddCoil = () => {
    const newCoil = new Coil(0, 0);
    simulation.addObject(newCoil);
    onUpdate();
    setShowAddMenu(false);
  };

  const handleAddMagnet = () => {
    const newMagnet = new Magnet(0, 0);
    simulation.addObject(newMagnet);
    onUpdate();
    setShowAddMenu(false);
  };

  const handleAddMeasurementCoil = () => {
    const newMeasurementCoil = new MeasurementCoil(0, 0);
    simulation.addObject(newMeasurementCoil);
    onUpdate();
    setShowAddMenu(false);
  };

  const handleAddRope = () => {
    const newRope = new Rope(0);
    simulation.addObject(newRope);
    onUpdate();
    setShowAddMenu(false);
  };

  const handleRemoveObject = (id) => {
    simulation.removeObject(id);
    if (selectedObject?.id === id) {
      setSelectedObject(null);
    }
    onUpdate();
  };

  const handleObjectSelect = (obj) => {
    setSelectedObject(obj);
  };

  const handlePropertyChange = (property, value) => {
    if (!selectedObject) return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const updates = { [property]: numValue };
    if (property === 'current') {
      updates.baseCurrent = numValue;
    }

    simulation.updateObject(selectedObject.id, updates);
    setSelectedObject({ ...selectedObject, ...updates });
    onUpdate();
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h3 style={styles.heading}>Simulation Mode</h3>
        <div style={styles.buttonGroup}>
          <button
            style={{
              ...styles.button,
              ...(simMode === 'static' ? styles.buttonActive : {})
            }}
            onClick={() => setSimMode('static')}
          >
            Static
          </button>
          <button
            style={{
              ...styles.button,
              ...(simMode === 'dynamic' ? styles.buttonActive : {})
            }}
            onClick={() => setSimMode('dynamic')}
          >
            Dynamic
          </button>
        </div>
        
        {simMode === 'dynamic' && (
          <div style={styles.properties}>
            <div style={{...styles.property, marginTop: '10px'}}>
              <div style={styles.sliderHeader}>
                <label style={styles.label}>Frequency (Hz)</label>
                <span style={styles.value}>{frequency.toFixed(1)}</span>
              </div>
              <input
                type="range"
                step="1"
                min="1"
                max="50"
                value={frequency}
                onChange={(e) => setFrequency(parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>
            <div style={styles.property}>
              <div style={styles.sliderHeader}>
                <label style={styles.label}>Time Speed</label>
                <span style={styles.value}>{timeSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                step="0.01"
                min="0.01"
                max="1.0"
                value={timeSpeed}
                onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.heading}>Visualization Mode</h3>
        <div style={styles.buttonGroup}>
          <button
            style={{
              ...styles.button,
              ...(viewMode === 'arrows' ? styles.buttonActive : {})
            }}
            onClick={() => onViewModeChange('arrows')}
          >
            Arrows
          </button>
          <button
            style={{
              ...styles.button,
              ...(viewMode === 'lines' ? styles.buttonActive : {})
            }}
            onClick={() => onViewModeChange('lines')}
          >
            Lines
          </button>
          <button
            style={{
              ...styles.button,
              ...(viewMode === 'potential' ? styles.buttonActive : {})
            }}
            onClick={() => onViewModeChange('potential')}
          >
            Potential
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.heading}>Visualization Settings</h3>
        <div style={styles.properties}>
          <div style={styles.property}>
            <div style={styles.sliderHeader}>
              <label style={styles.label}>Resolution</label>
              <span style={styles.value}>{resolution}</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={resolution}
              onChange={(e) => setResolution(parseInt(e.target.value))}
              style={styles.slider}
            />
          </div>
          
          {viewMode === 'lines' && (
            <div style={styles.property}>
              <div style={styles.sliderHeader}>
                <label style={styles.label}>Line Density</label>
                <span style={styles.value}>{lineDensity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={lineDensity}
                onChange={(e) => setLineDensity(parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.heading}>Objects</h3>
        <button
          style={styles.addButton}
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          + Add Object
        </button>

        {showAddMenu && (
          <div style={styles.addMenu}>
            <button style={styles.menuButton} onClick={handleAddCoil}>
              Add Coil
            </button>
            <button style={styles.menuButton} onClick={handleAddMagnet}>
              Add Magnet
            </button>
            <button style={styles.menuButton} onClick={handleAddMeasurementCoil}>
              Add Measurement Coil
            </button>
            <button style={styles.menuButton} onClick={handleAddRope}>
              Add Rope
            </button>
          </div>
        )}

        <div style={styles.objectList}>
          {simulation.objects.map((obj) => (
            <div
              key={obj.id}
              style={{
                ...styles.objectItem,
                ...(selectedObject?.id === obj.id ? styles.objectItemSelected : {})
              }}
              onClick={() => handleObjectSelect(obj)}
            >
              <div style={styles.objectInfo}>
                <strong>
                  {obj.type === 'coil' ? '🔋 Coil' : 
                   obj.type === 'magnet' ? '🧲 Magnet' : 
                   obj.type === 'rope' ? '🪢 Rope' :
                   '📏 Measurement Coil'}
                </strong>
                <div style={styles.objectCoords}>
                  ({obj.x.toFixed(3)}, {obj.y.toFixed(3)})
                </div>
              </div>
              <button
                style={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveObject(obj.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedObject && (
        <div style={styles.section}>
          <h3 style={styles.heading}>Properties</h3>
          <div style={styles.properties}>
            {selectedObject.type !== 'rope' && (
              <div style={styles.property}>
                <label style={styles.label}>X Position (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={selectedObject.x}
                  onChange={(e) => handlePropertyChange('x', e.target.value)}
                  style={styles.input}
                />
              </div>
            )}
            <div style={styles.property}>
              <label style={styles.label}>Y Position (m)</label>
              <input
                type="number"
                step="0.01"
                value={selectedObject.y}
                onChange={(e) => handlePropertyChange('y', e.target.value)}
                style={styles.input}
              />
            </div>

            {selectedObject.type === 'coil' && (
              <>
                <div style={styles.property}>
                  <label style={styles.label}>Radius (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedObject.radius}
                    onChange={(e) => handlePropertyChange('radius', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Length (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedObject.length}
                    onChange={(e) => handlePropertyChange('length', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Number of Turns</label>
                  <input
                    type="number"
                    step="10"
                    value={selectedObject.nTurns}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        simulation.updateObject(selectedObject.id, { 
                          nTurns: val,
                          n: val / selectedObject.length 
                        });
                        setSelectedObject({ ...selectedObject, nTurns: val });
                        onUpdate();
                      }
                    }}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Current (A)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedObject.baseCurrent !== undefined ? selectedObject.baseCurrent : selectedObject.current}
                    onChange={(e) => handlePropertyChange('current', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </>
            )}

            {selectedObject.type === 'magnet' && (
              <>
                <div style={styles.property}>
                  <label style={styles.label}>Magnetic Moment (A·m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedObject.moment}
                    onChange={(e) => handlePropertyChange('moment', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Angle (°)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="360"
                    value={((selectedObject.angle ?? 90) - 90 + 360) % 360}
                    onChange={(e) => {
                      const userValue = parseFloat(e.target.value);
                      if (!isNaN(userValue)) {
                        handlePropertyChange('angle', (userValue + 90) % 360);
                      }
                    }}
                    style={styles.input}
                  />
                </div>
              </>
            )}

            {selectedObject.type === 'measurementCoil' && (
              <>
                <div style={styles.property}>
                  <label style={styles.label}>Radius (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedObject.radius}
                    onChange={(e) => handlePropertyChange('radius', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Length (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedObject.length}
                    onChange={(e) => handlePropertyChange('length', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Number of Turns</label>
                  <input
                    type="number"
                    step="10"
                    value={selectedObject.nTurns}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        simulation.updateObject(selectedObject.id, { nTurns: val });
                        setSelectedObject({ ...selectedObject, nTurns: val });
                        onUpdate();
                      }
                    }}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Resistance (Ω)</label>
                  <input
                    type="number"
                    step="1"
                    value={selectedObject.resistance}
                    onChange={(e) => handlePropertyChange('resistance', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Induced Current (mA)</label>
                  <input
                    type="text"
                    value={((selectedObject.inducedCurrent ?? 0) * 1000).toFixed(4)}
                    readOnly
                    style={{...styles.input, backgroundColor: '#f0f0f0'}}
                  />
                </div>
              </>
            )}

            {selectedObject.type === 'rope' && (
              <>
                <div style={styles.property}>
                  <label style={styles.label}>Length (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedObject.length}
                    onChange={(e) => handlePropertyChange('length', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Density (dipoles/m)</label>
                  <input
                    type="number"
                    step="10"
                    value={selectedObject.density}
                    onChange={(e) => handlePropertyChange('density', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Dipole Moment (A·m²)</label>
                  <input
                    type="number"
                    step="1e-7"
                    value={selectedObject.dipoleMoment}
                    onChange={(e) => handlePropertyChange('dipoleMoment', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Tension (N)</label>
                  <input
                    type="number"
                    step="1"
                    value={selectedObject.tension ?? 70}
                    onChange={(e) => handlePropertyChange('tension', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Linear Mass Density (g/m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={((selectedObject.lineMassDensity ?? 0.0035) * 1000).toFixed(1)}
                    onChange={(e) => {
                      const gPerM = parseFloat(e.target.value);
                      if (!isNaN(gPerM) && gPerM > 0) {
                        const kgPerM = gPerM / 1000;
                        simulation.updateObject(selectedObject.id, { lineMassDensity: kgPerM });
                        setSelectedObject({ ...selectedObject, lineMassDensity: kgPerM });
                        onUpdate();
                      }
                    }}
                    style={styles.input}
                  />
                </div>
                <div style={styles.property}>
                  <label style={styles.label}>Damping</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedObject.damping ?? 0.5}
                    onChange={(e) => handlePropertyChange('damping', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '300px',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderLeft: '1px solid #ccc',
    overflowY: 'auto',
    fontFamily: 'Arial, sans-serif'
  },
  section: {
    marginBottom: '30px'
  },
  heading: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  },
  button: {
    flex: 1,
    padding: '10px',
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  },
  buttonActive: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff'
  },
  addButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  addMenu: {
    marginTop: '10px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '5px',
    overflow: 'hidden'
  },
  menuButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'white',
    border: 'none',
    borderBottom: '1px solid #ddd',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px'
  },
  objectList: {
    marginTop: '15px'
  },
  objectItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '5px',
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  objectItemSelected: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff'
  },
  objectInfo: {
    flex: 1
  },
  objectCoords: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px'
  },
  deleteButton: {
    width: '30px',
    height: '30px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '20px',
    lineHeight: '1',
    fontWeight: 'bold'
  },
  properties: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  property: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#555'
  },
  input: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '14px'
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px'
  },
  value: {
    fontSize: '12px',
    color: '#666',
    fontWeight: 'bold'
  },
  slider: {
    width: '100%',
    cursor: 'pointer'
  }
};

export default ControlPanel;

