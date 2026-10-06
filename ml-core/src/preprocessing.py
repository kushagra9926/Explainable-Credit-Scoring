"""
Data Preprocessing & Feature Engineering Pipeline.
Handles encoding of categorical & protected attributes, missing values, and scaling.
"""

import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

class CreditFeaturePreprocessor(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.column_transformer = None
        self.feature_names_out = []
        self.num_cols = []
        self.cat_cols = []

    def fit(self, X: pd.DataFrame, y=None):
        X = pd.DataFrame(X)
        self.cat_cols = [c for c in X.columns if X[c].dtype == 'object' or X[c].dtype.name == 'category']
        self.num_cols = [c for c in X.columns if c not in self.cat_cols]

        transformers = []
        if self.num_cols:
            transformers.append(('num', StandardScaler(), self.num_cols))
        if self.cat_cols:
            transformers.append(('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), self.cat_cols))

        self.column_transformer = ColumnTransformer(transformers=transformers)
        self.column_transformer.fit(X, y)

        # Build feature names
        feature_names = list(self.num_cols)
        if self.cat_cols:
            ohe = self.column_transformer.named_transformers_['cat']
            cat_names = list(ohe.get_feature_names_out(self.cat_cols))
            feature_names.extend(cat_names)
            
        self.feature_names_out = feature_names
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X = pd.DataFrame(X)
        arr = self.column_transformer.transform(X)
        return pd.DataFrame(arr, columns=self.feature_names_out, index=X.index)

    def fit_transform(self, X: pd.DataFrame, y=None) -> pd.DataFrame:
        self.fit(X, y)
        return self.transform(X)
