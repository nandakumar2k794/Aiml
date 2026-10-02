import pandas as pd
import numpy as np
import os
import io

def clean_aws_data(file_path):
    print(f"Processing AWS data from {file_path}")
    # Read ignoring the header comments
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    data_lines = []
    header = None
    for line in lines:
        if header is None and line.startswith('Date/Time'):
            header = line.strip().split('\t')
            continue
        if header is not None and line.strip():
            data_lines.append(line.strip().split('\t'))
            
    print(f"Header length: {len(header)}")
    print(f"First data row length: {len(data_lines[0])}")
    # filter data_lines to match header length
    data_lines = [line for line in data_lines if len(line) == len(header)]
    
    df = pd.DataFrame(data_lines, columns=header)
    
    # Clean column names
    col_map = {
        'Date/Time': 'datetime',
        'TTT [°C]': 'temperature',
        'ff [m/s]': 'wind_speed',
        'ff max [m/s]': 'wind_speed_max',
        'dd [deg]': 'wind_direction',
        'PPPP [hPa]': 'pressure',
        'SWD [W/m**2]': 'solar_radiation'
    }
    
    df = df.rename(columns=col_map)
    cols_to_keep = ['datetime', 'temperature', 'wind_speed', 'wind_speed_max', 'wind_direction', 'pressure', 'solar_radiation']
    existing_cols = [c for c in cols_to_keep if c in df.columns]
    df = df[existing_cols]
    
    df['datetime'] = pd.to_datetime(df['datetime'], errors='coerce')
    df = df.dropna(subset=['datetime'])
    
    for col in existing_cols:
        if col != 'datetime':
            df[col] = pd.to_numeric(df[col], errors='coerce')
            
    df['year'] = df['datetime'].dt.year
    df['month'] = df['datetime'].dt.month
    
    # Wind direction circular encoding
    if 'wind_direction' in df.columns:
        df['wind_direction_rad'] = np.deg2rad(df['wind_direction'])
        df['wind_direction_sin'] = np.sin(df['wind_direction_rad'])
        df['wind_direction_cos'] = np.cos(df['wind_direction_rad'])
        
    # Aggregate to monthly
    agg_funcs = {
        'temperature': ['mean', 'min', 'max'],
        'wind_speed': ['mean', 'max'],
        'pressure': ['mean'],
        'solar_radiation': ['mean', 'max', 'sum']
    }
    if 'wind_speed_max' in df.columns:
        agg_funcs['wind_speed_max'] = ['max']
    if 'wind_direction_sin' in df.columns:
        agg_funcs['wind_direction_sin'] = ['mean']
        agg_funcs['wind_direction_cos'] = ['mean']
        
    # Only aggregate columns that exist
    actual_agg_funcs = {k: v for k, v in agg_funcs.items() if k in df.columns}
    
    monthly_aws = df.groupby(['year', 'month']).agg(actual_agg_funcs)
    # Flatten multi-index columns
    monthly_aws.columns = ['_'.join(col).strip() for col in monthly_aws.columns.values]
    monthly_aws = monthly_aws.reset_index()
    
    return monthly_aws

def process_fuel_data(file_path):
    print(f"Processing fuel data from {file_path}")
    df = pd.read_csv(file_path, skiprows=1) # skip indicator title
    
    df = df[df['Place'] == 'Mawson']
    df = df[df['Parameter'] == 'Fuel usage']
    
    df['date'] = pd.to_datetime(df['Date'], format='%b-%y')
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    df['fuel_consumption_litres'] = pd.to_numeric(df['Value'], errors='coerce')
    
    # Adjust year for dates like Jan-93 (which could parse as 2093)
    df.loc[df['year'] > 2050, 'year'] -= 100
    
    return df[['year', 'month', 'fuel_consumption_litres']]

if __name__ == "__main__":
    aws_file = r"D:\antartic\datasets\IMAU_ANT_AWS19.tab" # King Baudouin Ice Shelf (coastal, like Mawson)
    fuel_file = r"D:\antartic\indicator_56.csv"
    
    aws_df = clean_aws_data(aws_file)
    fuel_df = process_fuel_data(fuel_file)
    
    merged = pd.merge(fuel_df, aws_df, on=['year', 'month'], how='left')
    
    # Sort by date
    merged = merged.sort_values(['year', 'month']).reset_index(drop=True)
    
    # Add temporal features
    merged['date'] = pd.to_datetime(merged['year'].astype(str) + '-' + merged['month'].astype(str) + '-01')
    merged['month_sin'] = np.sin(2 * np.pi * merged['month'] / 12)
    merged['month_cos'] = np.cos(2 * np.pi * merged['month'] / 12)
    
    # Add lag features
    merged['fuel_lag_1'] = merged['fuel_consumption_litres'].shift(1)
    merged['fuel_lag_2'] = merged['fuel_consumption_litres'].shift(2)
    merged['fuel_lag_3'] = merged['fuel_consumption_litres'].shift(3)
    
    # Fill missing weather data with historical monthly medians or interpolation
    # Since AWS data might not cover the full fuel history (1993-2016), we impute based on month
    for col in merged.columns:
        if col not in ['year', 'month', 'date', 'fuel_consumption_litres', 'fuel_lag_1', 'fuel_lag_2', 'fuel_lag_3', 'month_sin', 'month_cos']:
            # Impute missing with the median of that month across all years
            merged[col] = merged.groupby('month')[col].transform(lambda x: x.fillna(x.median()))
            # If still missing, fill with overall median
            merged[col] = merged[col].fillna(merged[col].median())
            
    # Drop rows where target is missing
    merged = merged.dropna(subset=['fuel_consumption_litres'])
    
    # Forward fill/backward fill lags just in case
    merged['fuel_lag_1'] = merged['fuel_lag_1'].fillna(merged['fuel_consumption_litres'].median())
    merged['fuel_lag_2'] = merged['fuel_lag_2'].fillna(merged['fuel_consumption_litres'].median())
    merged['fuel_lag_3'] = merged['fuel_lag_3'].fillna(merged['fuel_consumption_litres'].median())
    
    # Save processed data
    out_dir = r"D:\antartic\data\processed"
    os.makedirs(out_dir, exist_ok=True)
    merged.to_csv(os.path.join(out_dir, 'modeling_data.csv'), index=False)
    print("Preprocessing complete. Data saved to modeling_data.csv")
    print(merged.head())
