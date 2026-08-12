#!/usr/bin/env python3
"""
Isolated test script for CrabInHoney/urlbert-tiny-v5 with MSMalicious-URLs-dataset_head.
"""

import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    print("=== Isolated URL Model v5 Test ===\n")

    # Step 1: Test dependencies
    print("Step 1: Checking dependencies...")
    try:
        import torch
        import torch.nn as nn
        import torch.nn.functional as F
        print(f"✅ PyTorch available: version {torch.__version__}")

        from transformers import AutoTokenizer, AutoModel
        print("✅ Transformers library available")

        from huggingface_hub import hf_hub_download
        print("✅ Hugging Face Hub available")

        from safetensors.torch import load_file
        print("✅ Safetensors available")
    except ImportError as e:
        print(f"❌ Dependencies missing: {e}")
        print("\nInstall required dependencies with:")
        print("pip install transformers torch huggingface-hub safetensors")
        return 1

    # Step 2: Define the classification head architecture
    print("\nStep 2: Defining classification head architecture...")

    class Head(nn.Module):
        def __init__(self, c):
            super().__init__()
            self.pre_classifier = nn.Linear(768, 768)
            self.bn = nn.BatchNorm1d(768)
            self.classifier = nn.Linear(768, c)

        def forward(self, x):
            return self.classifier(torch.dropout(torch.relu(self.bn(self.pre_classifier(x))), 0.3, False))

    print("✅ Head architecture defined")

    # Step 3: Load model, tokenizer, and head
    print("\nStep 3: Loading model, tokenizer, and classification head...")
    REPO = "CrabInHoney/urlbert-tiny-v5"
    HEAD_FILE = "MSMalicious-URLs-dataset_head.safetensors"
    LABEL_MAPPING = {0: "BENIGN", 1: "DEFACEMENT", 2: "PHISHING", 3: "MALWARE"}

    try:
        tokenizer = AutoTokenizer.from_pretrained(REPO)
        print("✅ Tokenizer loaded successfully")

        encoder = AutoModel.from_pretrained(REPO)
        encoder.eval()
        print("✅ Encoder loaded successfully (eval mode)")

        head_path = hf_hub_download(REPO, f"heads/{HEAD_FILE}")
        head = Head(len(LABEL_MAPPING))
        head.load_state_dict(load_file(head_path))
        head.eval()
        print("✅ Classification head loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load model/tokenizer/head: {e}")
        import traceback
        traceback.print_exc()
        return 1

    print(f"\nLabel mapping: {LABEL_MAPPING}")

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
        inputs = tokenizer(url, return_tensors="pt", truncation=True, max_length=512)

        # Predict
        with torch.no_grad():
            # Get CLS embedding from encoder
            outputs = encoder(**inputs)
            cls_embedding = outputs.last_hidden_state[:, 0, :]

            # Pass through head
            logits = head(cls_embedding)
            probabilities = F.softmax(logits, dim=1)[0]
            predicted_class_id = probabilities.argmax().item()
            predicted_label = LABEL_MAPPING[predicted_class_id]
            confidence = probabilities[predicted_class_id].item()

        # Get all class probabilities
        all_probs = {}
        for i, prob in enumerate(probabilities.numpy()):
            all_probs[LABEL_MAPPING[i]] = prob

        print(f"  Predicted label: {predicted_label}")
        print(f"  Confidence: {confidence:.4f}")
        print(f"  All class probabilities: {all_probs}")

        test_results.append({
            "url": url,
            "predicted_label": predicted_label,
            "confidence": confidence,
            "all_probs": all_probs,
            "is_known_benign": url in known_benign_urls,
            "is_suspicious": url in suspicious_urls,
        })

    # Print summary table
    print("\n=== Test Results Summary ===")
    print(f"{'URL':<60} | {'Predicted Label':<15} | {'Confidence':<10} | {'Reasonable?'}")
    print("-" * 120)
    for result in test_results:
        url = result["url"][:57] + "..." if len(result["url"]) > 60 else result["url"]
        predicted_label = result["predicted_label"]
        confidence = f"{result['confidence']:.4f}"

        if result["is_known_benign"]:
            reasonable = "Yes" if predicted_label == "BENIGN" else "No"
        elif result["is_suspicious"]:
            reasonable = "Yes" if predicted_label in ["PHISHING", "MALWARE", "DEFACEMENT"] else "No"
        else:
            reasonable = "Unknown"

        print(f"{url:<60} | {predicted_label:<15} | {confidence:<10} | {reasonable}")

    print("\n=== Isolated URL Model v5 Test Complete ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
