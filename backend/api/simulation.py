import pandas as pd
import numpy as np

def generate_synthetic_load(scenarios_hours=24, scenario='NORMAL'):
    '''
    Generate a synthetic electrical load profile for the prototype.
    This is purely a SIMULATION for demonstration purposes.
    '''
    np.random.seed(42)
    # Base load around 150 kW
    base = 150 
    
    loads = []
    critical_loads = []
    flexible_loads = []
    
    for h in range(scenarios_hours):
        # Time of day effect
        tod_factor = 1.0 + 0.2 * np.sin(np.pi * (h - 6) / 12) 
        
        # Scenario adjustments
        if scenario == 'LOW_SOLAR_SNOWSTORM':
            base_scenario = base * 1.3 # Higher heating demand
        elif scenario == 'SEVERE_SHORTAGE':
            base_scenario = base * 1.5
        else:
            base_scenario = base
            
        total_load = base_scenario * tod_factor + np.random.normal(0, 10)
        # Critical load is about 60% of total
        critical = total_load * 0.6
        flexible = total_load - critical
        
        loads.append(total_load)
        critical_loads.append(critical)
        flexible_loads.append(flexible)
        
    return pd.DataFrame({
        'hour': range(scenarios_hours),
        'total_demand_kW': loads,
        'critical_demand_kW': critical_loads,
        'flexible_demand_kW': flexible_loads
    })

def estimate_solar_generation(aws_data, scenario='NORMAL'):
    '''
    ESTIMATED SOLAR GENERATION based on an explicit assumed PV configuration.
    Assumed PV capacity = 100 kW
    '''
    pv_capacity_kw = 100
    efficiency = 0.18
    # We take solar_radiation (W/m2) and convert to kW assuming a fixed area
    # Or simply scale: 1000 W/m2 -> pv_capacity_kw
    
    # We will just generate 24h profile based on a typical day and scenario
    solar = []
    for h in range(24):
        # daytime 6 to 18
        if 6 <= h <= 18:
            power = pv_capacity_kw * np.sin(np.pi * (h - 6) / 12)
        else:
            power = 0
            
        if scenario == 'LOW_SOLAR_SNOWSTORM':
            power *= 0.1 # 90% reduction
        elif scenario == 'SEVERE_SHORTAGE':
            power *= 0.05
            
        solar.append(power)
        
    return solar

def run_optimization(load_df, solar_profile, battery_params, generator_params, scenario='NORMAL'):
    '''
    Energy Optimization Engine
    Determines dispatch to minimize diesel while meeting critical load.
    '''
    results = []
    
    soc = battery_params['initial_SOC']
    cap = battery_params['battery_capacity_kWh']
    min_soc = battery_params['minimum_SOC'] * cap
    max_soc = battery_params['maximum_SOC'] * cap
    chg_eff = battery_params['charge_efficiency']
    dis_eff = battery_params['discharge_efficiency']
    max_pwr = battery_params['maximum_discharge_power']
    
    gen_cap = generator_params['generator_capacity_kW']
    
    for i, row in load_df.iterrows():
        demand = row['total_demand_kW']
        crit_demand = row['critical_demand_kW']
        flex_demand = row['flexible_demand_kW']
        solar = solar_profile[i]
        
        # 1. Use solar first
        net_load = demand - solar
        diesel_gen = 0
        batt_discharge = 0
        batt_charge = 0
        unused_solar = 0
        load_served = demand
        crit_served = crit_demand
        
        if net_load < 0:
            # Excess solar
            excess = -net_load
            # Charge battery
            space = max_soc - soc
            charge = min(excess * chg_eff, space, max_pwr)
            soc += charge
            unused_solar = excess - (charge / chg_eff)
            batt_charge = charge
        else:
            # Need more power
            # Try battery first
            available_energy = (soc - min_soc) * dis_eff
            discharge = min(net_load, available_energy, max_pwr)
            
            soc -= discharge / dis_eff
            batt_discharge = discharge
            
            net_load -= discharge
            
            if net_load > 0:
                # Need diesel
                diesel_needed = net_load
                if diesel_needed > gen_cap:
                    diesel_gen = gen_cap
                    unmet = diesel_needed - gen_cap
                    # Drop flexible load first
                    if unmet <= flex_demand:
                        load_served -= unmet
                    else:
                        load_served -= flex_demand
                        unmet_crit = unmet - flex_demand
                        crit_served -= unmet_crit
                        load_served -= unmet_crit
                else:
                    diesel_gen = diesel_needed
                    
        # Energy risk logic (simplified for prototype)
        risk = "NORMAL"
        if soc < (min_soc + 0.1 * cap):
            risk = "CRITICAL"
        elif soc < (min_soc + 0.3 * cap):
            risk = "HIGH RISK"
        elif scenario != "NORMAL":
            risk = "WATCH"
            
        fuel_used = diesel_gen * generator_params['fuel_consumption_rate']
            
        results.append({
            'hour': i,
            'demand': float(demand),
            'critical_demand': float(crit_demand),
            'solar': float(solar),
            'battery_charge': float(batt_charge),
            'battery_discharge': float(batt_discharge),
            'soc_kwh': float(soc),
            'soc_percent': float(soc / cap * 100),
            'diesel_gen': float(diesel_gen),
            'fuel_used_litres': float(fuel_used),
            'load_served': float(load_served),
            'critical_served': float(crit_served),
            'unused_solar': float(unused_solar),
            'risk_status': risk
        })
        
    return results
