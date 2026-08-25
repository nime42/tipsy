import argparse
import json
import re
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputClassifier


def natural_sort_key(value: str):
    parts = re.split(r"(\d+)", value)
    return [int(part) if part.isdigit() else part for part in parts]


def get_feature_and_target_columns(df: pd.DataFrame):
    feature_cols = [col for col in df.columns if col.startswith(("folket_", "odds_"))]
    raw_target_cols = [col for col in df.columns if col.startswith("result_")]

    if not feature_cols:
        raise ValueError("Hittade inga funktioner som börjar med 'folket_' eller 'odds_'.")
    if not raw_target_cols:
        raise ValueError("Hittade inga målvariabler som börjar med 'result_'.")

    feature_cols = sorted(feature_cols, key=natural_sort_key)

    match_numbers = sorted({int(re.search(r"result_[^_]+_(\d+)", col).group(1)) for col in raw_target_cols})
    target_cols = []
    for match_number in match_numbers:
        for label in ["1", "x", "2"]:
            col_name = f"result_{label}_{match_number}"
            if col_name not in raw_target_cols:
                raise ValueError(f"Saknar resultatkolumn: {col_name}")
            target_cols.append(col_name)

    if len(target_cols) % 3 != 0:
        raise ValueError("Antalet resultatkolumner måste vara delbart med 3.")

    return feature_cols, target_cols


def verify_one_hot_targets(y: pd.DataFrame):
    n_targets = y.shape[1]
    for i in range(0, n_targets, 3):
        group = y.iloc[:, i : i + 3]
        if not ((group.sum(axis=1) == 1).all()):
            raise ValueError(
                f"Resultatkolumnerna {group.columns.tolist()} måste vara one-hot kodade med exakt en '1' per rad."
            )


def argmax_labels(y: np.ndarray):
    n_matches = y.shape[1] // 3
    labels = np.zeros((y.shape[0], n_matches), dtype=int)
    for match_index in range(n_matches):
        labels[:, match_index] = np.argmax(y[:, match_index * 3 : match_index * 3 + 3], axis=1)
    return labels


def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray):
    exact_match = np.mean(np.all(y_true == y_pred, axis=1))
    n_matches = y_true.shape[1] // 3

    print(f"\nExakt träffandel (alla {n_matches} matcher): {exact_match:.3f}")

    per_match_scores = []
    for match_index in range(n_matches):
        true_labels = np.argmax(y_true[:, match_index * 3 : match_index * 3 + 3], axis=1)
        pred_labels = np.argmax(y_pred[:, match_index * 3 : match_index * 3 + 3], axis=1)
        score = accuracy_score(true_labels, pred_labels)
        per_match_scores.append(score)
        print(f"Match {match_index + 1:2d} accuracy: {score:.3f}")

    print(f"Medelaccuracy per match: {np.mean(per_match_scores):.3f}")

    print("\nExempel på klassificeringsrapport för match 1:")
    print(classification_report(
        np.argmax(y_true[:, 0:3], axis=1),
        np.argmax(y_pred[:, 0:3], axis=1),
        target_names=["1", "X", "2"],
        zero_division=0,
    ))


def train_draws_model(data_path: Path, model_path: Path, metadata_path: Path, test_size: float = 0.2):
    df = pd.read_csv(data_path)

    feature_cols, target_cols = get_feature_and_target_columns(df)
    print(f"Använder {len(feature_cols)} funktioner och {len(target_cols)} målvariabler.")

    X = df[feature_cols]
    y = df[target_cols]
    verify_one_hot_targets(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )

    estimator = RandomForestClassifier(n_estimators=200, random_state=42)
    model = MultiOutputClassifier(estimator, n_jobs=-1)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    print("\n=== Utvärdering ===")
    evaluate_model(y_test.values, y_pred)

    joblib.dump(model, model_path)
    metadata = {
        "feature_columns": feature_cols,
        "target_columns": target_cols,
        "n_matches": len(target_cols) // 3,
        "result_labels": ["1", "X", "2"],
    }
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"\nModell sparad till: {model_path}")
    print(f"Metadata sparad till: {metadata_path}")


def parse_args():
    parser = argparse.ArgumentParser(description="Träna en multi-output modell för drawsdata.csv.")
    parser.add_argument("data_path", help="Sökväg till CSV-filen med drawsdata.")
    parser.add_argument("model_path", nargs="?", default="draws_model.pkl", help="Sökväg där modellen sparas.")
    parser.add_argument("metadata_path", nargs="?", default="draws_model_meta.json", help="Sökväg för metadatafil.")
    parser.add_argument("--test-size", type=float, default=0.2, help="Andel data som används för test (standard 0.2).")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train_draws_model(Path(args.data_path), Path(args.model_path), Path(args.metadata_path), test_size=args.test_size)
