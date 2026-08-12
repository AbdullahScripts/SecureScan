# """
# File service: handles file saving, hashing, and metadata extraction.

# Safety: Files are NEVER executed. Only saved and analyzed statically.
# """

# import hashlib
# import os
# import uuid
# from typing import Dict, Optional

# from app.config import settings

# # Extension-based MIME type mapping (no python-magic needed)
# EXTENSION_MIME_MAP: Dict[str, str] = {
#     ".exe": "application/x-dosexec",
#     ".dll": "application/x-dosexec",
#     ".bin": "application/octet-stream",
#     ".com": "application/x-dosexec",
# }


# def validate_file_extension(filename: str) -> bool:
#     """
#     Check if the file extension is in the allowed list.

#     Args:
#         filename: Original filename from upload.

#     Returns:
#         True if extension is allowed, False otherwise.
#     """
#     ext = os.path.splitext(filename)[1].lower()
#     return ext in settings.allowed_extensions_list


# def validate_file_size(file_size: int) -> bool:
#     """
#     Check if the file size is within the configured limit.

#     Args:
#         file_size: Size of the file in bytes.

#     Returns:
#         True if within limit, False otherwise.
#     """
#     return file_size <= settings.max_file_size_bytes


# def save_upload(filename: str, content: bytes) -> str:
#     """
#     Save uploaded file to the uploads directory with a UUID prefix
#     to prevent filename collisions.

#     Args:
#         filename: Original filename from upload.
#         content: Raw file bytes.

#     Returns:
#         Absolute path to the saved file.
#     """
#     # Ensure uploads directory exists
#     os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

#     # Generate unique filename: uuid_originalname.ext
#     ext = os.path.splitext(filename)[1].lower()
#     safe_name = f"{uuid.uuid4().hex}{ext}"
#     file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

#     with open(file_path, "wb") as f:
#         f.write(content)

#     return os.path.abspath(file_path)


# def calculate_sha256(content: bytes) -> str:
#     """
#     Calculate SHA256 hash of file content.

#     Args:
#         content: Raw file bytes.

#     Returns:
#         Hexadecimal SHA256 hash string (64 characters).
#     """
#     return hashlib.sha256(content).hexdigest()


# def get_file_metadata(filename: str, file_size: int) -> Dict[str, str]:
#     """
#     Extract basic file metadata using extension-based detection.
#     Does not use python-magic to avoid Windows installation issues.

#     Args:
#         filename: Original filename from upload.
#         file_size: Size of the file in bytes.

#     Returns:
#         Dictionary with extension and file_type.
#     """
#     ext = os.path.splitext(filename)[1].lower()
#     file_type = EXTENSION_MIME_MAP.get(ext, "application/octet-stream")

#     return {
#         "extension": ext,
#         "file_type": file_type,
#     }


# def is_valid_pe_file(file_path: str) -> bool:
#     """
#     Check if a file is a valid Windows PE executable.
#     Checks:
#     1. File starts with MZ header (0x4D, 0x5A)
#     2. Has valid e_lfanew pointer
#     3. PE signature exists at e_lfanew (0x50, 0x45, 0x00, 0x00)

#     Args:
#         file_path: Path to the file to check.

#     Returns:
#         True if valid PE file, False otherwise.
#     """
#     try:
#         with open(file_path, 'rb') as f:
#             # Check file is at least large enough for MZ and PE signature
#             data = f.read(1024)
#             if len(data) < 64:
#                 return False

#             # Check MZ header (bytes 0-1)
#             if data[0:2] != b'MZ':
#                 return False

#             # Read e_lfanew (offset 0x3C, 4 bytes, little-endian)
#             if len(data) < 0x40:
#                 return False
#             e_lfanew = int.from_bytes(data[0x3C:0x40], byteorder='little')

#             # Check if e_lfanew is within reasonable bounds
#             if e_lfanew < 0x40 or e_lfanew > len(data) - 4:
#                 return False

