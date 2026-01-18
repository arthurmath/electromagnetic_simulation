import numpy as np
from scipy import special



def get_phi(r, a, ksi):
    return np.arctan(np.abs(ksi / (a - r)))



def get_lambda(phi, k):
    """
    Calcule la fonction lambda de Heuman Λ(get_phi, k)

    Parameters:
    phi (float ou array) : Angle en radians
    k (float) : Module elliptique (0 <= k <= 1)
    """
    kp = np.sqrt(1 - k**2)  # module complémentaire

    # Intégrales complètes
    K = special.ellipk(k**2)
    E = special.ellipe(k**2)

    # Intégrales incomplètes (avec le module complémentaire)
    F_get_phi = special.ellipkinc(np.asarray(phi), kp**2)
    E_get_phi = special.ellipeinc(np.asarray(phi), kp**2)

    return (2 / np.pi) * (E * F_get_phi + K * E_get_phi - K * F_get_phi)



def get_k(a, r, ksi):
    """Compute k parameter for elliptic integrals."""
    denom = ksi**2 + (a + r)**2
    # Avoid division by zero
    denom = np.where(denom == 0, 1e-12, denom)
    k_sq = (4 * a * r) / denom
    # Clamp to valid range for sqrt
    k_sq = np.clip(k_sq, 0, 0.9999)
    return np.sqrt(k_sq)



def get_Br(a, mu, n, i, r, ksi_low, ksi_high):
    """Compute radial magnetic field component."""

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
    
    k_high = get_k(a, r_valid, ksi_high_valid)
    k_low = get_k(a, r_valid, ksi_low_valid)
    
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



def get_Bz(a, mu, n, i, r, ksi_low, ksi_high):
    """Compute axial magnetic field component."""
    
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
    
    k_high = get_k(a, r_valid, ksi_high_valid)
    k_low = get_k(a, r_valid, ksi_low_valid)
    
    k_high = np.maximum(k_high, 1e-10)
    k_low = np.maximum(k_low, 1e-10)
    
    K_high = special.ellipk(k_high**2)
    K_low = special.ellipk(k_low**2)
    
    sqrt_ar = np.sqrt(a * r_valid)
    sqrt_ar = np.maximum(sqrt_ar, 1e-10)

    get_phi_high = get_phi(r_valid, a, ksi_high_valid)
    get_phi_low = get_phi(r_valid, a, ksi_low_valid)
    
    Bz_high = (mu * n * i / 4) * (((ksi_high_valid * k_high) / (np.pi * sqrt_ar) * K_high) + ((a - r_valid) * ksi_high_valid / np.abs((a - r_valid) * ksi_high_valid) * get_lambda(get_phi_high, k_high)))
    Bz_low  = (mu * n * i / 4) * (((ksi_low_valid * k_low) / (np.pi * sqrt_ar) * K_low) + ((a - r_valid) * ksi_low_valid / np.abs((a - r_valid) * ksi_low_valid) * get_lambda(get_phi_low, k_low)))
    
    result[mask] = Bz_high - Bz_low
    
    # On-axis points get solenoid approximation
    on_axis = ~mask
    if np.any(on_axis):
        result[on_axis] = mu * n * i
    
    return result[0] if scalar_input else result