# Magnetic Field Visualisation App

App simulating the magnetic field of coils and magnets. Python codes generates images, React frontend contains an interactive visualization.


## Python : 

Required: Python 3.10+

Setup:

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python3 simulation.py



## Frontend React

Required: NodeJS (mac: "brew install node")

Setup:

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


### Features:

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


### Controls:

- Mouse drag on canvas: Move objects
- Click object in list: Select for editing
- Resolution slider: Adjust field calculation grid
- Line Density slider: Adjust number of streamlines (Lines mode)
- Add Object button: Create new coils or magnets
- × button: Delete an object
- Arrows/Lines buttons: Switch visualization mode



### TODO

Bug catch coils
Sens aimants
Dynamique
Potentiel vecteur