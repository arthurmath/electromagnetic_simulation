from scipy import special
import numpy as np

phi = np.array([2.0])
kp = np.array([0.5])  # kp**2 should be between 0 and 1 for elliptic integrals
    
print(special.ellipkinc(phi, kp**2))