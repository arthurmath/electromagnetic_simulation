import numpy as np
import matplotlib.pyplot as plt
from functions import get_Br, get_Bz
from typing import List


class Coil:
    """
    Represents a solenoid coil for electromagnetic field simulation.
    
    The coil axis is aligned with the y-direction.
    Position (x, y) represents the center of the coil.
    """
    
    def __init__(self, x, y, radius, length, n_turns, current, mu=4*np.pi*1e-7):
        self.x = x
        self.y = y
        self.radius = radius
        self.length = length
        self.n_turns = n_turns
        self.current = current
        self.mu = mu
        self.n = n_turns / length  # turns per unit length
    
    def field(self, x, y):
        """
        Calculate magnetic field (Bx, By) on grid.
        
        The coil axis is along y-direction.
        Returns Bx (radial) and By (axial) components.
        """
        x = np.asarray(x, dtype=float)
        y = np.asarray(y, dtype=float)
        
        # Radial distance from coil axis
        r = np.abs(x - self.x)
        # Axial position relative to coil center
        z = y - self.y
        
        ksi_low = z - self.length / 2
        ksi_high = z + self.length / 2
        
        # Get cylindrical field components
        Br = get_Br(self.radius, self.mu, self.n, self.current, r, ksi_low, ksi_high)
        Bz = get_Bz(self.radius, self.mu, self.n, self.current, r, ksi_low, ksi_high)

        # Convert to Cartesian: Br points radially outward
        # For x > coil.x: radial is +x direction
        # For x < coil.x: radial is -x direction
        sign_x = np.sign(x - self.x)
        sign_x = np.where(sign_x == 0, 1, sign_x)  # On axis, default to positive
        
        Bx = Br * sign_x
        By = Bz
        
        return -Bx, By



class Magnet:
    """
    Represents a permanent magnet using the magnetic dipole model:
    B̂ = (μ0/4π) * [3(^m·r̂)r̂ - ^mr²] / r³
    
    The magnet is oriented along the y-direction (dipole moment points in +y or -y).
    Dipole approximation, correct far from the magnet.
    Position (x, y) represents the center of the magnet.

    Le moment magnétique d’un aimant permanent vaut approximativement : m = MV
    avec :
        M la magnétisation du materiau (A/m),
        V le volume de l’aimant (m³).
    """
    
    def __init__(self, x, y, moment=0.1, mu=4*np.pi*1e-7):
        """
        Initialize a magnetic dipole.
        
        Parameters:
            x, y: position of the magnet center
            moment: magnetic dipole moment (A·m²), positive = +y direction
            mu: permeability (default: vacuum permeability)
        """
        self.x = x
        self.y = y
        self.radius = 0.01
        self.length = 0.03
        self.moment = moment
        self.mu = mu
    
    def field(self, x, y):
        """
        Calculate magnetic field (Bx, By) at given points.
        
        Uses the magnetic dipole field equations.
        Returns Bx (radial) and By (axial) components.
        """
        x = np.asarray(x, dtype=float)
        y = np.asarray(y, dtype=float)
        
        # Position relative to dipole center
        dx = x - self.x
        dy = y - self.y
        
        # Distance from dipole
        r_sq = dx**2 + dy**2
        r = np.maximum(np.sqrt(r_sq), 1e-10)  # Avoid division by zero
        
        # Dipole field components (for dipole along y-axis)
        # Bx = (μ₀ * m / 4π) * (3 * x * y) / r^5  
        # By = (μ₀ * m / 4π) * (2y² - x²)) / r^5
        Bx = self.mu * self.moment / (4*np.pi) * (3 * dx * dy) / r**5
        By = self.mu * self.moment / (4*np.pi) * (2 * dy**2 - dx**2) / r**5
        
        # Set field to zero at dipole location (avoid singularity artifacts)
        at_center = r < 1e-10
        Bx = np.where(at_center, 0.0, Bx)
        By = np.where(at_center, 0.0, By)
        
        return Bx, By