#             # Check PE signature at e_lfanew (should be PE\0\0)
#             if data[e_lfanew:e_lfanew+4] != b'PE\x00\x00':
#                 return False

#             return True
#     except Exception:
#         return False
"""
File service: handles file saving, hashing, and metadata extraction.

Safety: Files are NEVER executed. Only saved and analyzed statically.
"""

import hashlib
import os
import uuid
from typing import Dict, Optional

from app.config import settings

# Extension-based MIME type mapping (no python-magic needed)
EXTENSION_MIME_MAP: Dict[str, str] = {
    ".exe": "application/x-dosexec",
    ".dll": "application/x-dosexec",
    ".bin": "application/octet-stream",
    ".com": "application/x-dosexec",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def validate_file_extension(filename: str) -> bool:
    """
    Check if the file extension is in the allowed list.

    Args:
        filename: Original filename from upload.

    Returns:
        True if extension is allowed, False otherwise.
    """
    ext = os.path.splitext(filename)[1].lower()
    return ext in settings.allowed_extensions_list


def validate_file_size(file_size: int) -> bool:
    """
    Check if the file size is within the configured limit.

    Args:
        file_size: Size of the file in bytes.

    Returns:
        True if within limit, False otherwise.
    """
    return file_size <= settings.max_file_size_bytes


def save_upload(filename: str, content: bytes) -> str:
    """
    Save uploaded file to the uploads directory with a UUID prefix
    to prevent filename collisions.

    Args:
        filename: Original filename from upload.
        content: Raw file bytes.

    Returns:
        Absolute path to the saved file.
    """
    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Generate unique filename: uuid_originalname.ext
    ext = os.path.splitext(filename)[1].lower()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as f:
        f.write(content)

    return os.path.abspath(file_path)


def calculate_sha256(content: bytes) -> str:
    """
    Calculate SHA256 hash of file content.

    Args:
        content: Raw file bytes.

    Returns:
        Hexadecimal SHA256 hash string (64 characters).
    """
    return hashlib.sha256(content).hexdigest()


def get_file_metadata(filename: str, file_size: int) -> Dict[str, str]:
    """
    Extract basic file metadata using extension-based detection.
    Does not use python-magic to avoid Windows installation issues.

    Args:
        filename: Original filename from upload.
        file_size: Size of the file in bytes.

    Returns:
        Dictionary with extension and file_type.
    """
    ext = os.path.splitext(filename)[1].lower()
    file_type = EXTENSION_MIME_MAP.get(ext, "application/octet-stream")

    return {
        "extension": ext,
        "file_type": file_type,
    }


def is_valid_pe_file(file_path: str) -> bool:
    """
    Check if a file is a valid Windows PE executable.
    Checks:
    1. File starts with MZ header (0x4D, 0x5A)
    2. Has valid e_lfanew pointer
    3. PE signature exists at e_lfanew (0x50, 0x45, 0x00, 0x00)

    Args:
        file_path: Path to the file to check.

    Returns:
        True if valid PE file, False otherwise.
    """
    try:
        with open(file_path, 'rb') as f:
            # Check file is at least large enough for MZ and PE signature
            data = f.read(1024)
            if len(data) < 64:
                return False

            # Check MZ header (bytes 0-1)
            if data[0:2] != b'MZ':
                return False

            # Read e_lfanew (offset 0x3C, 4 bytes, little-endian)
            if len(data) < 0x40:
                return False
            e_lfanew = int.from_bytes(data[0x3C:0x40], byteorder='little')

            # Check if e_lfanew is within reasonable bounds
            if e_lfanew < 0x40 or e_lfanew > len(data) - 4:
                return False

            # Check PE signature at e_lfanew (should be PE\0\0)
            if data[e_lfanew:e_lfanew+4] != b'PE\x00\x00':
                return False

            return True
    except Exception:
        return False