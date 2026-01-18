import numpy as np
from scipy import special
import json

def test_elliptic():
    m_values = [0.1, 0.5, 0.9, 0.99]
    phi_values = [np.pi/4, np.pi/3]
    
    results = {
        "ellipk": {},
        "ellipe": {},
        "ellipkinc": {},
        "ellipeinc": {}
    }
    
    # Complete integrals
    for m in m_values:
        k_res = special.ellipk(m)
        e_res = special.ellipe(m)
        results["ellipk"][m] = k_res
        results["ellipe"][m] = e_res
        
    # Incomplete integrals
    for phi in phi_values:
        for m in m_values:
            kinc_res = special.ellipkinc(phi, m)
            einc_res = special.ellipeinc(phi, m)
            key = f"{phi}_{m}"
            results["ellipkinc"][key] = kinc_res
            results["ellipeinc"][key] = einc_res

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    test_elliptic()

