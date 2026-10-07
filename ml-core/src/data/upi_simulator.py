"""
Synthetic UPI Transaction-Level Gig-Worker Simulator.

Simulates 6 to 12 months of daily transaction logs for informal gig-workers
(Delivery Partners, Ride-Hail Drivers, Freelancers, Micro-Vendors) using latent traits:
- Income Level, Volatility, Discipline, Shock Exposure
Derives behavioral credit features and ground-truth default labels with controlled noise.
NOTE: All generated data is explicitly flagged as synthetic for academic transparent auditing.
"""

import numpy as np
import pandas as pd
from typing import Dict, Tuple, List, Optional
import datetime

class UPIGigWorkerSimulator:
    def __init__(self, seed: int = 42):
        self.rng = np.random.RandomState(seed)

    def generate_applicant_transactions(
        self,
        applicant_id: str,
        platform_type: str = "delivery",
        num_months: int = 6,
        protected_gender: str = "Female",
        protected_city_tier: str = "Tier-2",
        include_raw_tx: bool = True
    ) -> Dict:
        """
        Simulates raw daily transaction feed for a single applicant over num_months.
        """
        days = num_months * 30
        start_date = datetime.date(2025, 1, 1)

        # Profile trait defaults depending on platform type
        profiles = {
            "delivery": {"base_daily": 600, "volatility": 0.25, "ticket_avg": 80, "freq_per_day": 7},
            "ride": {"base_daily": 850, "volatility": 0.30, "ticket_avg": 170, "freq_per_day": 5},
            "freelance": {"base_daily": 1400, "volatility": 0.50, "ticket_avg": 2500, "freq_per_day": 0.6},
            "vendor": {"base_daily": 1100, "volatility": 0.20, "ticket_avg": 120, "freq_per_day": 10},
        }

        prof = profiles.get(platform_type.lower(), profiles["delivery"])
        freq_multiplier = float(self.rng.uniform(0.3, 2.5))
        effective_freq = max(0.2, prof["freq_per_day"] * freq_multiplier)

        # Latent borrower traits
        latent_discipline = self.rng.beta(2, 2)  # [0, 1] - higher means better financial discipline
        latent_shock = self.rng.binomial(1, p=0.35)  # 1 if experienced a severe health/vehicle shock
        shock_severity = self.rng.uniform(0.2, 0.6) if latent_shock else 0.0

        transactions = []
        balance = 500.0
        zero_balance_days = 0
        active_days = 0
        utility_on_time = 0
        utility_total = 0
        recharge_regularity = 0
        recharge_total = 0
        emergency_drawdowns = 0
        total_tx_count = 0

        total_inflow = 0.0
        total_outflow = 0.0
        monthly_inflows = []
        curr_month_inflow = 0.0

        for d in range(days):
            date_str = (start_date + datetime.timedelta(days=d)).isoformat()
            day_of_month = (d % 30) + 1

            # Shock impact during second half of observation
            shock_factor = (1.0 - shock_severity) if (latent_shock and d > (days // 2)) else 1.0

            # Daily earnings simulation
            is_active = self.rng.rand() < (0.8 + 0.15 * latent_discipline)
            if is_active:
                active_days += 1
                n_tx = max(1, int(self.rng.poisson(effective_freq)))
                total_tx_count += n_tx
                daily_earning = max(0.0, self.rng.normal(prof["base_daily"], prof["base_daily"] * prof["volatility"]) * shock_factor)
                
                if include_raw_tx:
                    tx_amounts = self.rng.dirichlet(np.ones(n_tx)) * daily_earning
                    for amt in tx_amounts:
                        transactions.append({
                            "transaction_id": f"TX_{applicant_id}_{d}_{len(transactions)}",
                            "timestamp": f"{date_str}T{self.rng.randint(8,21):02d}:{self.rng.randint(0,59):02d}:00Z",
                            "amount": round(float(amt), 2),
                            "type": "CREDIT",
                            "category": "PLATFORM_PAYOUT",
                            "counterparty": f"UPI_{platform_type.upper()}_HUB"
                        })
                
                balance += daily_earning
                curr_month_inflow += daily_earning
                total_inflow += daily_earning

            # Utility & Rent payments on 5th and 20th of each month
            if day_of_month in [5, 20]:
                utility_total += 1
                bill_amount = self.rng.uniform(400, 1500)
                paid_on_time = self.rng.rand() < (0.5 + 0.48 * latent_discipline)
                if paid_on_time and balance >= bill_amount:
                    utility_on_time += 1
                    balance -= bill_amount
                    total_outflow += bill_amount
                    if include_raw_tx:
                        transactions.append({
                            "transaction_id": f"TX_{applicant_id}_{d}_UTIL",
                            "timestamp": f"{date_str}T10:00:00Z",
                            "amount": round(float(bill_amount), 2),
                            "type": "DEBIT",
                            "category": "UTILITY",
                            "counterparty": "BESCOM_UTILITY_UPI"
                        })

            # Mobile Data Recharge every 28 days
            if day_of_month == 28:
                recharge_total += 1
                recharge_amt = 299.0
                if balance >= recharge_amt and (self.rng.rand() < (0.6 + 0.38 * latent_discipline)):
                    recharge_regularity += 1
                    balance -= recharge_amt
                    total_outflow += recharge_amt
                    if include_raw_tx:
                        transactions.append({
                            "transaction_id": f"TX_{applicant_id}_{d}_RCHG",
                            "timestamp": f"{date_str}T14:30:00Z",
                            "amount": recharge_amt,
                            "type": "DEBIT",
                            "category": "RECHARGE",
                            "counterparty": "JIO_UPI"
                        })

            # Daily living outflow
            living_exp = max(100.0, self.rng.normal(250, 50))
            if balance < living_exp:
                zero_balance_days += 1
                if living_exp > balance + 200:
                    emergency_drawdowns += 1
            balance = max(10.0, balance - living_exp)
            total_outflow += living_exp

            # Track month boundary
            if day_of_month == 30:
                monthly_inflows.append(curr_month_inflow)
                curr_month_inflow = 0.0

        # Derived behavioral features
        monthly_inflows_np = np.array(monthly_inflows) if monthly_inflows else np.array([total_inflow])
        inflow_avg = float(np.mean(monthly_inflows_np))
        inflow_std = float(np.std(monthly_inflows_np))
        inflow_volatility = float(inflow_std / (inflow_avg + 1.0))

        active_days_ratio = round(active_days / float(days), 4)
        utility_punctuality = round(utility_on_time / float(max(1, utility_total)), 4)
        recharge_regularity_idx = round(recharge_regularity / float(max(1, recharge_total)), 4)
        inflow_outflow_ratio = round(total_inflow / float(max(1.0, total_outflow)), 4)

        # Ground truth default determination based on latent physics + realistic noise
        risk_score_latent = (
            - 2.5 * active_days_ratio
            - 2.0 * utility_punctuality
            - 1.5 * recharge_regularity_idx
            + 2.8 * inflow_volatility
            + 0.15 * zero_balance_days
            + 0.40 * emergency_drawdowns
            + 1.5 * (1.0 if latent_shock else 0.0)
            - 2.0 * latent_discipline
            + 2.8
        )
        
        # Logistic sigmoid probability
        prob_default = 1.0 / (1.0 + np.exp(-risk_score_latent))
        noisy_prob = np.clip(prob_default + self.rng.normal(0, 0.04), 0.01, 0.99)
        default_label = int(noisy_prob > 0.40)

        feature_vector = {
            "applicant_id": applicant_id,
            "platform_type": platform_type,
            "monthly_inflow_avg": round(inflow_avg, 2),
            "monthly_outflow_avg": round(total_outflow / num_months, 2),
            "inflow_volatility": round(inflow_volatility, 4),
            "inflow_outflow_ratio": inflow_outflow_ratio,
            "active_days_ratio": active_days_ratio,
            "utility_punctuality_score": utility_punctuality,
            "recharge_regularity_index": recharge_regularity_idx,
            "avg_transaction_value": round(total_inflow / max(1, total_tx_count), 2),
            "peak_daily_inflow": round(float(np.max(monthly_inflows_np) / 20.0), 2) if len(monthly_inflows_np) else 500.0,
            "emergency_drawdown_count": emergency_drawdowns,
            "zero_balance_days": zero_balance_days,
            "platform_diversity": 2 if platform_type in ["freelance", "vendor"] else 1,
            "tenure_months": num_months,
            "gender": protected_gender,
            "city_tier": protected_city_tier,
            "default_label": default_label,
            "is_synthetic": True
        }

        return {
            "applicant_id": applicant_id,
            "transactions": transactions,
            "features": feature_vector
        }

    def generate_dataset(
        self,
        num_samples: int = 2500,
        min_months: int = 3,
        max_months: int = 60
    ) -> pd.DataFrame:
        """
        Generates a synthetic UPI dataset of size num_samples with varying account tenure (3 to 60 months).
        """
        platforms = ["delivery", "ride", "freelance", "vendor"]
        genders = ["Female", "Male"]
        city_tiers = ["Tier-1", "Tier-2", "Tier-3"]
        possible_tenures = [3, 6, 9, 12, 18, 24, 36, 48, 60]

        records = []
        for i in range(num_samples):
            app_id = f"UPI_GIG_{i+100001:06d}"
            plat = str(self.rng.choice(platforms, p=[0.40, 0.30, 0.15, 0.15]))
            gender = str(self.rng.choice(genders, p=[0.45, 0.55]))
            city = str(self.rng.choice(city_tiers, p=[0.30, 0.45, 0.25]))
            tenure = int(self.rng.choice(possible_tenures))

            res = self.generate_applicant_transactions(
                applicant_id=app_id,
                platform_type=plat,
                num_months=tenure,
                protected_gender=gender,
                protected_city_tier=city,
                include_raw_tx=False
            )
            records.append(res["features"])

        df = pd.DataFrame(records)
        return df

if __name__ == "__main__":
    sim = UPIGigWorkerSimulator(seed=42)
    df = sim.generate_dataset(num_samples=100)
    print(f"Generated synthetic UPI dataset of shape: {df.shape}")
    print(f"Default rate: {df['default_label'].mean():.2%}")
    print(df.head(2))

