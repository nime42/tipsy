# predict_model.py
import pandas as pd
import joblib
import json
import sys
import numpy as np
from io import StringIO

def get_data_from_command_line_args():
    if len(sys.argv) < 3:
        print("Användning: python predict_model.py <model.pkl> <datafil.csv>|datastring")
        sys.exit(1)
    model_path = sys.argv[1]
    data = sys.argv[2]
    if data.endswith(".csv"):
        df = pd.read_csv(data)
        return model_path, df
    else:
        csv_string = data.replace(';', '\n')
        df = pd.read_csv(StringIO(csv_string), header=None)
        # Add column names for string input
        df.columns = ["folket_1", "folket_x", "folket_2", "odds_1", "odds_x", "odds_2"]

    return model_path, df

def entropy(p):
    p = np.clip(p, 1e-9, 1)
    return -np.sum(p * np.log2(p))

def predict_with_model(model_path, df):
    model = joblib.load(model_path)
    

    labels = list(model.classes_)
    
    
    feature_cols = ["folket_1", "folket_x", "folket_2", "odds_1", "odds_x", "odds_2"]
    
    for col in feature_cols:
        if col not in df.columns:
            raise ValueError(f"Saknar kolumn: {col}")
    
    X = df[feature_cols]
    preds = model.predict(X)
    probs = model.predict_proba(X)
    
    # Bygg dataframe med sannolikheter i rätt ordning
    for i, label in enumerate(labels):
        df[f"prob_{label}"] = probs[:, i]
    
    df["prediction"] = preds

    # Beräkna entropi för varje match
    df["entropy"] = df.apply(lambda r: entropy([r["prob_1"], r["prob_X"], r["prob_2"]]), axis=1)


    print(df[["prediction","prob_1","prob_X","prob_2","entropy"]])

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Användning: python predict_model.py <model.pkl> <'datastring'>|<datafil.csv>")
        print("Example: python predict_model.py model.pkl '0.4,0.3,0.3,1.8,3.2,4.5;0.6,0.2,0.2,1.5,3.8,5.5'")
        print("   där datastring är semikolonseparerade rader med kommateckenseparerade värden,kolumnerna är folket_1, folket_x, folket_2, odds_1, odds_x, odds_2")
        print("   eller: python predict_model.py model.pkl data.csv")
        sys.exit(1)
    

    model_path,df= get_data_from_command_line_args()
    predict_with_model(model_path, df)
