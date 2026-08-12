#!/usr/bin/env python3
"""
Isolated test script for Eason918/malicious-url-detector-v2.
"""

import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    print("=== Isolated URL Model Test: Eason918/malicious-url-detector-v2 ===\n")

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
    model_name = "Eason918/malicious-url-detector-v2"

    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        print("✅ Tokenizer loaded successfully")

        model = AutoModelForSequenceClassification.from_pretrained(model_name)
        model.eval()
        print("✅ Model loaded successfully (eval mode)")
    except Exception as e:
        print(f"❌ Failed to load model/tokenizer: {e}")
        import traceback
        traceback.print_exc()
        return 1

    # Step 3: Print model config
    print("\nStep 3: Model configuration...")
    print(f"id2label: {model.config.id2label}")
    print(f"label2id: {model.config.label2id}")

    # Step 4: Test sample URLs
    print("\nStep 4: Testing sample URLs...")
    known_benign_urls = [
        "https://google.com",
        "https://www.microsoft.com",
        "https://github.com",
        "https://huggingface.co",
        "https://openai.com",
    ]
    suspicious_urls = [
        "http://192.168.1.1/login",
        "http://example.com/verify-account-password",
        "https://randomdomain.example/free-prize-login",
        "http://secure-account-update.example.com/login",
        "http://paypal-secure-login.update.com",
    ]
    sample_urls = known_benign_urls + suspicious_urls

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
            confidence = probabilities[0][predicted_class_id].item()

        # Get all class probabilities
        all_probs = {}
        for i, prob in enumerate(probabilities[0].numpy()):
            all_probs[model.config.id2label[i]] = prob

        print(f"  Raw label: {raw_label}")
        print(f"  Confidence: {confidence:.4f}")
        print(f"  All class probabilities: {all_probs}")

        test_results.append({
            "url": url,
            "raw_label": raw_label,
            "confidence": confidence,
            "all_probs": all_probs,
            "is_known_benign": url in known_benign_urls,
            "is_suspicious": url in suspicious_urls,
        })

    # Print summary table
    print("\n=== Test Results Summary ===")
    print(f"{'URL':<60} | {'Raw Label':<12} | {'Confidence':<10} | {'Reasonable?'}")
    print("-" * 110)
    for result in test_results:
        url = result["url"][:57] + "..." if len(result["url"]) > 60 else result["url"]
        raw_label = result["raw_label"]
        confidence = f"{result['confidence']:.4f}"

        if result["is_known_benign"]:
            reasonable = "Yes" if raw_label.lower() == "benign" else "No"
        elif result["is_suspicious"]:
            reasonable = "Yes" if raw_label.lower() == "malicious" else "No"
        else:
            reasonable = "Unknown"

        print(f"{url:<60} | {raw_label:<12} | {confidence:<10} | {reasonable}")

    print("\n=== Isolated URL Model Test Complete ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
