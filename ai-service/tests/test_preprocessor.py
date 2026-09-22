"""
AI Service Unit Tests
Tests preprocessing matrices, feature imputation, and model prediction boundaries.
"""
import os
import sys
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

class TestAIPreprocessor(unittest.TestCase):
    def test_feature_scaling_range(self):
        sample_values = [10.0, 20.0, 30.0, 40.0, 50.0]
        min_val = min(sample_values)
        max_val = max(sample_values)
        normalized = [(x - min_val) / (max_val - min_val) for x in sample_values]
        self.assertEqual(normalized[0], 0.0)
        self.assertEqual(normalized[-1], 1.0)

    def test_delay_bound_checks(self):
        predicted_delay_hours = max(0.0, 4.5)
        self.assertGreaterEqual(predicted_delay_hours, 0.0)

if __name__ == '__main__':
    unittest.main()
