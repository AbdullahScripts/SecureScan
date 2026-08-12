"""
AI malware detection service using MalConv model from cycloevan/malconv.

Phase 4: Real model implementation.
Uses Hugging Face Hub to download weights, builds MalConv architecture locally,
and runs inference on raw file bytes (static analysis only, no execution).

Fallback: if model fails to load or predict, returns "unavailable" label.
"""

import logging
import os
from typing import Dict, Optional

import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)

# Lazy-loaded model
_model: Optional[object] = None
_model_loaded: bool = False
_model_failed: bool = False

# MalConv model architecture from cycloevan/malconv/src/model.py
try:
    import tensorflow as tf
    from tensorflow.keras import layers, Model

    class DeCorrelationLoss(tf.keras.layers.Layer):
        """DeCov normalization from the paper"""
        def __init__(self, lambda_decov=1e-4, **kwargs):
            super(DeCorrelationLoss, self).__init__(**kwargs)
            self.lambda_decov = lambda_decov

        def build(self, input_shape):
            super(DeCorrelationLoss, self).build(input_shape)

        def call(self, inputs):
            batch_size = tf.cast(tf.shape(inputs)[0], tf.float32)
            inputs_centered = inputs - tf.reduce_mean(inputs, axis=0, keepdims=True)
            covariance = tf.matmul(inputs_centered, inputs_centered, transpose_a=True) / (batch_size - 1)
            covariance_off_diagonal = covariance - tf.linalg.diag(tf.linalg.diag_part(covariance))
            decov_loss = 0.5 * tf.reduce_sum(tf.square(covariance_off_diagonal))
            self.add_loss(self.lambda_decov * decov_loss)
            return inputs

    class MalConv(Model):
        """MalConv model as specified in the paper"""
        def __init__(self, 
                     max_input_length=2_000_000,
                     embedding_size=8,
                     filter_size=500,
                     stride=500,
                     num_filters=128,
                     fc_size=128,
                     use_decov=True,
                     lambda_decov=1e-4,
                     **kwargs):
            super(MalConv, self).__init__(**kwargs)
            self.max_input_length = max_input_length
            self.use_decov = use_decov

            self.embedding = layers.Embedding(
                input_dim=256,
                output_dim=embedding_size,
                input_length=None,
                mask_zero=False,
                name='byte_embedding'
            )

            self.conv_A = layers.Conv1D(
                filters=num_filters,
                kernel_size=filter_size,
                strides=stride,
                padding='valid',
                activation='relu',
                name='conv_A'
            )

            self.conv_B = layers.Conv1D(
                filters=num_filters,
                kernel_size=filter_size,
                strides=stride,
                padding='valid',
                activation='sigmoid',
                name='conv_B'
            )

            self.global_max_pool = layers.GlobalMaxPooling1D(name='global_max_pool')
            self.fc = layers.Dense(fc_size, activation='relu', name='fc_layer')

            if use_decov:
                self.decov_layer = DeCorrelationLoss(lambda_decov=lambda_decov)

            self.dropout = layers.Dropout(0.5, name='dropout')
            self.output_layer = layers.Dense(1, activation='sigmoid', name='output')

        def call(self, inputs, training=None):
            x = self.embedding(inputs)
            conv_a = self.conv_A(x)
            conv_b = self.conv_B(x)
            gated_conv = layers.multiply([conv_a, conv_b], name='gated_conv')
            pooled = self.global_max_pool(gated_conv)
            fc_out = self.fc(pooled)

            if self.use_decov:
                fc_out = self.decov_layer(fc_out)

            if training:
                fc_out = self.dropout(fc_out, training=training)

            output = self.output_layer(fc_out)
            return output

    TF_AVAILABLE = True
except ImportError as e:
    logger.warning(f"TensorFlow/Keras not available: {e}")
    TF_AVAILABLE = False
    MalConv = None
    DeCorrelationLoss = None

try:
    from huggingface_hub import hf_hub_download
    HF_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Hugging Face Hub not available: {e}")
    HF_AVAILABLE = False


