# train_model.py
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import json
import sys

def train_model(data_path, model_path="model.pkl", classes_path="classes.json"):
    df = pd.read_csv(data_path)
    
    required_cols = [
        "folket_1", "folket_x", "folket_2",
        "odds_1", "odds_x", "odds_2",
        "resultat"
    ]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Saknar kolumn: {col}")
    
    X = df[["folket_1", "folket_x", "folket_2", "odds_1", "odds_x", "odds_2"]]
    y = df["resultat"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    print("\n=== Modellens träffsäkerhet ===")
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("\nKlassificeringsrapport:")
    print(classification_report(y_test, y_pred))
    
    # Spara modell och klasser
    joblib.dump(model, model_path)
    with open(classes_path, "w") as f:
        json.dump(list(model.classes_), f)
    
    print(f"\nModell sparad till: {model_path}")
    print(f"Klasser sparade till: {classes_path}")
    print("Klassordning:", list(model.classes_))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Användning: python train_model.py <datafil.csv> [model.pkl]")
        sys.exit(1)
    
    data_path = sys.argv[1]
    model_path = sys.argv[2] if len(sys.argv) > 2 else "model.pkl"
    train_model(data_path, model_path)
