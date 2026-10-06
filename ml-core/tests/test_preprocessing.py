import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("ml-core"))

import pandas as pd
import numpy as np
from src.preprocessing import CreditFeaturePreprocessor

def test_credit_feature_preprocessor_fit_transform():
    df_raw = pd.DataFrame({
        "monthly_inflow_avg": [20000.0, 35000.0, 15000.0],
        "inflow_volatility": [0.25, 0.45, 0.15],
        "platform_type": ["delivery", "ride", "vendor"]
    })

    prep = CreditFeaturePreprocessor()
    df_proc = prep.fit_transform(df_raw)

    assert isinstance(df_proc, pd.DataFrame)
    assert len(df_proc) == 3
    assert "monthly_inflow_avg" in df_proc.columns
    assert "inflow_volatility" in df_proc.columns
    assert any("platform_type" in c for c in df_proc.columns)

def test_credit_feature_preprocessor_non_leakage():
    df_train = pd.DataFrame({
        "monthly_inflow_avg": [20000.0, 30000.0],
        "platform_type": ["delivery", "ride"]
    })
    df_test = pd.DataFrame({
        "monthly_inflow_avg": [25000.0],
        "platform_type": ["delivery"]
    })

    prep = CreditFeaturePreprocessor()
    prep.fit(df_train)
    df_test_proc = prep.transform(df_test)

    assert len(df_test_proc) == 1
    assert df_test_proc.shape[1] == prep.transform(df_train).shape[1]
