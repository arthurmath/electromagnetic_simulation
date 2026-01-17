import numpy as np
import matplotlib.pyplot as plt
from scipy.special import ellipk, ellipe

# =============================
# Coil geometry
# =============================
a_c = 0.05
L_c = 0.30
N_c = 5
n_c = N_c / L_c
mu_0 = 4 * np.pi * 1e-7
I = 1


# =============================
# Magnetic field helpers
# =============================
def ksi_l(z, L):
    return z - L / 2

def ksi_h(z, L):
    return z + L / 2

def k_val(r, a, ksi):
    return np.sqrt((4 * a * r) / (ksi**2 + (a + r)**2))

def phi(r, a, ksi):
    return np.arctan(np.abs(ksi / (a - r)))

# =============================
# Radial field Br
# =============================
def Br(mu, n, i, a, r, ksi_low, ksi_high):
    k_high = k_val(r, a, ksi_high)
    k_low = k_val(r, a, ksi_low)

    K_high = ellipk(k_high**2)
    E_high = ellipe(k_high**2)
    K_low = ellipk(k_low**2)
    E_low = ellipe(k_low**2)

    Br_high = (mu * n * i / np.pi) * np.sqrt(a / r) * (
        ((2 - k_high**2) / (2 * k_high)) * K_high - E_high / k_high
    )
    Br_low = (mu * n * i / np.pi) * np.sqrt(a / r) * (
        ((2 - k_low**2) / (2 * k_low)) * K_low - E_low / k_low
    )
    return Br_high - Br_low

# =============================
# Axial field Bz (simplified, no Heuman here)
# =============================
def Bz(mu, n, i, a, r, ksi_low, ksi_high):
    k_high = k_val(r, a, ksi_high)
    k_low = k_val(r, a, ksi_low)

    K_high = ellipk(k_high**2)
    K_low = ellipk(k_low**2)

    Bz_high = (mu * n * i / (4 * np.pi)) * (
        (ksi_high * k_high) / (np.pi * np.sqrt(a * r)) * K_high
    )
    Bz_low = (mu * n * i / (4 * np.pi)) * (
        (ksi_low * k_low) / (np.pi * np.sqrt(a * r)) * K_low
    )
    return Bz_high - Bz_low

# =============================
# Example field values
# =============================
z_test = 0.1
r_test = 0.05

kl = ksi_l(z_test, L_c)
kh = ksi_h(z_test, L_c)

br_val = Br(mu_0, n_c, I, a_c, r_test, kl, kh)
bz_val = Bz(mu_0, n_c, I, a_c, r_test, kl, kh)

print("Br =", br_val)
print("Bz =", bz_val)
