"""
Isolated test script to verify cycloevan/malconv model loading,
input preprocessing, prediction, and label mapping.
"""

import sys
import os
import numpy as np

# Add parent directory to path to access app modules if needed
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# MalConv model architecture from cycloevan/malconv/src/model.py
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

def test_dependencies():
    """Test if required dependencies are installed."""
    print("=== Testing Dependencies ===")
    
    try:
        import keras
        print(f"✅ Keras version: {keras.__version__}")
    except ImportError as e:
        print(f"❌ Keras not found: {e}")
        return False
    
    try:
        import tensorflow as tf
        print(f"✅ TensorFlow version: {tf.__version__}")
    except ImportError as e:
        print(f"❌ TensorFlow not found: {e}")
        return False
    
    try:
        import huggingface_hub
        print(f"✅ Hugging Face Hub version: {huggingface_hub.__version__}")
    except ImportError as e:
        print(f"❌ Hugging Face Hub not found: {e}")
        return False
    
    print("✅ All dependencies available\n")
    return True

def read_binary_file(file_path, max_length=2_000_000):
    """
    Read binary file and preprocess according to cycloevan/malconv requirements.
    From src/utils.py in the model repo.
    """
    try:
        with open(file_path, 'rb') as f:
            raw_bytes = f.read()
        
        # Convert bytes to 0-255 integer array
        byte_array = np.frombuffer(raw_bytes, dtype=np.uint8)
        
        if len(byte_array) > max_length:
            # Truncate to first max_length bytes
            return byte_array[:max_length]
        else:
            # Pad with zeros to max_length
            padded = np.zeros(max_length, dtype=np.uint8)
            padded[:len(byte_array)] = byte_array
            return padded
    except Exception as e:
        print(f"❌ Error reading file {file_path}: {e}")
        return np.zeros(max_length, dtype=np.uint8)

def test_model_loading():
    """Test loading the model from Hugging Face Hub (download weights and build model)."""
    print("=== Testing Model Loading ===")
    
    try:
        from huggingface_hub import hf_hub_download
        import tensorflow as tf
        
        # Download the weights file
        print("Downloading malconv_model.h5 from Hugging Face Hub...")
        weights_path = hf_hub_download(
            repo_id="cycloevan/malconv",
            filename="models/malconv_model.h5"
        )
        print(f"✅ Weights downloaded to: {weights_path}")
        
        # Build the model first with dummy input
        print("Building MalConv model...")
        model = MalConv(max_input_length=2_000_000)
        
        # Pass dummy input to build the model
        dummy_input = tf.zeros((1, 2_000_000), dtype=tf.int32)
        _ = model(dummy_input)
        print("✅ Model built successfully!")
        
        # Load the weights
        print("Loading model weights...")
        model.load_weights(weights_path)
        print("✅ Weights loaded successfully!")
        
        # Print model summary
        print("\n=== Model Summary ===")
        model.summary()
        
        return model
    except Exception as e:
        print(f"❌ Model loading failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_input_preprocessing(test_file_path):
    """Test input preprocessing with a test file."""
    print("\n=== Testing Input Preprocessing ===")
    
    if not os.path.exists(test_file_path):
        print(f"❌ Test file not found: {test_file_path}")
        return None
    
    print(f"Using test file: {test_file_path}")
    processed = read_binary_file(test_file_path)
    
    print(f"✅ Input shape: {processed.shape}")
    print(f"✅ Input dtype: {processed.dtype}")
    print(f"✅ Min value: {processed.min()}, Max value: {processed.max()}")
    
    return processed

def test_prediction(model, processed_input):
    """Test model prediction."""
    print("\n=== Testing Prediction ===")
    
    try:
        # Add batch dimension
        input_data = np.expand_dims(processed_input, axis=0)
        print(f"Input data shape: {input_data.shape}")
        
        # Run prediction
        prediction = model.predict(input_data, verbose=1)
        print(f"Prediction result: {prediction}")
        print(f"Prediction shape: {prediction.shape}")
        
        # Get the scalar value
        pred_value = float(prediction[0][0])
        print(f"Prediction scalar: {pred_value}")
        
        return pred_value
    except Exception as e:
        print(f"❌ Prediction failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    print("=" * 60)
    print("cycloevan/malconv Isolated Test")
    print("=" * 60)
    
    # Test file path - use existing test_sample.bin
    test_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "test_sample.bin"
    )
    
    # Step 1: Test dependencies
    if not test_dependencies():
        print("\n❌ Test failed: Missing dependencies")
        return
    
    # Step 2: Load model
    model = test_model_loading()
    if not model:
        print("\n❌ Test failed: Could not load model")
        return
    
    # Step 3: Preprocess test file
    processed_input = test_input_preprocessing(test_file)
    if processed_input is None:
        print("\n❌ Test failed: Could not preprocess test file")
        return
    
    # Step 4: Run prediction
    pred_value = test_prediction(model, processed_input)
    if pred_value is None:
        print("\n❌ Test failed: Could not run prediction")
        return
    
    # Step 5: Analyze label mapping
    print("\n" + "=" * 60)
    print("=== Label Mapping Analysis ===")
    print("=" * 60)
    print(f"Test file: {test_file}")
    print(f"Prediction value: {pred_value:.6f}")
    print("\nFrom model repo src/predict.py:")
    print("  - status = '정상' (benign) if pred > 0.5")
    print("  - status = '악성코드' (malicious) if pred <= 0.5")
    print("  - confidence = pred if pred > 0.5 else 1 - pred")
    print("\nFrom model card:")
    print("  - label 0 = benign")
    print("  - label 1 = malicious")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