class MagneticFieldSimulation:
    """Simulates the combined magnetic field from multiple objects."""
    
    def __init__(self, objects: List[Coil|Magnet]):
        self.objects = objects
    
    
    def compute_field(self, x_range, y_range, resolution=30):
        """
        Compute total magnetic field at grid points.
        
        X, Y: 2D meshgrid arrays
        Returns: Bx, By arrays of same shape
        """

        x = np.linspace(x_range[0], x_range[1], resolution)
        y = np.linspace(y_range[0], y_range[1], resolution)
        self.X, self.Y = np.meshgrid(x, y)

        self.Bx = np.zeros_like(self.X)
        self.By = np.zeros_like(self.Y)
        
        X_flat = self.X.flatten()
        Y_flat = self.Y.flatten()
        
        for obj in self.objects:
            bx, by = obj.field(X_flat, Y_flat)
            self.Bx += bx.reshape(self.X.shape)
            self.By += by.reshape(self.Y.shape)
    
    
    def plot_arrows(self):
        """
        Plot the magnetic field as a vector field.
        
        x_range: tuple (x_min, x_max)
        y_range: tuple (y_min, y_max)
        resolution: number of points along each axis
        """
        
        # Compute field magnitude for coloring
        B_mag = np.sqrt(self.Bx**2 + self.By**2)
        B_mag_safe = np.maximum(B_mag, 1e-20)
        
        # Normalize arrows for visibility
        Bx_norm = self.Bx / B_mag_safe
        By_norm = self.By / B_mag_safe
        
        # Create figure
        fig, ax = plt.subplots(figsize=(12, 8), facecolor='#0d1117')
        ax.set_facecolor('#0d1117')
        
        # Plot vector field with color based on magnitude
        magnitude_log = np.log10(B_mag_safe + 1e-20)
        
        quiver = ax.quiver(
            self.X, self.Y, Bx_norm, By_norm,
            magnitude_log,
            cmap='plasma',
            scale=25,
            width=0.004,
            headwidth=4,
            headlength=5,
            alpha=0.9
        )
        
        # Add colorbar
        cbar = plt.colorbar(quiver, ax=ax, shrink=0.8, pad=0.02)
        cbar.set_label('log₁₀(|B|) [T]', color='white', fontsize=11)
        cbar.ax.yaxis.set_tick_params(color='white')
        plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='white')
        
        # Draw coil representations
        for objet in self.objects:
            # Draw coil as a rectangle
            rect = plt.Rectangle(
                (objet.x - objet.radius, objet.y - objet.length/2),
                2 * objet.radius,
                objet.length,
                fill=False,
                edgecolor='#58a6ff',
                linewidth=2,
                linestyle='--',
                label=f'Coil (r={objet.radius}, L={objet.length})'
            )
            ax.add_patch(rect)
            
            # Mark coil center
            ax.plot(objet.x, objet.y, 'o', color='#f78166', markersize=8)
        
        # Styling
        ax.set_xlabel('x [m]', color='white', fontsize=12)
        ax.set_ylabel('y [m]', color='white', fontsize=12)
        ax.set_title('Magnetic Field Simulation', color='white', fontsize=14, pad=15)
        ax.tick_params(colors='white')
        ax.set_aspect('equal')
        
        for spine in ax.spines.values():
            spine.set_color('#30363d')
        
        ax.grid(True, alpha=0.2, color='#30363d')
        
        plt.tight_layout()
        plt.savefig('images/magnetic_field_arrows.png', dpi=150, facecolor='#0d1117', bbox_inches='tight')
        plt.show()


    def plot_lines(self, density=1.6):
        """
        Plot the magnetic field as continuous field lines (streamlines).
        
        density: controls the closeness of streamlines (default=2)
        """
        
        # Compute field magnitude for coloring
        B_mag = np.sqrt(self.Bx**2 + self.By**2)
        B_mag_safe = np.maximum(B_mag, 1e-20)
        
        # Create figure with white background
        fig, ax = plt.subplots(figsize=(12, 8), facecolor='white')
        ax.set_facecolor('white')
        
        # Plot streamlines with color based on magnitude
        magnitude_log = np.log10(B_mag_safe + 1e-20)
        
        stream = ax.streamplot(
            self.X, self.Y, self.Bx, self.By,
            color=magnitude_log,
            cmap='viridis',
            density=density,
            linewidth=1.5,
            arrowsize=1.5,
            arrowstyle='->',
        )
        
        # Add colorbar
        cbar = plt.colorbar(stream.lines, ax=ax, shrink=0.8, pad=0.02)
        cbar.set_label('log₁₀(|B|) [T]', color='black', fontsize=11)
        cbar.ax.yaxis.set_tick_params(color='black')
        plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='black')
        
        # Draw coil representations
        for objet in self.objects:
            # Draw coil as a rectangle
            rect = plt.Rectangle(
                (objet.x - objet.radius, objet.y - objet.length/2),
                2 * objet.radius,
                objet.length,
                fill=False,
                edgecolor='red',
                linewidth=2,
                linestyle='--',
                label=f'Coil (r={objet.radius}, L={objet.length})'
            )
            ax.add_patch(rect)
            
            # Mark coil center
            ax.plot(objet.x, objet.y, 'o', color='red', markersize=8)
        
        # Styling
        ax.set_xlabel('x [m]', color='black', fontsize=12)
        ax.set_ylabel('y [m]', color='black', fontsize=12)
        ax.set_title('Magnetic Field Lines', color='black', fontsize=14, pad=15)
        ax.tick_params(colors='black')
        ax.set_aspect('equal')
        
        for spine in ax.spines.values():
            spine.set_color('black')
        
        ax.grid(True, alpha=0.3, color='gray', linestyle=':')
        
        plt.tight_layout()
        plt.savefig('images/magnetic_field_lines.png', dpi=150, facecolor='white', bbox_inches='tight')
        plt.show()



if __name__ == "__main__":
    
    # Add coils at different positions
    objects = [Coil(
        x=-0.05, y=0.0,
        radius=0.05,
        length=0.20,
        n_turns=100,
        current=2.0
    )]
    
    # objects.append(Coil(
    #     x=0.1, y=0.20,
    #     radius=0.05,
    #     length=0.10,
    #     n_turns=100,
    #     current=1.0
    # ))

    objects.append(Magnet(
        x = 0.1, y = 0.2,
        moment = 0.1
    ))
    
    sim = MagneticFieldSimulation(objects)

    sim.compute_field(
        x_range=(-0.20, 0.20),
        y_range=(-0.15, 0.35),
        resolution=50
    )
    
    # sim.plot_arrows()
    sim.plot_lines()
    
    

