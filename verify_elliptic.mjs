import { ellipk, ellipe, ellipkinc, ellipeinc } from './frontend/src/physics/elliptic.js';

function test_elliptic() {
    const m_values = [0.1, 0.5, 0.9, 0.99];
    const phi_values = [Math.PI/4, Math.PI/3];
    
    const results = {
        "ellipk": {},
        "ellipe": {},
        "ellipkinc": {},
        "ellipeinc": {}
    };
    
    // Complete integrals
    for (const m of m_values) {
        const k_res = ellipk(m);
        const e_res = ellipe(m);
        results["ellipk"][m] = k_res;
        results["ellipe"][m] = e_res;
    }
    
    // Incomplete integrals
    for (const phi of phi_values) {
        for (const m of m_values) {
            const kinc_res = ellipkinc(phi, m);
            const einc_res = ellipeinc(phi, m);
            const key = `${phi}_${m}`;
            results["ellipkinc"][key] = kinc_res;
            results["ellipeinc"][key] = einc_res;
        }
    }

    console.log(JSON.stringify(results, null, 2));
}

test_elliptic();

// node verify_elliptic.mjs