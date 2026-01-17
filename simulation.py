import numpy as np
import matplotlib.pyplot as plt
from scipy import special


def heuman_lambda(phi, k):
    """
    Calcule la fonction lambda de Heuman Λ(phi, k)

    Parameters
    ----------
    phi : float ou array
        Angle en radians
    k : float
        Module elliptique (0 <= k <= 1)

    Returns
    -------
    Lambda(phi, k)
    """
    kp = np.sqrt(1 - k**2)  # module complémentaire

    # Intégrales complètes
    K = special.ellipk(k**2)
    E = special.ellipe(k**2)

    # print("PHI : ", phi)
    # print("K : ", kp)

    # Intégrales incomplètes (avec le module complémentaire)
    F_phi = special.ellipkinc(np.asarray(phi), kp**2)
    E_phi = special.ellipeinc(np.asarray(phi), kp**2)

    return (2 / np.pi) * (E * F_phi + K * E_phi - K * F_phi)


def phi(r, a, ksi):
    return np.arctan(np.abs(ksi / (a - r)))



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
    
    def _k_val(self, r, ksi):
        """Compute k parameter for elliptic integrals."""
        a = self.radius
        denom = ksi**2 + (a + r)**2
        # Avoid division by zero
        denom = np.where(denom == 0, 1e-12, denom)
        k_sq = (4 * a * r) / denom
        # Clamp to valid range for sqrt
        k_sq = np.clip(k_sq, 0, 0.9999)
        return np.sqrt(k_sq)
    
    def _Br(self, r, ksi_low, ksi_high):
        """Compute radial magnetic field component."""
        a = self.radius
        mu, n, i = self.mu, self.n, self.current
        
        # Handle r=0 (on axis) - Br is zero by symmetry
        r = np.asarray(r, dtype=float)
        scalar_input = r.ndim == 0
        r = np.atleast_1d(r)
        
        result = np.zeros_like(r)
        mask = r > 1e-10
        
        if not np.any(mask):
            return result[0] if scalar_input else result
        
        r_valid = r[mask]
        ksi_low_valid = np.atleast_1d(ksi_low)[mask] if np.asarray(ksi_low).ndim > 0 else ksi_low
        ksi_high_valid = np.atleast_1d(ksi_high)[mask] if np.asarray(ksi_high).ndim > 0 else ksi_high
        
        k_high = self._k_val(r_valid, ksi_high_valid)
        k_low = self._k_val(r_valid, ksi_low_valid)
        
        # Avoid k=0 issues
        k_high = np.maximum(k_high, 1e-10)
        k_low = np.maximum(k_low, 1e-10)
        
        K_high = special.ellipk(k_high**2)
        E_high = special.ellipe(k_high**2)
        K_low = special.ellipk(k_low**2)
        E_low = special.ellipe(k_low**2)
        
        Br_high = (mu * n * i / np.pi) * np.sqrt(a / r_valid) * (((2 - k_high**2) / (2 * k_high)) * K_high - E_high / k_high)
        Br_low = (mu * n * i / np.pi) * np.sqrt(a / r_valid) * (((2 - k_low**2) / (2 * k_low)) * K_low - E_low / k_low)
        
        result[mask] = Br_high - Br_low
        return result[0] if scalar_input else result
    
    def _Bz(self, r, ksi_low, ksi_high):
        """Compute axial magnetic field component."""
        a = self.radius
        mu, n, i = self.mu, self.n, self.current
        
        r = np.asarray(r, dtype=float)
        scalar_input = r.ndim == 0
        r = np.atleast_1d(r)
        
        result = np.zeros_like(r)
        mask = r > 1e-10
        
        if not np.any(mask):
            # On axis approximation for solenoid
            Bz_axis = mu * n * i
            result[:] = Bz_axis
            return result[0] if scalar_input else result
        
        r_valid = r[mask]
        ksi_low_valid = np.atleast_1d(ksi_low)[mask] if np.asarray(ksi_low).ndim > 0 else ksi_low
        ksi_high_valid = np.atleast_1d(ksi_high)[mask] if np.asarray(ksi_high).ndim > 0 else ksi_high
        
        k_high = self._k_val(r_valid, ksi_high_valid)
        k_low = self._k_val(r_valid, ksi_low_valid)
        
        k_high = np.maximum(k_high, 1e-10)
        k_low = np.maximum(k_low, 1e-10)
        
        K_high = special.ellipk(k_high**2)
        K_low = special.ellipk(k_low**2)
        
        sqrt_ar = np.sqrt(a * r_valid)
        sqrt_ar = np.maximum(sqrt_ar, 1e-10)

        phi_high = phi(r_valid, a, ksi_high_valid)
        phi_low = phi(r_valid, a, ksi_low_valid)
        
        Bz_high = (mu * n * i / 4) * (((ksi_high_valid * k_high) / (np.pi * sqrt_ar) * K_high) + ((a - r_valid) * ksi_high_valid / np.abs((a - r_valid) * ksi_high_valid) * heuman_lambda(phi_high, k_high)))
        Bz_low  = (mu * n * i / 4) * (((ksi_low_valid * k_low) / (np.pi * sqrt_ar) * K_low) + ((a - r_valid) * ksi_low_valid / np.abs((a - r_valid) * ksi_low_valid) * heuman_lambda(phi_low, k_low)))
        
        result[mask] = Bz_high - Bz_low
        
        # On-axis points get solenoid approximation
        on_axis = ~mask
        if np.any(on_axis):
            result[on_axis] = mu * n * i
        
        return result[0] if scalar_input else result
    
    def field_at(self, x, y):
        """
        Calculate magnetic field (Bx, By) at point(s) (x, y).
        
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
        Br = self._Br(r, ksi_low, ksi_high)
        Bz = self._Bz(r, ksi_low, ksi_high)

        return Br, Bz
        
        # # Convert to Cartesian: Br points radially outward
        # sign_x = np.sign(x - self.x)
        # sign_x = np.where(sign_x == 0, 0, sign_x)
        
        # Bx = Br #* sign_x
        # By = Bz
        
        # return Bx, By


class MagneticFieldSimulation:
    """Simulates the combined magnetic field from multiple coils."""
    
    def __init__(self):
        self.coils = []
    
    def add_coil(self, coil):
        """Add a coil to the simulation."""
        self.coils.append(coil)
        return self
    
    def compute_field(self, X, Y):
        """
        Compute total magnetic field at grid points.
        
        X, Y: 2D meshgrid arrays
        Returns: Bx, By arrays of same shape
        """
        Bx_total = np.zeros_like(X)
        By_total = np.zeros_like(Y)
        
        X_flat = X.flatten()
        Y_flat = Y.flatten()
        
        for coil in self.coils:
            bx, by = coil.field_at(X_flat, Y_flat)
            Bx_total += bx.reshape(X.shape)
            By_total += by.reshape(Y.shape)
        
        return Bx_total, By_total
    
    def plot(self, x_range, y_range, resolution=30, figsize=(12, 10)):
        """
        Plot the magnetic field as a vector field.
        
        x_range: tuple (x_min, x_max)
        y_range: tuple (y_min, y_max)
        resolution: number of points along each axis
        """
        x = np.linspace(x_range[0], x_range[1], resolution)
        y = np.linspace(y_range[0], y_range[1], resolution)
        X, Y = np.meshgrid(x, y)
        
        Bx, By = self.compute_field(X, Y)
        
        # Compute field magnitude for coloring
        B_mag = np.sqrt(Bx**2 + By**2)
        B_mag_safe = np.maximum(B_mag, 1e-20)
        
        # Normalize arrows for visibility
        Bx_norm = Bx / B_mag_safe
        By_norm = By / B_mag_safe
        
        # Create figure
        fig, ax = plt.subplots(figsize=figsize, facecolor='#0d1117')
        ax.set_facecolor('#0d1117')
        
        # Plot vector field with color based on magnitude
        magnitude_log = np.log10(B_mag_safe + 1e-20)
        
        quiver = ax.quiver(
            X, Y, Bx_norm, By_norm,
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
        for coil in self.coils:
            # Draw coil as a rectangle
            rect = plt.Rectangle(
                (coil.x - coil.radius, coil.y - coil.length/2),
                2 * coil.radius,
                coil.length,
                fill=False,
                edgecolor='#58a6ff',
                linewidth=2,
                linestyle='--',
                label=f'Coil (r={coil.radius}, L={coil.length})'
            )
            ax.add_patch(rect)
            
            # Mark coil center
            ax.plot(coil.x, coil.y, 'o', color='#f78166', markersize=8)
        
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
        return fig, ax


# =============================
# Example usage
# =============================
if __name__ == "__main__":
    # Create simulation
    sim = MagneticFieldSimulation()
    
    # Add coils at different positions
    coil1 = Coil(
        x=0.0, y=0.0,
        radius=0.05,
        length=0.20,
        n_turns=100,
        current=1.0
    )
    
    # coil2 = Coil(
    #     x=0.0, y=0.20,
    #     radius=0.05,
    #     length=0.10,
    #     n_turns=100,
    #     current=1.0
    # )
    
    sim.add_coil(coil1)
    # sim.add_coil(coil2)
    
    # Plot the field
    fig, ax = sim.plot(
        x_range=(-0.20, 0.20),
        y_range=(-0.15, 0.35),
        resolution=50
    )
    
    plt.savefig('magnetic_field.png', dpi=150, facecolor='#0d1117', bbox_inches='tight')
    plt.show()