def _load_model() -> bool:
    """
    Load the MalConv model lazily (only once, when first needed).
    
    Returns:
        True if model loaded successfully, False otherwise.
    """
    global _model, _model_loaded, _model_failed

    if _model_loaded:
        return True
    if _model_failed:
        return False
    if not settings.ENABLE_AI_SCANNER:
        logger.info("AI scanner disabled via ENABLE_AI_SCANNER=false")
        _model_failed = True
        return False
    if not TF_AVAILABLE:
        logger.error("Cannot load model: TensorFlow/Keras not available")
        _model_failed = True
        return False
    if not HF_AVAILABLE:
        logger.error("Cannot load model: Hugging Face Hub not available")
        _model_failed = True
        return False

    try:
        logger.info("Downloading MalConv weights from Hugging Face Hub...")
        weights_path = hf_hub_download(
            repo_id=settings.MALCONV_MODEL_REPO,
            filename=settings.MALCONV_WEIGHTS_FILE
        )
        logger.info(f"Weights downloaded to: {weights_path}")

        logger.info("Building MalConv model...")
        model = MalConv(max_input_length=settings.MALCONV_MAX_BYTES)

        # Pass dummy input to build the model
        dummy_input = tf.zeros((1, settings.MALCONV_MAX_BYTES), dtype=tf.int32)
        _ = model(dummy_input)
        logger.info("Model built successfully")

        logger.info("Loading model weights...")
        model.load_weights(weights_path)
        logger.info("Weights loaded successfully")

        _model = model
        _model_loaded = True
        return True
    except Exception as e:
        logger.error(f"Failed to load MalConv model: {e}")
        import traceback
        logger.error(traceback.format_exc())
        _model_failed = True
        return False


def _preprocess_file(file_path: str) -> Optional[np.ndarray]:
    """
    Preprocess a binary file for MalConv input.
    
    Args:
        file_path: Absolute path to the file.
        
    Returns:
        Preprocessed numpy array of shape (2000000,), dtype uint8, or None on error.
    """
    try:
        with open(file_path, 'rb') as f:
            raw_bytes = f.read()

        byte_array = np.frombuffer(raw_bytes, dtype=np.uint8)

        if len(byte_array) > settings.MALCONV_MAX_BYTES:
            return byte_array[:settings.MALCONV_MAX_BYTES]
        else:
            padded = np.zeros(settings.MALCONV_MAX_BYTES, dtype=np.uint8)
            padded[:len(byte_array)] = byte_array
            return padded
    except Exception as e:
        logger.error(f"Failed to preprocess file {file_path}: {e}")
        return None


def predict(file_path: str) -> Dict:
    """
    Run AI malware detection on a file using MalConv.
    
    Args:
        file_path: Absolute path to the file to analyze.
        
    Returns:
        Dictionary with:
        - label: "benign", "malicious", "unavailable", or "skipped"
        - confidence: float between 0.0 and 1.0
        - score: raw prediction score (float) or None
        - note: explanation if applicable
    """
    logger.info(f"AI scan requested for: {file_path}")

    # First check if file is valid PE executable
    from app.services.file_service import is_valid_pe_file
    if not is_valid_pe_file(file_path):
        logger.info("AI scanner skipped: file is not a valid PE executable")
        return {
            "label": "skipped",
            "confidence": 0.0,
            "score": None,
            "note": "AI scanner skipped because this file is not a valid PE executable.",
        }

    # Check if model is available
    if not _load_model():
        logger.warning("Model unavailable, returning fallback result")
        return {
            "label": "unavailable",
            "confidence": 0.0,
            "score": None,
            "note": "AI scanner unavailable due to model loading error.",
        }

    # Preprocess the file
    processed = _preprocess_file(file_path)
    if processed is None:
        logger.warning("File preprocessing failed, returning fallback result")
        return {
            "label": "unavailable",
            "confidence": 0.0,
            "score": None,
        }

    # Run prediction
    try:
        input_data = np.expand_dims(processed, axis=0)
        prediction = _model.predict(input_data, verbose=0)
        pred_value = float(prediction[0][0])

        # Map prediction with confidence handling
        if pred_value > 0.5:
            # Benign
            label = "benign"
            confidence = pred_value
        else:
            # Malicious - check confidence threshold
            confidence = 1.0 - pred_value
            if confidence < 0.90:
                label = "suspicious"
            else:
                label = "malicious"

        # Diagnostic logging
        logger.info(f"AI diagnostic - raw score: {pred_value:.6f}, mapped label: {label}, confidence: {confidence:.4f}")
        logger.info(f"AI prediction: {label} (confidence: {confidence:.4f}, score: {pred_value:.4f})")
        return {
            "label": label,
            "confidence": confidence,
            "score": pred_value,
            "note": "AI scanner ran on valid PE executable.",
        }
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            "label": "unavailable",
            "confidence": 0.0,
            "score": None,
            "note": "AI scanner unavailable due to prediction error.",
        }
