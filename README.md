# ELECTROMAGNETIC FIELD VISUALIZER 

## Python : 

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python3 simulation.py



## Frontend React

Required: NodeJS (mac: "brew install node")

SETUP:

1. Navigate to the frontend directory:
   cd frontend

2. Install dependencies:
   npm install

3. Start the development server:
   npm run dev

4. Open your browser to:
   http://localhost:3000

5. Quit:
   Press q + enter


FEATURES:

✓ Two Visualization Modes:
  - Arrows: Shows vector field with arrows colored by magnitude
  - Lines: Shows streamlines (field lines) with colors indicating field strength

✓ Interactive Objects:
  - Drag objects around the canvas to reposition them
  - Click on objects in the control panel to select and edit properties
  - Add new coils or magnets using the "+ Add Object" button
  - Delete objects using the × button

✓ Object Properties:
  For Coils:
    - Position (x, y)
    - Radius
    - Length
    - Number of turns
    - Current (in Amperes)
  
  For Magnets:
    - Position (x, y)
    - Magnetic moment (A·m²)

✓ Adjustable Parameters:
  - Resolution: Controls the grid density for field calculation
  - Line Density: (Lines mode only) Controls how many field lines are drawn


CONTROLS:

- Mouse drag on canvas: Move objects
- Click object in list: Select for editing
- Resolution slider: Adjust field calculation grid
- Line Density slider: Adjust number of streamlines (Lines mode)
- Add Object button: Create new coils or magnets
- × button: Delete an object
- Arrows/Lines buttons: Switch visualization mode


NOTES:

- The simulation uses the same physics calculations as the Python version
- Field lines in "Lines" mode will attempt to form closed loops where possible
- White background is used for both visualization modes
- Objects are color-coded: Red for coils, Blue for magnets

