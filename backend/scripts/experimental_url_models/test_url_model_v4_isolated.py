# Experimental only. Not used by backend. v4 was rejected because it produced high false positives on known benign URLs.

#!/usr/bin/env python3
"""
Isolated test script for CrabInHoney/urlbert-tiny-v4-malicious-url-classifier.
"""

import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    print("=== Isolated URL Model Test ===\n")

    # Step 1: Test dependencies
    print("Step 1: Checking dependencies...")
    try:
        import torch
        print(f"✅ PyTorch available: version {torch.__version__}")

        from transformers import (
            AutoTokenizer,
            AutoModelForSequenceClassification,
        )
        print("✅ Transformers library available")
    except ImportError as e:
        print(f"❌ Dependencies missing: {e}")
        print("\nInstall required dependencies with:")
        print("pip install transformers torch")
        return 1

    # Step 2: Load model and tokenizer
    print("\nStep 2: Loading model and tokenizer...")
    model_name = "CrabInHoney/urlbert-tiny-v4-malicious-url-classifier"

    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        print("✅ Tokenizer loaded successfully")

        model = AutoModelForSequenceClassification.from_pretrained(model_name)
        print("✅ Model loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load model/tokenizer: {e}")
        import traceback
        traceback.print_exc()
        return 1

    # Step 3: Print model config and label mapping
    print("\nStep 3: Model configuration and label mapping...")
    print(f"id2label (raw): {model.config.id2label}")
    print(f"label2id (raw): {model.config.label2id}")

    # Exact label mapping from model card usage example
    label_mapping = {
        "LABEL_0": "benign",
        "LABEL_1": "defacement",
        "LABEL_2": "malware",
        "LABEL_3": "phishing",
    }
    print(f"Friendly label mapping: {label_mapping}")

    # Step 4: Test sample URLs
    print("\nStep 4: Testing sample URLs...")
    sample_urls = [
        "https://google.com",
        "https://www.microsoft.com",
        "https://github.com",
        "https://huggingface.co",
        "https://openai.com",
        "http://192.168.1.1/login",
        "http://example.com/verify-account-password",
        "https://randomdomain.example/free-prize-login",
        "http://secure-account-update.example.com/login",
    ]

    test_results = []

    for url in sample_urls:
        print(f"\n  URL: {url}")

        # Tokenize
        inputs = tokenizer(url, return_tensors="pt", truncation=True, padding=True)

        # Predict
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=-1)
            predicted_class_id = torch.argmax(probabilities, dim=-1).item()
            raw_label = model.config.id2label[predicted_class_id]
            mapped_label = label_mapping.get(raw_label, raw_label)
            confidence = probabilities[0][predicted_class_id].item()

        # Get all class probabilities
        all_probs = {}
        for i, prob in enumerate(probabilities[0].numpy()):
            raw_lbl = model.config.id2label[i]
            friendly_lbl = label_mapping.get(raw_lbl, raw_lbl)
            all_probs[friendly_lbl] = prob

        print(f"  Raw label: {raw_label}")
        print(f"  Mapped label: {mapped_label}")
        print(f"  Confidence: {confidence:.4f}")
        print(f"  All class probabilities: {all_probs}")

        test_results.append({
            "url": url,
            "raw_label": raw_label,
            "mapped_label": mapped_label,
            "confidence": confidence,
            "all_probs": all_probs,
        })

    # Print summary table
    print("\n=== Test Results Summary ===")
    print(f"{'URL':<60} | {'Raw Label':<10} | {'Mapped Label':<12} | {'Confidence':<10} | {'Reasonable?'}")
    print("-" * 140)
    
    known_benign_domains = ["google.com", "microsoft.com", "github.com", "huggingface.co", "openai.com"]
    suspicious_test_urls = [
        "http://192.168.1.1/login",
        "http://example.com/verify-account-password",
        "https://randomdomain.example/free-prize-login",
        "http://secure-account-update.example.com/login",
    ]
    
    for result in test_results:
        url = result["url"][:57] + "..." if len(result["url"]) > 60 else result["url"]
        raw_label = result["raw_label"]
        mapped_label = result["mapped_label"]
        confidence = f"{result['confidence']:.4f}"
        
        # Determine if reasonable
        is_known_benign = any(domain in result["url"] for domain in known_benign_domains)
        is_suspicious_test = result["url"] in suspicious_test_urls
        
        if is_known_benign:
            reasonable = "Yes" if mapped_label == "benign" else "No"
        elif is_suspicious_test:
            reasonable = "Yes" if mapped_label in ["phishing", "malware", "defacement"] else "No"
        else:
            reasonable = "Unknown"
        
        print(f"{url:<60} | {raw_label:<10} | {mapped_label:<12} | {confidence:<10} | {reasonable}")

    print("\n=== Isolated URL Model Test Complete ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
